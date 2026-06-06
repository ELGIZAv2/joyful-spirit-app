import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight, Sparkles, Receipt, Home, PartyPopper, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------- Confetti ------------------------------- */
const Confetti = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.5 + Math.random() * 2.5,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 8,
        color: ["#22c55e", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#a855f7"][i % 6],
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: p.rotate + 720 }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};

/* --------------------------------- Page --------------------------------- */
const BillingSuccessPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">("loading");
  const [details, setDetails] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const identifier =
      params.get("checkout_id") ||
      params.get("payment_id") ||
      params.get("subscription_id");
    if (!identifier) {
      setStatus("failed");
      return;
    }
    (async () => {
      try {
        const query = new URLSearchParams();
        if (params.get("payment_id")) query.set("payment_id", params.get("payment_id")!);
        else if (params.get("subscription_id")) query.set("subscription_id", params.get("subscription_id")!);
        else query.set("checkout_id", identifier);

        const { data, error } = await supabase.functions.invoke(`dodo-verify?${query.toString()}`, {
          method: "GET",
        });
        if (error) throw error;
        setDetails(data);
        if (data.status === "succeeded") setStatus("success");
        else if (data.status === "open") setStatus("pending");
        else setStatus("failed");
      } catch {
        setStatus("failed");
      }
    })();
  }, [params]);

  const handleSuccessContinue = async () => {
    setCreating(true);
    const pendingWorkspaceName = sessionStorage.getItem("megsy_pending_workspace_name");
    const pendingWorkspacePlan = sessionStorage.getItem("megsy_pending_workspace_plan");

    if (pendingWorkspaceName && pendingWorkspacePlan) {
      const { data, error } = await supabase.rpc("create_workspace", {
        p_name: pendingWorkspaceName,
        p_plan: pendingWorkspacePlan,
      } as never);

      if (!error && data) {
        const wsId = (data as any).id;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("profiles").update({ active_workspace_id: wsId } as any).eq("id", user.id);
          }
        } catch { /* ignore */ }
        try { sessionStorage.removeItem("megsy_pending_workspace_name"); } catch {}
        try { sessionStorage.removeItem("megsy_pending_workspace_plan"); } catch {}
        navigate(`/settings/workspaces/${(data as any).id}`);
        return;
      }
    }
    navigate("/");
  };

  const amountFormatted =
    details?.amount != null
      ? `${(details.amount / 100).toFixed(2)} ${(details.currency || "USD").toUpperCase()}`
      : null;

  return (
    <div
      dir="auto"
      className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-background"
    >
      {/* Background aurora */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[520px] h-[520px] rounded-full bg-fuchsia-500/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {status === "success" && <Confetti />}

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="relative z-10 w-full max-w-lg"
        >
          <div className="relative rounded-[28px] border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden">
            {/* Top gradient bar */}
            <div
              className={
                "h-1.5 w-full " +
                (status === "success"
                  ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
                  : status === "pending"
                  ? "bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500"
                  : status === "failed"
                  ? "bg-gradient-to-r from-rose-400 via-red-500 to-rose-500"
                  : "bg-gradient-to-r from-primary/60 via-primary to-primary/60")
              }
            />

            <div className="p-7 sm:p-10 text-center">
              {status === "loading" && (
                <div className="py-6">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    <Loader2 className="absolute inset-0 m-auto w-10 h-10 animate-spin text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Confirming your payment…</h1>
                  <p className="text-muted-foreground">Hang tight, this only takes a moment.</p>
                </div>
              )}

              {status === "success" && (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                    className="relative w-24 h-24 mx-auto mb-6"
                  >
                    <div className="absolute inset-0 rounded-full bg-emerald-500/15 blur-xl" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                      <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
                    </div>
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <Sparkles className="w-6 h-6 text-amber-400 drop-shadow" />
                    </motion.div>
                  </motion.div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                    <PartyPopper className="w-3.5 h-3.5" />
                    Payment confirmed
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
                    You're all set!
                  </h1>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {details?.product_name
                      ? <>Your subscription to <span className="font-semibold text-foreground">{details.product_name}</span> is now active.</>
                      : "Your purchase is complete and your account is ready to go."}
                  </p>

                  {(amountFormatted || details?.product_name) && (
                    <div className="mb-7 mx-auto max-w-sm rounded-2xl border border-border/60 bg-background/60 divide-y divide-border/60 text-sm">
                      {details?.product_name && (
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-muted-foreground">Plan</span>
                          <span className="font-semibold">{details.product_name}</span>
                        </div>
                      )}
                      {amountFormatted && (
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold">{amountFormatted}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-muted-foreground">Status</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={handleSuccessContinue}
                      disabled={creating}
                      className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition disabled:opacity-60"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {creating ? "Setting up…" : "Continue to dashboard"}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button
                      onClick={() => navigate("/settings/billing")}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border/60 bg-background/40 hover:bg-background transition text-sm font-medium"
                    >
                      <Receipt className="w-4 h-4" />
                      View invoice
                    </button>
                  </div>

                  <p className="mt-6 text-xs text-muted-foreground">
                    A receipt has been sent to your email.
                  </p>
                </>
              )}

              {status === "pending" && (
                <>
                  <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-amber-500/15">
                    <Clock className="w-10 h-10 text-amber-500" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Payment is processing</h1>
                  <p className="text-muted-foreground mb-6">
                    This usually finishes within a minute. We'll activate your subscription automatically.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 rounded-xl bg-foreground text-background font-semibold"
                    >
                      Refresh status
                    </button>
                    <button
                      onClick={() => navigate("/settings/billing")}
                      className="px-5 py-3 rounded-xl border border-border/60 text-sm font-medium"
                    >
                      View invoices
                    </button>
                  </div>
                </>
              )}

              {status === "failed" && (
                <>
                  <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-rose-500/15">
                    <XCircle className="w-10 h-10 text-rose-500" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">We couldn't confirm your payment</h1>
                  <p className="text-muted-foreground mb-6">
                    If you were charged, the amount will be refunded automatically within a few days.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => navigate("/pricing")}
                      className="px-6 py-3 rounded-xl bg-foreground text-background font-semibold"
                    >
                      Back to pricing
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border/60 text-sm font-medium"
                    >
                      <Home className="w-4 h-4" /> Go home
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Need help? Contact <a href="mailto:support@megsyai.com" className="underline hover:text-foreground">support@megsyai.com</a>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BillingSuccessPage;
