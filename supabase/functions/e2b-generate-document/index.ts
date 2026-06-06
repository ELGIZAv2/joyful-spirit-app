// e2b-generate-document: generate real PPTX / DOCX / XLSX / PDF using python libraries
// in an E2B sandbox. Body: { type: 'pptx'|'docx'|'xlsx'|'pdf', spec: {...}, conversation_id? }
import { runInSandbox } from "../_shared/e2b.ts";
import { serviceClient, getUserId, uploadFiles } from "../_shared/e2b-storage.ts";
import { MULTILINGUAL_PY } from "../_shared/multilingual.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const PPTX_SCRIPT = `
import json, sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

spec = json.loads(SPEC_JSON)
prs = Presentation()
prs.slide_width = Inches(13.333); prs.slide_height = Inches(7.5)

def hex2rgb(h):
    h = h.lstrip('#')
    return RGBColor(int(h[0:2],16), int(h[2:4],16), int(h[4:6],16))

theme = spec.get('theme', {})
bg = theme.get('background', '#0F172A')
fg = theme.get('text', '#FFFFFF')
accent = theme.get('accent', '#3B82F6')

for slide_spec in spec.get('slides', []):
    layout = prs.slide_layouts[6]  # blank
    s = prs.slides.add_slide(layout)
    bg_fill = s.background.fill; bg_fill.solid(); bg_fill.fore_color.rgb = hex2rgb(bg)

    title = slide_spec.get('title')
    if title:
        tx = s.shapes.add_textbox(Inches(0.6), Inches(0.5), Inches(12), Inches(1.2))
        tf = tx.text_frame; tf.word_wrap = True
        p = tf.paragraphs[0]
        if is_rtl_text(title):
            from pptx.enum.text import PP_ALIGN
            p.alignment = PP_ALIGN.RIGHT
        r = p.add_run(); r.text = title
        r.font.size = Pt(40); r.font.bold = True; r.font.color.rgb = hex2rgb(accent)
        r.font.name = pick_font(title); apply_run_font(r, title)

    content = slide_spec.get('content', [])
    if content:
        tx = s.shapes.add_textbox(Inches(0.6), Inches(1.9), Inches(12), Inches(5))
        tf = tx.text_frame; tf.word_wrap = True
        for i, line in enumerate(content):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            if is_rtl_text(line):
                from pptx.enum.text import PP_ALIGN
                p.alignment = PP_ALIGN.RIGHT
            r = p.add_run(); r.text = f"• {line}"
            r.font.size = Pt(20); r.font.color.rgb = hex2rgb(fg)
            r.font.name = pick_font(line); apply_run_font(r, line)

out = '/tmp/out.pptx'
prs.save(out)
print(json.dumps({"path": out, "slides": len(prs.slides)}))
`;

const DOCX_SCRIPT = `
import json
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def _set_run_lang(run, text):
    family = pick_font(text)
    run.font.name = family
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts")) or OxmlElement("w:rFonts")
    rFonts.set(qn("w:ascii"), family)
    rFonts.set(qn("w:hAnsi"), family)
    rFonts.set(qn("w:cs"), family)
    rFonts.set(qn("w:eastAsia"), family)
    if rPr.find(qn("w:rFonts")) is None: rPr.append(rFonts)
    if is_rtl_text(text):
        rtl = OxmlElement("w:rtl"); rtl.set(qn("w:val"), "1"); rPr.append(rtl)
        cs  = OxmlElement("w:cs");  cs.set(qn("w:val"), "1");  rPr.append(cs)

def _set_para_rtl(p):
    pPr = p._p.get_or_add_pPr()
    bidi = OxmlElement("w:bidi"); pPr.append(bidi)
    jc = OxmlElement("w:jc"); jc.set(qn("w:val"), "right"); pPr.append(jc)

def add_styled_para(doc, text, *, heading_level=None, bullet=False):
    if heading_level is not None:
        p = doc.add_heading("", level=heading_level)
    elif bullet:
        p = doc.add_paragraph(style="List Bullet")
    else:
        p = doc.add_paragraph()
    if is_rtl_text(text): _set_para_rtl(p)
    run = p.add_run(text)
    _set_run_lang(run, text)
    return p

spec = json.loads(SPEC_JSON)
doc = Document()

title = spec.get('title')
if title:
    add_styled_para(doc, title, heading_level=0)

for section in spec.get('sections', []):
    if section.get('heading'):
        add_styled_para(doc, section['heading'], heading_level=section.get('level', 1))
    for para in section.get('paragraphs', []):
        add_styled_para(doc, para)
    for bullet in section.get('bullets', []):
        add_styled_para(doc, bullet, bullet=True)

out = '/tmp/out.docx'
doc.save(out)
print(json.dumps({"path": out}))
`;

const XLSX_SCRIPT = `
import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

spec = json.loads(SPEC_JSON)
wb = openpyxl.Workbook()
wb.remove(wb.active)

for sheet_spec in spec.get('sheets', []):
    ws = wb.create_sheet(title=sheet_spec.get('name', 'Sheet')[:31])
    headers = sheet_spec.get('headers', [])
    rows = sheet_spec.get('rows', [])
    if headers:
        ws.append(headers)
        for cell in ws[1]:
            cell.font = Font(bold=True, color='FFFFFF')
            cell.fill = PatternFill('solid', fgColor='3B82F6')
            cell.alignment = Alignment(horizontal='center')
    for r in rows:
        ws.append(r)
    for col in ws.columns:
        max_len = max((len(str(c.value or '')) for c in col), default=10)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 40)

