import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Camera,
  IndianRupee,
  UserCircle,
  Briefcase,
  ReceiptText,
  LineChart,
  CheckSquare,
  Lightbulb,
  CalendarDays,
  LogOut,
  Bell,
  Search,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
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
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-border/60 bg-[#0d0d0d] flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border/60 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Camera className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-primary uppercase leading-none">Captora</h1>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Photography Studio</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location === item.href || location.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group ${
                        isActive
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}>
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="w-3 h-3 text-primary/60" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="p-3 border-t border-border/60 space-y-0.5">
          <Link href="/settings">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer group ${
              location === "/settings"
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}>
              <Settings className="w-4 h-4 flex-shrink-0" />
              Settings
            </div>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex-shrink-0 border-b border-border/60 bg-[#0d0d0d]/80 backdrop-blur-sm flex items-center px-6 gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients, shoots..."
              className="w-full bg-white/5 border border-border/60 rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-border/60 transition-all">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-border/60">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center text-sm font-bold text-background">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">Abhishek</p>
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
