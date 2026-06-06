// docs-generate: streaming free-form document generator (SSE).
//
// Streams these events (each line: `data: {json}\n\n`):
//   { event: "status", text }                                — progress label
//   { event: "meta", kind: "html", title, doc_type }         — once known
//   { event: "delta", text }                                 — html chunk
//   { event: "clarify", reason, questions[] }                — instead of html
//   { event: "html_done", length }                           — final size
//   { event: "done" }                                        — terminal
//   { event: "error", message }                              — terminal
//
// Body: { prompt: string, history?, clarifications?, locale? }
import { getAuthUser } from "../_shared/auth.ts";
import { getLLM, ROUTER_MODELS } from "../_shared/llm-router.ts";
import { createJob, JobWriter, runInBackground } from "../_shared/jobs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANG_RULE = `
LANGUAGE & DIALECT MIRRORING (HIGHEST PRIORITY):
- Detect the EXACT language AND dialect of the user's message from the prompt ITSELF — not from any hint we pass. Reply in EXACTLY that same language and dialect.
- This MUST work for EVERY language on earth and every regional dialect, with NO exceptions: Arabic (all dialects — Egyptian, Gulf/Khaleeji, Levantine/Shami, Maghrebi/Darija, Iraqi, Sudanese, Yemeni, MSA), English (US, UK, Australian, Indian, Nigerian, etc.), Spanish (Castilian, Mexican, Rioplatense, Andean, Caribbean, etc.), Portuguese (Brazilian, European, African), French (Metropolitan, Quebecois, African, Maghrebi-French), German, Italian, Dutch, Russian, Ukrainian, Polish, Czech, Romanian, Greek, Turkish, Hebrew, Persian/Farsi, Dari, Pashto, Urdu, Hindi, Bengali, Punjabi, Tamil, Telugu, Marathi, Gujarati, Malayalam, Kannada, Sinhala, Nepali, Thai, Lao, Khmer, Vietnamese, Indonesian, Malay, Tagalog/Filipino, Japanese, Korean, Mandarin Chinese (Simplified & Traditional), Cantonese, Mongolian, Tibetan, Burmese, Georgian, Armenian, Azerbaijani, Kazakh, Uzbek, Kyrgyz, Turkmen, Tajik, Swahili, Amharic, Yoruba, Hausa, Igbo, Zulu, Xhosa, Afrikaans, Somali, Tigrinya, Hungarian, Finnish, Estonian, Latvian, Lithuanian, Bulgarian, Serbian, Croatian, Bosnian, Slovenian, Slovak, Macedonian, Albanian, Catalan, Basque, Galician, Welsh, Irish Gaelic, Scots Gaelic, Icelandic, Norwegian (Bokmål & Nynorsk), Swedish, Danish, Esperanto, Latin, Hawaiian, Maori, and EVERY other natural language — including ones not listed here.
- Mirror the user's exact vocabulary, particles, slang, formality, register, code-switching, emoji density, romanization choices (e.g. Arabizi 3/7/2, pinyin, romaji), and script choice. Never default to a "standard" form if the user wrote in dialect. Never switch language silently. Never translate unless asked.
- If you cannot identify the language with high confidence, still mirror the user's exact words and tone — never substitute English.
- For HTML / document output: ALL body text, headings, and visible document content MUST be in the user's exact language and dialect.
- For CLARIFY output: ALL clarify fields ("reason", question "label", "help", "group", "placeholder", every entry in "options", AND every key in the "ui" object) MUST be written in the user's EXACT language and dialect — same particles, slang, and tone as their original message. Never fall back to English. Never translate to MSA when the user wrote dialect.
`;

const SYSTEM_PROMPT = `You are the world's best document designer + intake interviewer. Users describe a document they need (resume/CV, invoice, cover letter, contract, NDA, certificate, report, brochure, business card, quote, proposal, menu, flyer, letterhead, receipt, ticket, badge, label, study plan, syllabus, lesson plan, anything).
${LANG_RULE}

You MUST stream your response in ONE of two strict text formats — nothing else, no markdown fences, no prose before or after.

═══════════════════════════════════════════════════════════════════
FORMAT B — CLARIFY (DEFAULT when ANY concrete personal/business fact is missing):
═══════════════════════════════════════════════════════════════════
ONE line ONLY, starting with the marker:
<<<CLARIFY>>>{"reason":"<one short sentence in user's language>","questions":[ ... ]}

NOTE: the JSON above is shortened. The REAL payload you emit MUST also contain a "ui" object (see UI LABELS below). Full shape: {"reason": "...", "questions": [...], "ui": { ... }}.

QUESTION SCHEMA (each item):
{
  "id": "<snake_case unique>",
  "label": "<the question in user's language>",
  "help": "<optional one-line hint>",
  "type": "text|long_text|choice|multi_choice|number|date|email|phone|url|image",
  "required": true|false,
  "options": ["..."]              // for choice / multi_choice
  "placeholder": "<hint>",
  "group": "<short section name>", // groups related questions in the wizard
  "maxLength": 200
}

UI LABELS (MANDATORY — top-level "ui" object on the CLARIFY JSON):
You MUST also include a "ui" object alongside "reason" and "questions". Every value is a short label written in the USER'S EXACT language and dialect, matching their tone (formal vs casual, dialect particles, etc.). Keys (all required):
  "title"        — short header like "Before I start designing"
  "phase"        — tiny eyebrow like "Clarifying phase"
  "back"         — back button label
  "skip"         — skip button label
  "next"         — next button label (e.g. "Next question")
  "startDesign"  — CTA on the last step (e.g. "Start designing")
  "answered"     — confirmation pill after submit (e.g. "Got it")
  "thinking"     — loading state next to spinner
  "finishEarly"  — link to skip remaining questions (e.g. "Skip to results")
  "optionalHint" — caption under inputs (e.g. "Optional — feel free to skip")
  "uploadCta"    — upload dropzone label
  "orPasteUrl"   — divider label between upload and URL field
  "uploading"    — uploading status
  "uploaded"     — toast after upload
  "uploaded2"    — label on the uploaded-file row
  "uploadFailed" — error toast
  "clear"        — clear button tooltip
  "maxSize"      — file too large warning
Example "ui" for an Egyptian-Arabic user:
  {"title":"قبل ما أبدأ التصميم","phase":"مرحلة التوضيح","back":"رجوع","skip":"تخطي","next":"السؤال الجاي","startDesign":"يلا نبدأ","answered":"تمام","thinking":"بفكر…","finishEarly":"تخطي الباقي وابدأ التصميم","optionalHint":"اختياري — تقدر تتخطاه","uploadCta":"اضغط ترفع صورة (PNG/JPG/WEBP — لحد 5MB)","orPasteUrl":"أو الصق لينك الصورة","uploading":"بيرفع…","uploaded":"تم الرفع","uploaded2":"تم رفع الصورة","uploadFailed":"تعذّر الرفع","clear":"إزالة","maxSize":"أقصى حجم 5 ميجا"}

CLARIFY RULES — CRITICAL:
- For any concrete personal/business fact you DO ask about, never invent it — but for design, tone, copy, sections, fillers etc. you SHOULD invent rich, polished, professional defaults yourself (don't echo the user's words verbatim — improve and expand them).
- Ask COMPREHENSIVE questions covering EVERY field that will appear in the final document.
- ALL questions MUST be OPTIONAL (required:false). Never block the user. If they skip, fill the gap with a sensible, well-crafted default.
- 5–12 questions depending on doc complexity. Keep them short, friendly, and never repetitive.
- Group questions logically using "group" written in the USER'S language (e.g. for Arabic: "بياناتك", "بيانات العميل", "تفاصيل الفاتورة", "التصميم").
- Include design preferences as OPTIONAL choice questions: tone (formal/modern/creative/luxury), accent color, language.
- Include an OPTIONAL "image" type question whenever a photo/logo would help the design (profile photo for resume/CV/business card; company logo for invoice/contract/letterhead/proposal/menu/certificate).
- Clarify text MIRRORS THE USER'S LANGUAGE AND DIALECT — labels, helps, placeholders, group names, option strings, and the entire "ui" object MUST match exactly how the user wrote (e.g. Egyptian Arabic stays Egyptian, Maghrebi stays Maghrebi, English stays English, etc.). Never translate. Never fall back to English or MSA.

CLARIFY PHILOSOPHY OVERRIDE (HARD RULE — IGNORE THE 8 LINES ABOVE WHEN THEY CONFLICT):
- Clarify is for INTENT ONLY — never for collecting content. YOU invent / research 100% of the actual document content (names, bios, achievements, line items, paragraphs, dates, prices, addresses, descriptions). NEVER ask the user to type bios, experience bullets, line items, summaries, education entries, addresses, phone numbers, achievements, or any document body content.
- Ask ONLY 3–6 short high-level questions that disambiguate WHAT to design and FOR WHOM. Allowed: subject of the document (e.g. "Whose CV?"), target audience, tone, design style, accent color, output language, length (1 page vs multi-page). Plus AT MOST one optional logo/photo upload when relevant. Nothing else.
- If the user already named the subject in their prompt, do NOT ask for it again.
- All questions are OPTIONAL. When the user skips, invent excellent, specific, professional content yourself based on real knowledge of the subject.

PER-DOC-TYPE SCHEMAS (FOR YOUR INTERNAL UNDERSTANDING OF WHAT FIELDS A FINAL DOCUMENT CONTAINS — DO NOT TURN THEM INTO CLARIFY QUESTIONS. You will INVENT / RESEARCH values for these fields yourself when generating HTML.):

