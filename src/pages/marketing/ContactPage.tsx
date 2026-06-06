import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";

const supportSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(1, "Please describe your issue").max(2000),
});

const enterpriseSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  workEmail: z.string().trim().email("Invalid email").max(255),
  company: z.string().trim().min(1, "Company name is required").max(200),
  country: z.string().trim().min(1, "Country is required"),
  companySize: z.string().trim().min(1, "Company size is required"),
  needs: z.string().trim().min(1, "Please tell us about your needs").max(2000),
});

type SupportData = z.infer<typeof supportSchema>;
type EnterpriseData = z.infer<typeof enterpriseSchema>;

const countries = [
  "Egypt", "United States", "United Kingdom", "Germany", "France",
  "Saudi Arabia", "UAE", "Canada", "Australia", "Japan", "India",
  "Brazil", "South Korea", "Other",
];
const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const ContactPage = () => {
  const [tab, setTab] = useState<"support" | "enterprise">("support");
  const [submitting, setSubmitting] = useState(false);

  const supportForm = useForm<SupportData>({ resolver: zodResolver(supportSchema) });
  const enterpriseForm = useForm<EnterpriseData>({ resolver: zodResolver(enterpriseSchema) });

  const onSupportSubmit = async (data: SupportData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: data.username, email: data.email, message: data.message, form_type: "support",
      });
      if (error) throw error;
      toast.success("Request submitted successfully!");
      supportForm.reset();
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  const onEnterpriseSubmit = async (data: EnterpriseData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: `${data.firstName} ${data.lastName}`,
        email: data.workEmail,
        message: data.needs,
        subject: `Enterprise - ${data.company}`,
        form_type: "enterprise",
      });
      if (error) throw error;
      toast.success("Inquiry submitted successfully!");
      enterpriseForm.reset();
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/40 focus:bg-white/[0.04] selectable";

  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SEOHead
        title="Contact Megsy AI — Support & Enterprise"
        description="Reach Megsy AI support or talk to our enterprise team for custom plans, SSO, and dedicated onboarding."
        path="/contact"
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
            Contact
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-[9vw] uppercase leading-[0.95] tracking-tight text-foreground md:text-[5.5vw]"
          >
            Talk to{" "}
            <span className="text-primary">a real human.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-[13px] leading-snug text-muted-foreground md:mt-6 md:text-lg"
          >
            Pick the form that fits — we read every message and reply ourselves.
          </motion.p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-10 inline-flex items-center rounded-full bg-white/5 p-1">
              <button
                onClick={() => setTab("support")}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  tab === "support" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white/80"
                }`}
              >
                Support and billing
              </button>
              <button
                onClick={() => setTab("enterprise")}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  tab === "enterprise" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white/80"
                }`}
              >
                Enterprise sales
              </button>
            </div>

            {tab === "support" && (
              <motion.form
                key="support"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                onSubmit={supportForm.handleSubmit(onSupportSubmit)}
                className="space-y-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <input {...supportForm.register("username")} placeholder="Your Megsy username *" className={inputClass} />
                    {supportForm.formState.errors.username && (
                      <p className="mt-1.5 text-xs text-red-400">{supportForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  <div>
                    <input {...supportForm.register("email")} placeholder="Email address *" className={inputClass} />
                    {supportForm.formState.errors.email && (
                      <p className="mt-1.5 text-xs text-red-400">{supportForm.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <textarea {...supportForm.register("message")} placeholder="Describe your issue *" rows={6} className={`${inputClass} resize-none`} />
                  {supportForm.formState.errors.message && (
                    <p className="mt-1.5 text-xs text-red-400">{supportForm.formState.errors.message.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit request"}
                </button>
              </motion.form>
            )}

            {tab === "enterprise" && (
              <motion.form
                key="enterprise"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                onSubmit={enterpriseForm.handleSubmit(onEnterpriseSubmit)}
                className="space-y-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <input {...enterpriseForm.register("firstName")} placeholder="First Name *" className={inputClass} />
                    {enterpriseForm.formState.errors.firstName && (
                      <p className="mt-1.5 text-xs text-red-400">{enterpriseForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <input {...enterpriseForm.register("lastName")} placeholder="Last Name *" className={inputClass} />
                    {enterpriseForm.formState.errors.lastName && (
                      <p className="mt-1.5 text-xs text-red-400">{enterpriseForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <input {...enterpriseForm.register("workEmail")} placeholder="Work Email *" className={inputClass} />
                    {enterpriseForm.formState.errors.workEmail && (
                      <p className="mt-1.5 text-xs text-red-400">{enterpriseForm.formState.errors.workEmail.message}</p>
                    )}
                  </div>
                  <div>
                    <input {...enterpriseForm.register("company")} placeholder="Company Name *" className={inputClass} />
                    {enterpriseForm.formState.errors.company && (
                      <p className="mt-1.5 text-xs text-red-400">{enterpriseForm.formState.errors.company.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <select {...enterpriseForm.register("country")} className={`${inputClass} appearance-none`} defaultValue="">
                      <option value="" disabled className="bg-black text-white/30">Country *</option>
                      {countries.map((c) => (
                        <option key={c} value={c} className="bg-black text-white">{c}</option>
                      ))}
                    </select>
                    {enterpriseForm.formState.errors.country && (
                      <p className="mt-1.5 text-xs text-red-400">{enterpriseForm.formState.errors.country.message}</p>
                    )}
                  </div>
                  <div>
                    <select {...enterpriseForm.register("companySize")} className={`${inputClass} appearance-none`} defaultValue="">
                      <option value="" disabled className="bg-black text-white/30">Company size *</option>
                      {companySizes.map((s) => (
                        <option key={s} value={s} className="bg-black text-white">{s}</option>
                      ))}
                    </select>
                    {enterpriseForm.formState.errors.companySize && (
                      <p className="mt-1.5 text-xs text-red-400">{enterpriseForm.formState.errors.companySize.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <textarea {...enterpriseForm.register("needs")} placeholder="Tell us about your needs *" rows={5} className={`${inputClass} resize-none`} />
                  {enterpriseForm.formState.errors.needs && (
                    <p className="mt-1.5 text-xs text-red-400">{enterpriseForm.formState.errors.needs.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit inquiry"}
                </button>
              </motion.form>
            )}

            <p className="mt-8 text-xs leading-relaxed text-white/30">
              By submitting this form, I agree to receive updates and marketing communications from Megsy, as outlined in the{" "}
              <a href="/privacy" className="text-white/50 underline hover:text-white/80">
                Privacy & Cookie Policy
              </a>.
            </p>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default ContactPage;
