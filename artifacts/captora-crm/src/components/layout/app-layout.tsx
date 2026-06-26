import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FolderOpen, CalendarDays, Film,
  IndianRupee, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Projects", icon: FolderOpen },
  { href: "/shoots", label: "Events", icon: CalendarDays },
  { href: "/deliverables", label: "Post Production", icon: Film },
  { href: "/profit", label: "Finance", icon: IndianRupee },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F5F5EE" }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-48 flex-shrink-0 flex flex-col"
        style={{ background: "#1E293B" }}
      >
        {/* Logo / brand */}
        <div className="px-4 pt-5 pb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: "#0F172A" }}
            >
              C
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold leading-tight truncate">
                Captora
              </p>
              <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: "#64748B" }}>
                Wedding Photography &amp; Films
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href}>
                <div
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm"
                  style={{
                    background: active ? "rgba(255,255,255,0.09)" : "transparent",
                    color: active ? "#FFFFFF" : "#94A3B8",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLDivElement).style.color = "#CBD5E1";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      (e.currentTarget as HTMLDivElement).style.color = "#94A3B8";
                    }
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.2 : 1.7} />
                  <span className={`${active ? "font-semibold" : "font-medium"} leading-none`}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2.5 w-full text-sm font-medium rounded-lg transition-all"
            style={{ color: "#94A3B8" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.color = "#CBD5E1";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "";
              (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
            }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.7} />
            Sign Out
          </button>
          <p className="px-3 mt-1.5 text-xs" style={{ color: "#334155" }}>
            Captora · Admin
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-7 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