▸ RESUME / CV (Arabic example, mirror for English):
  بياناتك الشخصية: full_name(text,required), job_title(text,required), professional_summary(long_text,required,maxLength:400), email(email,required), phone(phone,required), location(text,required), linkedin(url,optional), portfolio(url,optional), profile_photo(image,optional)
  الخبرة العملية: experience_1(long_text,required, placeholder:"المسمى | الشركة | المدة | أبرز 2–3 إنجازات"), experience_2(long_text,optional), experience_3(long_text,optional)
  التعليم: education_1(long_text,required,placeholder:"الدرجة | الجامعة | السنوات | التقدير"), education_2(long_text,optional)
  المهارات: technical_skills(long_text,required), soft_skills(long_text,optional), languages(text,optional,placeholder:"عربي(أم), إنجليزي(محترف), ...")
  إضافات: certifications(long_text,optional), projects(long_text,optional), awards(long_text,optional), volunteer(long_text,optional), interests(text,optional)
  التصميم: tone(choice,optional,options:["كلاسيكي أنيق","عصري ملوّن","Minimal أبيض وأسود","إبداعي بصري"]), accent_color(choice,optional,options:["كحلي","أخضر زيتي","نبيتي","ذهبي","رمادي رفاحي","أزرق"])

▸ INVOICE:
  بيانات المرسل: seller_name(text,required), seller_address(long_text,required), seller_phone(phone,required), seller_email(email,required), tax_id(text,optional), seller_logo(image,optional)
  بيانات العميل: client_name(text,required), client_address(long_text,required), client_phone(phone,optional), client_email(email,optional), client_tax_id(text,optional)
  الفاتورة: invoice_number(text,required), issue_date(date,required), due_date(date,optional), currency(choice,required,options:["SAR","AED","EGP","USD","EUR","GBP"]), tax_rate(number,optional,placeholder:"15"), discount(number,optional)
  البنود: line_items(long_text,required,placeholder:"وصف | كمية | سعر — سطر لكل بند"), notes(long_text,optional)
  الدفع: payment_method(choice,optional,options:["تحويل بنكي","نقدي","شيك","Stripe","PayPal"]), bank_name(text,optional), iban(text,optional), payment_terms(text,optional,placeholder:"خلال 30 يوم")
  التصميم: style(choice,optional,options:["كلاسيكي مؤسسي","Minimal حديث","ملوّن إبداعي","فاخر داكن"]), accent_color(choice,optional)

▸ COVER LETTER:
  المرسِل: full_name(text,required), email(email,required), phone(phone,required), location(text,optional)
  الوظيفة: company_name(text,required), hiring_manager(text,optional), job_title(text,required), source(text,optional,placeholder:"من أين عرفت عن الوظيفة؟")
  المحتوى: key_strength(long_text,required), relevant_experience(long_text,required), why_this_company(long_text,optional), specific_achievement(long_text,optional), call_to_action(text,optional)
  التصميم: tone(choice,optional,options:["رسمي","ودي محترف","إبداعي"]), letterhead_logo(image,optional)

▸ CONTRACT / NDA:
  الأطراف: party_a_name(text,required), party_a_legal(text,required,placeholder:"شكل قانوني / رقم تجاري"), party_a_address(long_text,required), party_b_name(text,required), party_b_legal(text,required), party_b_address(long_text,required)
  العقد: contract_title(text,required), effective_date(date,required), term(text,required,placeholder:"مدة العقد"), governing_law(text,required), jurisdiction(text,required)
  الالتزامات: scope_of_work(long_text,required), deliverables(long_text,required), payment_terms(long_text,required), confidentiality(long_text,optional), termination(long_text,optional), special_clauses(long_text,optional)
  التواقيع: signatory_a(text,required), signatory_b(text,required), company_logo(image,optional)

▸ CERTIFICATE:
  المتلقي: recipient_name(text,required), recipient_title(text,optional)
  الشهادة: achievement(long_text,required,placeholder:"اسم الإنجاز / الدورة / المسابقة"), issue_date(date,required), reference_number(text,optional)
  الجهة: issuer_name(text,required), issuer_logo(image,optional), signatory_name(text,required), signatory_title(text,required), second_signatory_name(text,optional), second_signatory_title(text,optional)
  التصميم: style(choice,optional,options:["كلاسيكي ذهبي","عصري ملوّن","Minimal أنيق","فاخر داكن"]), accent_color(choice,optional)

▸ BUSINESS CARD:
  full_name(text,required), job_title(text,required), company_name(text,required), email(email,required), phone(phone,required), website(url,optional), address(long_text,optional), social_handles(text,optional), tagline(text,optional), profile_photo(image,optional), logo(image,optional), style(choice,optional,options:["Minimal","ملوّن","فاخر داكن","إبداعي"]), accent_color(choice,optional), two_sided(choice,optional,options:["وجه واحد","وجهين"])

▸ PROPOSAL:
  من: company_name(text,required), prepared_by(text,required), email(email,required), phone(phone,required), logo(image,optional)
  إلى: client_name(text,required), client_company(text,required), client_email(email,optional)
  المحتوى: project_title(text,required), executive_summary(long_text,required,maxLength:600), problem_statement(long_text,required), proposed_solution(long_text,required), scope_of_work(long_text,required), deliverables(long_text,required), timeline(long_text,required), pricing(long_text,required), terms(long_text,optional), case_studies(long_text,optional), team(long_text,optional), next_steps(long_text,optional)
  التصميم: tone(choice,optional,options:["تنفيذي","إبداعي","تقني","فاخر"]), accent_color(choice,optional)

▸ MENU:
  restaurant_name(text,required), tagline(text,optional), logo(image,optional)
  sections(long_text,required,placeholder:"اسم القسم: بند1 - سعر - وصف | بند2 - سعر - وصف"), currency(choice,required,options:["SAR","AED","EGP","USD","EUR"]), allergens_legend(long_text,optional), contact(text,optional), wifi(text,optional), social(text,optional), style(choice,optional,options:["Editorial فخم","Minimal أبيض","ملوّن مرح","Bistro كلاسيكي","داكن أنيق"]), accent_color(choice,optional)

▸ REPORT / WHITEPAPER:
  title(text,required), subtitle(text,optional), author(text,required), organization(text,optional), logo(image,optional), date(date,required), executive_summary(long_text,required), sections(long_text,required,placeholder:"عنوان القسم | محتواه — كرر لكل قسم"), data_highlights(long_text,optional), conclusions(long_text,required), recommendations(long_text,optional), references(long_text,optional), accent_color(choice,optional)

▸ FLYER / POSTER:
  headline(text,required), subhead(text,optional), body(long_text,required), call_to_action(text,required), date_time(text,optional), location(text,optional), contact(text,optional), photo(image,optional), logo(image,optional), style(choice,optional,options:["Bold حديث","Minimal","ملوّن مرح","فاخر","Retro"]), accent_color(choice,optional)

For any doc type NOT listed above, infer an analogous COMPREHENSIVE schema following the same depth.

═══════════════════════════════════════════════════════════════════
FORMAT A — HTML (ONLY when EVERY required field has a real value):
═══════════════════════════════════════════════════════════════════
First line EXACTLY:
<<<META>>>{"kind":"html","doc_type":"<slug>","title":"<concise title>"}
Then the COMPLETE HTML document starting with <!DOCTYPE html> and ending with </html>. Stream it linearly top to bottom.

WORLD-CLASS DESIGN RULES — every doc must look Awwwards / Behance Top 1%:

