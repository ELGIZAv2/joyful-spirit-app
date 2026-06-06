// @ts-nocheck
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink } from "lucide-react";
import { getInternalTemplate } from "./registry";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1440,
  tablet: 820,
  mobile: 390,
};

export default function InternalTemplatePreviewPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const template = getInternalTemplate(slug);
  const [device, setDevice] = useState<Device>("desktop");

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <p className="text-lg font-semibold">Template not found</p>
        <button
          onClick={() => navigate("/code")}
          className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium"
        >
          Back to templates
        </button>
      </div>
    );
  }

  const handleRemix = () => {
    navigate(`/code?prompt=${encodeURIComponent(template.remixPrompt)}`);
  };

  const Component = template.Component;
  const w = DEVICE_WIDTHS[device];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 md:px-6 h-14 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <button
          onClick={() => navigate("/code")}
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="w-px h-5 bg-white/15" />
        <p className="text-sm font-semibold truncate">{template.name}</p>
      </header>


      {/* Preview canvas */}
      <div className="flex-1 relative bg-black">
        <iframe
          src={`/code/templates/${template.slug}/view`}
          title={template.name}
          className="absolute inset-0 w-full h-full border-0"
        />
        <button
          onClick={handleRemix}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 h-11 rounded-full text-sm font-bold bg-white text-black hover:bg-white/90 transition shadow-2xl shadow-black/40"
        >
          Remix
        </button>
      </div>
    </div>
  );
}

/** Standalone full-page render of the template (used inside the preview iframe and via /view URL). */
export function InternalTemplateStandalonePage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const template = getInternalTemplate(slug);
  if (!template) return null;
  const Component = template.Component;
  return <Component />;
}
