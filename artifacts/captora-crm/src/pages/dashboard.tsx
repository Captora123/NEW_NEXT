import { useState } from "react";
import {
  useGetDashboardSummary, useGetUpcomingShoots, useGetOverduePaymentClients,
  useGetPnLChart, useListStaff,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Camera, IndianRupee, Users, AlertCircle, TrendingUp, ChevronDown, ArrowRight } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CORAL = "#E0533C";

const FY_OPTIONS = ["FY 2024-25", "FY 2025-26", "FY 2026-27"];

function Pill({ label, color }: { label: string; color: "green" | "red" | "amber" | "blue" }) {
  const map = {
    green: "bg-green-50 text-green-700 border border-green-200",
    red: "bg-red-50 text-red-600 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>{label}</span>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: number }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="text-slate-500 font-medium mb-2">{label !== undefined ? MONTHS[label - 1] : ""}</p>
        {payload.map(p => (
          <p key={p.name} className="font-semibold" style={{ color: p.color }}>
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
  const [fy, setFy] = useState("FY 2025-26");
  const [fyOpen, setFyOpen] = useState(false);

  const chartData = chart?.map(row => ({ month: row.month, Revenue: row.revenue, Expenses: row.expenses, Profit: row.profit })) ?? [];
  const totalSalaryDue = staff?.reduce((sum, s) => sum + s.monthlySalary, 0) ?? 0;

  const metrics = [
    { label: "Total Revenue", value: `₹${(data?.thisMonthRevenue ?? 0).toLocaleString("en-IN")}`, sub: "this month", icon: TrendingUp, iconBg: "#FFF1F0", iconColor: CORAL },
    { label: "Cash Received", value: `₹${(data?.thisMonthRevenue ?? 0).toLocaleString("en-IN")}`, sub: `${data?.todayShootsCount ?? 0} shoots today`, icon: IndianRupee, iconBg: "#F0FDF4", iconColor: "#16A34A" },
    { label: "Outstanding", value: `₹${(data?.pendingPaymentsTotal ?? 0).toLocaleString("en-IN")}`, sub: "pending collection", icon: AlertCircle, iconBg: "#FEF3C7", iconColor: "#D97706" },
    { label: "Active Clients", value: data?.totalLeadsThisMonth ?? 0, sub: "leads this month", icon: Users, iconBg: "#EEF2FF", iconColor: "#4F46E5" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {/* FY picker */}
        <div className="relative">
          <button
            onClick={() => setFyOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all shadow-sm"
          >
            {fy}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${fyOpen ? "rotate-180" : ""}`} />
          </button>
          {fyOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
              {FY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setFy(opt); setFyOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${fy === opt ? "font-semibold text-[#E0533C] bg-orange-50" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{m.label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: m.iconBg }}>
                  <Icon className="w-4 h-4" style={{ color: m.iconColor }} />
                </div>
              </div>
              {isLoading
                ? <div className="h-7 bg-slate-100 animate-pulse rounded w-24 mb-1" />
                : <p className="text-2xl font-bold text-slate-900">{m.value}</p>
              }
              <p className="text-xs text-slate-500 mt-1">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Chart + wages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue vs Expenses</h2>
              <p className="text-xs text-slate-400 mt-0.5">Monthly overview · {fy}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: CORAL }} />Revenue</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-300" />Expenses</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-400" />Profit</span>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400">
              <Camera className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No data yet — add payments to see trends</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={3} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tickFormatter={v => MONTHS[v - 1] ?? v} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
                <Bar dataKey="Revenue" fill={CORAL} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#4ADE80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team wages */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col">
          <h2 className="text-base font-bold text-slate-900 mb-0.5">Team Wages Due</h2>
          <p className="text-xs text-slate-400 mb-4">Monthly salary obligations</p>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {!staff?.length ? (
              <p className="text-sm text-slate-400 py-4">No staff added yet.</p>
            ) : staff.map(s => (
              <div key={s.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: CORAL }}>
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-none">{s.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.role}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-800">₹{s.monthlySalary.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
          {(staff?.length ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Due</p>
              <p className="text-base font-bold" style={{ color: CORAL }}>₹{totalSalaryDue.toLocaleString("en-IN")}</p>
            </div>
          )}
          <Link href="/staff">
            <button className="mt-3 text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: CORAL }}>
              Manage staff <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      {/* Bottom tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming shoots */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Upcoming Shoots</h2>
            <Link href="/shoots"><button className="text-xs font-semibold flex items-center gap-1" style={{ color: CORAL }}>View all <ArrowRight className="w-3 h-3" /></button></Link>
          </div>
          {!upcoming?.length ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">No shoots scheduled in the next 7 days.</div>
          ) : (
            <div>
              {upcoming.slice(0, 5).map((shoot) => (
                <div key={shoot.id} className="flex items-center justify-between px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFF1F0" }}>
                      <Camera className="w-4 h-4" style={{ color: CORAL }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{shoot.clientName}</p>
                      <p className="text-xs text-slate-400">{shoot.functions?.join(", ") || "Shoot"}{shoot.venue ? ` · ${shoot.venue}` : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{shoot.shootDate}</p>
                    {shoot.shootTime && <p className="text-xs text-slate-400">{shoot.shootTime}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outstanding payments */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Outstanding Payments</h2>
              {(overdue?.length ?? 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">{overdue?.length}</span>
              )}
            </div>
            <Link href="/payments"><button className="text-xs font-semibold flex items-center gap-1" style={{ color: CORAL }}>View all <ArrowRight className="w-3 h-3" /></button></Link>
          </div>
          {!overdue?.length ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">All payments cleared — excellent! 🎉</div>
          ) : (
            <div>
              {overdue.slice(0, 5).map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-sm font-bold text-red-500 flex-shrink-0">
                        {client.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{client.name}</p>
                        <p className="text-xs text-slate-400">{client.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">₹{(client.totalPending ?? 0).toLocaleString("en-IN")}</p>
                      <Pill label="Pending" color="red" />
                    </div>
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
