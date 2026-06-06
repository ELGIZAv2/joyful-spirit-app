// Account switcher dropdown — Personal + all workspaces.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

export default function WorkspaceSwitcher({ children, align = "start", side = "top" }: Props) {
  const navigate = useNavigate();
  const { workspaces, activeId, setActive, loading } = useWorkspaces();
  const account = useActiveAccount();
  const [open, setOpen] = useState(false);

  const switchTo = async (id: string | null, name: string) => {
    await setActive(id);
    toast.success(`Switched to ${name}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-72 p-0 rounded-xl border-border">
        {/* Header — current account */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active account</p>
          <p className="text-sm font-semibold text-foreground truncate mt-0.5">{account.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{account.credits.toFixed(0)} credits</p>
        </div>

        {/* List */}
        <div className="max-h-72 overflow-y-auto py-1">
          <button
            onClick={() => switchTo(null, "Personal")}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left"
          >
            <div className="w-8 h-8 rounded-full bg-muted grid place-items-center text-xs font-semibold text-foreground">P</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Personal</p>
              <p className="text-[11px] text-muted-foreground">Your private space</p>
            </div>
            {activeId === null && <Check className="w-4 h-4 text-foreground" />}
          </button>

          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Loading…</p>
          ) : (
            workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => switchTo(w.id, w.name)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left"
              >
                {w.avatar_url ? (
                  <img src={w.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-foreground text-background grid place-items-center text-xs font-semibold">
                    {w.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{w.name}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">{Number(w.credits).toFixed(0)} credits</p>
                </div>
                {activeId === w.id && <Check className="w-4 h-4 text-foreground" />}
              </button>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border py-1">
          <button
            onClick={() => navigate("/settings/workspaces")}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted text-left"
          >
            <Users className="w-4 h-4" />
            Manage workspaces
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
