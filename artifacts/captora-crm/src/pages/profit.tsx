import { useState } from "react";
import { useGetMonthlyPnL, useGetPnLChart } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOW = new Date();

export default function Profit() {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year, setYear] = useState(NOW.getFullYear());

  const { data: pnl, isLoading } = useGetMonthlyPnL({ month, year });
  const { data: chart } = useGetPnLChart();

  const netProfit = pnl?.netProfit ?? 0;
  const isProfit = netProfit >= 0;

  const maxBar = Math.max(...(chart?.map(r => Math.max(r.revenue, r.expenses)) || [1]));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="bg-card border border-border text-sm px-3 py-2 rounded-lg text-foreground"
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="bg-card border border-border text-sm px-3 py-2 rounded-lg text-foreground"
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl border border-border bg-card">
              <p className="text-sm font-medium text-muted-foreground mb-1">Revenue</p>
              <p className="text-2xl font-bold text-primary">₹{(pnl?.totalRevenue ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <p className="text-sm font-medium text-muted-foreground mb-1">Freelancer Costs</p>
              <p className="text-2xl font-bold text-destructive">₹{(pnl?.totalFreelancerCosts ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <p className="text-sm font-medium text-muted-foreground mb-1">Staff Salaries</p>
              <p className="text-2xl font-bold text-destructive">₹{(pnl?.totalSalaries ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <p className="text-sm font-medium text-muted-foreground mb-1">Other Expenses</p>
              <p className="text-2xl font-bold text-destructive">₹{(pnl?.totalExpenses ?? 0).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className={`p-8 rounded-xl border-2 ${isProfit ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isProfit ? "bg-green-500/10" : "bg-destructive/10"}`}>
                {isProfit
                  ? <TrendingUp className="w-8 h-8 text-green-500" />
                  : <TrendingDown className="w-8 h-8 text-destructive" />
                }
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Net {isProfit ? "Profit" : "Loss"} — {MONTHS[month - 1]} {year}</p>
                <p className={`text-4xl font-bold ${isProfit ? "text-green-500" : "text-destructive"}`}>
                  {isProfit ? "+" : ""}₹{netProfit.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {chart && chart.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">6-Month Overview</h2>
          <div className="flex items-end gap-2 h-48">
            {chart.map((row) => (
              <div key={row.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end" style={{ height: "160px" }}>
                  <div
                    className="flex-1 bg-primary/70 rounded-t-sm transition-all"
                    style={{ height: `${(row.revenue / maxBar) * 100}%` }}
                    title={`Revenue: ₹${row.revenue.toLocaleString("en-IN")}`}
                  />
                  <div
                    className="flex-1 bg-destructive/60 rounded-t-sm transition-all"
                    style={{ height: `${(row.expenses / maxBar) * 100}%` }}
                    title={`Expenses: ₹${row.expenses.toLocaleString("en-IN")}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{row.month}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-3 justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm bg-primary/70" />Revenue
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm bg-destructive/60" />Expenses
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
