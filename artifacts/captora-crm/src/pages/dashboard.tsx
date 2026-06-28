import { useState } from "react";
import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetUpcomingShoots,
  useGetOverduePaymentClients,
  useGetPnLChart,
  useListStaff,
  useListPayments,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  Calendar, ChevronDown, IndianRupee, TrendingUp, AlertCircle,
  Camera, Users, Clock, ArrowRight, ChevronRight, BarChart2,
} from "lucide-react";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FY_OPTIONS = ["FY 2026-27", "FY 2025-26", "FY 2024-25"];
const CORAL = "#E0533C";

function fmt(v: number) {
  if (v >= 100000) return "₹" + (v / 100000).toFixed(1).replace(/\.0$/, "") + "L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(0) + "k";
  return "₹" + v.toLocaleString("en-IN");
}
function fmtFull(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

function xAxisLabel(month: number) {
  const m = MONTHS_SHORT[(month - 1) % 12];
  const yr = String(month <= 3 ? 27 : 26);
  return `${m} ${yr}`;
}

const GOLD = "#C5A059";

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; fill?: string }[];
  label?: number;
}) => {
  if (active && payload?.length) {
    const profit = (payload.find(p => p.name === "Revenue")?.value ?? 0) - (payload.find(p => p.name === "Expenses")?.value ?? 0);
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm min-w-[140px]">
        <p className="text-slate-500 text-xs mb-1.5 font-semibold">{label !== undefined ? xAxisLabel(label) : ""}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">{p.name}</span>
            <span className="text-xs font-bold text-slate-800">{fmtFull(p.value)}</span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-500">Net</span>
            <span className={`text-xs font-bold ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>{profit >= 0 ? "+" : ""}{fmtFull(profit)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: upcomingShoots } = useGetUpcomingShoots();
  const { data: overdueClients } = useGetOverduePaymentClients();
  const { data: chartData } = useGetPnLChart();
  const { data: staffList } = useListStaff();
  const { data: allPayments } = useListPayments();

  const [fy, setFy] = useState(FY_OPTIONS[0]);
  const [fyOpen, setFyOpen] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [plRange, setPlRange] = useState<1 | 6 | 12>(6);

  const totalReceived = allPayments?.reduce((s, p) => s + p.amount, 0) ?? 0;
  // DUE = sum of per-client pending (accurate), not the global diff which can be wrong
  const totalPending = (overdueClients ?? []).reduce((s, c) => s + (c.totalPending ?? 0), 0);
  const totalPackage = totalReceived + totalPending;
  const pct = totalPackage > 0 ? Math.round((totalReceived / totalPackage) * 100) : 0;
  const thisMonth = new Date().getMonth() + 1;
  const allBarData = chartData?.map(r => ({ month: r.month, Revenue: r.revenue, Expenses: r.expenses, Profit: r.profit })) ?? [];
  // Slice to requested range, keeping only months with data up to current month
  const filledMonths = allBarData.filter(r => r.month <= thisMonth);
  const barData = plRange === 12 ? allBarData : plRange === 6 ? filledMonths.slice(-6) : filledMonths.slice(-1);
  // Summary totals for selected range
  const rangeRevenue = barData.reduce((s, r) => s + r.Revenue, 0);
  const rangeExpenses = barData.reduce((s, r) => s + r.Expenses, 0);
  const rangeProfit = rangeRevenue - rangeExpenses;
  const lastPnL = filledMonths.length > 0 ? filledMonths[filledMonths.length - 1] : null;

  const overdue = overdueClients ?? [];
  const visibleOverdue = showAllOverdue ? overdue : overdue.slice(0, 3);
  const visibleStaff = showAllStaff ? (staffList ?? []) : (staffList ?? []).slice(0, 4);
  const totalWages = staffList?.reduce((s, m) => s + m.monthlySalary, 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{fy}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setFyOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {fy}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${fyOpen ? "rotate-180" : ""}`} />
          </button>
          {fyOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30">
              {FY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setFy(opt); setFyOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${fy === opt ? "font-semibold bg-orange-50 text-[#E0533C]" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 3-column stat cards (compact even on mobile) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Total Package */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 leading-tight">
              Package<span className="hidden sm:inline"> Value</span>
            </p>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FFF1F0" }}>
              <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: CORAL }} />
            </div>
          </div>
          {isLoading
            ? <div className="h-6 sm:h-8 bg-slate-100 animate-pulse rounded w-16 sm:w-24" />
            : <p className="text-base sm:text-2xl font-bold text-slate-900 leading-tight">{fmt(totalPackage)}</p>
          }
          <p className="text-[10px] sm:text-xs mt-1 text-slate-400">total booked</p>
        </div>

        {/* Received */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 leading-tight">
              Received
            </p>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            </div>
          </div>
          {isLoading
            ? <div className="h-6 sm:h-8 bg-slate-100 animate-pulse rounded w-16 sm:w-24" />
            : <p className="text-base sm:text-2xl font-bold text-green-600 leading-tight">{fmt(totalReceived)}</p>
          }
          <p className="text-[10px] sm:text-xs mt-1 font-semibold text-green-500">{pct}% collected</p>
        </div>

        {/* Outstanding */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 leading-tight">
              Due
            </p>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FFFBEB" }}>
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
            </div>
          </div>
          {isLoading
            ? <div className="h-6 sm:h-8 bg-slate-100 animate-pulse rounded w-16 sm:w-24" />
            : <p className={`text-base sm:text-2xl font-bold leading-tight ${totalPending > 0 ? "text-amber-600" : "text-slate-400"}`}>{fmt(totalPending)}</p>
          }
          <p className="text-[10px] sm:text-xs mt-1 text-slate-400">from clients</p>
        </div>
      </div>

      {/* ── Quick info row (all cards clickable) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Link href="/shoots">
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Today's Shoots</p>
              <p className="text-base font-bold text-slate-800">{summary?.todayShootsCount ?? 0}</p>
            </div>
          </div>
        </Link>
        <Link href="/shoots">
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FFF1F0" }}>
              <Camera className="w-4 h-4" style={{ color: CORAL }} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Month Shoots</p>
              <p className="text-base font-bold text-slate-800">{summary?.thisMonthShootsCount ?? 0}</p>
            </div>
          </div>
        </Link>
        <Link href="/deliverables">
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 hover:border-violet-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Pending Delivery</p>
              <p className="text-base font-bold text-slate-800">{summary?.pendingDeliverablesCount ?? 0}</p>
            </div>
          </div>
        </Link>
        <Link href="/clients">
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Confirmed</p>
              <p className="text-base font-bold text-slate-800">{summary?.confirmedBookingsCount ?? 0}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Overdue clients (most important — show prominently) ── */}
      {overdue.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-red-700">Overdue Payments</h2>
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{overdue.length}</span>
            </div>
            <Link href="/finance">
              <button className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1">
                Finance <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {visibleOverdue.map(c => (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Paid {fmtFull(c.totalPaid ?? 0)} of {fmtFull(c.packageAmount ?? 0)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-sm font-bold text-red-600">−{fmtFull(c.totalPending ?? 0)}</p>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {overdue.length > 3 && (
            <button
              onClick={() => setShowAllOverdue(v => !v)}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-100"
            >
              {showAllOverdue ? "Show less" : `Show ${overdue.length - 3} more`}
            </button>
          )}
        </div>
      )}

      {/* ── Upcoming Events ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Upcoming Events</h2>
          <Link href="/shoots">
            <button className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: CORAL }}>
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        {!upcomingShoots?.length ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">No events in the next 7 days.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingShoots.slice(0, 5).map(shoot => (
              <div key={shoot.id} className="px-4 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{shoot.clientName ?? "—"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{shoot.shootDate}{shoot.venue ? ` · ${shoot.venue}` : ""}</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
                  {shoot.functions?.length
                    ? shoot.functions.slice(0, 2).map(fn => (
                        <span key={fn} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 border border-orange-200 whitespace-nowrap" style={{ color: CORAL }}>{fn}</span>
                      ))
                    : <span className="text-xs text-slate-400">Shoot</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── P&L + Team wages ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* P&L chart — full width on mobile, 3/5 on desktop */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Profit &amp; Loss</h2>
              {lastPnL && (
                <p className="text-xs text-slate-400 mt-0.5">
                  This month:&nbsp;
                  <span className={lastPnL.Profit >= 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                    {lastPnL.Profit >= 0 ? "+" : ""}{fmt(lastPnL.Profit)} net
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Range toggle */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                {([1, 6, 12] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setPlRange(r)}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                    style={plRange === r
                      ? { background: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                      : { color: "#94A3B8" }}
                  >
                    {r === 1 ? "1M" : r === 6 ? "6M" : "12M"}
                  </button>
                ))}
              </div>
              <Link href="/profit">
                <button className="hidden sm:flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: CORAL }}>
                  Full P&amp;L <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          </div>

          <div className="px-4 sm:px-5 pt-4 pb-4 sm:pb-5">
            {/* Legend */}
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: GOLD }} />Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: CORAL }} />Expenses
              </span>
            </div>

            {allBarData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={barData} barSize={plRange === 1 ? 32 : plRange === 6 ? 16 : 10} barGap={2} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={xAxisLabel} tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
                  <Bar dataKey="Revenue" fill={GOLD} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Expenses" fill={CORAL} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Summary strip for selected range */}
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Revenue</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{fmt(rangeRevenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Expenses</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: CORAL }}>{fmt(rangeExpenses)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Net</p>
                <p className={`text-sm font-bold mt-0.5 ${rangeProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {rangeProfit >= 0 ? "+" : ""}{fmt(rangeProfit)}
                </p>
              </div>
            </div>

            {/* Mobile full P&L link */}
            <Link href="/profit">
              <button className="sm:hidden mt-3 w-full py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                View Full P&amp;L <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </div>

        {/* Team Wages */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Team Wages Due</h2>
            <Link href="/finance">
              <button className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: CORAL }}>
                Finance <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          {!staffList?.length ? (
            <p className="text-sm text-slate-400 py-2">No staff added yet.</p>
          ) : (
            <div className="space-y-0 divide-y divide-slate-100">
              {visibleStaff.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.role}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: CORAL }}>{fmtFull(s.monthlySalary)}</p>
                </div>
              ))}
              {(staffList?.length ?? 0) > 4 && (
                <button onClick={() => setShowAllStaff(v => !v)} className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center">
                  {showAllStaff ? "Show less" : `+${(staffList?.length ?? 0) - 4} more`}
                </button>
              )}
            </div>
          )}
          {totalWages > 0 && (
            <div className="pt-3 mt-1 border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total/mo</p>
              <p className="text-sm font-bold" style={{ color: CORAL }}>{fmtFull(totalWages)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
