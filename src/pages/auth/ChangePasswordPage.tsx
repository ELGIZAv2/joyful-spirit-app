import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, LockKeyhole, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) { toast.error("Please fill all fields"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully");
      navigate("/settings/profile");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const strength = newPassword.length >= 16 ? 4 : newPassword.length >= 12 ? 3 : newPassword.length >= 8 ? 2 : newPassword.length > 0 ? 1 : 0;
  const strengthLabels = ["", "Weak", "Medium", "Strong", "Very Strong"];
  const strengthColors = ["", "bg-red-500", "bg-amber-500", "bg-emerald-400", "bg-emerald-500"];

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      {/* Hero */}
      <div className="flex flex-col items-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <LockKeyhole className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Create a strong password with at least 8 characters
        </p>
      </div>

      {/* Password fields */}
      <div className="space-y-4 mb-4">
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all pr-10"
            />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all pr-10"
            />
            <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Strength meter */}
        {newPassword && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : "bg-muted"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{strengthLabels[strength]}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={handleChangePassword}
        disabled={loading || !newPassword || !confirmPassword}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        ) : null}
        {loading ? "Updating..." : "Update Password"}
      </button>
      <button
        onClick={() => navigate("/settings/profile")}
        className="w-full py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        Cancel
      </button>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Change Password" subtitle="Update your account password">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings/profile")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Change Password</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