out = '/tmp/out.xlsx'
wb.save(out)
print(json.dumps({"path": out, "sheets": [s.title for s in wb.worksheets]}))
`;

const PDF_SCRIPT = `
import json, html
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, ListFlowable, ListItem
from reportlab.lib.units import cm

FONTS = register_pdf_fonts()

def font_for(text):
    return FONTS.get(detect_script(text or ""), FONTS["latin"])

def render_text(text):
    """Escape, then shape RTL if needed (reportlab has no bidi engine)."""
    safe = html.escape(text or "")
    if is_rtl_text(text or ""):
        safe = shape_rtl(safe)
    return safe

def make_style(name, *, size=12, leading=None, bold=False, sample=""):
    return ParagraphStyle(
        name=name,
        fontName=font_for(sample),
        fontSize=size,
        leading=leading or size * 1.4,
        alignment=TA_RIGHT if is_rtl_text(sample) else TA_LEFT,
        wordWrap="RTL" if is_rtl_text(sample) else "LTR",
    )

spec = json.loads(SPEC_JSON)
out = '/tmp/out.pdf'
doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
story = []

if spec.get('title'):
    t = spec['title']
    story.append(Paragraph(render_text(t), make_style("title", size=24, bold=True, sample=t)))
    story.append(Spacer(1, 0.5*cm))

for section in spec.get('sections', []):
    if section.get('heading'):
        h = section['heading']
        story.append(Paragraph(render_text(h), make_style("h2", size=16, bold=True, sample=h)))
        story.append(Spacer(1, 0.3*cm))
    for para in section.get('paragraphs', []):
        story.append(Paragraph(render_text(para), make_style("body", size=12, sample=para)))
        story.append(Spacer(1, 0.2*cm))
    for bullet in section.get('bullets', []) or []:
        story.append(Paragraph("• " + render_text(bullet), make_style("bul", size=12, sample=bullet)))
    if section.get('page_break'):
        story.append(PageBreak())
doc.build(story)
print(json.dumps({"path": out}))
`;

const INSTALL_AND_RUN: Record<string, { install: string; script: string; out: string; ext: string }> = {
  pptx: { install: "python-pptx", script: PPTX_SCRIPT, out: "/tmp/out.pptx", ext: "pptx" },
  docx: { install: "python-docx", script: DOCX_SCRIPT, out: "/tmp/out.docx", ext: "docx" },
  xlsx: { install: "openpyxl", script: XLSX_SCRIPT, out: "/tmp/out.xlsx", ext: "xlsx" },
  pdf: { install: "reportlab", script: PDF_SCRIPT, out: "/tmp/out.pdf", ext: "pdf" },
};

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
    const type = body?.type;
    const spec = body?.spec;
    if (!type || !INSTALL_AND_RUN[type]) {
      return json(400, { error: "type must be pptx|docx|xlsx|pdf" });
    }
    if (!spec || typeof spec !== "object") {
      return json(400, { error: "spec is required" });
    }

    const recipe = INSTALL_AND_RUN[type];
    const filename = (body?.filename as string) || `document.${recipe.ext}`;
    const dotIndex = filename.lastIndexOf(".");
    const rawBase = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
    const rawExt = dotIndex > 0 ? filename.slice(dotIndex + 1) : recipe.ext;
    const safeBase = rawBase
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .replace(/\s+/g, "-")
      .replace(/_+/g, "_")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 80) || "document";
    const safeExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || recipe.ext;
    const safeName = `${safeBase}.${safeExt}`;

    const code = `
${MULTILINGUAL_PY}
import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "${recipe.install}"], check=True)
SPEC_JSON = ${JSON.stringify(JSON.stringify(spec))}
${recipe.script}
`;

    const supabase = serviceClient();
    const { data: execRow, error: insErr } = await supabase
      .from("e2b_executions").insert({
        user_id: userId,
        conversation_id: body.conversation_id ?? null,
        kind: "generate_document",
        language: "python",
        status: "running",
        input: { type, spec, filename: safeName },
      }).select("id").single();
    if (insErr || !execRow) return json(500, { error: "failed to create execution" });

    try {
      const result = await runInSandbox({
        code, language: "python",
        outputFiles: [recipe.out],
        timeoutSec: 300,
      });

      // Rename output file to user-requested filename
      const renamed = result.files.map((f) =>
        f.path === recipe.out ? { ...f, path: safeName } : f
      );
      const uploaded = await uploadFiles(supabase, userId, execRow.id, renamed);

      await supabase.from("e2b_executions").update({
        status: result.error ? "failed" : "succeeded",
        stdout: result.stdout, stderr: result.stderr,
        error: result.error ?? null, files: uploaded,
        duration_ms: result.duration_ms,
      }).eq("id", execRow.id);

      return json(200, {
        execution_id: execRow.id,
        file: uploaded[0] ?? null,
        files: uploaded,
        stdout: result.stdout,
        error: result.error,
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
