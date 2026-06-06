const stripCodeFences = (content: string) => content
  .replace(/```html\s*/gi, "")
  .replace(/```markdown\s*/gi, "")
  .replace(/```md\s*/gi, "")
  .replace(/```\s*/g, "")
  .trim();

const hasRawHtml = (content: string) => /<!doctype html|<html[\s>]|<body[\s>]|<main[\s>]|<section[\s>]|<div[\s>]/i.test(content);

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const inlineFormat = (text: string) => {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
};

const normalizeLines = (content: string) => stripCodeFences(content)
  .replace(/\r/g, "")
  .split("\n")
  .map((line) => line.trimEnd());

const titleFromRequest = (request: string, fallback: string) => {
  const cleaned = request.trim().replace(/[.#*_`]/g, "");
  return cleaned ? cleaned.slice(0, 80) : fallback;
};

const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
};

function extractSections(content: string, request: string) {
  const lines = normalizeLines(content);
  const sections: { title: string; body: string[] }[] = [];
  let current = { title: titleFromRequest(request, "Overview"), body: [] as string[] };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (current.body[current.body.length - 1] !== "") current.body.push("");
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      if (current.body.length > 0) sections.push(current);
      current = { title: line.replace(/^#{1,3}\s+/, "").trim(), body: [] };
      continue;
    }
    current.body.push(line);
  }
  if (current.body.length > 0) sections.push(current);

  if (sections.length > 1) return sections;

  const paragraphs = stripCodeFences(content).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    const sentences = stripCodeFences(content).split(/(?<=[.!??])\s+/).map(p => p.trim()).filter(Boolean);
    return chunk(sentences, 3).map((group, i) => ({
      title: i === 0 ? titleFromRequest(request, "Overview") : `Section ${i + 1}`,
      body: group,
    }));
  }
  return chunk(paragraphs, 2).map((group, i) => ({
    title: i === 0 ? titleFromRequest(request, "Overview") : `Section ${i + 1}`,
    body: group,
  }));
}

function renderBlocks(lines: string[]) {
  const html: string[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length === 0) return;
    html.push(`<ul>${listBuffer.map(item => `<li>${inlineFormat(item)}</li>`).join("")}</ul>`);
    listBuffer = [];
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushList(); continue; }
    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      listBuffer.push(line.replace(/^([-*•]\s+|\d+[.)]\s+)/, ""));
      continue;
    }
    flushList();
    html.push(`<p>${inlineFormat(line)}</p>`);
  }
  flushList();
  return html.join("\n");
}