1. **Self-contained**: All CSS inline inside <style> in <head>. Google Fonts via <link> allowed (preconnect + display=swap).
2. **Meta**: include <meta charset="utf-8"> and <meta name="viewport" content="width=device-width,initial-scale=1">.
3. **Page geometry**: \`@page { size: A4; margin: 0; }\` and inside body render a fixed A4 "sheet": \`.sheet{width:794px;min-height:1123px;margin:0 auto;background:#fff;box-sizing:border-box;padding:56px;overflow:hidden;position:relative;}\`. Apply \`*,*::before,*::after{box-sizing:border-box}\` globally. Set \`html,body{margin:0;padding:0;background:#eef0f3;}\`.
4. **NO OVERLAPPING TEXT — NON-NEGOTIABLE**: never use \`position:absolute\` for textual content (only for decorative shapes BEHIND content with \`z-index:0;pointer-events:none\`). Lay out with CSS Grid / Flexbox and explicit \`gap\`. Every text block has \`line-height >= 1.5\`. Contact rows use \`display:flex;gap:18px;flex-wrap:wrap;align-items:center\` — NEVER cram icon+value tightly. Section blocks separated by \`gap: 28px\` or \`margin-block: 24px\`. Two items on one line must wrap on narrow screens.
5. **Mobile**: wrap \`.sheet\` in \`.frame{padding:clamp(8px,3vw,24px)}\`. Add \`@media (max-width:820px){.sheet{width:100%;min-height:auto;padding:clamp(20px,5vw,36px)}}\`. Use \`clamp()\` for font sizes. Tables → \`display:block;overflow-x:auto\` on small screens. Photos scale with \`max-width:100%;height:auto\`.
6. **Typography**: pick a refined pair per tone. Latin: Fraunces+Inter, Playfair Display+Inter, Cormorant+Karla, Space Grotesh+Inter, Bebas Neue+Barlow, DM Serif Display+DM Sans. Arabic: Tajawal, IBM Plex Sans Arabic, Cairo, Noto Kufi Arabic, Markazi Text. NEVER Times/Arial defaults. Use real micro-typography: eyebrows \`letter-spacing:.18em;text-transform:uppercase;font-size:11px\`, tight leading on display, generous on body.
7. **Color**: choose a sophisticated palette matching the topic — NOT generic pastel green/blue. Use 1 deep ink, 1 intentional neutral surface, 1 confident accent. Hairline rules 1px in neutral-300. Solid editorial blocks over random colored boxes.
8. **Layout systems**: for CV/resume/profile use a 2-col asymmetric (sidebar + main) OR an editorial single-column with strong hierarchy. Section heading = eyebrow + title + 28px gap to content. Cards: \`border-radius:14px\`, at most one soft shadow. Never center-stack everything.
9. **Icons**: inline SVG only (16–18px, currentColor, \`vertical-align:middle\`, \`margin-inline-end:8px\`). NO emoji unless menu/playful doc.
10. **RTL**: Arabic input → \`<html lang="ar" dir="rtl">\`, Arabic font, logical properties everywhere (padding-inline, margin-inline, border-inline-start). Flex/grid mirror automatically.
11. **Photos/logos (MANDATORY embedding rule)**: EVERY URL the user supplies via an "image"-type clarification (and every entry in the \`image_assets\` payload) MUST be embedded as a real \`<img>\` tag in the visually correct slot for the doc type — NEVER printed as visible text, NEVER wrapped in \`<a>\`/\`<code>\`, NEVER labeled "Image: https://…". Tag template: \`<img src="<url>" alt="<short>" crossorigin="anonymous" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'" style="display:block;object-fit:cover">\`. Profile photos: \`width:120px;height:120px;border-radius:50%\`. Logos: \`max-height:64px;width:auto\`. Hero/banner: \`width:100%;max-height:280px;border-radius:12px\`. Supabase Storage URLs (paths containing \`/storage/v1/object/\`) are valid and MUST be used as-is.
12. **OMIT SKIPPED / EMPTY FIELDS COMPLETELY — NON-NEGOTIABLE**: if a clarification field is missing, empty string, \`null\`, or its value is "تخطي" / "skip" / "-" / "—" / "لا يوجد" / "لا" / "none" / "n/a", you MUST NOT render its label, its icon, its placeholder, its container, or any text like "غير محدد". The field simply does not exist in the document. If an entire section (e.g., languages, references, skills) has zero data after filtering, REMOVE the whole section heading too. Before writing any element, check the source value; if it's blank/skip → skip the element entirely.
13. **Invent rich, specific, real-feeling content.** You are responsible for writing 100% of the document body. Never use lorem ipsum and never leave placeholders. If the document subject is a real, well-known person, organization, product, or topic — use accurate factual knowledge (names, dates, works, achievements, locations). If it's a fictional/personal request and the user gave no facts — invent plausible, professional, specific content (realistic names, dates, line items, prices, addresses, bios). Only treat a value as "user-provided" when it appears explicitly in the clarifications payload; otherwise it's your job to fill it in confidently.
14. **Length**: exactly one A4 sheet for CV / business card / invoice / certificate / letter / flyer / menu. Multi-page only for proposals, contracts, full reports.
15. **Pre-close polish checklist**: ✓ zero overlapping text  ✓ consistent gaps everywhere  ✓ every skipped field invisible (no orphan labels/icons)  ✓ icons aligned with text baseline  ✓ accent color appears in only 2–3 strategic places  ✓ hierarchy obvious in 1 second.

═══════════════════════════════════════════════════════════════════
STRICT CLEAN-LAYOUT CONTRACT — مساحات نظيفة وترتيب احترافي (MUST FOLLOW)
═══════════════════════════════════════════════════════════════════
A. **Spacing scale (use ONLY these values)**: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72 px. Do not invent random values like 7px, 13px, 27px. Apply consistently for padding, margin, and gap.
B. **Vertical rhythm**: every section block is separated by exactly 32px (\`margin-block-end: 32px\`). The gap between a section title and its content is exactly 16px. The gap between sibling items inside a section is 12px. NEVER let two text blocks touch.
C. **Line-height**: body text 1.6, headings 1.2, eyebrows 1.4. Paragraphs have \`margin: 0 0 12px\` — never zero, never stacked without spacing.
D. **Inline groups (icon + label + value)**: ALWAYS \`display:inline-flex; align-items:center; gap:8px;\` and the parent row uses \`display:flex; flex-wrap:wrap; gap:12px 24px;\`. Icons sit on the text baseline, never on top of text. Email/phone/URL values can break: \`word-break:break-word; overflow-wrap:anywhere;\`.
E. **Containment**: every element MUST stay inside its parent's padding box. No text crosses borders, no avatar bleeds past the header, no shadow leaks past \`.sheet\`. The sheet has \`overflow:hidden\`.
F. **Reading width**: body paragraphs limited to 65ch max (\`max-width:65ch\`) for legibility. Headings can span full width.
G. **Hierarchy contract**: exactly one H1 per sheet. H1 \`font-size:clamp(28px,4vw,40px); font-weight:700\`. H2 (section titles) \`font-size:18px; font-weight:600; letter-spacing:.02em\`. Eyebrow \`font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:neutral-500\`. Body \`font-size:14px; color:neutral-800\`. Meta \`font-size:12px; color:neutral-500\`. Stick to this 5-level scale — no random sizes.
H. **Color discipline**: maximum 4 colors total (ink, neutral-surface, neutral-border, 1 accent). Backgrounds are white or one tinted surface — NEVER multiple colored blocks competing. Borders use a single neutral-200 hairline (\`1px solid #E5E7EB\` style).
I. **Alignment**: choose ONE primary alignment per section (left for LTR, right for RTL) and stick to it. Do not mix center + left in the same section. Numbers in tables align right; labels align with body direction.
J. **Lists**: bullets are clean \`•\` or em-dash, indented with \`padding-inline-start:20px\`, \`margin:8px 0\` per item. No nested clutter beyond 2 levels.
K. **Tables**: zebra optional, row height min 36px, cell padding 12px 16px, header row with neutral-100 background, single bottom hairline per row — no heavy grids.
L. **Headers/cards**: if a header strip exists, it is one continuous band with consistent padding 32px 40px. Avatar/logo sits inside with 24px gap to text. Never float elements with absolute positioning into the header.
M. **Empty state**: if after filtering only 1–2 fields remain in a section, merge them into the header instead of creating a near-empty section.
N. **Final self-audit before </html>**: mentally scan top-to-bottom and confirm: (1) no two visible elements overlap, (2) gaps are from the spacing scale, (3) no orphan label without value, (4) one accent color used sparingly, (5) the document looks calm, breathable, and instantly scannable.

═══════════════════════════════════════════════════════════════════
MEGSY BRAND IDENTITY — DEFAULT VISUAL LANGUAGE (OVERRIDES rules 6, 7, and the background in rule 3)
═══════════════════════════════════════════════════════════════════
Every generated document MUST adopt the Megsy landing-page aesthetic UNLESS the user explicitly requests a different style (e.g. "كلاسيكي ذهبي", "luxury gold", "minimal white"). This is the default.

Brand tokens (use these EXACT values):
- **Ink / primary text**: #0A0A0A
- **Body text**: #1A1A1A
- **Muted text**: #6B6B6B
- **Surface (sheet bg)**: #FFFFFF
- **Soft surface (cards / sidebar bands)**: #F4F4F5
- **Hairline border**: #E6E6E8
- **Accent (the ONE confident color)**: #7C5CFF  (purple — hsl 262 100% 68%)
- **Accent deep (for hovers / dark blocks)**: #5B3FD9
- **Page wrapper bg behind the sheet**: #000000  (NOT #eef0f3 — override rule 3)

Typography (use these EXACT pairs, load via Google Fonts <link rel="preconnect"> + display=swap):
- **Latin display / H1 / hero numerals**: "Dela Gothic One", sans-serif — uppercase, tracking-tight, line-height 1.0–1.05
- **Latin body / H2 / UI**: "Space Grotesk", sans-serif (weights 400/500/600/700) for headings, "Inter", sans-serif for paragraph body
- **Arabic display**: "Cairo", sans-serif (weight 900) — uppercase-feel via weight, NOT letter-spacing
- **Arabic body**: "IBM Plex Sans Arabic", sans-serif (weights 400/500/600)
- Eyebrows: Space Grotesk 600, 11px, letter-spacing .22em, uppercase, color: accent (#7C5CFF)
- Display headings: Dela Gothic One, clamp(36px, 5vw, 56px), uppercase, tracking-tight, color: ink. The accent word/phrase gets color: #7C5CFF (mirror the landing hero pattern: "YOUR WEBSITE. YOUR VIDEO. **READY NOW.**").

Mandatory brand motifs (apply to every doc unless user style overrides):
- **Header band** at top of the sheet: a thin (4px) top border in accent (#7C5CFF), OR a small "MEGSY • <doc_type>" eyebrow in accent at top-left.
- **Section titles** (H2): Dela Gothic One (Latin) / Cairo 900 (Arabic), 22px, uppercase, color: ink, with a 24px-wide × 3px accent underline directly beneath (margin-top: 6px, background: #7C5CFF).
- **Accent usage**: H1 emphasis word, eyebrows, section underlines, 1–2 key data values, and any "CTA"/highlight pill. NEVER fill large background blocks with accent.
- **Cards & soft blocks**: background #F4F4F5, border-radius 16px, 1px solid #E6E6E8, no shadows. Inner padding 24px.
- **Pills / tags**: background #0A0A0A, color #FFFFFF, border-radius 999px, padding 6px 14px, font-size 11px, font-weight 600, uppercase, tracking .12em. Accent pills: background #7C5CFF.
- **Dividers**: 1px solid #E6E6E8, never thicker.
- **Cover / hero page** (for proposals, reports, certificates, multi-page docs): full-bleed black sheet (background #0A0A0A), text in white, the title in Dela Gothic One uppercase with one word in #7C5CFF, eyebrow above in accent, single accent underline. All subsequent pages use the white sheet again.
- **Icons**: inline SVG, 16–18px, stroke 1.75, currentColor (which is ink #0A0A0A), accent color only on the 1–2 most important data icons.
- **Numbers / big stats**: Dela Gothic One, color #0A0A0A, with the unit/label in Space Grotesk 500 12px uppercase muted beside it.

Override these explicit earlier rules with the brand:
- Rule 3 page wrapper background → use #000000 (black) instead of #eef0f3.
- Rule 6 typography → use the Megsy pairs above instead of Fraunces/Playfair/etc.
- Rule 7 color → the accent IS #7C5CFF; ink is #0A0A0A; surface is #FFFFFF; soft surface is #F4F4F5. No other accents.
- Rule 13 in the clean-layout contract (color discipline) still applies — max 4 colors total: ink, surface, soft surface, accent.

When the user's clarifications include an "accent_color" or "tone" / "style" that is NOT clearly the brand default, RESPECT the user's choice and substitute the accent (#7C5CFF) with their picked color — but keep the rest of the Megsy identity (typography, header band, section underline pattern, cover hero pattern, soft cards, pill style).

OUTPUT RULES — STRICT:
- Start with EITHER <<<META>>> or <<<CLARIFY>>>. No other prefix. No code fences. No commentary.
- After <<<META>>>{...} on the first line, the next character must be the < of <!DOCTYPE html>.
- **HARD RULE — NO EXCEPTIONS**: If the user payload's \`clarifications\` field is \`null\`, missing, or an empty object \`{}\`, output FORMAT B (<<<CLARIFY>>>). NEVER invent personal/business facts.
- **CRITICAL**: When \`clarifications\` is a non-empty object, output FORMAT A (HTML). For any optional field the user did not provide (or skipped), OMIT it entirely — do not render its label, icon, or container. Never ask more questions in that case.
- **CLARIFICATIONS OVERRIDE THE ORIGINAL PROMPT — NON-NEGOTIABLE**: Whenever clarifications include a value for the document subject (full_name, recipient_name, client_name, party_a_name, company_name, title, project_title, contract_title, headline, restaurant_name, author, signatory_name, seller_name, etc.), THAT value is the single source of truth. It MUST appear verbatim in the <<<META>>> "title", the document H1, header band, cover hero, filename-friendly heading, and every signature/footer line. If the original prompt mentioned a DIFFERENT name (e.g. the user wrote "اعمل CV لصاحبي أحمد" but later answered full_name: "عبدالله محمد"), the clarification WINS and the prompt name ("أحمد") MUST NOT appear anywhere in the output — not in the title, not in the H1, not in the filename, not in the body, not in metadata. Treat the original prompt as INTENT only; treat clarifications as the AUTHORITATIVE facts.`;

