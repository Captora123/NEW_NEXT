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
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/shoots", label: "Shoots", icon: Camera },
  { href: "/payments", label: "Payments", icon: IndianRupee },
  { href: "/freelancers", label: "Freelancers", icon: UserCircle },
  { href: "/staff", label: "Staff", icon: Briefcase },
  { href: "/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/profit", label: "P&L", icon: LineChart },
  { href: "/deliverables", label: "Deliverables", icon: CheckSquare },
  { href: "/content", label: "Content", icon: Lightbulb },
  { href: "/team-planner", label: "Team Planner", icon: CalendarDays },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold tracking-tight text-primary">CAP<span className="text-foreground">TORA</span></h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? "bg-sidebar-accent text-primary font-medium" 
                      : "text-sidebar-foreground/80 hover:text-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sidebar-foreground/80 hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
