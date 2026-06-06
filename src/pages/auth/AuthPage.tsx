import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/supabaseFunction";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import SEOHead from "@/components/common/SEOHead";

type Step = "email" | "password" | "otp-signup" | "set-password" | "otp-2fa" | "forgot-password" | "otp-reset" | "reset-password";
type ClipboardField = { name: "email" | "password" | "newPassword" | "otp"; otpIndex?: number };
type ClipboardMenuState = { x: number; y: number; field: ClipboardField; input: HTMLInputElement };

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [verifiedResetCode, setVerifiedResetCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [, setUserExists] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [mobileVideoLoaded, setMobileVideoLoaded] = useState(false);
  const [mobileImgIndex, setMobileImgIndex] = useState(0);
  const mobileImages = ["/auth/mobile-1.webp", "/auth/mobile-2.webp", "/auth/mobile-3.webp"];
  useEffect(() => {
    const id = setInterval(() => setMobileImgIndex((i) => (i + 1) % 3), 4500);
    return () => clearInterval(id);
  }, []);
  const [clipboardMenu, setClipboardMenu] = useState<ClipboardMenuState | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const clipboardMenuRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get("redirect");

  // Referral code — auto-fill from ?ref= query or from localStorage (captured at /ref/:code)
  const [referralCode, setReferralCode] = useState<string>(() => {
    try {
      const fromQuery = searchParams.get("ref");
      if (fromQuery) return fromQuery.trim().toUpperCase().slice(0, 64);
      const raw = localStorage.getItem("megsy_referral_code");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.code && typeof parsed.code === "string") {
          return parsed.code.trim().toUpperCase().slice(0, 64);
        }
      }
    } catch {}
    return "";
  });
  const [showReferralField, setShowReferralField] = useState<boolean>(!!referralCode);


  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "dark");
    return () => { if (prev) document.documentElement.setAttribute("data-theme", prev); };
  }, []);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (clipboardMenuRef.current?.contains(event.target as Node)) return;
      setClipboardMenu(null);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleCheckEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) { toast.error("Please enter a valid email address"); return; }
    setIsSubmitting(true);
    try {
      const { data, error } = await invokeFunction("check-email", { body: { email: normalizedEmail } });
      if (error) throw new Error(error.message);
      if (data.exists) { setUserExists(true); setHas2FA(data.two_factor_enabled); setStep("password"); }
      else { setUserExists(false); await sendOTP(normalizedEmail); setStep("otp-signup"); }
    } catch (e: any) { toast.error(e.message || "Could not check email"); }
    finally { setIsSubmitting(false); }
  };

  const sendOTP = async (targetEmail?: string) => {
    const normalizedEmail = (targetEmail || email).trim().toLowerCase();
    setIsSubmitting(true);
    try {
      const { data, error } = await invokeFunction("otp", { body: { action: "send", email: normalizedEmail } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to send code");
      toast.success("Verification code sent to your email");
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (e: any) { toast.error(e.message || "Could not send code"); }
    finally { setIsSubmitting(false); }
  };

  const handlePasswordLogin = async () => {
    if (!password) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      if (has2FA) { await sendOTP(); setStep("otp-2fa"); }
      else { toast.success("Welcome back!"); if (redirectUrl) window.location.href = redirectUrl; else navigate("/chat"); }
    } catch (e: any) { toast.error(e.message || "Login failed"); }
    finally { setIsSubmitting(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newValues.every((v) => v !== "") && newValues.join("").length === 6) handleVerifyOTP(newValues.join(""));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleTextPaste = (e: React.ClipboardEvent<HTMLInputElement>, update: (value: string) => void) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;
    e.preventDefault();
    e.stopPropagation();
    const input = e.currentTarget;
    const supportsSelection = !["email", "number"].includes(input.type);
    const start = supportsSelection ? (input.selectionStart ?? input.value.length) : input.value.length;
    const end = supportsSelection ? (input.selectionEnd ?? input.value.length) : input.value.length;
    const nextValue = `${input.value.slice(0, start)}${pasted}${input.value.slice(end)}`;
    update(nextValue);
    requestAnimationFrame(() => {
      if (!supportsSelection) return;
      const cursor = start + pasted.length;
      try { input.setSelectionRange(cursor, cursor); } catch {}
    });
  };

  const replaceTextSelection = (input: HTMLInputElement, pasted: string, update: (value: string) => void) => {
    const supportsSelection = !["email", "number"].includes(input.type);
    const start = supportsSelection ? (input.selectionStart ?? input.value.length) : input.value.length;
    const end = supportsSelection ? (input.selectionEnd ?? input.value.length) : input.value.length;
    const nextValue = `${input.value.slice(0, start)}${pasted}${input.value.slice(end)}`;
    update(nextValue);
    requestAnimationFrame(() => {
      const cursor = start + pasted.length;
      input.focus();
      if (!supportsSelection) return;
      try { input.setSelectionRange(cursor, cursor); } catch {}
    });
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const openClipboardMenu = (input: HTMLInputElement, field: ClipboardField, x: number, y: number) => {
    input.focus();
    setClipboardMenu({ x, y, field, input });
  };

  const clipboardProps = (field: ClipboardField) => ({
    onContextMenu: (e: React.MouseEvent<HTMLInputElement>) => {
      e.preventDefault();
      openClipboardMenu(e.currentTarget, field, e.clientX, e.clientY);
    },
    onPointerDown: (e: React.PointerEvent<HTMLInputElement>) => {
      if (e.pointerType !== "touch") return;
      const input = e.currentTarget;
      longPressTimerRef.current = window.setTimeout(() => openClipboardMenu(input, field, e.clientX, e.clientY), 450);
    },
    onPointerUp: clearLongPressTimer,
    onPointerCancel: clearLongPressTimer,
  });

  const handleClipboardPaste = async () => {
    if (!clipboardMenu) return;
    const pasted = await navigator.clipboard?.readText().catch(() => "");
    if (!pasted) { setClipboardMenu(null); return; }
    if (clipboardMenu.field.name === "email") replaceTextSelection(clipboardMenu.input, pasted, setEmail);
    if (clipboardMenu.field.name === "password") replaceTextSelection(clipboardMenu.input, pasted, setPassword);
    if (clipboardMenu.field.name === "newPassword") replaceTextSelection(clipboardMenu.input, pasted, setNewPassword);
    if (clipboardMenu.field.name === "otp") handleOtpTextPaste(pasted, clipboardMenu.field.otpIndex ?? 0);
    setClipboardMenu(null);
  };

  const handleClipboardCopy = async () => {
    const input = clipboardMenu?.input;
    if (!input) return;
    const supportsSelection = !["email", "number"].includes(input.type);
    const value = supportsSelection
      ? (input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? input.value.length) || input.value)
      : input.value;
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    setClipboardMenu(null);
  };

  const handleOtpTextPaste = (text: string, startIndex: number) => {
    const pasted = text.replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newValues = [...otpValues];
    pasted.split("").forEach((digit, offset) => {
      const targetIndex = startIndex + offset;
      if (targetIndex < newValues.length) newValues[targetIndex] = digit;
    });
    setOtpValues(newValues);
    const nextEmptyIndex = newValues.findIndex((digit) => !digit);
    if (newValues.every(Boolean)) handleVerifyOTP(newValues.join(""));
    else inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    handleOtpTextPaste(e.clipboardData.getData("text"), startIndex);
  };

  const handleVerifyOTP = async (code: string) => {
    setIsSubmitting(true);
    try {
      if (step === "otp-2fa") {
        const { data, error } = await invokeFunction("otp", { body: { action: "verify-2fa", email: email.trim().toLowerCase(), code } });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Invalid code");
        toast.success("Welcome back!");
        if (redirectUrl) window.location.href = redirectUrl; else navigate("/chat");
      } else if (step === "otp-reset") {
        const { data, error } = await invokeFunction("otp", { body: { action: "verify-reset", email: email.trim().toLowerCase(), code } });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Invalid code");
        setVerifiedResetCode(code);
        setStep("reset-password");
      } else {
        const { data, error } = await invokeFunction("otp", { body: { action: "verify-only", email: email.trim().toLowerCase(), code } });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Invalid code");
        setStep("set-password");
      }
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
      setOtpValues(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally { setIsSubmitting(false); }
  };

  const handleCreateAccount = async () => {
    if (!newPassword || newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setIsSubmitting(true);
    try {
      const cleanReferral = referralCode.trim().toUpperCase().slice(0, 64) || null;

      const { data, error } = await invokeFunction("signup", {
        body: {
          email: email.trim().toLowerCase(),
          password: newPassword,
          ...(cleanReferral ? { referral_code: cleanReferral } : {}),
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Could not create account");
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
      if (verifyError) throw verifyError;

      // Mark the most recent matching click as converted (fire-and-forget)
      if (cleanReferral) {
        try {
          const { data: u } = await supabase.auth.getUser();
          if (u?.user?.id) {
            const { data: lastClick } = await supabase
              .from("referral_clicks")
              .select("id")
              .eq("code", cleanReferral)
              .is("converted_user_id", null)
              .order("created_at", { ascending: false })
              .limit(1);
            if (lastClick && lastClick.length > 0) {
              await supabase
                .from("referral_clicks")
                .update({
                  converted_user_id: u.user.id,
                  converted_at: new Date().toISOString(),
                })
                .eq("id", lastClick[0].id);
            }
          }
        } catch {}
      }


      try { localStorage.removeItem("megsy_referral_code"); } catch {}
      toast.success("Account created!");
      if (redirectUrl) window.location.href = redirectUrl; else navigate("/chat");
    } catch (e: any) { toast.error(e.message || "Could not create account"); }
    finally { setIsSubmitting(false); }
  };



  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setIsSubmitting(true);
    try {
      const { data, error } = await invokeFunction("update-password", { body: { email: email.trim().toLowerCase(), password: newPassword, code: verifiedResetCode } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to update password");
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
      if (verifyError) throw verifyError;
      toast.success("Password updated!");
      navigate("/chat");
    } catch (e: any) { toast.error(e.message || "Failed to update password"); }
    finally { setIsSubmitting(false); }
  };

  const handleForgotPassword = async () => { await sendOTP(); setStep("otp-reset"); };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectUrl || window.location.origin + "/chat" } });
  };
  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: redirectUrl || window.location.origin + "/chat" } });
  };

  const resetFlow = () => { setStep("email"); setPassword(""); setNewPassword(""); setOtpValues(["", "", "", "", "", ""]); };

  // Step meta — minimal, clean copy
  const stepMeta: Record<Step, { title: string; sub: string; index: number; total: number; label: string }> = {
    email:             { title: "Welcome to Megsy",      sub: "Enter your email to sign in or create an account.", index: 1, total: 2, label: "Sign in" },
    password:          { title: "Enter your password",   sub: email,                                                index: 2, total: 2, label: "Sign in" },
    "otp-signup":      { title: "Verify your email",     sub: `We sent a 6-digit code to ${email}`,                index: 2, total: 3, label: "Create account" },
    "set-password":    { title: "Set a password",        sub: "At least 8 characters.",                             index: 3, total: 3, label: "Create account" },
    "otp-2fa":         { title: "Two-factor verification", sub: `Enter the code sent to ${email}`,                  index: 2, total: 2, label: "Sign in" },
    "forgot-password": { title: "Reset your password",   sub: `We'll send a verification code to ${email}`,         index: 1, total: 3, label: "Reset password" },
    "otp-reset":       { title: "Verify your email",     sub: `Enter the code sent to ${email}`,                   index: 2, total: 3, label: "Reset password" },
    "reset-password":  { title: "Choose a new password", sub: "At least 8 characters.",                             index: 3, total: 3, label: "Reset password" },
  };

  const isOtpStep = step === "otp-signup" || step === "otp-2fa" || step === "otp-reset";
  const showBack = step !== "email";
  const meta = stepMeta[step];

  const Spinner = () => <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;

  // Borderless input — only a thin bottom rule, no fill
  const inputCls =
    "w-full bg-transparent border-0 border-b border-white/15 rounded-none px-0 py-3 text-[15px] text-foreground placeholder:text-foreground/30 outline-none focus:border-foreground/70 transition-colors duration-200";

  // Primary CTA — solid neutral
  const btnCls =
    "w-full py-3 rounded-full bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 active:scale-[0.99] transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none";

  // Secondary — bare outline pill
  const socialCls =
    "w-full flex items-center justify-center gap-2.5 py-3 rounded-full border border-white/15 bg-transparent text-foreground/90 text-[14px] font-medium hover:border-foreground/40 active:scale-[0.99] transition-all duration-150";

  return (
    <>
      <SEOHead
        title="Sign in to Megsy AI"
        description="Sign in or create your Megsy AI account."
        path="/auth"
        noindex
      />
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex flex-col lg:flex-row">
      {/* Calm backdrop */}
      <div className="absolute inset-0 -z-10 bg-[#0a0a0b]">
        <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120vw] h-[80vh] max-w-[1200px] rounded-full bg-primary/[0.06] blur-[160px]" />
      </div>

      {/* Mobile top video with image fallback (hidden on desktop) */}
      <div className="lg:hidden relative w-full h-[38vh] shrink-0 overflow-hidden z-0">
        <img
          src="/auth/auth-mobile-fallback.webp"
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${mobileVideoLoaded ? 'opacity-0' : 'opacity-100'}`}
        />
        <video
          src="/auth/auth-mobile.mp4"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setMobileVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#0a0a0b]" />
      </div>

      {/* Left half wrapper (desktop) / bottom panel (mobile) */}
      <div className="relative w-full lg:w-1/2 lg:min-h-screen flex-1 flex flex-col">
        {/* Mobile rounded panel wrapping content */}
        <div className="relative z-10 flex flex-col flex-1 bg-[#0a0a0b] rounded-t-3xl -mt-5 lg:mt-0 lg:rounded-none lg:bg-transparent">

      {/* Top bar with back button */}
      <div className="relative z-10 w-full px-6 py-3 lg:py-6 flex items-center justify-end max-w-[480px] mx-auto">

        <AnimatePresence>
          {showBack && (
            <motion.button
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              onClick={resetFlow}
              className="flex items-center gap-1.5 text-[12px] text-foreground/55 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-6 lg:pb-16 pt-2 lg:pt-4 lg:min-h-[calc(100vh-88px)]">


        <div className="w-full max-w-[400px]">
          {/* Headline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`hdr-${step}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mb-4 lg:mb-8"
            >
              <h1 className="text-[22px] leading-[1.25] font-medium tracking-tight text-foreground">
                {meta.title}
              </h1>
              <p className="mt-2 text-[13px] text-foreground/50 leading-relaxed break-words">
                {meta.sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <div className="space-y-5">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onPaste={(e) => handleTextPaste(e, setEmail)}
                    {...clipboardProps({ name: "email" })}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()}
                    autoFocus
                    autoComplete="email"
                    inputMode="email"
                    className={inputCls}
                  />

                  {/* Invite code — auto-shown when user lands via /ref/:code, editable */}
                  {showReferralField ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-foreground/55 uppercase tracking-[0.18em]">
                          Invite code
                        </label>
                        <button
                          type="button"
                          onClick={() => { setReferralCode(""); setShowReferralField(false); }}
                          className="text-[11px] text-foreground/45 hover:text-foreground/80 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="MEGSY-XXXXXX"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase().slice(0, 64))}
                        autoComplete="off"
                        spellCheck={false}
                        className={`${inputCls} font-mono tracking-wider`}
                      />
                      {referralCode && (
                        <p className="text-[11px] text-foreground/45">
                          You'll be credited to <span className="text-foreground/75 font-mono">{referralCode}</span> after signup.
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReferralField(true)}
                      className="text-[12px] text-foreground/55 hover:text-foreground transition-colors"
                    >
                      Have an invite code?
                    </button>
                  )}

                  <button onClick={handleCheckEmail} disabled={isSubmitting || !email.trim()} className={btnCls}>
                    {isSubmitting ? <span className="flex items-center justify-center gap-2"><Spinner />Checking…</span> : "Continue"}
                  </button>
                </div>


                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-foreground/35 uppercase tracking-[0.25em]">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="space-y-2.5">
                  <button onClick={handleGoogleLogin} className={socialCls}>
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                  <button onClick={handleGitHubLogin} className={socialCls}>
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    Continue with GitHub
                  </button>
                </div>
              </motion.div>
            )}

            {step === "password" && (
              <motion.div key="password" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-5">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onPaste={(e) => handleTextPaste(e, setPassword)}
                    {...clipboardProps({ name: "password" })}
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                    autoFocus
                    autoComplete="current-password"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground/80 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-end -mt-3">
                  <button onClick={() => setStep("forgot-password")} className="text-[12px] text-foreground/55 hover:text-foreground transition-colors">
                    Forgot password?
                  </button>
                </div>
                <button onClick={handlePasswordLogin} disabled={isSubmitting || !password} className={btnCls}>
                  {isSubmitting ? <span className="flex items-center justify-center gap-2"><Spinner />Signing in…</span> : "Sign in"}
                </button>
              </motion.div>
            )}

            {isOtpStep && (
              <motion.div key={`otp-${step}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-5">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValues.join("")}
                    onChange={(val) => {
                      const digits = val.replace(/\D/g, "").slice(0, 6);
                      const next = ["", "", "", "", "", ""];
                      digits.split("").forEach((d, i) => { next[i] = d; });
                      setOtpValues(next);
                      if (digits.length === 6) handleVerifyOTP(digits);
                    }}
                    autoFocus
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={`otp-${step}-${i}`}
                          index={i}
                          className="w-11 h-12 sm:w-12 sm:h-14 text-2xl font-display font-bold text-foreground bg-transparent border-0 border-b-2 border-white/15 rounded-none first:rounded-none last:rounded-none focus-within:border-foreground/70 transition-colors"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {isSubmitting && (
                  <p className="text-[12px] text-foreground/55 text-center flex items-center justify-center gap-2">
                    <Spinner /> Verifying…
                  </p>
                )}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-[12px] text-foreground/40">Resend in {countdown}s</p>
                  ) : (
                    <button onClick={() => sendOTP()} disabled={isSubmitting} className="text-[12px] text-foreground/65 hover:text-foreground transition-colors disabled:opacity-40">
                      Resend code
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === "set-password" && (
              <motion.div key="set-password" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-5">
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Password (min 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onPaste={(e) => handleTextPaste(e, setNewPassword)}
                    {...clipboardProps({ name: "newPassword" })}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
                    autoFocus
                    autoComplete="new-password"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground/80 transition-colors">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={handleCreateAccount} disabled={isSubmitting || newPassword.length < 8} className={btnCls}>
                  {isSubmitting ? <span className="flex items-center justify-center gap-2"><Spinner />Creating…</span> : "Create account"}
                </button>
              </motion.div>
            )}

            {step === "reset-password" && (
              <motion.div key="reset-password" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-5">
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password (min 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onPaste={(e) => handleTextPaste(e, setNewPassword)}
                    {...clipboardProps({ name: "newPassword" })}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    autoFocus
                    autoComplete="new-password"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground/80 transition-colors">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={handleResetPassword} disabled={isSubmitting || newPassword.length < 8} className={btnCls}>
                  {isSubmitting ? <span className="flex items-center justify-center gap-2"><Spinner />Updating…</span> : "Update password"}
                </button>
              </motion.div>
            )}

            {step === "forgot-password" && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-5">
                <button onClick={handleForgotPassword} disabled={isSubmitting} className={btnCls}>
                  {isSubmitting ? <span className="flex items-center justify-center gap-2"><Spinner />Sending…</span> : "Send reset code"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {clipboardMenu && (
            <div
              ref={clipboardMenuRef}
              className="fixed z-[100] flex overflow-hidden rounded-xl border border-white/15 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-xl"
              style={{ left: `min(${clipboardMenu.x}px, calc(100vw - 168px))`, top: `max(12px, ${clipboardMenu.y - 52}px)` }}
            >
              <button type="button" onClick={handleClipboardCopy} className="px-4 py-2.5 text-[13px] font-medium hover:bg-foreground/10">
                Copy
              </button>
              <button type="button" onClick={handleClipboardPaste} className="border-l border-white/10 px-4 py-2.5 text-[13px] font-medium hover:bg-foreground/10">
                Paste
              </button>
            </div>
          )}

          {/* Footer terms */}
          <p className="mt-4 lg:mt-12 text-[11px] text-foreground/40 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="https://terms.megsyai.com" target="_blank" rel="noopener noreferrer" className="text-foreground/65 underline underline-offset-2 hover:text-foreground transition-colors">Terms</a>{" "}
            and{" "}
            <a href="https://privacy.megsyai.com" target="_blank" rel="noopener noreferrer" className="text-foreground/65 underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
      </div>
      </div>




      {/* Right half — video background with image fallback (desktop only) */}
      <aside className="hidden lg:block lg:w-1/2 lg:min-h-screen relative overflow-hidden">
        <img
          src="/auth/auth-side.webp"
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-700 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`} />
        <video
          src="/auth/auth-side-loading.mp4"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </aside>
    </div>
    </>
  );
};


export default AuthPage;