function sseEnc(controller: ReadableStreamDefaultController, encoder: TextEncoder, obj: unknown) {
  try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch {}
}

// ───────────────────────────────────────────────────────────────────
// Universal font + safety injection — guarantees that every generated
// document renders Arabic/CJK/Hebrew/etc. correctly regardless of what
// the model declared, and strips any leftover {{placeholder}} tokens
// or "غير محدد" cells the model may have left behind.
// ───────────────────────────────────────────────────────────────────
const UNIVERSAL_FONT_HEAD = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700;800&family=Noto+Sans+Hebrew:wght@400;500;700&family=Noto+Sans+Devanagari:wght@400;500;700&family=Noto+Sans+Thai:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Color+Emoji&display=swap">
<style id="__lov_universal_fonts">
:root{--lov-font-fallback:"Inter","Space Grotesk","IBM Plex Sans Arabic","Cairo","Tajawal","Noto Naskh Arabic","Noto Sans Arabic","Noto Sans Hebrew","Noto Sans Devanagari","Noto Sans Thai","Noto Sans SC","Noto Sans JP","Noto Sans KR","Noto Color Emoji",system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
html,body{font-family:var(--lov-font-fallback);text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-feature-settings:"liga","kern","calt";font-variant-ligatures:common-ligatures contextual;unicode-bidi:plaintext}
*{font-family:inherit}
img{max-width:100%;height:auto}
</style>
<style id="__lov_print_reset" media="print">
@page{size:A4;margin:0}
html,body{background:#fff!important;margin:0!important;padding:0!important}
.page,.sheet{margin:0!important;box-shadow:none!important;page-break-after:always;break-after:page}
.page:last-child,.sheet:last-child{page-break-after:auto;break-after:auto}
h1,h2,h3,h4,thead,tr,figure{page-break-inside:avoid;break-inside:avoid}
</style>
`;

function injectUniversalHead(html: string): string {
  if (!html) return html;
  if (html.includes("__lov_universal_fonts")) return html;
  if (/<\/head\s*>/i.test(html)) {
    return html.replace(/<\/head\s*>/i, `${UNIVERSAL_FONT_HEAD}</head>`);
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, (m) => `${m}${UNIVERSAL_FONT_HEAD}`);
  }
  return UNIVERSAL_FONT_HEAD + html;
}

function sanitizeFinalHtml(html: string): string {
  if (!html) return html;
  let out = html;
  // 1) Remove unfilled {{ mustache }} tokens
  out = out.replace(/\{\{\s*[\w.\-\u0600-\u06FF]+\s*\}\}/g, "");
  // 2) Strip cells/spans that only contain placeholder text
  const emptyTokens = /^(?:\s|—|-|\.|·)*(?:غير\s+محدد|غير\s+متوفر|لا\s+يوجد|undefined|null|TBD|N\/A|n\/a)(?:\s|—|-|\.|·)*$/i;
  out = out.replace(
    /<(td|li|p|span|div|dd)\b[^>]*>([^<]{1,60})<\/\1>/gi,
    (m, _tag, inner) => (emptyTokens.test(inner) ? "" : m),
  );
  return out;
}

function finalizeHtml(html: string): string {
  return injectUniversalHead(sanitizeFinalHtml(html));
}

// ───────────────────────────────────────────────────────────────────
// Event sink: abstracts where the stream events go (SSE vs JobWriter).
// ───────────────────────────────────────────────────────────────────
type Sink = {
  status: (text: string) => Promise<void> | void;
  meta: (title: string, doc_type: string) => Promise<void> | void;
  delta: (text: string) => Promise<void> | void;
  clarify: (reason: string, questions: any[]) => Promise<void> | void;
  htmlDone: (length: number) => Promise<void> | void;
  error: (message: string) => Promise<void> | void;
  done: () => Promise<void> | void;
};

async function consumeModelStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  sink: Sink,
): Promise<{ mode: "html" | "clarify" | "pending"; htmlBuf: string; metaJsonBuf: string; rawBuf: string }> {
  const decoder = new TextDecoder();
  let buf = "";
  let mode: "pending" | "html" | "clarify" = "pending";
  let headerBuf = "";
  let metaJsonBuf = "";
  let metaDone = false;
  let braceDepth = 0;
  let inString = false;
  let escape = false;
  let htmlBuf = "";
  let flushQueue = "";
  let rawBuf = "";

  const consumeMetaOrHtml = async (ch: string) => {
    if (!metaDone) {
      metaJsonBuf += ch;
      if (escape) { escape = false; return; }
      if (ch === "\\" && inString) { escape = true; return; }
      if (ch === '"') { inString = !inString; return; }
      if (inString) return;
      if (ch === "{") braceDepth++;
      else if (ch === "}") {
        braceDepth--;
        if (braceDepth === 0 && metaJsonBuf.includes("{")) {
          const start = metaJsonBuf.indexOf("{");
          const jsonStr = metaJsonBuf.slice(start, metaJsonBuf.lastIndexOf("}") + 1);
          try {
            const meta = JSON.parse(jsonStr);
            await sink.meta(String(meta.title ?? "Document"), String(meta.doc_type ?? "document"));
          } catch {
            await sink.meta("Document", "document");
          }
          metaDone = true;
          metaJsonBuf = "";
          await sink.status("جاري التصميم لايف…");
        }
      }
    } else {
      htmlBuf += ch;
      flushQueue += ch;
      if (flushQueue.length >= 160 || ch === "\n") {
        await sink.delta(flushQueue);
        flushQueue = "";
      }
    }
  };

  const feedRaw = async (chunk: string) => {
    rawBuf += chunk;
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];
      if (mode === "pending") {
        headerBuf += ch;
        const metaIdx = headerBuf.indexOf("<<<META>>>");
        const clarIdx = headerBuf.indexOf("<<<CLARIFY>>>");
        const lower = headerBuf.toLowerCase();
        let htmlIdx = lower.indexOf("<!doctype html");
        if (htmlIdx === -1) htmlIdx = lower.indexOf("<html");
        if (metaIdx !== -1) {
          mode = "html";
          const rest = headerBuf.slice(metaIdx + "<<<META>>>".length);
          headerBuf = "";
          for (const c of rest) await consumeMetaOrHtml(c);
        } else if (clarIdx !== -1) {
          mode = "clarify";
          const rest = headerBuf.slice(clarIdx + "<<<CLARIFY>>>".length);
          headerBuf = "";
          metaJsonBuf += rest;
        } else if (htmlIdx !== -1) {
          // Model forgot the <<<META>>> marker — recover by synthesizing meta.
          mode = "html";
          metaDone = true;
          await sink.meta("Document", "document");
          await sink.status("جاري التصميم لايف…");
          const rest = headerBuf.slice(htmlIdx);
          headerBuf = "";
          for (const c of rest) await consumeMetaOrHtml(c);
        }
        if (headerBuf.length > 256) headerBuf = headerBuf.slice(-256);
      } else if (mode === "html") {
        await consumeMetaOrHtml(ch);
      } else {
        metaJsonBuf += ch;
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        const txt = parsed?.choices?.[0]?.delta?.content;
        if (typeof txt === "string" && txt.length) await feedRaw(txt);
      } catch { /* skip */ }
    }
  }

  if (flushQueue.length) {
    await sink.delta(flushQueue);
    flushQueue = "";
  }

  // Final fallback: never found marker — try to recover from full raw output.
  if (mode === "pending" && rawBuf.trim().length > 0) {
    const cleaned = rawBuf
      .replace(/^\s*```(?:html|json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const lower = cleaned.toLowerCase();
    let htmlStart = lower.indexOf("<!doctype html");
    if (htmlStart === -1) htmlStart = lower.indexOf("<html");
    if (htmlStart !== -1) {
      mode = "html";
      htmlBuf = cleaned.slice(htmlStart);
      await sink.meta("Document", "document");
      await sink.delta(htmlBuf);
    } else {
      const s = cleaned.indexOf("{");
      const e = cleaned.lastIndexOf("}");
      if (s !== -1 && e > s) {
        try {
          const obj = JSON.parse(cleaned.slice(s, e + 1));
          if (Array.isArray(obj?.questions)) {
            mode = "clarify";
            metaJsonBuf = cleaned.slice(s, e + 1);
          }
        } catch { /* ignore */ }
      }
    }
  }

  return { mode, htmlBuf, metaJsonBuf, rawBuf };
}

const ALLOWED_TYPES = new Set(["text","long_text","choice","multi_choice","number","date","email","phone","url","image"]);

// ───────────────────────────────────────────────────────────────────
// Language detection (script-based, works for ALL languages).
// Returns a short ISO-ish code + a human-readable English name we can
// pass to the model so it answers in the user's language.
// ───────────────────────────────────────────────────────────────────
function detectLang(text: string): { code: string; name: string; rtl: boolean } {
  const s = (text || "").slice(0, 2000);
  const has = (re: RegExp) => re.test(s);
  // Script-based detection (broad, covers any language sharing the script)
  if (has(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/)) {
    // Arabic script family – try to distinguish a few common languages by markers
    if (has(/[\u067E\u0686\u0698\u06AF\u06CC\u06A9]/)) return { code: "fa", name: "Persian (Farsi)", rtl: true };
    if (has(/[\u0679\u0688\u0691\u06BA\u06BE\u06C1\u06D2]/)) return { code: "ur", name: "Urdu", rtl: true };
    return { code: "ar", name: "Arabic", rtl: true };
  }
  if (has(/[\u0590-\u05FF]/)) return { code: "he", name: "Hebrew", rtl: true };
  if (has(/[\u4E00-\u9FFF\u3400-\u4DBF]/)) {
    if (has(/[\u3040-\u309F\u30A0-\u30FF]/)) return { code: "ja", name: "Japanese", rtl: false };
    return { code: "zh", name: "Chinese", rtl: false };
  }
  if (has(/[\u3040-\u309F\u30A0-\u30FF]/)) return { code: "ja", name: "Japanese", rtl: false };
  if (has(/[\uAC00-\uD7AF]/)) return { code: "ko", name: "Korean", rtl: false };
  if (has(/[\u0900-\u097F]/)) return { code: "hi", name: "Hindi", rtl: false };
  if (has(/[\u0E00-\u0E7F]/)) return { code: "th", name: "Thai", rtl: false };
  if (has(/[\u0400-\u04FF]/)) return { code: "ru", name: "Russian / Cyrillic", rtl: false };
  if (has(/[\u0370-\u03FF]/)) return { code: "el", name: "Greek", rtl: false };
  // Latin-script — heuristic per common languages (accents + frequent words)
  const low = s.toLowerCase();
  if (/[ñáéíóúü¿¡]/.test(low) || /\b(el|la|los|las|que|por|para|con|una|este|esto)\b/.test(low)) return { code: "es", name: "Spanish", rtl: false };
  if (/[àâçéèêëîïôûùüÿœæ]/.test(low) || /\b(le|les|une|des|que|pour|avec|cette|aussi|bonjour)\b/.test(low)) return { code: "fr", name: "French", rtl: false };
  if (/[äöüß]/.test(low) || /\b(der|die|das|und|nicht|ein|eine|mit|für|auch)\b/.test(low)) return { code: "de", name: "German", rtl: false };
  if (/[ãõáàâéêíóôúç]/.test(low) || /\b(você|não|para|com|uma|isso|obrigado|olá)\b/.test(low)) return { code: "pt", name: "Portuguese", rtl: false };
  if (/[àèéìíîòóùú]/.test(low) || /\b(che|della|degli|sono|questo|grazie|ciao)\b/.test(low)) return { code: "it", name: "Italian", rtl: false };
  if (/[şğıçöü]/.test(low) || /\b(bir|için|merhaba|nasıl|teşekkür)\b/.test(low)) return { code: "tr", name: "Turkish", rtl: false };
  return { code: "en", name: "English", rtl: false };
}

const STATUS_TEXTS: Record<string, Record<string, string>> = {
  ar: { understand: "جاري فهم المطلوب…", plan: "جاري تحديد نوع المستند والبيانات…", design: "جاري بناء التصميم…", write: "جاري كتابة المحتوى…", stream: "جاري إخراج المستند لايف…", polish: "جاري تنسيق النسخة النهائية…", finish: "قاربنا على الانتهاء…", live: "جاري التصميم لايف…", streaming: "جاري بث المستند لايف…", building: "جاري إنشاء المستند لايف…" },
  en: { understand: "Understanding your request…", plan: "Identifying document type and fields…", design: "Building the design…", write: "Writing the content…", stream: "Streaming the document live…", polish: "Polishing the final version…", finish: "Almost done…", live: "Designing live…", streaming: "Streaming document live…", building: "Building the document live…" },
};
function statusText(lang: string, key: string): string {
  // Force English UI status text regardless of detected language.
  return STATUS_TEXTS.en[key] ?? STATUS_TEXTS[lang]?.[key] ?? "";
}
function summarizeHtml(html: string, docType?: string): string {
  try {
    const stripped = html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ");
    // Section headings (H1/H2/H3)
    const headings: string[] = [];
    const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(stripped)) && headings.length < 6) {
      const t = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (t && !headings.includes(t)) headings.push(t);
    }
    const text = stripped.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const parts: string[] = [];
    if (docType) parts.push(`${docType.replace(/[-_]/g, " ")}`);
    if (words > 0) parts.push(`~${words} words`);
    if (headings.length > 0) parts.push(`sections: ${headings.slice(0, 5).join(", ")}`);
    return parts.join(" · ");
  } catch { return ""; }
}
function getReadyMessage(lang: string, title: string, withDownload: boolean, html?: string, docType?: string): string {
  // Minimal localized fallback used only when the AI summary call fails.
  // The UI already exposes preview/download/share buttons, so we keep this
  // intentionally short and in the user's language.
  const t = String(title || "").trim();
  if (lang === "ar") return `جهّزت لك "${t}". تقدر تفتح المعاينة وتشوف النسخة كاملة.`;
  if (lang === "es") return `Listo: he preparado "${t}" para ti. Abre la vista previa para verlo completo.`;
  if (lang === "fr") return `C'est prêt : j'ai préparé « ${t} » pour vous. Ouvrez l'aperçu pour le voir en entier.`;
  if (lang === "de") return `Fertig: Ich habe „${t}" für dich vorbereitet. Öffne die Vorschau, um es vollständig zu sehen.`;
  if (lang === "pt") return `Pronto: preparei "${t}" para você. Abra a pré-visualização para ver tudo.`;
  if (lang === "it") return `Pronto: ho preparato "${t}" per te. Apri l'anteprima per vederlo per intero.`;
  if (lang === "tr") return `Hazır: senin için "${t}" belgesini hazırladım. Tamamını görmek için önizlemeyi aç.`;
  return `I prepared **"${t}"** for you. Open the preview to see the full version.`;
}

