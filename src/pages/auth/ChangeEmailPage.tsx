import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, MailPlus, SendHorizonal } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

const ChangeEmailPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");

  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentEmail(user.email || "");
    });
  });

  const handleChangeEmail = async () => {
    if (!newEmail) { toast.error("Please enter an email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { toast.error("Please enter a valid email"); return; }
    if (newEmail === currentEmail) { toast.error("This is your current email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation email sent to both addresses");
      navigate("/settings/profile");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      {/* Current email display */}
      <div className="flex flex-col items-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MailPlus className="w-7 h-7 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Email</p>
        <p className="text-sm font-medium text-foreground">{currentEmail}</p>
      </div>

      {/* New email input */}
      <div className="space-y-2 mb-4">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider">New Email Address</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleChangeEmail()}
          placeholder="your-new@email.com"
          className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      <p className="text-xs text-muted-foreground mb-6 px-1">
        A confirmation link will be sent to both your current and new email addresses.
      </p>

      {/* Actions */}
      <button
        onClick={handleChangeEmail}
        disabled={loading || !newEmail}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        ) : null}
        {loading ? "Sending..." : "Update Email"}
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
      <DesktopSettingsLayout title="Change Email" subtitle="Update your email address">
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
          <h1 className="font-display text-lg font-bold text-foreground">Change Email</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default ChangeEmailPage;
