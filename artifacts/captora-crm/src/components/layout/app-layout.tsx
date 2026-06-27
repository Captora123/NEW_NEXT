import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FolderOpen, CalendarDays, Film,
  IndianRupee, Settings, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Projects", icon: FolderOpen },
  { href: "/shoots", label: "Events", icon: CalendarDays },
  { href: "/deliverables", label: "Post Production", icon: Film },
  { href: "/finance", label: "Finance", icon: IndianRupee },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Bottom nav shows only top 5 items on mobile (Settings omitted, accessed via overflow)
const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F5F5EE" }}>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300
          w-56
          lg:relative lg:translate-x-0 lg:w-48
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:flex-shrink-0
        `}
        style={{ background: "#1E293B" }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: "#0F172A" }}
            >
              C
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold leading-tight truncate">Captora</p>
              <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: "#64748B" }}>
                Wedding Photography
              </p>
            </div>
          </div>
          <button
            className="lg:hidden p-1 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
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
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-30 border-b border-slate-200"
          style={{ background: "#1E293B" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "#0F172A" }}
            >
              C
            </div>
            <span className="text-white text-sm font-bold">Captora</span>
          </div>
          <div className="flex-1" />
          {/* Active page label */}
          <span className="text-slate-400 text-xs font-medium">
            {NAV_ITEMS.find(n => isActive(n.href))?.label ?? ""}
          </span>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center border-t border-slate-200"
        style={{ background: "#1E293B" }}
      >
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className="flex-1">
              <div
                className="flex flex-col items-center justify-center py-2.5 gap-1 transition-colors"
                style={{ color: active ? "#E0533C" : "#64748B" }}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.7} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
