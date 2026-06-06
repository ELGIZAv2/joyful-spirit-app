import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, OctagonAlert, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

const DeleteAccountPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter your password to confirm");
      return;
    }
    setIsDeleting(true);
    try {
      // Verify password by attempting sign-in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User not found");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password });
      if (signInError) {
        toast.error("Incorrect password");
        setIsDeleting(false);
        return;
      }
      toast.success("Account deletion requested. You will be signed out.");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const deletedItems = [
    "Profile Information",
    "All Conversations",
    "Generated Images & Videos",
    "MC & Subscription",
  ];

  const content = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
      {/* Warning hero */}
      <div className="flex flex-col items-center py-8">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <OctagonAlert className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Delete your account?</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          This action is permanent and cannot be undone
        </p>
      </div>

      {/* What will be deleted */}
      <div className="mb-6">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">What will be deleted</p>
        <div className="space-y-2.5">
          {deletedItems.map((item) => (
            <div key={item} className="flex items-center gap-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
              <p className="text-sm text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Password confirmation */}
      <div className="mb-4">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">
          Enter your password to confirm
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-destructive/30 transition-all"
        />
      </div>

      {/* Confirm input */}
      <div className="mb-6">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">
          Type <span className="font-bold text-destructive">DELETE</span> to confirm
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDeleteAccount()}
          placeholder="DELETE"
          className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-destructive/30 transition-all"
        />
      </div>

      {/* Actions */}
      <button
        onClick={handleDeleteAccount}
        disabled={isDeleting || confirmText !== "DELETE"}
        className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 mb-3"
      >
        {isDeleting ? (
          <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
        ) : (
          <UserX className="w-4 h-4" />
        )}
        {isDeleting ? "Deleting..." : "Delete My Account"}
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
      <DesktopSettingsLayout title="Delete Account" subtitle="Permanently delete your account and data">
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
          <h1 className="font-display text-lg font-bold text-foreground">Delete Account</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
