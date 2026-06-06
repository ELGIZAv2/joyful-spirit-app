// Shared HTML composer for Cloudflare Pages deploys (publish + live preview).
// Used by cloudflare-deploy and bundle-preview-fast.

const TAILWIND_CONFIG = `
tailwind.config = {
  darkMode: ['class'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};
`;

// Inspired by open-source visual editors (onlook, stagewise).
// Lets the parent workspace toggle "pick mode" inside the preview iframe and
// receive {selector, text, tag} back when the user clicks an element.
const VISUAL_EDIT_SCRIPT = `
(function(){
  var enabled = false;
  var hover = null;
  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #6366f1;background:rgba(99,102,241,0.12);border-radius:6px;transition:all .05s linear;display:none';
  document.documentElement.appendChild(box);
  function cssPath(el){
    if(!(el instanceof Element)) return '';
    var path=[];
    while(el && el.nodeType===1 && el!==document.body && path.length<6){
      var sel=el.nodeName.toLowerCase();
      if(el.id){sel+='#'+el.id;path.unshift(sel);break;}
      var sib=el, n=1;
      while((sib=sib.previousElementSibling)){ if(sib.nodeName===el.nodeName) n++; }
      sel+=':nth-of-type('+n+')';
      path.unshift(sel); el=el.parentElement;
    }
    return path.join(' > ');
  }
  function paint(el){
    if(!el){box.style.display='none';return;}
    var r=el.getBoundingClientRect();
    box.style.display='block';
    box.style.left=r.left+'px'; box.style.top=r.top+'px';
    box.style.width=r.width+'px'; box.style.height=r.height+'px';
  }
  function onMove(e){ if(!enabled) return; hover=e.target; paint(hover); }
  function onClick(e){
    if(!enabled) return;
    e.preventDefault(); e.stopPropagation();
    var el=e.target;
    parent.postMessage({__lov_visual_pick:true, selector:cssPath(el), text:(el.innerText||'').slice(0,400), tag:el.tagName.toLowerCase()}, '*');
  }
  window.addEventListener('mousemove', onMove, true);
  window.addEventListener('click', onClick, true);
  window.addEventListener('message', function(e){
    var d=e.data;
    if(d && d.__lov_visual_edit){
      enabled=!!d.enabled;
      document.documentElement.style.cursor=enabled?'crosshair':'';
      if(!enabled){ box.style.display='none'; hover=null; }
    }
  });
})();
`;

export interface DeploySettings {
  slug?: string;
  title?: string;
  description?: string;
  ogImage?: string;
  favicon?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]
  );
}

export function composeIndexHtml(opts: {
  settings: DeploySettings;
  jsHref: string;
  cssHref: string;
}): string {
  const title = escapeHtml(opts.settings.title || "App");
  const desc = escapeHtml(opts.settings.description || "");
  const og = escapeHtml(opts.settings.ogImage || "");
  const favicon = escapeHtml(opts.settings.favicon || "/favicon.ico");

  const head = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${desc ? `<meta name="description" content="${desc}" />` : ""}
    ${og ? `<meta property="og:image" content="${og}" />` : ""}
    <meta property="og:title" content="${title}" />
    ${desc ? `<meta property="og:description" content="${desc}" />` : ""}
    <link rel="icon" href="${favicon}" />
    <link rel="stylesheet" href="${opts.cssHref}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>${TAILWIND_CONFIG}</script>
  `;
  return `<!DOCTYPE html>
<html lang="en">
  <head>${head}</head>
  <body>
    <div id="root"></div>
    <script type="module" src="${opts.jsHref}"></script>
    <script>${VISUAL_EDIT_SCRIPT}</script>
  </body>
</html>
`;
}

export function guessContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    html: "text/html; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    json: "application/json",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  return map[ext] || "application/octet-stream";
}

export function projectNameFor(projectId: string): string {
  // Cloudflare Pages: lowercase, [a-z0-9-], must start with a letter, ≤58 chars.
  return `megsy-${projectId.replace(/-/g, "").toLowerCase()}`;
}