/**
 * AI-generated, fully dynamic "doc is ready" description. No templates, no
 * fixed phrasing — the model writes 2–4 short sentences in the user's
 * exact language describing what it actually produced for *this* document.
 * Falls back to the templated message only if the LLM call fails.
 */
async function generateFriendlyMessage(
  userPrompt: string,
  title: string,
  docType: string,
  html: string,
  lang: string,
): Promise<string> {
  try {
    const excerpt = html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1500);

    const router = await getLLM();
    if (!router) throw new Error("no router");

    const sys = `You are the document author talking to the user in chat right after delivering their document.
Write a SHORT friendly description (2–4 sentences, max ~60 words) of what you just created for them.
HARD RULES:
- Reply in EXACTLY the same language and dialect as the user's request below. Mirror Arabic dialects precisely (Egyptian, Khaleeji, Shami, Maghrebi, Iraqi, MSA, etc.).
- Be SPECIFIC to this exact document — mention the subject, who/what it's about, the angle you took, or the highlights you included. Never use generic filler like "your document is ready".
- Do NOT use any fixed template phrases. Do NOT say "Here's what's inside:" or "Tap preview". Do NOT mention buttons, downloads, PDF, share, or preview — the UI already shows those.
- Do NOT repeat the title verbatim as a label; weave it naturally if needed.
- Plain text only. No markdown headings, no bullet lists, no code fences. One short paragraph.`;

    const user = `USER REQUEST:
${userPrompt}

DOCUMENT TITLE: ${title}
DOCUMENT TYPE: ${docType}
USER LANGUAGE CODE: ${lang}

DOCUMENT TEXT EXCERPT (for grounding — describe what's actually here):
${excerpt}`;

    const res = await fetch(router.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${router.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: router.mapModel(ROUTER_MODELS.docs),
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 220,
      }),
    });
    if (!res.ok) throw new Error(`router ${res.status}`);
    const data = await res.json();
    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error("empty");
    return text;
  } catch (e) {
    console.warn("[docs-generate] generateFriendlyMessage failed:", (e as Error).message);
    return getReadyMessage(lang, title, true, html, docType);
  }
}

