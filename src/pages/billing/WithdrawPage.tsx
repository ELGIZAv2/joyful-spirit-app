import { ArrowLeft } from "lucide-react";
import FancyButton from "@/components/branding/FancyButton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MIN_WITHDRAWAL = 10;

const WithdrawPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadBalance = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: earns } = await supabase
      .from("referral_earnings")
      .select("amount")
      .eq("referrer_id", user.id);

    const { data: wds } = await supabase
      .from("withdrawal_requests")
      .select("amount, status")
      .eq("user_id", user.id);

    const totalEarned = (earns || []).reduce((s, e) => s + Number(e.amount), 0);
    const totalWithdrawn = (wds || [])
      .filter(w => w.status !== "rejected")
      .reduce((s, w) => s + Number(w.amount), 0);

    setAvailableBalance(totalEarned - totalWithdrawn);
  }, []);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is $${MIN_WITHDRAWAL}`);
      return;
    }
    if (amt > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!details.trim()) {
      toast.error("Enter your payment details");
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      amount: amt,
      method,
      payment_details: details.trim(),
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Withdrawal request submitted successfully");
      navigate("/settings/referrals");
    }
  };

  const methodOptions = [
    { id: "paypal", label: "PayPal", placeholder: "your@email.com" },
    { id: "payoneer", label: "Payoneer", placeholder: "Payoneer email or ID" },
    { id: "vodafone_cash", label: "Vodafone Cash", placeholder: "01xxxxxxxxx" },
    { id: "bank", label: "Bank Transfer", placeholder: "IBAN / Account number" },
  ];

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-md mx-auto pb-16">

      {/* Balance */}
      <div className="text-center py-6">
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">Available Balance</p>
        <p className="text-4xl font-bold text-foreground font-display">${availableBalance.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-2">Minimum withdrawal: ${MIN_WITHDRAWAL}</p>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <input
            type="number"
            min={MIN_WITHDRAWAL}
            max={availableBalance}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={MIN_WITHDRAWAL.toString()}
            className="w-full pl-8 pr-4 py-3 rounded-xl bg-transparent border-b border-border text-foreground text-lg font-medium outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
          />
        </div>
        {availableBalance > 0 && (
          <button
            onClick={() => setAmount(availableBalance.toFixed(2))}
            className="text-xs text-primary hover:underline"
          >
            Withdraw all
          </button>
        )}
      </div>

      {/* Method Selection */}
      <div className="space-y-3">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Payment Method</label>
        <div className="grid grid-cols-2 gap-2">
          {methodOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setMethod(opt.id)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                method === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-2">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">
          {methodOptions.find(m => m.id === method)?.label} Details
        </label>
        <input
          type="text"
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder={methodOptions.find(m => m.id === method)?.placeholder}
          className="w-full px-0 py-3 bg-transparent border-b border-border text-foreground text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Submit */}
      <FancyButton
        onClick={handleSubmit}
        className={`w-full ${submitting ? "opacity-60 pointer-events-none" : ""}`}
      >
        {submitting ? "Submitting..." : "Submit Withdrawal Request"}
      </FancyButton>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Withdrawal requests are processed within 3-5 business days. You will receive a notification once your payment is sent.
      </p>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Withdraw" subtitle="Request a payout from your referral earnings">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings/referrals")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Withdraw</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default WithdrawPage;