function buildSlidesHtml(content: string, request: string) {
  const sections = extractSections(content, request).filter(s => s.body.length > 0);
  const safeSections = sections.length > 0 ? sections : [{ title: titleFromRequest(request, "Presentation"), body: [stripCodeFences(content) || request] }];
  const title = safeSections[0]?.title || titleFromRequest(request, "Presentation");

  const slidesMarkup = safeSections.map((section, index) => `
    <section class="slide" data-slide="${index + 1}">
      <div class="slide-inner">
        <div class="slide-kicker">Slide ${index + 1}</div>
        <h2>${inlineFormat(section.title)}</h2>
        <div class="slide-body">${renderBlocks(section.body)}</div>
      </div>
    </section>
  `).join("\n");

  const dotsMarkup = safeSections.map((_, i) => `<button class="dot" type="button" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { --bg: #07111f; --panel: rgba(10,22,39,0.78); --card: rgba(255,255,255,0.06); --text: #f4f7fb; --muted: #a5b4c7; --accent: #7dd3fc; --accent-2: #f9a8d4; --border: rgba(255,255,255,0.12); --shadow: 0 30px 80px rgba(0,0,0,0.35); }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: radial-gradient(circle at top,rgba(125,211,252,0.18),transparent 30%),radial-gradient(circle at bottom right,rgba(249,168,212,0.18),transparent 28%),var(--bg); color: var(--text); font-family: Arial,Helvetica,sans-serif; height: 100%; overflow: hidden; }
    body { display: grid; grid-template-rows: auto 1fr auto; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 24px; position: relative; z-index: 2; }
    .brand { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
    .title { font-size: clamp(20px,4vw,34px); font-weight: 700; margin: 0; }
    .viewport { position: relative; overflow: hidden; padding: 12px 24px 24px; }
    .track { height: 100%; display: grid; grid-auto-flow: column; grid-auto-columns: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; gap: 18px; scrollbar-width: none; }
    .track::-webkit-scrollbar { display: none; }
    .slide { scroll-snap-align: start; min-height: 100%; padding: 12px 0 0; }
    .slide-inner { min-height: calc(100vh - 170px); border: 1px solid var(--border); border-radius: 32px; background: linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04)); box-shadow: var(--shadow); padding: clamp(28px,5vw,56px); display: grid; align-content: start; gap: 24px; overflow: hidden; position: relative; }
    .slide-inner::after { content: ""; position: absolute; inset: auto -12% -25% auto; width: 280px; height: 280px; border-radius: 999px; background: radial-gradient(circle,rgba(125,211,252,0.22),transparent 70%); pointer-events: none; }
    .slide-kicker { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
    h2 { margin: 0; font-size: clamp(32px,7vw,68px); line-height: 0.96; max-width: 12ch; }
    .slide-body { max-width: min(860px,100%); color: var(--muted); font-size: clamp(16px,2.1vw,24px); line-height: 1.7; }
    .slide-body p { margin: 0 0 14px; }
    .slide-body ul { margin: 0; padding-left: 1.1em; display: grid; gap: 10px; }
    .slide-body li::marker { color: var(--accent-2); }
    .slide-body a { color: var(--text); }
    .controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 24px 22px; }
    .dots { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .dot { width: 10px; height: 10px; border-radius: 999px; border: 0; cursor: pointer; background: rgba(255,255,255,0.16); transition: transform 0.2s ease,background 0.2s ease; }
    .dot.active { background: var(--accent); transform: scale(1.2); }
    .navs { display: flex; gap: 10px; }
    .btn { border: 1px solid var(--border); background: var(--panel); color: var(--text); border-radius: 999px; padding: 10px 16px; cursor: pointer; }
    @media (max-width: 768px) { .topbar,.viewport,.controls { padding-left: 16px; padding-right: 16px; } .slide-inner { min-height: calc(100vh - 184px); border-radius: 24px; } }
  </style>
</head>
<body>
  <header class="topbar">
    <div><div class="brand">Megsy Slides</div><h1 class="title">${inlineFormat(title)}</h1></div>
  </header>
  <main class="viewport"><div class="track" id="track">${slidesMarkup}</div></main>
  <footer class="controls">
    <div class="dots" id="dots">${dotsMarkup}</div>
    <div class="navs">
      <button class="btn" type="button" id="prevBtn">Previous</button>
      <button class="btn" type="button" id="nextBtn">Next</button>
    </div>
  </footer>
  <script>
    const track=document.getElementById('track'),dots=Array.from(document.querySelectorAll('.dot')),prevBtn=document.getElementById('prevBtn'),nextBtn=document.getElementById('nextBtn'),slides=Array.from(document.querySelectorAll('.slide'));let currentIndex=0;
    const update=i=>{currentIndex=Math.max(0,Math.min(i,slides.length-1));track.scrollTo({left:currentIndex*track.clientWidth,behavior:'smooth'});dots.forEach((d,j)=>d.classList.toggle('active',j===currentIndex))};
    dots.forEach(d=>d.addEventListener('click',()=>update(Number(d.dataset.index||0))));prevBtn.addEventListener('click',()=>update(currentIndex-1));nextBtn.addEventListener('click',()=>update(currentIndex+1));
    track.addEventListener('scroll',()=>{const i=Math.round(track.scrollLeft/Math.max(track.clientWidth,1));dots.forEach((d,j)=>d.classList.toggle('active',j===i));currentIndex=i},{passive:true});
    window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' ')update(currentIndex+1);if(e.key==='ArrowLeft'||e.key==='PageUp')update(currentIndex-1)});
    update(0);
  </script>
</body>
</html>`;
}

function buildDocumentHtml(content: string, request: string, agent: string | null) {
  const sections = extractSections(content, request);
  const title = sections[0]?.title || titleFromRequest(request, agent === "resume" ? "Resume" : "Document");

  const sectionsMarkup = sections.map((section, index) => `
    <section class="section">
      <div class="section-index">${String(index + 1).padStart(2, '0')}</div>
      <div>
        <h2>${inlineFormat(section.title)}</h2>
        <div class="section-body">${renderBlocks(section.body)}</div>
      </div>
    </section>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { --bg: #f5f7fb; --card: #ffffff; --text: #101828; --muted: #667085; --accent: #0f172a; --border: #dbe3f0; --shadow: 0 18px 50px rgba(15,23,42,0.08); }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: linear-gradient(180deg,#eef3fb 0%,#f7f9fc 100%); color: var(--text); font-family: Arial,Helvetica,sans-serif; }
    body { min-height: 100vh; padding: 32px 16px; }
    .shell { max-width: 1080px; margin: 0 auto; }
    .hero { background: linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96)); color: white; border-radius: 28px; padding: clamp(28px,5vw,56px); box-shadow: var(--shadow); position: relative; overflow: hidden; }
    .hero::after { content: ""; position: absolute; width: 280px; height: 280px; border-radius: 999px; right: -90px; top: -90px; background: radial-gradient(circle,rgba(125,211,252,0.18),transparent 70%); }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.18em; font-size: 12px; color: rgba(255,255,255,0.68); }
    h1 { margin: 14px 0 10px; font-size: clamp(34px,5vw,64px); line-height: 0.98; }
    .content { display: grid; gap: 18px; margin-top: 22px; }
    .section { display: grid; grid-template-columns: 56px 1fr; gap: 18px; padding: 24px; background: var(--card); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow); }
    .section-index { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: #e9eef8; color: var(--accent); font-weight: 700; }
    h2 { margin: 0 0 12px; font-size: clamp(24px,3vw,34px); }
    .section-body { color: var(--muted); font-size: 17px; line-height: 1.8; }
    .section-body p { margin: 0 0 14px; }
    .section-body ul { margin: 0; padding-left: 1.1em; display: grid; gap: 8px; }
    .section-body a { color: var(--accent); }
    .section-body img { max-width: 100%; border-radius: 12px; margin: 12px 0; }
    .section-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 15px; }
    .section-body th, .section-body td { border: 1px solid var(--border); padding: 10px 14px; text-align: left; }
    .section-body th { background: #f0f4f9; font-weight: 600; }
    .section-body tr:nth-child(even) { background: #fafbfd; }
    @media (max-width: 720px) { .section { grid-template-columns: 1fr; } .section-index { width: 48px; height: 48px; border-radius: 16px; } body { padding: 16px 12px; } }
    @media print { body { padding: 0; } .hero { border-radius: 0; } .section { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div class="eyebrow">Megsy Workspace</div>
      <h1>${inlineFormat(title)}</h1>
    </header>
    <main class="content">${sectionsMarkup}</main>
  </div>
</body>
</html>`;
}

function buildRoadmapHtml(content: string, request: string) {
  const sections = extractSections(content, request);
  const title = titleFromRequest(request, "Roadmap");
  const phases = sections.map((s, i) => `
    <div class="phase">
      <div class="phase-marker"><div class="phase-dot"></div><div class="phase-line"></div></div>
      <div class="phase-content">
        <div class="phase-label">Phase ${i + 1}</div>
        <h3>${inlineFormat(s.title)}</h3>
        <div class="phase-body">${renderBlocks(s.body)}</div>
      </div>
    </div>`).join("\n");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:32px 16px;font-family:Arial,sans-serif;background:linear-gradient(135deg,#0f172a,#1e293b);color:#f1f5f9;min-height:100vh}
.shell{max-width:900px;margin:0 auto}h1{font-size:clamp(28px,5vw,48px);margin:0 0 8px;font-weight:800}
.subtitle{color:#94a3b8;margin-bottom:40px;font-size:14px}
.phase{display:grid;grid-template-columns:40px 1fr;gap:16px;margin-bottom:0}
.phase-marker{display:flex;flex-direction:column;align-items:center}
.phase-dot{width:16px;height:16px;border-radius:50%;background:#7dd3fc;border:3px solid #0f172a;box-shadow:0 0 12px rgba(125,211,252,0.4);flex-shrink:0}
.phase-line{width:2px;flex:1;background:linear-gradient(to bottom,#7dd3fc,rgba(125,211,252,0.1));min-height:40px}
.phase:last-child .phase-line{display:none}
.phase-content{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:16px}
.phase-label{font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#7dd3fc;margin-bottom:8px}
h3{margin:0 0 12px;font-size:clamp(20px,3vw,28px)}
.phase-body{color:#94a3b8;font-size:15px;line-height:1.7}
.phase-body p{margin:0 0 10px}.phase-body ul{margin:0;padding-left:1.1em;display:grid;gap:6px}
@media(max-width:600px){.phase{grid-template-columns:28px 1fr}}
</style></head><body><div class="shell"><h1>${inlineFormat(title)}</h1><p class="subtitle">Project Roadmap</p>${phases}</div></body></html>`;
}

function buildMindmapHtml(content: string, request: string) {
  const sections = extractSections(content, request);
  const title = titleFromRequest(request, "Mind Map");
  const nodes = sections.map((s, i) => {
    const items = s.body.filter(b => b.trim()).slice(0, 5);
    return `<div class="branch" style="--angle:${(i * 360) / Math.max(sections.length, 1)}deg">
      <div class="node">${inlineFormat(s.title)}</div>
      ${items.map(item => `<div class="leaf">${inlineFormat(item.replace(/^[-*•]\s+|\d+[.)]\s+/, ""))}</div>`).join("")}
    </div>`;
  }).join("\n");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:32px 16px;font-family:Arial,sans-serif;background:#0f172a;color:#f1f5f9;min-height:100vh}
.shell{max-width:1000px;margin:0 auto}h1{font-size:clamp(28px,5vw,48px);text-align:center;margin:0 0 40px}
.center-node{width:160px;height:160px;border-radius:50%;background:linear-gradient(135deg,#7dd3fc,#a78bfa);display:flex;align-items:center;justify-content:center;margin:0 auto 40px;font-weight:700;font-size:18px;text-align:center;padding:16px;box-shadow:0 0 40px rgba(125,211,252,0.3)}
.branches{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}
.branch{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px}
.node{font-weight:700;font-size:18px;color:#7dd3fc;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.1)}
.leaf{color:#94a3b8;font-size:14px;padding:6px 0 6px 14px;border-left:2px solid rgba(125,211,252,0.3);margin-bottom:4px}
</style></head><body><div class="shell"><h1>${inlineFormat(title)}</h1>
<div class="center-node">${inlineFormat(title.slice(0, 30))}</div>
<div class="branches">${nodes}</div></div></body></html>`;
}

function buildTimelineHtml(content: string, request: string) {
  const sections = extractSections(content, request);
  const title = titleFromRequest(request, "Timeline");
  const events = sections.map((s, i) => `
    <div class="event ${i % 2 === 0 ? "left" : "right"}">
      <div class="event-content">
        <div class="event-marker">${String(i + 1).padStart(2, '0')}</div>
        <h3>${inlineFormat(s.title)}</h3>
        <div class="event-body">${renderBlocks(s.body)}</div>
      </div>
    </div>`).join("\n");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:32px 16px;font-family:Arial,sans-serif;background:linear-gradient(180deg,#f8fafc,#eef2f7);color:#0f172a;min-height:100vh}
.shell{max-width:900px;margin:0 auto}h1{font-size:clamp(28px,5vw,48px);text-align:center;margin:0 0 8px;font-weight:800}
.subtitle{text-align:center;color:#64748b;margin-bottom:40px;font-size:14px}
.timeline{position:relative;padding:20px 0}
.timeline::before{content:"";position:absolute;left:50%;transform:translateX(-50%);width:3px;height:100%;background:linear-gradient(to bottom,#7dd3fc,#a78bfa);border-radius:3px}
.event{position:relative;width:50%;padding:20px 40px;margin-bottom:20px}
.event.left{left:0;text-align:right}.event.right{left:50%;text-align:left}
.event-content{background:white;border-radius:20px;padding:24px;box-shadow:0 8px 30px rgba(15,23,42,0.08);border:1px solid #e2e8f0}
.event-marker{display:inline-block;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7dd3fc,#a78bfa);color:white;font-weight:700;font-size:14px;line-height:36px;text-align:center;margin-bottom:12px}
h3{margin:0 0 10px;font-size:clamp(18px,2.5vw,24px)}
.event-body{color:#64748b;font-size:15px;line-height:1.7;text-align:left}
.event-body p{margin:0 0 8px}.event-body ul{margin:0;padding-left:1.1em;display:grid;gap:6px}
@media(max-width:768px){.timeline::before{left:20px}.event,.event.left,.event.right{width:100%;left:0;padding-left:50px;padding-right:16px;text-align:left}}
</style></head><body><div class="shell"><h1>${inlineFormat(title)}</h1><p class="subtitle">Chronological Timeline</p>
<div class="timeline">${events}</div></div></body></html>`;
}

export function buildPreviewHtml({ content, agent, request }: { content: string; agent: string | null; request: string }) {
  const cleaned = stripCodeFences(content);
  if (hasRawHtml(cleaned)) return cleaned;
  if (agent === "slides") return buildSlidesHtml(cleaned, request);
  if (agent === "roadmap") return buildRoadmapHtml(cleaned, request);
  if (agent === "mindmap") return buildMindmapHtml(cleaned, request);
  if (agent === "timeline") return buildTimelineHtml(cleaned, request);
  return buildDocumentHtml(cleaned, request, agent);
}