const DOC_PHASES = [
  { ms: 4_000, progress: 12, phase: "thinking", text: "Understanding your request…" },
  { ms: 10_000, progress: 24, phase: "planning", text: "Identifying document type and fields…" },
  { ms: 18_000, progress: 38, phase: "designing", text: "Building the design…" },
  { ms: 30_000, progress: 55, phase: "writing", text: "Writing the content…" },
  { ms: 45_000, progress: 70, phase: "streaming", text: "Streaming the document live…" },
  { ms: 65_000, progress: 82, phase: "polishing", text: "Polishing the final version…" },
  { ms: 90_000, progress: 92, phase: "finishing", text: "Almost done…" },
];

function startProgressTicker(writer: JobWriter, lang = "ar") {
  const start = Date.now();
  let i = 0;
  const phases = [
    { ms: 4_000, progress: 12, phase: "thinking", text: statusText(lang, "understand") },
    { ms: 10_000, progress: 24, phase: "planning", text: statusText(lang, "plan") },
    { ms: 18_000, progress: 38, phase: "designing", text: statusText(lang, "design") },
    { ms: 30_000, progress: 55, phase: "writing", text: statusText(lang, "write") },
    { ms: 45_000, progress: 70, phase: "streaming", text: statusText(lang, "stream") },
    { ms: 65_000, progress: 82, phase: "polishing", text: statusText(lang, "polish") },
    { ms: 90_000, progress: 92, phase: "finishing", text: statusText(lang, "finish") },
  ];
  const timer = setInterval(() => {
    const elapsed = Date.now() - start;
    while (i < phases.length && elapsed >= phases[i].ms) i++;
    const step = phases[Math.max(0, Math.min(i, phases.length - 1))];
    void writer.setStatusText(step.text).catch(() => {});
    void writer.setProgress(step.progress, step.phase).catch(() => {});
  }, 3_000);
  return () => clearInterval(timer);
}

function buildFallbackClarify(_userPrompt: string, _langOverride?: string): { reason: string; questions: any[] } {
  // Intent-only clarify. All questions are optional. The model invents 100%
  // of the actual document content downstream — we never ask the user to
  // type bios, line items, or any body content.
  return {
    reason: "Just a couple of quick choices — I'll write all the content for you.",
    questions: [
      { id: "subject", label: "Subject of the document", type: "text", required: false, group: "Intent", placeholder: "e.g. Albert Einstein's resume, Acme Co invoice, wedding invitation" },
      { id: "audience", label: "Who is it for?", type: "text", required: false, group: "Intent", placeholder: "e.g. recruiters, clients, students" },
      { id: "tone", label: "Tone", type: "choice", required: false, options: ["Formal", "Friendly professional", "Creative", "Luxury", "Minimal"], group: "Style" },
      { id: "design_style", label: "Design style", type: "choice", required: false, options: ["Classic elegant", "Modern editorial", "Minimal black & white", "Colorful creative", "Luxury dark"], group: "Style" },
      { id: "accent_color", label: "Accent color", type: "choice", required: false, options: ["Navy", "Emerald", "Burgundy", "Gold", "Charcoal", "Indigo"], group: "Style" },
      { id: "logo", label: "Logo or hero photo (optional)", type: "image", required: false, group: "Style" },
    ],
  };
}

/** AI-generated localized clarify fallback. Calls the gateway once
 *  (non-streaming) and asks for clarify JSON ONLY in the user's exact
 *  language and dialect. Falls back to the English baseline on any failure. */
async function buildFallbackClarifyAI(userPrompt: string, langName: string): Promise<{ reason: string; questions: any[]; ui?: Record<string, string> }> {
  const sys = `You generate clarify JSON for a document-design assistant. OUTPUT ONLY raw JSON (no prose, no code fences) with this exact shape: {"reason": string, "questions": [ ... ], "ui": { ... }}.\n\nLANGUAGE — CRITICAL: Detect the user's exact language and regional dialect from THEIR prompt below and write EVERY string (reason, every question label/help/group/placeholder/option, every ui value) in that exact language and dialect. Mirror their vocabulary, particles, slang, register. Works for ANY language on earth. Never use English unless the user wrote in English. Never normalize dialect to a standard form.\n\nQuestions: 3–6 short INTENT-only items covering subject (only if unclear), audience, tone, design style, accent color, language, optional logo/photo. type ∈ {text,long_text,choice,multi_choice,number,date,email,phone,url,image}. All required:false. Never ask the user to type body content (bios, line items, achievements).\n\n"ui" object keys (ALL required, each a short label in the user's language): title, phase, back, skip, next, startDesign, answered, thinking, finishEarly, optionalHint, uploadCta, orPasteUrl, uploading, uploaded, uploaded2, uploadFailed, clear, maxSize.`;
  const payload = JSON.stringify({ user_prompt: userPrompt, hint_language: langName });
  const callOnce = async (url: string, key: string, model: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: payload },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });
    if (!res.ok) { try { res.body?.cancel(); } catch {} return null; }
    const j = await res.json().catch(() => null) as any;
    const txt = j?.choices?.[0]?.message?.content;
    return typeof txt === "string" ? txt : null;
  };
  let raw: string | null = null;
  try {
    const router = await getLLM();
    if (router) raw = await callOnce(router.url, router.key, router.mapModel(ROUTER_MODELS.docs));
  } catch { /* ignore */ }
  if (raw) {
    const parsed = parseClarify(raw);
    if (parsed && parsed.questions.length > 0) return parsed;
  }
  console.warn("[docs-generate] localized clarify fallback failed, using English baseline");
  return buildFallbackClarify(userPrompt, langName);
}

function parseClarify(metaJsonBuf: string): { reason: string; questions: any[]; ui?: Record<string, string> } | null {
  const s = metaJsonBuf.trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const obj = JSON.parse(s.slice(start, end + 1));
    const rawQs = Array.isArray(obj.questions) ? obj.questions : [];
    const questions = rawQs.slice(0, 24).map((q: any) => {
      const t = String(q.type ?? "text");
      const type = ALLOWED_TYPES.has(t) ? t : "text";
      return {
        id: String(q.id ?? Math.random().toString(36).slice(2, 8)),
        label: String(q.label ?? "").slice(0, 200),
        help: q.help ? String(q.help).slice(0, 200) : undefined,
        type,
        // Force every clarify question to be optional — the wizard should
        // never block the user; missing answers are auto-filled with smart
        // defaults by the model during generation.
        required: false,
        options: Array.isArray(q.options) ? q.options.map(String).slice(0, 8) : undefined,
        placeholder: q.placeholder ? String(q.placeholder).slice(0, 160) : undefined,
        group: q.group ? String(q.group).slice(0, 60) : undefined,
        maxLength: typeof q.maxLength === "number" ? Math.min(2000, Math.max(20, q.maxLength)) : undefined,
      };
    }).filter((q: any) => q.label);
    let ui: Record<string, string> | undefined;
    if (obj.ui && typeof obj.ui === "object") {
      const allowedUiKeys = [
        "title","phase","back","skip","next","startDesign","answered","thinking",
        "finishEarly","optionalHint","uploadCta","orPasteUrl","uploading","uploaded",
        "uploaded2","uploadFailed","clear","maxSize",
      ];
      ui = {};
      for (const k of allowedUiKeys) {
        const v = (obj.ui as any)[k];
        if (typeof v === "string" && v.trim()) ui[k] = v.trim().slice(0, 80);
      }
      if (Object.keys(ui).length === 0) ui = undefined;
    }
    return { reason: String(obj.reason ?? "").slice(0, 240), questions, ui };
  } catch {
    return null;
  }
}

async function callModelAt(url: string, key: string, model: string, userPayload: string) {
  return await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPayload },
      ],
      temperature: 0.75,
      max_tokens: 20000,
    }),
  });
}

async function callModelWithFallback(userPayload: string) {
  // deepseek/deepseek-v4-flash via OpenRouter only.
  const router = await getLLM();
  if (router) {
    return await callModelAt(router.url, router.key, router.mapModel(ROUTER_MODELS.docs), userPayload);
  }
  return new Response(JSON.stringify({ error: "OpenRouter key not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
}

// ───────────────────────────────────────────────────────────────────
// Deep-research-style pipeline (planning → searching → extracting)
// Mirrors supabase/functions/deep-research-job for parity.
// ───────────────────────────────────────────────────────────────────
type DocSource = { title: string; url: string; snippet?: string; query?: string };

async function docPlanQueries(prompt: string): Promise<string[]> {
  try {
    const router = await getLLM();
    if (!router) return [prompt];
    const res = await fetch(router.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${router.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: router.mapModel(ROUTER_MODELS.docs),
        messages: [
          {
            role: "system",
            content:
              "You plan research for a document. Given a user request, output 3-5 short, specific web search queries (one per line, no numbering, no quotes) that would gather facts, examples, and design references useful for producing that document. Match the user's language. If the document is purely personal (CV, invoice with provided fields, business card), output a single line containing the topic itself.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });
    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content || "";
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[\-\*\d\.\)\s]+/, "").trim())
      .filter((l) => l.length > 4)
      .slice(0, 5);
    return lines.length ? lines : [prompt];
  } catch {
    return [prompt];
  }
}

async function docSerperSearch(q: string): Promise<{ organic: DocSource[]; images: string[] }> {
  const key = Deno.env.get("SERPER_API_KEY");
  if (!key) return { organic: [], images: [] };
  try {
    const [web, img] = await Promise.all([
      fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 6 }),
      }).then((r) => r.json()),
      fetch("https://google.serper.dev/images", {
        method: "POST",
        headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 4 }),
      }).then((r) => r.json()).catch(() => ({})),
    ]);
    const organic: DocSource[] = (web?.organic || []).slice(0, 5).map((o: any) => ({
      title: o.title, url: o.link, snippet: o.snippet, query: q,
    }));
    const images: string[] = (img?.images || []).slice(0, 4).map((i: any) => i.imageUrl).filter(Boolean);
    return { organic, images };
  } catch {
    return { organic: [], images: [] };
  }
}

