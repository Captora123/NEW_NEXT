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
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Calendar, ChevronDown, IndianRupee, TrendingUp, AlertCircle } from "lucide-react";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FY_OPTIONS = ["FY 2026-27", "FY 2025-26", "FY 2024-25"];
const CORAL = "#E0533C";

function formatINR(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

function xAxisLabel(month: number) {
  const m = MONTHS_SHORT[(month - 1) % 12];
  const yr = String(month <= 3 ? 27 : 26);
  return `${m} ${yr}`;
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: number;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="text-slate-500 text-xs mb-1">{label !== undefined ? xAxisLabel(label) : ""}</p>
        {payload.map(p => (
          <p key={p.name} className="font-bold text-slate-800">
            {formatINR(p.value)}
          </p>
        ))}
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

  const totalReceived = allPayments?.reduce((s, p) => s + p.amount, 0) ?? 0;
  const totalRevenue = summary?.thisMonthRevenue ?? 0;
  const totalPending = summary?.pendingPaymentsTotal ?? 0;
  const projectCount = summary?.totalLeadsThisMonth ?? 0;
  const pct = totalRevenue > 0 ? Math.round((totalReceived / totalRevenue) * 100) : 0;

  const barData = chartData?.map(r => ({ month: r.month, Revenue: r.revenue })) ?? [];

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>{fy}</p>
        </div>

        {/* FY picker */}
        <div className="relative">
          <button
            onClick={() => setFyOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            {fy}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${fyOpen ? "rotate-180" : ""}`} />
          </button>
          {fyOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30">
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

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
              Total Revenue
            </p>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FFF1F0" }}>
              <IndianRupee className="w-4 h-4" style={{ color: CORAL }} />
            </div>
          </div>
          {isLoading
            ? <div className="h-8 bg-slate-100 animate-pulse rounded w-32 mb-2" />
            : <p className="text-2xl font-bold" style={{ color: "#0F172A" }}>{formatINR(totalRevenue)}</p>
          }
          <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>{projectCount} projects</p>
        </div>

        {/* Received */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
              Received
            </p>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F0FDF4" }}>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          {isLoading
            ? <div className="h-8 bg-slate-100 animate-pulse rounded w-28 mb-2" />
            : <p className="text-2xl font-bold text-green-600">{formatINR(totalReceived)}</p>
          }
          <p className="text-xs mt-1.5 font-semibold text-green-600">
            {pct}% collected
          </p>
        </div>

        {/* Outstanding */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
              Outstanding
            </p>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FFFBEB" }}>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          {isLoading
            ? <div className="h-8 bg-slate-100 animate-pulse rounded w-32 mb-2" />
            : <p className="text-2xl font-bold text-amber-600">{formatINR(totalPending)}</p>
          }
          <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>from clients</p>
        </div>
      </div>

      {/* ── Dual column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-5">
            Payments Received (Last 6 Months)
          </h2>
          {barData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-300 text-sm">
              No payment data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barData} barSize={32} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={xAxisLabel}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={46}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
                <Bar dataKey="Revenue" fill={CORAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team Wages Due */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Team Wages Due</h2>
          <div className="flex-1 space-y-0 divide-y divide-slate-100">
            {!staffList?.length ? (
              <p className="text-sm text-slate-400 py-4">No staff added yet.</p>
            ) : (
              staffList.map(s => (
                <div key={s.id} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-none">{s.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.role}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: CORAL }}>
                    {formatINR(s.monthlySalary)}
                  </p>
                </div>
              ))
            )}
          </div>
          {staffList && staffList.length > 0 && (
            <div className="pt-4 mt-3 border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Total Due</p>
              <p className="text-base font-bold" style={{ color: CORAL }}>
                {formatINR(staffList.reduce((s, m) => s + m.monthlySalary, 0))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Events ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Upcoming Events</h2>
          <Link href="/shoots">
            <button className="text-xs font-semibold hover:underline transition-all" style={{ color: CORAL }}>
              View all →
            </button>
          </Link>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {!upcomingShoots?.length ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No upcoming events scheduled.</p>
          ) : upcomingShoots.slice(0, 6).map(shoot => (
            <div key={shoot.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{shoot.clientName ?? "—"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{shoot.shootDate}</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {shoot.functions?.length
                    ? shoot.functions.map(fn => (
                        <span key={fn} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 border border-orange-200" style={{ color: CORAL }}>{fn}</span>
                      ))
                    : <span className="text-xs text-slate-400">Shoot</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Date</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Client</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Event</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Venue</th>
              </tr>
            </thead>
            <tbody>
              {!upcomingShoots?.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                    No upcoming events scheduled.
                  </td>
                </tr>
              ) : (
                upcomingShoots.slice(0, 6).map(shoot => (
                  <tr key={shoot.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{shoot.shootDate}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{shoot.clientName ?? "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {shoot.functions?.length
                          ? shoot.functions.map(fn => (
                              <span key={fn} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 border border-orange-200" style={{ color: CORAL }}>
                                {fn}
                              </span>
                            ))
                          : <span className="text-sm text-slate-400">Shoot</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{shoot.venue ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
