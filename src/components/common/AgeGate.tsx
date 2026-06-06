import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global 18+ age gate.
 * Shown once per device until confirmed. Required for payment-processor compliance
 * (Visa/MC) and for jurisdictions with adult-platform age-verification rules.
 */
const AgeGate = () => {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) {
        // Not signed in: show the gate; confirmation will be saved once they sign in.
        setOpen(true);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("age_gate_acked_at")
        .eq("id", uid)
        .maybeSingle();
      if (!cancelled && !(prof as any)?.age_gate_acked_at) setOpen(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const confirm = async () => {
    setOpen(false);
    if (userId) {
      await supabase
        .from("profiles")
        .update({ age_gate_acked_at: new Date().toISOString() } as any)
        .eq("id", userId);
    }
  };

  const decline = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 px-6 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-gate-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 text-white shadow-2xl md:p-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400/80">
              Age verification
            </p>
            <h2
              id="age-gate-title"
              className="mt-4 font-display text-3xl font-black leading-tight tracking-tight md:text-4xl"
            >
              Are you 18 or older?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Megsy AI is intended for adults. By continuing you confirm you are at
              least 18 years of age (or the age of majority in your country) and that
              you accept our{" "}
              <a href="/terms" className="text-white underline-offset-4 hover:underline">
                Terms
              </a>
              ,{" "}
              <a href="/privacy" className="text-white underline-offset-4 hover:underline">
                Privacy Policy
              </a>
              , and{" "}
              <a
                href="/policies/content"
                className="text-white underline-offset-4 hover:underline"
              >
                Content Policy
              </a>
              .
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={confirm}
                className="w-full rounded-full bg-white py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.01]"
              >
                Yes, I'm 18 or older — Enter
              </button>
              <button
                onClick={decline}
                className="w-full rounded-full border border-white/15 py-3.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5"
              >
                No, take me back
              </button>
            </div>
            <p className="mt-6 text-[11px] leading-relaxed text-white/30">
              We do not knowingly collect data from anyone under 18. See our{" "}
              <a href="/trust" className="underline-offset-4 hover:underline">
                Trust Center
              </a>{" "}
              for COPPA and children's privacy details.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgeGate;
