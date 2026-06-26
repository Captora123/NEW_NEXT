import {
  useGetDashboardSummary,
  useGetUpcomingShoots,
  useGetOverduePaymentClients,
  useGetPnLChart,
  useListStaff,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Camera, IndianRupee, Users, AlertCircle, TrendingUp, ArrowUpRight } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: number }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="text-muted-foreground mb-2 font-medium">{label !== undefined ? MONTHS[label - 1] : ""}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: ₹{Number(p.value).toLocaleString("en-IN")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data, isLoading } = useGetDashboardSummary();
  const { data: upcoming } = useGetUpcomingShoots();
  const { data: overdue } = useGetOverduePaymentClients();
  const { data: chart } = useGetPnLChart();
  const { data: staff } = useListStaff();

  const chartData = chart?.map(row => ({
    month: row.month,
    Revenue: row.revenue,
    Expenses: row.expenses,
    Profit: row.profit,
  })) ?? [];

  const totalSalaryDue = staff?.reduce((sum, s) => sum + s.monthlySalary, 0) ?? 0;

  const stats = [
    {
      label: "Total Revenue",
      value: `₹${((data?.thisMonthRevenue ?? 0) * 12 / 1).toLocaleString("en-IN")}`,
      sub: "this month",
      subValue: `₹${(data?.thisMonthRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "from-primary/20 to-primary/5",
      border: "border-primary/20",
    },
    {
      label: "Cash Received",
      value: `₹${(data?.thisMonthRevenue ?? 0).toLocaleString("en-IN")}`,
      sub: `${data?.todayShootsCount ?? 0} shoots today`,
      icon: IndianRupee,
      color: "text-green-400",
      bg: "from-green-500/20 to-green-500/5",
      border: "border-green-500/20",
    },
    {
      label: "Outstanding",
      value: `₹${(data?.pendingPaymentsTotal ?? 0).toLocaleString("en-IN")}`,
      sub: "pending from clients",
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "from-amber-500/20 to-amber-500/5",
      border: "border-amber-500/20",
    },
    {
      label: "Active Clients",
      value: data?.totalLeadsThisMonth ?? 0,
      sub: "leads this month",
      icon: Users,
      color: "text-blue-400",
      bg: "from-blue-500/20 to-blue-500/5",
      border: "border-blue-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning, Abhishek 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/shoots">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg border border-primary/20 transition-all">
            <Camera className="w-4 h-4" />
            Schedule Shoot
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`p-5 rounded-xl border ${stat.border} bg-gradient-to-br ${stat.bg} relative overflow-hidden`}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <div className={`p-1.5 rounded-lg bg-black/20`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              {isLoading
                ? <div className="h-8 bg-white/10 animate-pulse rounded w-28 mb-1" />
                : <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              }
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Chart + Side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-semibold">Revenue vs Expenses</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly overview for the year</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium bg-green-500/10 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              Live data
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
              No chart data yet. Add payments to see trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => MONTHS[v - 1] ?? v}
                  tick={{ fill: "#888", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: "#888", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend
                  formatter={(value) => <span style={{ color: "#888", fontSize: 12 }}>{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="Revenue" fill="#C5A059" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Bar dataKey="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team Wages Due */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
          <h2 className="text-base font-semibold mb-1">Team Wages Due</h2>
          <p className="text-xs text-muted-foreground mb-4">Monthly salary obligations</p>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-48">
            {!staff?.length ? (
              <p className="text-sm text-muted-foreground">No staff added yet.</p>
            ) : staff.map(s => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.role}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-amber-400">₹{s.monthlySalary.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
          {(staff?.length ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-border/60 flex justify-between items-center">
              <p className="text-xs text-muted-foreground font-medium">Total Due</p>
              <p className="text-base font-bold text-amber-400">₹{totalSalaryDue.toLocaleString("en-IN")}</p>
            </div>
          )}
          <Link href="/staff">
            <button className="mt-3 text-xs text-primary hover:underline">Manage staff →</button>
          </Link>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Shoots */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold">Upcoming Shoots</h2>
            <Link href="/shoots">
              <button className="text-xs text-primary hover:underline">View all →</button>
            </Link>
          </div>
          {!upcoming?.length ? (
            <p className="text-muted-foreground text-sm py-4">No shoots in the next 7 days.</p>
          ) : (
            <div className="space-y-1">
              {upcoming.slice(0, 5).map((shoot) => (
                <div key={shoot.id} className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{shoot.clientName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {shoot.functions?.join(", ") || "Shoot"}{shoot.venue ? ` • ${shoot.venue}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-primary">{shoot.shootDate}</p>
                    {shoot.shootTime && <p className="text-xs text-muted-foreground">{shoot.shootTime}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Payments */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Outstanding Payments</h2>
              {(overdue?.length ?? 0) > 0 && (
                <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-medium">
                  {overdue?.length}
                </span>
              )}
            </div>
            <Link href="/payments">
              <button className="text-xs text-primary hover:underline">View all →</button>
            </Link>
          </div>
          {!overdue?.length ? (
            <p className="text-muted-foreground text-sm py-4">All payments cleared. Excellent! 🎉</p>
          ) : (
            <div className="space-y-1">
              {overdue.slice(0, 5).map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive flex-shrink-0">
                        {client.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{client.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{client.phone}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-destructive flex-shrink-0">
                      ₹{(client.totalPending ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
