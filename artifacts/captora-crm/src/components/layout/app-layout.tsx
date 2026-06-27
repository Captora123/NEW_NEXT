import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FolderOpen, CalendarDays, Film,
  IndianRupee, Settings, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useStudio } from "@/lib/studio-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Projects", icon: FolderOpen },
  { href: "/shoots", label: "Events", icon: CalendarDays },
  { href: "/deliverables", label: "Post Production", icon: Film },
  { href: "/finance", label: "Finance", icon: IndianRupee },
  { href: "/settings", label: "Settings", icon: Settings },
];

const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);

function SidebarContent({
  sidebar, accent, studioName, onNav, showClose,
}: {
  sidebar: string; accent: string; studioName: string;
  onNav?: () => void; showClose?: boolean;
}) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  return (
    <div className="flex flex-col h-full" style={{ background: sidebar }}>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            C
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-bold leading-tight truncate">{studioName}</p>
            <p className="text-xs leading-tight mt-0.5 truncate opacity-50 text-white">Photography Studio</p>
          </div>
        </div>
        {showClose && (
          <button onClick={onNav} className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} onClick={onNav}>
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm"
                style={{
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)";
                  if (!active) (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.8)";
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  if (!active) (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.55)";
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.2 : 1.7} />
                <span className={`${active ? "font-semibold" : "font-medium"} leading-none`}>{label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 pt-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2.5 w-full text-sm font-medium rounded-lg transition-all"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.7} />
          Sign Out
        </button>
        <p className="px-3 mt-1.5 text-xs opacity-20 text-white">Captora · Admin</p>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, config } = useStudio();

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  const studioName = config.studioName || "Captora";
  const shortName = studioName.split(" ")[0];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: theme.bg }}>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-48 lg:flex-shrink-0">
        <SidebarContent sidebar={theme.sidebar} accent={theme.accent} studioName={shortName} />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64 flex-shrink-0 shadow-2xl">
            <SidebarContent
              sidebar={theme.sidebar}
              accent={theme.accent}
              studioName={shortName}
              onNav={() => setMobileOpen(false)}
              showClose
            />
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-white/5"
          style={{ background: theme.sidebar }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "")}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              C
            </div>
            <span className="text-white text-sm font-bold">{shortName}</span>
          </div>
          <div className="flex-1" />
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
            {NAV_ITEMS.find(n => isActive(n.href))?.label ?? ""}
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t"
        style={{ background: theme.sidebar, borderColor: "rgba(255,255,255,0.08)" }}
      >
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className="flex-1">
              <div
                className="flex flex-col items-center justify-center py-2.5 gap-1 transition-colors"
                style={{ color: active ? theme.accent : "rgba(255,255,255,0.4)" }}
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