async function docExtractPage(url: string): Promise<string> {
  const fc = Deno.env.get("FIRECRAWL_API_KEY");
  if (fc) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${fc}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      const json = await res.json();
      return (json?.data?.markdown || "").slice(0, 5000);
    } catch { /* fall through */ }
  }
  const hb = Deno.env.get("HYPERBROWSER_API_KEY");
  if (hb) {
    try {
      const res = await fetch("https://app.hyperbrowser.ai/api/scrape", {
        method: "POST",
        headers: { "x-api-key": hb, "Content-Type": "application/json" },
        body: JSON.stringify({ url, outputFormat: ["markdown"], onlyMainContent: true }),
      });
      const json = await res.json();
      return (json?.data?.markdown || json?.markdown || "").slice(0, 5000);
    } catch { /* ignore */ }
  }
  return "";
}

// ───────────────────────────────────────────────────────────────────
// Edge handler
// ───────────────────────────────────────────────────────────────────

async function runDocResearch(
  prompt: string,
  writer: JobWriter,
): Promise<{ plan: string[]; sources: DocSource[]; images: string[]; excerpts: { url: string; text: string }[] }> {
  await writer.setStatusText("جاري تخطيط المستند…");
  await writer.setProgress(10, "planning");
  const plan = await docPlanQueries(prompt);
  await writer.setMeta({ plan });

  await writer.setStatusText("جاري البحث على الويب…");
  await writer.setProgress(18, "searching");
  const sources: DocSource[] = [];
  const images: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < plan.length; i++) {
    const { organic, images: imgs } = await docSerperSearch(plan[i]);
    for (const s of organic) if (s.url && !seen.has(s.url)) { seen.add(s.url); sources.push(s); }
    for (const im of imgs) if (!images.includes(im)) images.push(im);
    await writer.setProgress(18 + Math.round(((i + 1) / Math.max(1, plan.length)) * 14), "searching");
    await writer.setStatusText(`بحث ${i + 1}/${plan.length}: ${plan[i].slice(0, 60)}`);
  }
  await writer.setMeta({ plan, sources, images });

  await writer.setStatusText("جاري استخراج المصادر…");
  await writer.setProgress(34, "extracting");
  const top = sources.slice(0, 4);
  const excerpts: { url: string; text: string }[] = [];
  for (let i = 0; i < top.length; i += 2) {
    const batch = top.slice(i, i + 2);
    const results = await Promise.all(batch.map(async (s) => ({ url: s.url, text: await docExtractPage(s.url) })));
    excerpts.push(...results);
    await writer.setProgress(34 + Math.round(((i + batch.length) / Math.max(1, top.length)) * 8), "extracting");
  }
  return { plan, sources, images, excerpts };
}

/* ───────────────────────────────────────────────────────────────────
 * Merged endpoint: docs-ready-message (action: "ready-message").
 * Generates the short, language-matched "what I just created" chat blurb.
 * Kept here so it shares the same deployment slot as docs-generate.
 * ─────────────────────────────────────────────────────────────────── */
