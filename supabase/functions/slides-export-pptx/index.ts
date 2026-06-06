// slides-export-pptx: Convert the existing deck JSON (from chat-slides-stream)
// into a real, downloadable PPTX file using python-pptx in an E2B sandbox.
// Supports: title slides, bullet slides, two-column, image slides, quotes,
// RTL languages (Arabic), themed colors from the deck's palette.
//
// Body: { deck: {...}, filename?: string, conversation_id?: string }
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
import { runInSandbox } from "../_shared/e2b.ts";
import { serviceClient, getUserId, uploadFiles } from "../_shared/e2b-storage.ts";
import { MULTILINGUAL_PY } from "../_shared/multilingual.ts";

const PY_SCRIPT = MULTILINGUAL_PY + `
import subprocess, sys, json, urllib.request, os, traceback
subprocess.run([sys.executable, "-m", "pip", "install", "-q",
  "python-pptx", "Pillow"], check=True)

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from io import BytesIO

deck = json.loads(DECK_JSON)
palette = deck.get("palette") or {}
bg = palette.get("bg")     or "#0F172A"
fg = palette.get("fg")     or "#F8FAFC"
accent = palette.get("accent")  or "#3B82F6"
primary = palette.get("primary") or accent
lang = (deck.get("language") or "").lower()
# Detect RTL from deck language hint OR from the actual content (any slide title/body)
_lang_rtl = any(lang.startswith(p) for p in ("ar", "he", "fa", "ur", "ps", "sd", "ku"))
_sample = " ".join([
    str((deck.get("slides") or [{}])[0].get("title") or ""),
    str(deck.get("title") or ""),
])[:500]
rtl = _lang_rtl or is_rtl_text(_sample)

def hex2rgb(h):
    h = (h or "#000000").lstrip('#')
    if len(h) == 3: h = ''.join(c*2 for c in h)
    return RGBColor(int(h[0:2],16), int(h[2:4],16), int(h[4:6],16))

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]

def set_bg(slide, color):
    fill = slide.background.fill; fill.solid()
    fill.fore_color.rgb = hex2rgb(color)

def add_text(slide, x, y, w, h, text, *, size=18, bold=False, color=None,
             align=None, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    if isinstance(text, str): text = [text]
    for i, line in enumerate(text):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        if align is not None: p.alignment = align
        line_rtl = is_rtl_text(line)
        if line_rtl or rtl: p.alignment = PP_ALIGN.RIGHT
        r = p.add_run()
        r.text = line
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.name = pick_font(line)
        apply_run_font(r, line)
        r.font.color.rgb = hex2rgb(color or fg)
    return tb

def accent_bar(slide, x, y, w, h, color=None):
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shp.line.fill.background()
    shp.fill.solid(); shp.fill.fore_color.rgb = hex2rgb(color or accent)
    return shp

def try_image_bytes(url):
    if not url or not isinstance(url, str): return None
    if url.startswith("data:"):
        try:
            import base64
            b64 = url.split(",", 1)[1]
            return BytesIO(base64.b64decode(b64))
        except Exception: return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read()
            if not data: return None
            return BytesIO(data)
    except Exception as e:
        print("img fail", url[:60], e)
        return None

def add_image(slide, url, x, y, w, h):
    buf = try_image_bytes(url)
    if not buf: return None
    try:
        return slide.shapes.add_picture(buf, x, y, width=w, height=h)
    except Exception as e:
        print("add_picture fail", e)
        return None

# ─── slide renderers ─────────────────────────────────
def render_title_slide(s, slide_spec):
    set_bg(s, bg)
    accent_bar(s, Inches(0.6), Inches(3.2), Inches(0.15), Inches(1.5), primary)
    add_text(s, Inches(0.9), Inches(2.8), Inches(11.5), Inches(2.5),
             slide_spec.get("title", ""), size=58, bold=True, color=fg)
    sub = slide_spec.get("subtitle")
    if sub:
        add_text(s, Inches(0.9), Inches(5.2), Inches(11.5), Inches(1.0),
                 sub, size=22, color=accent)

def render_content_slide(s, slide_spec):
    set_bg(s, bg)
    title = slide_spec.get("title", "")
    add_text(s, Inches(0.7), Inches(0.5), Inches(12), Inches(1.0),
             title, size=34, bold=True, color=accent)
    accent_bar(s, Inches(0.7), Inches(1.45), Inches(1.2), Emu(38100), primary)

    bullets = slide_spec.get("bullets") or []
    body    = slide_spec.get("body")    or slide_spec.get("content")
    image   = slide_spec.get("image")

    if image:
        # Two columns: text left/right based on RTL
        text_x   = Inches(0.7) if not rtl else Inches(6.9)
        text_w   = Inches(5.7)
        img_x    = Inches(6.9) if not rtl else Inches(0.7)
        img_w    = Inches(5.7); img_h = Inches(5)
        added = add_image(s, image, img_x, Inches(1.8), img_w, img_h)
        if added is None:
            text_x, text_w = Inches(0.7), Inches(12)
        tx = text_x
    else:
        tx, text_w = Inches(0.7), Inches(12)

    if bullets:
        add_text(s, tx, Inches(1.9), text_w, Inches(5),
                 [f"•  {str(b)}" for b in bullets][:7],
                 size=18, color=fg)
    elif body:
        add_text(s, tx, Inches(1.9), text_w, Inches(5),
                 str(body), size=18, color=fg)

def render_quote_slide(s, slide_spec):
    set_bg(s, bg)
    quote = slide_spec.get("title") or slide_spec.get("quote") or ""
    author = slide_spec.get("subtitle") or slide_spec.get("author") or ""
    add_text(s, Inches(1.5), Inches(2.2), Inches(10.3), Inches(1.4),
             "\u201C", size=120, bold=True, color=accent)
    add_text(s, Inches(1.5), Inches(2.8), Inches(10.3), Inches(3),
             quote, size=30, bold=True, color=fg,
             anchor=MSO_ANCHOR.MIDDLE)
    if author:
        add_text(s, Inches(1.5), Inches(6), Inches(10.3), Inches(0.6),
                 f"— {author}", size=18, color=accent,
                 align=PP_ALIGN.RIGHT if rtl else PP_ALIGN.LEFT)

def render_section_slide(s, slide_spec):
    set_bg(s, primary)
    add_text(s, Inches(0.9), Inches(2.8), Inches(11.5), Inches(2),
             slide_spec.get("title", ""), size=54, bold=True, color=bg)
    sub = slide_spec.get("subtitle")
    if sub:
        add_text(s, Inches(0.9), Inches(4.8), Inches(11.5), Inches(1),
                 sub, size=22, color=bg)

def render_gallery_slide(s, slide_spec):
    set_bg(s, bg)
    add_text(s, Inches(0.7), Inches(0.5), Inches(12), Inches(1),
             slide_spec.get("title", ""), size=30, bold=True, color=accent)
    images = (slide_spec.get("images") or [])[:4]
    if len(images) >= 2:
        cell_w = Inches(5.8); cell_h = Inches(2.7); gap = Inches(0.2)
        coords = [
            (Inches(0.7), Inches(1.8)),
            (Inches(0.7) + cell_w + gap, Inches(1.8)),
            (Inches(0.7), Inches(1.8) + cell_h + gap),
            (Inches(0.7) + cell_w + gap, Inches(1.8) + cell_h + gap),
        ]
        for i, url in enumerate(images):
            if i >= 4: break
            add_image(s, url, coords[i][0], coords[i][1], cell_w, cell_h)
    elif len(images) == 1:
        add_image(s, images[0], Inches(0.7), Inches(1.8), Inches(12), Inches(5))

def render_chart_slide(s, slide_spec):
    set_bg(s, bg)
    title = slide_spec.get("title", "")
    add_text(s, Inches(0.7), Inches(0.5), Inches(12), Inches(1),
             title, size=32, bold=True, color=accent)
    accent_bar(s, Inches(0.7), Inches(1.45), Inches(1.2), Emu(38100), primary)
    ch = slide_spec.get("chart") or {}
    kind = (ch.get("kind") or "bar").lower()
    data_pts = ch.get("data") or []
    if not data_pts:
        return render_content_slide(s, slide_spec)
    cd = CategoryChartData()
    cd.categories = [str(d.get("label","")) for d in data_pts[:10]]
    vals = []
    for d in data_pts[:10]:
        try: vals.append(float(d.get("value", 0)))
        except Exception: vals.append(0.0)
    cd.add_series(ch.get("yLabel") or "Value", vals)
    xl_type = {
        "bar": XL_CHART_TYPE.COLUMN_CLUSTERED,
        "line": XL_CHART_TYPE.LINE,
        "donut": XL_CHART_TYPE.DOUGHNUT,
    }.get(kind, XL_CHART_TYPE.COLUMN_CLUSTERED)
    gframe = s.shapes.add_chart(xl_type, Inches(0.9), Inches(2.0), Inches(11.5), Inches(5.0), cd)
    try:
        chart = gframe.chart
        chart.has_legend = (kind == "donut")
        if chart.has_legend:
            chart.legend.position = XL_LEGEND_POSITION.RIGHT
            chart.legend.include_in_layout = False
    except Exception as e:
        print("chart style fail", e)

# ─── orchestrate ─────────────────────────────────────
slides_data = deck.get("slides") or []
if not slides_data:
    raise ValueError("deck.slides is empty")

# Cover slide derived from deck-level fields if first slide isn't a title
first = slides_data[0]
first_layout = (first.get("layout") or first.get("type") or "").lower()
if first_layout not in ("title", "cover", "hero"):
    cover = prs.slides.add_slide(BLANK)
    render_title_slide(cover, {
        "title": deck.get("title", ""),
        "subtitle": deck.get("subtitle", ""),
    })

for slide_spec in slides_data:
    s = prs.slides.add_slide(BLANK)
    t = (slide_spec.get("type") or "").lower()
    layout = (slide_spec.get("layout") or "").lower()
    try:
        if layout in ("title", "cover", "hero") or t in ("title", "cover"):
            render_title_slide(s, slide_spec)
        elif layout in ("section", "section-header", "divider") or t == "section":
            render_section_slide(s, slide_spec)
        elif layout.startswith("chart") or t == "chart" or slide_spec.get("chart"):
            render_chart_slide(s, slide_spec)
        elif layout in ("quote", "pull-quote", "manifesto") or t == "quote":
            render_quote_slide(s, slide_spec)
        elif layout in ("gallery", "grid", "mosaic") or (slide_spec.get("images") and len(slide_spec.get("images") or []) >= 2):
            render_gallery_slide(s, slide_spec)
        else:
            render_content_slide(s, slide_spec)
    except Exception:
        print("slide render error:", traceback.format_exc())
        render_content_slide(s, slide_spec)

out = "/tmp/deck.pptx"
prs.save(out)
print(json.dumps({"path": out, "slides": len(prs.slides)}))
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const userId = await getUserId(req);
    if (!userId) return json(401, { error: "auth_required" });

    const body = await req.json().catch(() => null);
    const deck = body?.deck;
    if (!deck || !Array.isArray(deck.slides)) {
      return json(400, { error: "deck with slides[] is required" });
    }

    const safeBase = String(body?.filename || deck.title || "presentation")
      // allow latin, digits, dash/dot/space + Arabic, Hebrew, CJK, Devanagari, Cyrillic, Greek, Thai
      .replace(/[^\w\-. \u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u0370-\u03FF\u0400-\u04FF\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]/g, "_").slice(0, 60).trim() || "presentation";
    const filename = safeBase.toLowerCase().endsWith(".pptx") ? safeBase : `${safeBase}.pptx`;

    const supabase = serviceClient();
    const { data: execRow, error: insErr } = await supabase
      .from("e2b_executions").insert({
        user_id: userId,
        conversation_id: body.conversation_id ?? null,
        kind: "generate_document",
        language: "python",
        status: "running",
        input: { type: "pptx", slides_count: deck.slides.length, filename },
      }).select("id").single();
    if (insErr || !execRow) return json(500, { error: "failed to create execution" });

    try {
      const code = `DECK_JSON = ${JSON.stringify(JSON.stringify(deck))}\n${PY_SCRIPT}`;
      const result = await runInSandbox({
        code, language: "python",
        outputFiles: ["/tmp/deck.pptx"],
        timeoutSec: 360,
      });

      if (result.error) {
        await supabase.from("e2b_executions").update({
          status: "failed", stdout: result.stdout, stderr: result.stderr,
          error: result.error, duration_ms: result.duration_ms,
        }).eq("id", execRow.id);
        return json(500, { execution_id: execRow.id, error: result.error, stdout: result.stdout, stderr: result.stderr });
      }

      const renamed = result.files.map((f) =>
        f.path === "/tmp/deck.pptx" ? { ...f, path: filename } : f
      );
      const uploaded = await uploadFiles(supabase, userId, execRow.id, renamed);

      await supabase.from("e2b_executions").update({
        status: "succeeded",
        stdout: result.stdout, stderr: result.stderr,
        files: uploaded, duration_ms: result.duration_ms,
      }).eq("id", execRow.id);

      return json(200, {
        execution_id: execRow.id,
        file: uploaded[0] ?? null,
        download_url: uploaded[0]?.signedUrl ?? null,
        filename,
        slides: deck.slides.length,
        duration_ms: result.duration_ms,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("e2b_executions").update({ status: "failed", error: msg }).eq("id", execRow.id);
      return json(500, { execution_id: execRow.id, error: msg });
    }
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
