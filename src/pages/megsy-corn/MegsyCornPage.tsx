import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import SEOHead from "@/components/common/SEOHead";
import { CornIcon } from "@/components/sidebar/SidebarIcons";

const CAPABILITIES = [
  "CEO Agent plans your mission in seconds",
  "Builders, Designers & Marketers work in parallel",
  "Ships a live site, brand kit & marketing plan",
];

export default function MegsyCornPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <SEOHead
        title="Megsy Corn — Your autonomous AI workforce"
        description="A team of AI agents that plan, design, build, market and ship your project — directly inside your chat."
        path="/megsy-corn"
      />

      {/* Compact centered card */}
      <div className="w-full max-w-[400px] rounded-[28px] border border-border/40 bg-card/80 backdrop-blur-xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-amber-500/15 flex items-center justify-center shrink-0">
            <CornIcon size={20} className="text-amber-500" strokeWidth={1.7} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[18px] font-bold tracking-tight">Megsy Corn</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">PRO</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          A team of AI agents that plans, builds and delivers your project — all from a single message in chat.
        </p>

        {/* Key points */}
        <div className="space-y-2.5">
          {CAPABILITIES.map((cap) => (
            <div key={cap} className="flex items-start gap-2.5 text-[13.5px] text-foreground/85">
              <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" strokeWidth={2.2} />
              <span>{cap}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/chat")}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-3 text-[13.5px] font-semibold text-slate-950 transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Activate in chat
        </button>

        {/* Price note */}
        <p className="text-[11.5px] text-muted-foreground text-center leading-relaxed">
          Available on the <span className="text-foreground/80 font-medium">$29</span> plan and above.
        </p>

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="w-full flex items-center justify-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>
    </div>
  );
}
