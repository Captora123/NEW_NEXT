import { useGetDashboardSummary, useGetUpcomingShoots, useGetOverduePaymentClients } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Camera, IndianRupee, Users, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { data, isLoading } = useGetDashboardSummary();
  const { data: upcoming } = useGetUpcomingShoots();
  const { data: overdue } = useGetOverduePaymentClients();

  const stats = [
    {
      label: "Today's Shoots",
      value: data?.todayShootsCount ?? 0,
      icon: Camera,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Monthly Revenue",
      value: `₹${(data?.thisMonthRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Leads",
      value: data?.totalLeadsThisMonth ?? 0,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Pending Payments",
      value: `₹${(data?.pendingPaymentsTotal ?? 0).toLocaleString("en-IN")}`,
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to Captora Command Center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              {isLoading
                ? <div className="h-8 bg-muted animate-pulse rounded w-24" />
                : <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              }
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Shoots</h2>
          {!upcoming?.length ? (
            <p className="text-muted-foreground text-sm">No upcoming shoots in the next 7 days.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 6).map((shoot) => (
                <div key={shoot.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{shoot.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {shoot.functions?.join(", ") || "Shoot"} • {shoot.venue || "TBD"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">{shoot.shootDate}</p>
                    {shoot.shootTime && <p className="text-xs text-muted-foreground">{shoot.shootTime}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/shoots">
            <button className="mt-4 text-xs text-primary hover:underline">View all shoots →</button>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            Overdue Payments
          </h2>
          {!overdue?.length ? (
            <p className="text-muted-foreground text-sm">No overdue payments. Great job! 🎉</p>
          ) : (
            <div className="space-y-3">
              {overdue.slice(0, 6).map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/30 rounded px-2 -mx-2 cursor-pointer transition-colors">
                    <div>
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">
                        ₹{(client.totalPending ?? 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">pending</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link href="/payments">
            <button className="mt-4 text-xs text-primary hover:underline">View all payments →</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
