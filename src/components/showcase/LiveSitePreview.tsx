import { useMemo } from "react";

function buildHtml(jsx: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/framer-motion@11.0.0/dist/framer-motion.js"></script>
<script src="https://unpkg.com/lucide-react@0.400.0/dist/umd/lucide-react.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>html,body,#root{margin:0;padding:0;min-height:100%;background:#fff;}</style>
</head><body><div id="root"></div>
<script>
  // Normalize globals so generated code can reference framerMotion / lucideReact
  window.framerMotion = window.framerMotion || window.Motion || window.FramerMotion || {};
  window.lucideReact  = window.lucideReact  || window.lucide      || window.LucideReact  || {};
</script>
<script type="text/babel" data-presets="react">
try {
${jsx}
} catch(e) {
  document.getElementById('root').innerHTML = '<pre style="padding:20px;color:#888;font-family:monospace;white-space:pre-wrap;font-size:12px;">⏳ ' + (e && e.message || e) + '</pre>';
}
</script></body></html>`;
}

export default function LiveSitePreview({
  jsx,
  className = "",
}: {
  jsx: string;
  className?: string;
}) {
  const html = useMemo(() => buildHtml(jsx || "ReactDOM.createRoot(document.getElementById('root')).render(React.createElement('div', {style:{padding:40,fontFamily:'sans-serif',color:'#888'}}, '⏳ Waiting for generation...'));"), [jsx]);
  return (
    <iframe
      title="Live preview"
      srcDoc={html}
      sandbox="allow-scripts"
      className={`w-full h-full border-0 bg-white ${className}`}
    />
  );
}