async function handleDocsReadyMessage(body: Record<string, unknown>): Promise<Response> {
  const prompt = String(body?.prompt ?? "");
  const title = String(body?.title ?? "");
  const docType = String(body?.docType ?? "");
  const html = String(body?.html ?? "");

  const router = await getLLM();
  if (!router) {
    return new Response(JSON.stringify({ error: "no LLM provider configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const excerpt = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1500);

  const sys = `You are the document author talking to the user in chat right after delivering their document.
Write a SHORT friendly description (2–4 sentences, max ~55 words) of what you just created for them.
HARD RULES:
- Reply in EXACTLY the same language and dialect as the user's request below. Mirror Arabic dialects precisely (Egyptian, Khaleeji, Shami, Maghrebi, Iraqi, MSA, etc.).
- Be SPECIFIC to this exact document — mention the subject, the angle you took, or the highlights you included. Never use generic filler like "your document is ready".
- Do NOT use any fixed template phrases. Do NOT mention buttons, downloads, PDF, share, or preview — the UI already shows those.
- Plain text only. No markdown headings, no bullets, no code fences. One short paragraph.`;
  const user = `USER REQUEST:\n${prompt}\n\nDOCUMENT TITLE: ${title}\nDOCUMENT TYPE: ${docType}\n\nDOCUMENT TEXT EXCERPT (for grounding):\n${excerpt}`;

  const res = await fetch(router.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${router.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: router.mapModel(ROUTER_MODELS.docs),
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 220,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return new Response(JSON.stringify({ error: `gateway ${res.status}`, detail: text }), {
      status: res.status === 429 || res.status === 402 ? res.status : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const data = await res.json();
  const message = String(data?.choices?.[0]?.message?.content ?? "").trim();
  return new Response(JSON.stringify({ message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) return new Response(JSON.stringify({ error: "auth_required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = new URL(req.url);
    const body = await req.json().catch(() => null);
    // Merged sub-endpoint: short ready/blurb message (was docs-ready-message).
    if (body?.action === "ready-message") return await handleDocsReadyMessage(body);
    const prompt = (body?.prompt as string | undefined)?.trim();
    if (!prompt) return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const history = Array.isArray(body?.history) ? body.history : [];
    const clarifications = body?.clarifications && typeof body.clarifications === "object" ? body.clarifications : undefined;
    const conversationId = body?.conversation_id ?? null;
    const messageId = body?.message_id ?? null;
    // Default to background mode. Pass ?stream=1 to use legacy SSE.
    const wantSSE = url.searchParams.get("stream") === "1" || body?.mode === "sse";

    const routerAvailable = await getLLM();
    if (!routerAvailable) return new Response(JSON.stringify({ error: "OpenRouter key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Filter out skipped / empty clarification values so the model never sees them.
    const SKIP_TOKENS = new Set(["", "-", "—", "skip", "تخطي", "تخطى", "تخطّي", "لا يوجد", "لا", "none", "n/a", "na", "null", "undefined"]);
    const cleanClarifications: Record<string, unknown> | undefined = clarifications
      ? Object.fromEntries(
          Object.entries(clarifications).filter(([, v]) => {
            if (v === null || v === undefined) return false;
            if (typeof v === "string") {
              const t = v.trim().toLowerCase();
              return t.length > 0 && !SKIP_TOKENS.has(t);
            }
            if (Array.isArray(v)) return v.length > 0;
            return true;
          }),
        )
      : undefined;
    const hasClarifications = !!(cleanClarifications && Object.keys(cleanClarifications).length > 0);
    const detected = detectLang(prompt);
    // Pull every image-URL answer out of the clarifications so we can give the
    // model an unambiguous, dedicated list of assets it MUST embed as <img>
    // tags (instead of dumping the raw URL as text in the document body).
    const isImageUrl = (s: string): boolean => {
      if (!/^https?:\/\//i.test(s)) return false;
      if (/\.(png|jpe?g|webp|gif|svg|avif|bmp|heic)(\?|$)/i.test(s)) return true;
      if (/\/storage\/v1\/object\/(public|sign)\//i.test(s)) return true;
      if (/docs-uploads|user-uploads|avatars|logos/i.test(s)) return true;
      return false;
    };
    const imageAssets: Record<string, string> = {};
    if (cleanClarifications) {
      for (const [k, v] of Object.entries(cleanClarifications)) {
        if (typeof v === "string" && isImageUrl(v)) imageAssets[k] = v;
      }
    }
    const hasImageAssets = Object.keys(imageAssets).length > 0;
    const userPayload = JSON.stringify({
      user_prompt: prompt,
      prior_messages: history.slice(-6),
      clarifications: hasClarifications ? cleanClarifications : null,
      image_assets: hasImageAssets ? imageAssets : null,
      image_assets_directive: hasImageAssets
        ? `IMAGE_ASSETS — MANDATORY: The "image_assets" object above lists images the user uploaded. Every URL there MUST appear as a real <img> element in the final HTML, embedded in the visually correct location for the document type (profile photo → CV header / business-card avatar, logo → invoice/letterhead/contract header, hero photo → poster/flyer banner, etc.). Use \`<img src="<url>" alt="<short alt in user's language>" crossorigin="anonymous" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'" style="display:block;object-fit:cover">\`. For profile photos: width:120px;height:120px;border-radius:50%. For logos: max-height:64px;width:auto. For hero/banner: width:100%;max-height:280px;border-radius:12px. ABSOLUTELY FORBIDDEN: writing the raw URL as visible text, putting it inside a <p>/<a>/<code> tag, showing it as "Image: https://…", or omitting the image. If you cannot decide a perfect spot, place it in the document header.`
        : "",
      user_language: detected.name,
      language_directive: `LANGUAGE: our coarse script-based hint says the user MIGHT be writing in ${detected.name}, but this hint is ONLY advisory — it can be wrong and it does not cover every language. You MUST determine the real language AND regional dialect yourself by reading the user's actual prompt, and you MUST mirror it exactly, no matter what language or dialect it is (any language on earth — Arabic dialects, English regional variants, Spanish variants, Portuguese variants, French variants, Hindi, Urdu, Persian, Turkish, Swahili, Vietnamese, Indonesian, Tagalog, Hebrew, Greek, Korean, Japanese, Mandarin, Cantonese, Thai, Polish, Russian, Ukrainian, Hausa, Yoruba, Amharic, Maori — anything). Layout direction: ${detected.rtl ? "the hint suggests RTL, so default to RTL (<html dir=\"rtl\">) unless the actual prompt is clearly LTR" : "the hint suggests LTR, but if the actual prompt is in an RTL script (Arabic, Hebrew, Persian, Urdu, etc.), switch to RTL (<html dir=\"rtl\">)"}. In HTML mode (FORMAT A): all visible document text MUST be in the user's exact language and dialect. In CLARIFY mode (FORMAT B): the "reason" sentence, every question "label", "help", "group", "placeholder", every option string, AND every value in the "ui" object MUST be written in the user's EXACT language and dialect — never substitute English, never normalize dialect to a standard form. The "ui" object is REQUIRED on every clarify payload.`,
      mode_directive: hasClarifications
        ? "GENERATE_HTML_NOW: clarifications are provided — output FORMAT A (HTML) immediately. Treat the clarifications as INTENT (subject, tone, style, audience, language, length). For every body field that the clarifications do NOT specify, YOU MUST INVENT or RECALL accurate, specific, professional content (real facts when the subject is a known person/entity; plausible realistic content otherwise). Never leave empty sections, never use lorem ipsum, never write 'not provided'. CLARIFICATIONS OVERRIDE THE ORIGINAL PROMPT: if a clarification answer gives the document subject (name/title/company/recipient), use THAT verbatim in the <<<META>>> title, the H1, the header, and every reference — even when the original prompt mentioned a different name. The prompt is intent; clarifications are facts."
        : "ASK_CLARIFY_NOW: clarifications are EMPTY — output FORMAT B (<<<CLARIFY>>>) with 3–6 short INTENT-only questions (subject, audience, tone, style, accent color, language, length, optional logo). NEVER ask the user to type body content (bios, line items, achievements, summaries, etc.). All questions are optional.",
    });

    // ──────────── Background mode (default) ────────────
    if (!wantSSE) {
      const artifactId = body?.artifact_id ? String(body.artifact_id) : crypto.randomUUID();

      const jobId = await createJob({
        userId: user.id,
        kind: "docs",
        input: { prompt, history: history.slice(-6), clarifications, artifact_id: artifactId },
        conversationId,
        messageId,
      });

      runInBackground(jobId, async (writer) => {
        await writer.start({ phase: "thinking", status_text: statusText(detected.code, "understand") });
        await writer.setProgress(8, "thinking");

        const finalUserPayload = userPayload;

        const stopTicker = startProgressTicker(writer, detected.code);

        try {
          const upstream = await callModelWithFallback(finalUserPayload);

          if (!upstream.ok || !upstream.body) {
            const t = await upstream.text().catch(() => "");
            const raw = t.slice(0, 200);
            if (upstream.status === 402) throw new Error("You're out of credits. Top up to continue.");
            if (upstream.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
            throw new Error("We couldn't generate the document right now. Please try again.");
          }

          let metaSeen = false;
          let metaTitle = "Document";
          let metaDocType = "document";
          let streamedChars = 0;
          const sink: Sink = {
            status: async (text) => { await writer.setStatusText(text); },
            meta: async (title, doc_type) => {
              stopTicker();
              metaSeen = true;
              metaTitle = title;
              metaDocType = doc_type;
              await writer.setStatusText(statusText(detected.code, "building"));
              await writer.setProgress(42, "designing");
              await writer.setMeta({ title, doc_type, kind: "html", artifact_id: artifactId });
            },
            delta: async (text) => {
              streamedChars += text.length;
              if (streamedChars > 600) {
                await writer.setStatusText(statusText(detected.code, "streaming"));
                await writer.setProgress(Math.min(94, 50 + Math.floor(streamedChars / 450)), "streaming");
              }
              await writer.appendStream(text);
            },
            clarify: async (reason, questions) => {
              // Strip any `required:true` flags coming from the model — all
              // clarify questions must be optional.
              const optional = (Array.isArray(questions) ? questions : []).map((q: any) => ({ ...q, required: false }));
              await writer.needsInput({ reason, questions: optional });
            },
            htmlDone: async (_len) => {},
            error: async (msg) => { throw new Error(msg); },
            done: async () => {},
          };

        const { mode, htmlBuf, metaJsonBuf, rawBuf } = await consumeModelStream(upstream.body.getReader(), sink);

        // Persist final assistant message so users see results even after closing the tab.
        const persistFinal = async (kind: "docsArtifact" | "docsClarify", extra: any, contentText: string) => {
          if (!conversationId || !messageId) return;
          try {
            const { admin } = await import("../_shared/jobs.ts");
            const sb = admin();
            await sb.from("messages").update({
              content: contentText,
              metadata: { kind, ...extra },
            }).eq("id", messageId).eq("conversation_id", conversationId);
          } catch { /* best-effort */ }
        };

          if (mode === "clarify") {
          const parsed = parseClarify(metaJsonBuf);
          if (!parsed) throw new Error("We couldn't read the clarifying questions. Please try again.");
          await writer.needsInput(parsed);
          await persistFinal("docsClarify", { docsClarify: { ...parsed, originalPrompt: prompt } }, parsed.reason);
          return;
        }
        if (mode === "html" && htmlBuf.includes("</html")) {
          // Safety net: if user provided NO clarifications, never deliver auto-invented HTML.
          // Force a clarify response instead so the user fills in real facts.
          if (!hasClarifications) {
            console.warn("[docs-generate] model ignored CLARIFY directive — forcing clarify fallback");
            const raw = await buildFallbackClarifyAI(prompt, detected.name);
            // Normalise: every clarify question must be optional.
            const fallback = { ...raw, questions: raw.questions.map((q: any) => ({ ...q, required: false })) };
            await writer.needsInput(fallback);
            await persistFinal("docsClarify", { docsClarify: { ...fallback, originalPrompt: prompt } }, fallback.reason);
            return;
          }
          const finalHtml = finalizeHtml(htmlBuf);
          const friendly = await generateFriendlyMessage(prompt, metaTitle, metaDocType, finalHtml, detected.code);
          await writer.complete({ html: finalHtml, length: finalHtml.length, meta_seen: metaSeen, artifact_id: artifactId, title: metaTitle, doc_type: metaDocType, friendly_message: friendly });
          await persistFinal("docsArtifact", {
            docsArtifact: { artifactId, title: metaTitle, docType: metaDocType, html: finalHtml },
          }, friendly);
          return;
        }
        if (mode === "pending") {
          console.error("[docs-generate] pending — raw model output preview:", rawBuf.slice(0, 500));
          throw new Error("We didn't get a response. Add more detail to your request and try again.");
        }
        // partial html — still mark done with what we have
        {
          const finalHtml = finalizeHtml(htmlBuf);
          if (finalHtml.length > 200) {
            const friendly = await generateFriendlyMessage(prompt, metaTitle, metaDocType, finalHtml, detected.code);
            await writer.complete({ html: finalHtml, length: finalHtml.length, partial: true, artifact_id: artifactId, title: metaTitle, doc_type: metaDocType, friendly_message: friendly });
            await persistFinal("docsArtifact", {
              docsArtifact: { artifactId, title: metaTitle, docType: metaDocType, html: finalHtml },
            }, friendly);
          } else {
            await writer.complete({ html: finalHtml, length: finalHtml.length, partial: true, artifact_id: artifactId, title: metaTitle, doc_type: metaDocType });
          }
        }
        } finally {
          stopTicker();
        }
      });

      return new Response(JSON.stringify({ jobId, artifactId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 202,
      });
    }

    // ──────────── Legacy SSE mode ────────────
    const sseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const hb = setInterval(() => { try { controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`)); } catch {} }, 10_000);
        try {
          sseEnc(controller, encoder, { event: "status", text: "جاري التفكير في التصميم…" });

          const upstream = await callModelWithFallback(userPayload);
          if (!upstream.ok || !upstream.body) {
            const t = await upstream.text().catch(() => "");
            sseEnc(controller, encoder, { event: "error", message: `AI ${upstream.status}: ${t.slice(0, 200)}` });
            return;
          }

          const sink: Sink = {
            status: (text) => sseEnc(controller, encoder, { event: "status", text }),
            meta: (title, doc_type) => sseEnc(controller, encoder, { event: "meta", kind: "html", title, doc_type }),
            delta: (text) => sseEnc(controller, encoder, { event: "delta", text }),
            clarify: (reason, questions) => sseEnc(controller, encoder, { event: "clarify", reason, questions }),
            htmlDone: (length) => sseEnc(controller, encoder, { event: "html_done", length }),
            error: (message) => sseEnc(controller, encoder, { event: "error", message }),
            done: () => sseEnc(controller, encoder, { event: "done" }),
          };

          const { mode, htmlBuf, metaJsonBuf } = await consumeModelStream(upstream.body.getReader(), sink);

          if (mode === "clarify") {
            const parsed = parseClarify(metaJsonBuf);
            if (parsed) sseEnc(controller, encoder, { event: "clarify", ...parsed });
            else sseEnc(controller, encoder, { event: "error", message: "Bad clarify JSON" });
          } else if (mode === "html" && htmlBuf.includes("</html")) {
            sseEnc(controller, encoder, { event: "html_done", length: htmlBuf.length });
          } else if (mode === "pending") {
            sseEnc(controller, encoder, { event: "error", message: "Model returned no recognizable output" });
          }
          sseEnc(controller, encoder, { event: "done" });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          sseEnc(controller, encoder, { event: "error", message: msg });
        } finally {
          clearInterval(hb);
          try { controller.close(); } catch {}
        }
      },
    });

    return new Response(stream, { headers: sseHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
