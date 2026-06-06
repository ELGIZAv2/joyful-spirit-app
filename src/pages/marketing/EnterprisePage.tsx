import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Shield, Zap, Users, Server, Headphones, Lock, BarChart3, Clock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";


const companySizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
const needs = [
  "Image generation at scale",
  "Video generation at scale",
  "Custom AI models",
  "API access & webhooks",
  "Dedicated infrastructure",
  "SLA guarantees",
  "Priority support",
  "Custom integrations",
  "Data privacy & compliance",
  "Advanced analytics",
];

const features = [
  { icon: Zap, title: "Custom credit allocation", desc: "A monthly MC volume sized to your real usage, with one consolidated invoice." },
  { icon: Users, title: "Team workspaces", desc: "Shared seats with central billing and per-member usage visibility." },
  { icon: Headphones, title: "Priority support channel", desc: "A direct line to the founders for setup, escalations and product feedback." },
  { icon: Server, title: "Higher rate limits", desc: "Raised concurrent generation and API limits sized for production workloads." },
  { icon: Globe, title: "Data residency on request", desc: "We can discuss regional deployment options depending on your jurisdiction." },
  { icon: Lock, title: "Custom data agreements", desc: "DPA, custom retention windows and on-request training opt-outs on every plan." },
  { icon: BarChart3, title: "Usage reporting", desc: "Monthly usage breakdowns per team, per feature and per workspace." },
  { icon: Clock, title: "Onboarding session", desc: "A live session to set up your workspace, train your team and answer questions." },
  { icon: Shield, title: "Contract & invoicing", desc: "Annual contracts, custom payment terms, PO support and tax-compliant invoicing." },
];

const EnterpriseFormSection = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleNeed = (need: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleSubmit = async () => {
    if (!companyName || !contactName || !email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from("contact_submissions").insert({
        name: contactName,
        email,
        message: `Company: ${companyName}\nSize: ${companySize}\nNeeds: ${selectedNeeds.join(", ")}\n\n${message}`,
        form_type: "enterprise",
        subject: `Enterprise Inquiry - ${companyName}`,
      });

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "notify_admin",
            message: `🏢 Enterprise Inquiry\n\nCompany: ${companyName}\nContact: ${contactName}\nEmail: ${email}\nSize: ${companySize}\nNeeds: ${selectedNeeds.join(", ")}\n\nMessage: ${message || "N/A"}`,
          }),
        });
      } catch { /* silent */ }

      toast.success("Your inquiry has been submitted. We'll get back to you soon.");
      navigate("/pricing");
    } catch {
      toast.error("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Company Name *</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/50" placeholder="Acme Inc." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Contact Name *</label>
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/50" placeholder="John Doe" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Business Email *</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/50" placeholder="john@company.com" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Company Size</label>
        <div className="flex flex-wrap gap-2">
          {companySizes.map((size) => (
            <button key={size} onClick={() => setCompanySize(size)} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${companySize === size ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-white/60 hover:border-white/30"}`}>
              {size}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">What do you need?</label>
        <div className="flex flex-wrap gap-2">
          {needs.map((need) => (
            <button key={need} onClick={() => toggleNeed(need)} className={`px-3 py-2 rounded-xl text-sm border transition-colors ${selectedNeeds.includes(need) ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-white/60 hover:border-white/30"}`}>
              {need}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Additional Details</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:border-primary/30 transition-colors resize-none placeholder:text-muted-foreground/50" placeholder="Tell us about your use case..." />
      </div>
      <button onClick={handleSubmit} disabled={submitting || !companyName || !contactName || !email} className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-40">
        <Send className="w-4 h-4" />
        {submitting ? "Submitting..." : "Submit Inquiry"}
      </button>
    </div>
  );
};

const EnterprisePage = () => {
  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SEOHead
        title="Megsy AI for Enterprise — Custom Plans for Teams"
        description="Custom credit volume, team workspaces, priority support and tailored contracts for organizations using Megsy AI at scale. Talk to the founders."
        path="/enterprise"
      />
      <LandingNavbar />

      {/* HERO — landing style */}
      <section className="relative overflow-hidden bg-background pb-12 pt-32 text-center md:pt-44">
        <div className="mx-auto w-full max-w-4xl px-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            For teams
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-[9vw] uppercase leading-[0.95] tracking-tight text-foreground md:text-[5.5vw]"
          >
            Megsy{" "}
            <span className="text-primary">for your team.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-[13px] leading-snug text-muted-foreground md:mt-6 md:text-lg"
          >
            Custom credit volume, shared workspaces, priority support and tailored contracts
            — sized to how your team actually uses Megsy.
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border/30 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14 max-w-3xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              What's included
            </p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] tracking-tight text-foreground md:text-5xl">
              Built around <span className="text-primary">your team.</span>
            </h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border/30 bg-white/[0.02] p-6 transition-colors hover:border-primary/30 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border/30 bg-white/[0.04]">
                  <h.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{h.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 md:py-24 border-t border-border/50">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2 text-center">Get in Touch</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Our team will create a custom plan for your needs.</p>
            <EnterpriseFormSection />
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default EnterprisePage;
