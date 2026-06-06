// Shared Python snippet that gives generated documents proper multilingual
// support (Arabic shaping + RTL, CJK, Hebrew, Devanagari, Cyrillic, Greek, etc.)
//
// Inject MULTILINGUAL_PY at the top of any python-pptx / reportlab / python-docx
// script. It exposes:
//
//   detect_script(text)         -> "arabic" | "hebrew" | "cjk" | "devanagari" | "latin"
//   is_rtl_text(text)           -> bool
//   shape_rtl(text)             -> str   (arabic-reshaper + bidi if available, else passthrough)
//   pick_font(text, *, bold)    -> str   (best font family name for the script)
//   register_pdf_fonts()        -> dict  (registers TTFs with reportlab, returns family->name map)
//   apply_run_font(run, text)   -> None  (sets latin / eastAsian / complex-script on a python-pptx run)
//
// Fonts installed (best-effort) inside the E2B sandbox:
//   fonts-noto-core, fonts-noto-cjk, fonts-noto-color-emoji
// + pip: arabic-reshaper, python-bidi
//
// We swallow install errors so the script keeps working with built-in fonts
// if the network/apt are unavailable.

export const MULTILINGUAL_PY = String.raw`
import subprocess, sys, os, re, glob

def _safe_run(cmd):
    try:
        subprocess.run(cmd, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    except Exception:
        pass

# Install Noto fonts (covers ~all scripts) and shaping libs. Best-effort.
_safe_run(["apt-get", "update"])
_safe_run(["apt-get", "install", "-y", "--no-install-recommends",
           "fonts-noto-core", "fonts-noto-cjk", "fonts-noto-color-emoji",
           "fonts-noto-ui-core"])
_safe_run([sys.executable, "-m", "pip", "install", "-q",
           "arabic-reshaper", "python-bidi"])

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    _BIDI_OK = True
except Exception:
    _BIDI_OK = False

# ── Script detection ──────────────────────────────────────────────────────
_ARABIC_RE     = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
_HEBREW_RE     = re.compile(r"[\u0590-\u05FF\uFB1D-\uFB4F]")
_CJK_RE        = re.compile(r"[\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF00-\uFFEF]")
_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
_THAI_RE       = re.compile(r"[\u0E00-\u0E7F]")
_CYRILLIC_RE   = re.compile(r"[\u0400-\u04FF]")

def detect_script(text):
    if not text: return "latin"
    if _ARABIC_RE.search(text):     return "arabic"
    if _HEBREW_RE.search(text):     return "hebrew"
    if _CJK_RE.search(text):        return "cjk"
    if _DEVANAGARI_RE.search(text): return "devanagari"
    if _THAI_RE.search(text):       return "thai"
    return "latin"

def is_rtl_text(text):
    return bool(text) and bool(_ARABIC_RE.search(text) or _HEBREW_RE.search(text))

def shape_rtl(text):
    """Shape Arabic letters + reorder for visual RTL display (needed for
    libraries like reportlab that don't do bidi themselves)."""
    if not text or not _BIDI_OK: return text
    try:
        if _ARABIC_RE.search(text):
            text = arabic_reshaper.reshape(text)
        return get_display(text)
    except Exception:
        return text

# ── Font selection ────────────────────────────────────────────────────────
# Names match Noto font family display names — common across MS PowerPoint /
# LibreOffice / Google Slides when reading PPTX files.
_FONT_MAP = {
    "arabic":     "Noto Naskh Arabic",
    "hebrew":     "Noto Sans Hebrew",
    "cjk":        "Noto Sans CJK SC",
    "devanagari": "Noto Sans Devanagari",
    "thai":       "Noto Sans Thai",
    "latin":      "Calibri",
}
def pick_font(text, *, bold=False):
    return _FONT_MAP.get(detect_script(text or ""), _FONT_MAP["latin"])

# ── python-pptx: set latin / eastAsian / complex-script font on a run ─────
def apply_run_font(run, text):
    """python-pptx run font helper. Sets the latin/east-asian/complex-script
    typefaces so PowerPoint picks the right glyphs regardless of script."""
    try:
        from pptx.oxml.ns import qn
        from lxml import etree
        rPr = run._r.get_or_add_rPr()
        family = pick_font(text)
        script = detect_script(text or "")
        # latin
        for tag in ("a:latin", "a:ea", "a:cs"):
            el = rPr.find(qn(tag))
            if el is not None: rPr.remove(el)
        latin = etree.SubElement(rPr, qn("a:latin"))
        latin.set("typeface", "Calibri")
        ea = etree.SubElement(rPr, qn("a:ea"))
        ea.set("typeface", "Noto Sans CJK SC" if script == "cjk" else "Calibri")
        cs = etree.SubElement(rPr, qn("a:cs"))
        cs.set("typeface", family if script in ("arabic", "hebrew", "devanagari", "thai") else "Calibri")
    except Exception:
        pass

# ── reportlab: register TTF fonts and return family map ───────────────────
def register_pdf_fonts():
    """Returns {script: font_name} usable in reportlab styles. Falls back to
    Helvetica if a font is missing."""
    families = {"latin": "Helvetica", "arabic": "Helvetica", "hebrew": "Helvetica",
                "cjk": "Helvetica", "devanagari": "Helvetica", "thai": "Helvetica"}
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
    except Exception:
        return families

    def _try(name, candidates):
        for c in candidates:
            for path in glob.glob(c):
                try:
                    pdfmetrics.registerFont(TTFont(name, path))
                    return True
                except Exception: continue
        return False

    if _try("NotoSans",        ["/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"]):
        families["latin"] = "NotoSans"
    if _try("NotoSansBold",    ["/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"]):
        pass
    if _try("NotoNaskhArabic", ["/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
                                "/usr/share/fonts/truetype/noto/NotoKufiArabic-Regular.ttf"]):
        families["arabic"] = "NotoNaskhArabic"
    if _try("NotoSansHebrew",  ["/usr/share/fonts/truetype/noto/NotoSansHebrew-Regular.ttf"]):
        families["hebrew"] = "NotoSansHebrew"
    if _try("NotoSansCJK",     ["/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
                                "/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf"]):
        families["cjk"] = "NotoSansCJK"
    if _try("NotoSansDeva",    ["/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf"]):
        families["devanagari"] = "NotoSansDeva"
    if _try("NotoSansThai",    ["/usr/share/fonts/truetype/noto/NotoSansThai-Regular.ttf"]):
        families["thai"] = "NotoSansThai"
    return families
`;
