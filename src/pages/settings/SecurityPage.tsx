import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";
import { Shield, Lock, Server, Eye, FileCheck, AlertTriangle, Globe, Key } from "lucide-react";

const practices = [
  {
    icon: Lock,
    title: "Encryption",
    desc: "All data is encrypted with TLS 1.3 in transit and AES-256 at rest. API keys and tokens are hashed using bcrypt. Database connections use SSL.",
  },
  {
    icon: Server,
    title: "Infrastructure",
    desc: "Hosted on SOC 2 compliant cloud infrastructure with automated backups, redundancy across multiple regions, and 99.9% uptime SLA.",
  },
  {
    icon: Key,
    title: "Authentication",
    desc: "Industry-standard authentication with optional two-factor (2FA), secure session management, and automatic session expiration.",
  },
  {
    icon: Eye,
    title: "Access Control",
    desc: "Role-based access control (RBAC) for internal systems. Principle of least privilege enforced. All access is logged and auditable.",
  },
  {
    icon: FileCheck,
    title: "Compliance",
    desc: "GDPR compliant for EU users. CCPA compliant for California residents. Regular privacy impact assessments and data processing agreements.",
  },
  {
    icon: AlertTriangle,
    title: "Incident Response",
    desc: "24/7 monitoring with automated alerting. Documented incident response plan with < 1 hour response time. Users notified within 72 hours per GDPR.",
  },
  {
    icon: Globe,
    title: "Data Residency",
    desc: "Primary data processing in secure data centers. Users can request data export at any time. Full data deletion upon account closure within 30 days.",
  },
  {
    icon: Shield,
    title: "Responsible AI",
    desc: "Content safety filters on all AI outputs. Automated detection of harmful content. Regular bias audits and safety testing of models.",
  },
];

const SecurityPage = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead title="Security" description="Learn about Megsy AI's security practices, data protection, encryption, and compliance commitments. Your data safety is our priority." path="/security" />
    <LandingNavbar />

    <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[150px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-medium text-emerald-400">
          <Shield className="h-4 w-4" /> Enterprise-grade security
        </motion.div>
        <h1 className="font-display text-5xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Security & <span className="text-primary">Trust</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Your data security is foundational to everything we build. Here's how we protect your creative work and personal information.
        </p>
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>

    <section className="mx-auto max-w-7xl px-6 pb-28">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {practices.map((p, i) => (
          <motion.div key={p.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-white/[0.06] bg-card p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5"><p.icon className="h-5 w-5 text-primary" /></div>
              <h2 className="text-xl font-bold text-foreground">{p.title}</h2>
            </div>
            <p className="text-sm leading-[1.8] text-muted-foreground">{p.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 rounded-2xl border border-white/[0.06] bg-card p-8 text-center">
        <h2 className="mb-3 text-xl font-bold text-foreground">Report a Vulnerability</h2>
        <p className="text-sm text-muted-foreground mb-2">
          We take security seriously. If you discover a vulnerability, please report it responsibly.
        </p>
        <a href="mailto:security@megsyai.com" className="text-primary hover:underline text-sm">security@megsyai.com</a>
      </motion.div>
    </section>

    <LandingFooter />
  </div>
);

export default SecurityPage;
