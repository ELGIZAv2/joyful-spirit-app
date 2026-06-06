import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MailCheck, ShieldEllipsis, ShieldCheck, UserRoundX, Gem, Camera, ChevronRight, Pencil, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import { toast } from "sonner";

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("free");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setUserEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, plan, display_name, avatar_url, two_factor_enabled")
        .eq("id", user.id)
        .single();
      if (profile && !cancelled) {
        setCredits(Number(profile.credits) || 0);
        setPlan(profile.plan || "free");
        if (profile.display_name) setUserName(profile.display_name);
        setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
        setTwoFactorEnabled((profile as any).two_factor_enabled ?? false);
      }
    };
    loadUser();
    return () => { cancelled = true; };
  }, []);

  const initial = (userName || "U").charAt(0).toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large. Max 5MB."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      await supabase.rpc("update_profile_safe", { p_user_id: userId, p_avatar_url: publicUrl });
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || !userId) return;
    try {
      await supabase.rpc("update_profile_safe", { p_user_id: userId, p_display_name: nameInput.trim() });
      await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } });
      setUserName(nameInput.trim());
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleToggle2FA = async () => {
    if (!userId) return;
    setToggling2FA(true);
    try {
      const newVal = !twoFactorEnabled;
      await supabase.rpc("update_profile_safe", { p_user_id: userId, p_two_factor_enabled: newVal });
      setTwoFactorEnabled(newVal);
      toast.success(newVal ? "Two-factor authentication enabled" : "Two-factor authentication disabled");
    } catch {
      toast.error("Failed to update 2FA setting");
    } finally {
      setToggling2FA(false);
    }
  };

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      {/* Avatar + Name + Email */}
      <div className="flex flex-col items-center py-8">
        <div className="relative mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
              {initial}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mb-1">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              autoFocus
              className="text-lg font-semibold text-foreground bg-transparent border-b border-primary outline-none text-center w-48"
            />
            <button onClick={handleSaveName} className="p-1 text-primary hover:bg-primary/10 rounded-lg">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingName(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => { setNameInput(userName); setEditingName(true); }} className="flex items-center gap-1.5 mb-1 group">
            <p className="text-lg font-semibold text-foreground">{userName || "Set your name"}</p>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <p className="text-sm text-muted-foreground">{userEmail}</p>
        <span className="text-xs text-muted-foreground mt-1 capitalize">{plan === "free" ? "Free Plan" : `${plan} Plan`}</span>
      </div>

      {/* Credits & Plan */}
      <div className="flex items-center mb-8">
        <button onClick={() => navigate("/settings/billing")} className="flex-1 py-3 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Credits</p>
          <p className="text-2xl font-bold text-foreground">{Math.floor(credits)}</p>
        </button>
        <div className="w-px h-10 bg-border" />
        <button onClick={() => navigate("/pricing")} className="flex-1 py-3 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
          <p className="text-2xl font-bold text-foreground capitalize">{plan === "free" ? "Free" : plan}</p>
        </button>
      </div>

      {/* Security + Upgrade + Delete */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 px-1">Security</p>
        <button onClick={() => navigate("/settings/change-email")} className="w-full flex items-center gap-3 py-3 px-1 text-left">
          <MailCheck className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Change Email</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </button>
        <button onClick={() => navigate("/settings/change-password")} className="w-full flex items-center gap-3 py-3 px-1 text-left">
          <ShieldEllipsis className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your password</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </button>
        <button onClick={handleToggle2FA} disabled={toggling2FA} className="w-full flex items-center gap-3 py-3 px-1 text-left">
          <ShieldCheck className={`w-5 h-5 ${twoFactorEnabled ? "text-primary" : "text-muted-foreground"}`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">{twoFactorEnabled ? "Enabled — OTP required on login" : "Disabled — Enable for extra security"}</p>
          </div>
          <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${twoFactorEnabled ? "bg-primary" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${twoFactorEnabled ? "translate-x-4" : "translate-x-0"}`} />
          </div>
        </button>
        {plan === "free" && (
          <button onClick={() => navigate("/pricing")} className="w-full flex items-center gap-3 py-3 px-1 text-left">
            <Gem className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Upgrade to Premium</p>
              <p className="text-xs text-muted-foreground">Get unlimited access to all features</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </button>
        )}
        <button onClick={() => navigate("/settings/delete-account")} className="w-full flex items-center gap-3 py-3 px-1 text-left mt-2">
          <UserRoundX className="w-5 h-5 text-destructive/60" />
          <p className="text-sm font-medium text-destructive/60">Delete Account</p>
        </button>
      </div>

      <div className="mb-8" />

      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Account" subtitle="Manage your profile and security">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Account</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
