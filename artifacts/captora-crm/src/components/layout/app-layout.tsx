import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Camera, IndianRupee, UserCircle,
  Briefcase, ReceiptText, LineChart, CheckSquare, Lightbulb,
  CalendarDays, LogOut, Bell, Search, Settings, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Projects",
    items: [
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/shoots", label: "Shoots", icon: Camera },
      { href: "/team-planner", label: "Team Planner", icon: CalendarDays },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/payments", label: "Payments", icon: IndianRupee },
      { href: "/expenses", label: "Expenses", icon: ReceiptText },
      { href: "/profit", label: "P&L Report", icon: LineChart },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/deliverables", label: "Deliverables", icon: CheckSquare },
      { href: "/freelancers", label: "Freelancers", icon: UserCircle },
      { href: "/staff", label: "Staff", icon: Briefcase },
      { href: "/content", label: "Content Ideas", icon: Lightbulb },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [search, setSearch] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* ── Sidebar ── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: "#1E293B" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#E0533C" }}>
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-wide leading-none">Captora</p>
            <p className="text-slate-400 text-[10px] leading-none mt-0.5">Studio CRM</p>
          </div>
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location === item.href || location.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all"
                        style={isActive
                          ? { background: "#E0533C", color: "#fff" }
                          : { color: "#94A3B8" }
                        }
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLDivElement).style.color = "#E2E8F0"; }}
                        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = ""; (e.currentTarget as HTMLDivElement).style.color = "#94A3B8"; } }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className={`flex-1 ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/settings">
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all"
              style={location === "/settings" ? { background: "#E0533C", color: "#fff" } : { color: "#94A3B8" }}
              onMouseEnter={e => { if (location !== "/settings") { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLDivElement).style.color = "#E2E8F0"; } }}
              onMouseLeave={e => { if (location !== "/settings") { (e.currentTarget as HTMLDivElement).style.background = ""; (e.currentTarget as HTMLDivElement).style.color = "#94A3B8"; } }}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Settings</span>
            </div>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg text-sm font-medium transition-all"
            style={{ color: "#94A3B8" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#E2E8F0"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 flex items-center px-6 gap-4 bg-white" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients, shoots..."
              className="w-full rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              onFocus={e => (e.target.style.borderColor = "#E0533C")}
              onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              className="relative p-2 rounded-lg transition-all"
              style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
            >
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#E0533C" }} />
            </button>

            <div className="flex items-center gap-2.5 pl-4" style={{ borderLeft: "1px solid #E2E8F0" }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "#E0533C" }}
              >
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-none">Abhishek</p>
                <p className="text-[11px] text-slate-500 leading-none mt-0.5">Studio Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
