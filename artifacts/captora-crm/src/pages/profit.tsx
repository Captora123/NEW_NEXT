import { useState } from "react";
import { useGetMonthlyPnL, useGetPnLChart } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOW = new Date();
const CORAL = "#E0533C";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: number }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="text-slate-500 font-medium mb-1.5">{label !== undefined ? MONTHS[label - 1] : ""}</p>
        {payload.map(p => <p key={p.name} className="font-semibold" style={{ color: p.color }}>{p.name}: ₹{Number(p.value).toLocaleString("en-IN")}</p>)}
      </div>
    );
  }
  return null;
};

export default function Profit() {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year, setYear] = useState(NOW.getFullYear());

  const { data: pnl, isLoading } = useGetMonthlyPnL({ month, year });
  const { data: chart } = useGetPnLChart();

  const netProfit = pnl?.netProfit ?? 0;
  const isProfit = netProfit >= 0;

  const chartData = chart?.map(r => ({ month: r.month, Revenue: r.revenue, Expenses: r.expenses, Profit: r.profit })) ?? [];

  const metrics = [
    { label: "Revenue", value: pnl?.totalRevenue ?? 0, color: CORAL, bg: "#FFF1F0" },
    { label: "Freelancer Costs", value: pnl?.totalFreelancerCosts ?? 0, color: "#DC2626", bg: "#FEF2F2" },
    { label: "Staff Salaries", value: pnl?.totalSalaries ?? 0, color: "#D97706", bg: "#FFFBEB" },
    { label: "Other Expenses", value: pnl?.totalExpenses ?? 0, color: "#7C3AED", bg: "#F5F3FF" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profit & Loss</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monthly financial breakdown</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="appearance-none bg-white border border-slate-200 text-sm font-medium px-4 py-2.5 pr-8 rounded-xl text-slate-700 focus:outline-none focus:border-[#E0533C] cursor-pointer shadow-sm">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="appearance-none bg-white border border-slate-200 text-sm font-medium px-4 py-2.5 pr-8 rounded-xl text-slate-700 focus:outline-none focus:border-[#E0533C] cursor-pointer shadow-sm">
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Metric cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{m.label}</p>
              <p className="text-2xl font-bold" style={{ color: m.color }}>₹{m.value.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}

      {/* Net result banner */}
      <div className={`rounded-xl border-2 p-6 flex items-center gap-5 ${isProfit ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isProfit ? "bg-green-100" : "bg-red-100"}`}>
          {isProfit ? <TrendingUp className="w-7 h-7 text-green-600" /> : <TrendingDown className="w-7 h-7 text-red-600" />}
        </div>
        <div>
          <p className={`text-sm font-semibold ${isProfit ? "text-green-600" : "text-red-600"}`}>
            Net {isProfit ? "Profit" : "Loss"} — {MONTHS[month - 1]} {year}
          </p>
          <p className={`text-4xl font-bold mt-0.5 ${isProfit ? "text-green-700" : "text-red-700"}`}>
            {isProfit ? "+" : ""}₹{netProfit.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-slate-900">Year-to-Date Overview</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: CORAL }} />Revenue</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-300" />Expenses</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-400" />Profit</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
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
        </div>
      )}
    </div>
  );
}
