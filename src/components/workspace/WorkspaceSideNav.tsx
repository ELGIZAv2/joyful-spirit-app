// Workspace side nav — Cal.com inspired. Quiet hover, subtle active state.
import { NavLink, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Mail,
  Activity,
  CreditCard,
  BarChart3,
  Settings2,
  Palette,
  Bell,
  ShieldCheck,
  Database,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

const SECTIONS: { title: string; items: { to: string; label: string; icon: LucideIcon }[] }[] = [
  {
    title: "Workspace",
    items: [
      { to: "", label: "Overview", icon: LayoutDashboard },
      { to: "members", label: "Members", icon: Users },
      { to: "invites", label: "Invites", icon: Mail },
      { to: "activity", label: "Activity", icon: Activity },
    ],
  },
  {
    title: "Billing",
    items: [
      { to: "billing", label: "Billing", icon: CreditCard },
      { to: "usage", label: "Usage", icon: BarChart3 },
    ],
  },
  {
    title: "Settings",
    items: [
      { to: "general", label: "General", icon: Settings2 },
      { to: "brand", label: "Brand kit", icon: Palette },
      { to: "notifications", label: "Notifications", icon: Bell },
      { to: "security", label: "Security", icon: ShieldCheck },
      { to: "data", label: "Data & privacy", icon: Database },
      { to: "danger", label: "Danger zone", icon: AlertTriangle },
    ],
  },
];

export default function WorkspaceSideNav() {
  const { id } = useParams<{ id: string }>();
  const base = `/settings/workspaces/${id}`;
  return (
    <nav className="space-y-6">
      {SECTIONS.map((sec) => (
        <div key={sec.title}>
          <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 mb-2 px-3">
            {sec.title}
          </h4>
          <div className="flex flex-col gap-0.5">
            {sec.items.map((it) => {
              const path = it.to ? `${base}/${it.to}` : base;
              const Icon = it.icon;
              const isDanger = it.to === "danger";
              return (
                <NavLink
                  key={it.label}
                  to={path}
                  end={!it.to}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                      isActive
                        ? isDanger
                          ? "bg-destructive/10 text-destructive font-medium"
                          : "bg-foreground/[0.06] text-foreground font-medium"
                        : isDanger
                          ? "text-muted-foreground/80 hover:text-destructive hover:bg-destructive/[0.06]"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !isDanger && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r-full bg-primary" />
                      )}
                      <Icon className={`w-[15px] h-[15px] shrink-0 transition-colors ${
                        isActive ? (isDanger ? "text-destructive" : "text-foreground") : "text-muted-foreground/70 group-hover:text-foreground"
                      }`} />
                      <span className="truncate">{it.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
