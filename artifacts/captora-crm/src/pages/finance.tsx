import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMonthlyPnL, useGetPnLChart,
  useListPayments, useCreatePayment, useDeletePayment, useGetPaymentsSummary,
  getListPaymentsQueryKey, getGetPaymentsSummaryQueryKey,
  useListClients,
  useListExpenses, useCreateExpense, useDeleteExpense, useGetExpenseSummary,
  getListExpensesQueryKey, getGetExpenseSummaryQueryKey,
  useListStaff, useCreateStaffMember, useUpdateStaffMember, useDeleteStaffMember,
  getListStaffQueryKey,
  useListFreelancers, useCreateFreelancer, useUpdateFreelancer, useDeleteFreelancer,
  getListFreelancersQueryKey,
} from "@workspace/api-client-react";
import type {
  Payment, PaymentInput,
  Expense, ExpenseInput,
  StaffMember, StaffInput,
  Freelancer, FreelancerInput,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Pencil, TrendingUp, TrendingDown,
  ChevronDown, IndianRupee, ReceiptText, Users, Wallet,
} from "lucide-react";

const CORAL = "#E0533C";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOW = new Date();

function fmt(v: number) { return "₹" + v.toLocaleString("en-IN"); }

// ─────────────────────────────────────────
// P&L TAB
// ─────────────────────────────────────────
const PnLTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: number }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="text-slate-500 font-medium mb-1.5">{label !== undefined ? MONTHS[label - 1] : ""}</p>
      {payload.map(p => <p key={p.name} className="font-semibold" style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
};

function PnLTab() {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year, setYear] = useState(NOW.getFullYear());
  const { data: pnl, isLoading } = useGetMonthlyPnL({ month, year });
  const { data: chart } = useGetPnLChart();

  const net = pnl?.netProfit ?? 0;
  const isProfit = net >= 0;
  const chartData = chart?.map(r => ({ month: r.month, Revenue: r.revenue, Expenses: r.expenses, Profit: r.profit })) ?? [];

  const cards = [
    { label: "Revenue", value: pnl?.totalRevenue ?? 0, color: CORAL, bg: "#FFF1F0" },
    { label: "Freelancer Costs", value: pnl?.totalFreelancerCosts ?? 0, color: "#DC2626", bg: "#FEF2F2" },
    { label: "Staff Salaries", value: pnl?.totalSalaries ?? 0, color: "#D97706", bg: "#FFFBEB" },
    { label: "Other Expenses", value: pnl?.totalExpenses ?? 0, color: "#7C3AED", bg: "#F5F3FF" },
  ];

  return (
    <div className="space-y-5">
      {/* Month/Year picker */}
      <div className="flex gap-2">
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
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Cards */}
      {isLoading
        ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl"/>)}</div>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(c => (
              <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: c.bg }}>
                  <IndianRupee className="w-4 h-4" style={{ color: c.color }} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{c.label}</p>
                <p className="text-xl font-bold" style={{ color: c.color }}>{fmt(c.value)}</p>
              </div>
            ))}
          </div>
        )}

      {/* Net result */}
      <div className={`rounded-xl border-2 p-6 flex items-center gap-5 ${isProfit ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isProfit ? "bg-green-100" : "bg-red-100"}`}>
          {isProfit ? <TrendingUp className="w-7 h-7 text-green-600" /> : <TrendingDown className="w-7 h-7 text-red-600" />}
        </div>
        <div>
          <p className={`text-sm font-semibold ${isProfit ? "text-green-600" : "text-red-600"}`}>
            Net {isProfit ? "Profit" : "Loss"} — {MONTHS[month - 1]} {year}
          </p>
          <p className={`text-4xl font-bold mt-0.5 ${isProfit ? "text-green-700" : "text-red-700"}`}>
            {isProfit ? "+" : ""}{fmt(net)}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-900">Year-to-Date Overview</h3>
            <div className="flex gap-4 text-xs">
              {[{ label:"Revenue", color: CORAL }, { label:"Expenses", color:"#CBD5E1" }, { label:"Profit", color:"#4ADE80" }].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />{l.label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={3} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tickFormatter={v => MONTHS[v - 1] ?? v} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<PnLTooltip />} cursor={{ fill: "#F8FAFC" }} />
              <Bar dataKey="Revenue" fill={CORAL} radius={[4,4,0,0]} />
              <Bar dataKey="Expenses" fill="#CBD5E1" radius={[4,4,0,0]} />
              <Bar dataKey="Profit" fill="#4ADE80" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// PAYMENTS TAB
// ─────────────────────────────────────────
const MODES = ["Cash", "Online", "Cheque", "Card", "UPI"];
const PAY_TYPES = ["Advance", "Milestone", "Final", "Refund", "Other"];
const MODE_COLORS: Record<string, string> = {
  Cash: "bg-green-50 text-green-700 border border-green-200",
  Online: "bg-blue-50 text-blue-700 border border-blue-200",
  UPI: "bg-purple-50 text-purple-700 border border-purple-200",
  Cheque: "bg-amber-50 text-amber-700 border border-amber-200",
  Card: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

const emptyPayment = (): PaymentInput => ({
  clientId: 0, amount: 0, mode: "Cash", installmentType: "Advance",
  paymentDate: NOW.toISOString().split("T")[0], notes: "",
});

function PaymentsTab() {
  const qc = useQueryClient();
  const { data: payments, isLoading } = useListPayments();
  const { data: clients } = useListClients();
  const { data: summary } = useGetPaymentsSummary();
  const createMut = useCreatePayment();
  const deleteMut = useDeletePayment();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PaymentInput>(emptyPayment());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetPaymentsSummaryQueryKey() });
  };

  const handleSave = () => {
    if (!form.clientId || !form.amount) {
      toast({ variant: "destructive", title: "Client and amount are required." }); return;
    }
    createMut.mutate({ data: { ...form, amount: Number(form.amount) } }, {
      onSuccess: () => { invalidate(); setOpen(false); setForm(emptyPayment()); toast({ title: "Payment recorded ✓" }); },
      onError: () => toast({ variant: "destructive", title: "Failed to record payment" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Payment deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  const clientName = (id: number) => clients?.find(c => c.id === id)?.name ?? `Client #${id}`;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Received", value: summary?.totalReceived ?? 0, color: "#16A34A", bg: "#F0FDF4" },
          { label: "Total Pending", value: summary?.totalPending ?? 0, color: CORAL, bg: "#FFF1F0" },
          { label: "Transactions", value: payments?.length ?? 0, color: "#4F46E5", bg: "#EEF2FF" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: s.bg }}>
              <Wallet className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>
              {typeof s.value === "number" && s.label !== "Transactions" ? fmt(s.value) : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Actions + table */}
      <div className="flex justify-end">
        <button onClick={() => { setForm(emptyPayment()); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
          style={{ background: CORAL }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")}
          onMouseLeave={e => (e.currentTarget.style.background = CORAL)}>
          <Plus className="w-4 h-4" />Record Payment
        </button>
      </div>

      {isLoading ? <p className="text-sm text-slate-400">Loading payments...</p> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Client", "Date", "Amount", "Type", "Mode", "Notes", ""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments?.map((p: Payment) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{clientName(p.clientId)}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{p.paymentDate}</td>
                  <td className="px-5 py-4 text-sm font-bold text-green-700">{fmt(p.amount)}</td>
                  <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">{p.installmentType}</span></td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${MODE_COLORS[p.mode] || "bg-slate-100 text-slate-600"}`}>{p.mode}</span></td>
                  <td className="px-5 py-4 text-xs text-slate-400 max-w-[140px] truncate">{p.notes || "—"}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {!payments?.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">No payments recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Record dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={String(form.clientId || "")} onValueChange={v => setForm(f => ({ ...f, clientId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="50000" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.paymentDate || ""} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.installmentType} onValueChange={v => setForm(f => ({ ...f, installmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Input value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Advance payment for Sharma wedding" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={createMut.isPending} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: CORAL }}>Record Payment</button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Payment?</DialogTitle></DialogHeader>
          <p className="text-slate-500 text-sm">This action cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => { if (deleteId) handleDelete(deleteId); }} disabled={deleteMut.isPending} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────
// EXPENSES & INVESTMENTS TAB
// ─────────────────────────────────────────
const CATEGORIES = [
  "Equipment", "Investment", "Software", "Marketing",
  "Travel", "Food", "Rent", "Utilities", "Salary", "Freelancer", "Other",
];
const CAT_COLORS: Record<string, string> = {
  Equipment:  "bg-blue-50 text-blue-700 border border-blue-200",
  Investment: "bg-violet-50 text-violet-700 border border-violet-200",
  Software:   "bg-purple-50 text-purple-700 border border-purple-200",
  Marketing:  "bg-pink-50 text-pink-700 border border-pink-200",
  Travel:     "bg-teal-50 text-teal-700 border border-teal-200",
  Food:       "bg-amber-50 text-amber-700 border border-amber-200",
  Rent:       "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Utilities:  "bg-cyan-50 text-cyan-700 border border-cyan-200",
  Salary:     "bg-orange-50 text-[#E0533C] border border-orange-200",
  Freelancer: "bg-rose-50 text-rose-700 border border-rose-200",
  Other:      "bg-slate-100 text-slate-600 border border-slate-200",
};

const emptyExpense = (): ExpenseInput => ({
  category: "Equipment", amount: 0,
  expenseDate: NOW.toISOString().split("T")[0], description: "", paidBy: "Self",
});

function ExpensesTab() {
  const qc = useQueryClient();
  const { data: expenses, isLoading } = useListExpenses();
  const { data: summary } = useGetExpenseSummary();
  const createMut = useCreateExpense();
  const deleteMut = useDeleteExpense();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExpenseInput>(emptyExpense());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetExpenseSummaryQueryKey() });
  };

  const handleSave = () => {
    if (!form.amount || !form.category) {
      toast({ variant: "destructive", title: "Category and amount are required." }); return;
    }
    createMut.mutate({ data: { ...form, amount: Number(form.amount) } }, {
      onSuccess: () => { invalidate(); setOpen(false); setForm(emptyExpense()); toast({ title: "Expense recorded ✓" }); },
      onError: () => toast({ variant: "destructive", title: "Failed to record expense" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Expense deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  const filtered = filter === "All" ? expenses : expenses?.filter(e => e.category === filter);
  const investTotal = expenses?.filter(e => e.category === "Investment" || e.category === "Equipment")
    .reduce((s, e) => s + e.amount, 0) ?? 0;

  return (
    <div className="space-y-5">
      {/* Investment highlight card */}
      {investTotal > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-1">Business Investments</p>
            <p className="text-2xl font-bold text-violet-700">{fmt(investTotal)}</p>
            <p className="text-xs text-violet-400 mt-0.5">Equipment + Investment purchases — included in P&L expenses</p>
          </div>
          <ReceiptText className="w-10 h-10 text-violet-300" />
        </div>
      )}

      {/* Filter + Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {["All", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === c ? "bg-[#E0533C] text-white border-[#E0533C]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm(emptyExpense()); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold flex-shrink-0"
          style={{ background: CORAL }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")}
          onMouseLeave={e => (e.currentTarget.style.background = CORAL)}>
          <Plus className="w-4 h-4" />Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? <p className="p-8 text-sm text-slate-400">Loading...</p> : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Description", "Category", "Date", "Paid By", "Amount", ""].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered?.map((e: Expense) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{e.description || "—"}</td>
                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CAT_COLORS[e.category] || CAT_COLORS.Other}`}>{e.category}</span></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{e.expenseDate}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{e.paidBy || "—"}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-800">{fmt(e.amount)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {!filtered?.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">No expenses recorded{filter !== "All" ? ` in "${filter}"` : ""} yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Expenses</p>
            <p className="text-3xl font-bold text-slate-900">{fmt(summary?.totalExpenses ?? 0)}</p>
          </div>
          {summary?.byCategory && summary.byCategory.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">By Category</p>
              <div className="space-y-3">
                {summary.byCategory.map(cat => (
                  <div key={cat.category} className="flex justify-between items-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CAT_COLORS[cat.category] || CAT_COLORS.Other}`}>{cat.category}</span>
                    <span className="text-sm font-bold text-slate-700">{fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Expense / Investment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2"><Label>Description</Label><Input value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Sony 50mm lens, DJI drone, Adobe CC" /></div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="25000" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.expenseDate || ""} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Paid By</Label><Input value={form.paidBy || ""} onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))} placeholder="Self / Company" /></div>
            </div>
            {(form.category === "Investment" || form.category === "Equipment") && (
              <p className="text-xs bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 text-violet-600">
                💡 This purchase will be counted as a business expense in your P&L, reducing net profit for the month.
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={createMut.isPending} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: CORAL }}>Save Expense</button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Expense?</DialogTitle></DialogHeader>
          <p className="text-slate-500 text-sm">This cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => { if (deleteId) handleDelete(deleteId); }} disabled={deleteMut.isPending} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────
// TEAM COSTS TAB
// ─────────────────────────────────────────
const emptyStaff = (): StaffInput => ({ name: "", role: "", phone: "", monthlySalary: 0, joiningDate: NOW.toISOString().split("T")[0] });
const emptyFreelancer = (): FreelancerInput => ({ name: "", role: "", phone: "", bankDetails: "", perShootRate: 0 });

function TeamTab() {
  const qc = useQueryClient();

  // Staff
  const { data: staffList } = useListStaff();
  const createStaff = useCreateStaffMember();
  const updateStaff = useUpdateStaffMember();
  const deleteStaff = useDeleteStaffMember();

  // Freelancers
  const { data: freelancers } = useListFreelancers();
  const createFL = useCreateFreelancer();
  const updateFL = useUpdateFreelancer();
  const deleteFL = useDeleteFreelancer();

  const { toast } = useToast();

  const [staffOpen, setStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState<StaffInput>(emptyStaff());
  const [deleteStaffId, setDeleteStaffId] = useState<number | null>(null);

  const [flOpen, setFlOpen] = useState(false);
  const [editingFL, setEditingFL] = useState<Freelancer | null>(null);
  const [flForm, setFlForm] = useState<FreelancerInput>(emptyFreelancer());
  const [deleteFLId, setDeleteFLId] = useState<number | null>(null);

  const invStaff = () => qc.invalidateQueries({ queryKey: getListStaffQueryKey() });
  const invFL = () => qc.invalidateQueries({ queryKey: getListFreelancersQueryKey() });

  const openAddStaff = () => { setEditingStaff(null); setStaffForm(emptyStaff()); setStaffOpen(true); };
  const openEditStaff = (s: StaffMember) => {
    setEditingStaff(s);
    setStaffForm({ name: s.name, role: s.role, phone: s.phone, monthlySalary: s.monthlySalary, joiningDate: s.joiningDate });
    setStaffOpen(true);
  };

  const saveStaff = () => {
    if (!staffForm.name || !staffForm.role) {
      toast({ variant: "destructive", title: "Name and role are required." }); return;
    }
    const data = { ...staffForm, monthlySalary: Number(staffForm.monthlySalary) };
    if (editingStaff) {
      updateStaff.mutate({ id: editingStaff.id, data }, {
        onSuccess: () => { invStaff(); setStaffOpen(false); toast({ title: "Staff updated" }); },
        onError: () => toast({ variant: "destructive", title: "Update failed" }),
      });
    } else {
      createStaff.mutate({ data }, {
        onSuccess: () => { invStaff(); setStaffOpen(false); setStaffForm(emptyStaff()); toast({ title: "Staff added ✓" }); },
        onError: () => toast({ variant: "destructive", title: "Create failed" }),
      });
    }
  };

  const openAddFL = () => { setEditingFL(null); setFlForm(emptyFreelancer()); setFlOpen(true); };
  const openEditFL = (f: Freelancer) => {
    setEditingFL(f);
    setFlForm({ name: f.name, role: f.role, phone: f.phone, bankDetails: f.bankDetails || "", perShootRate: f.perShootRate });
    setFlOpen(true);
  };

  const saveFL = () => {
    if (!flForm.name || !flForm.phone) {
      toast({ variant: "destructive", title: "Name and phone are required." }); return;
    }
    const data = { ...flForm, perShootRate: Number(flForm.perShootRate) };
    if (editingFL) {
      updateFL.mutate({ id: editingFL.id, data }, {
        onSuccess: () => { invFL(); setFlOpen(false); toast({ title: "Freelancer updated" }); },
        onError: () => toast({ variant: "destructive", title: "Update failed" }),
      });
    } else {
      createFL.mutate({ data }, {
        onSuccess: () => { invFL(); setFlOpen(false); setFlForm(emptyFreelancer()); toast({ title: "Freelancer added ✓" }); },
        onError: () => toast({ variant: "destructive", title: "Create failed" }),
      });
    }
  };

  const totalWages = staffList?.reduce((s, m) => s + m.monthlySalary, 0) ?? 0;
  const totalFL = freelancers?.reduce((s, f) => s + f.perShootRate, 0) ?? 0;

  return (
    <div className="space-y-8">
      {/* Staff */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Staff</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monthly salary roll · Total: <strong>{fmt(totalWages)}/mo</strong></p>
          </div>
          <button onClick={openAddStaff}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ background: CORAL }}
            onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")}
            onMouseLeave={e => (e.currentTarget.style.background = CORAL)}>
            <Plus className="w-4 h-4" />Add Staff
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Name", "Role", "Phone", "Joined", "Monthly Salary", ""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList?.map((s: StaffMember) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{s.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{s.role}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{s.phone}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{s.joiningDate}</td>
                  <td className="px-5 py-4 text-sm font-bold" style={{ color: CORAL }}>{fmt(s.monthlySalary)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEditStaff(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteStaffId(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!staffList?.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No staff added yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Freelancers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Freelancers</h3>
            <p className="text-xs text-slate-400 mt-0.5">Per-shoot rates · Total rate pool: <strong>{fmt(totalFL)}/shoot</strong></p>
          </div>
          <button onClick={openAddFL}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ background: CORAL }}
            onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")}
            onMouseLeave={e => (e.currentTarget.style.background = CORAL)}>
            <Plus className="w-4 h-4" />Add Freelancer
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Name", "Role", "Phone", "Bank Details", "Per-Shoot Rate", ""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {freelancers?.map((f: Freelancer) => (
                <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">{f.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{f.role}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{f.phone}</td>
                  <td className="px-5 py-4 text-xs text-slate-400 max-w-[160px] truncate">{f.bankDetails || "—"}</td>
                  <td className="px-5 py-4 text-sm font-bold" style={{ color: CORAL }}>{fmt(f.perShootRate)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEditFL(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteFLId(f.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!freelancers?.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No freelancers added yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff dialog */}
      <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingStaff ? "Edit Staff" : "Add Staff Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2"><Label>Name *</Label><Input value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
              <div className="space-y-1.5"><Label>Role *</Label><Input value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))} placeholder="Photographer, Editor…" /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" /></div>
              <div className="space-y-1.5"><Label>Monthly Salary (₹)</Label><Input type="number" value={staffForm.monthlySalary || ""} onChange={e => setStaffForm(f => ({ ...f, monthlySalary: Number(e.target.value) }))} placeholder="25000" /></div>
              <div className="space-y-1.5"><Label>Joining Date</Label><Input type="date" value={staffForm.joiningDate} onChange={e => setStaffForm(f => ({ ...f, joiningDate: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveStaff} disabled={createStaff.isPending || updateStaff.isPending} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: CORAL }}>{editingStaff ? "Save Changes" : "Add Staff"}</button>
              <Button variant="outline" onClick={() => setStaffOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteStaffId !== null} onOpenChange={() => setDeleteStaffId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Staff Member?</DialogTitle></DialogHeader>
          <p className="text-slate-500 text-sm">This cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => { if (deleteStaffId) deleteStaff.mutate({ id: deleteStaffId }, { onSuccess: () => { invStaff(); setDeleteStaffId(null); toast({ title: "Staff removed" }); } }); }} disabled={deleteStaff.isPending} className="flex-1">Remove</Button>
            <Button variant="outline" onClick={() => setDeleteStaffId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Freelancer dialog */}
      <Dialog open={flOpen} onOpenChange={setFlOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingFL ? "Edit Freelancer" : "Add Freelancer"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={flForm.name} onChange={e => setFlForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
              <div className="space-y-1.5"><Label>Role</Label><Input value={flForm.role} onChange={e => setFlForm(f => ({ ...f, role: e.target.value }))} placeholder="Videographer, Editor…" /></div>
              <div className="space-y-1.5"><Label>Phone *</Label><Input value={flForm.phone} onChange={e => setFlForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" /></div>
              <div className="space-y-1.5"><Label>Per-Shoot Rate (₹)</Label><Input type="number" value={flForm.perShootRate || ""} onChange={e => setFlForm(f => ({ ...f, perShootRate: Number(e.target.value) }))} placeholder="8000" /></div>
              <div className="space-y-1.5 col-span-2"><Label>Bank Details</Label><Input value={flForm.bankDetails || ""} onChange={e => setFlForm(f => ({ ...f, bankDetails: e.target.value }))} placeholder="Bank name, account no, IFSC" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveFL} disabled={createFL.isPending || updateFL.isPending} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: CORAL }}>{editingFL ? "Save Changes" : "Add Freelancer"}</button>
              <Button variant="outline" onClick={() => setFlOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteFLId !== null} onOpenChange={() => setDeleteFLId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Freelancer?</DialogTitle></DialogHeader>
          <p className="text-slate-500 text-sm">This cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => { if (deleteFLId) deleteFL.mutate({ id: deleteFLId }, { onSuccess: () => { invFL(); setDeleteFLId(null); toast({ title: "Freelancer removed" }); } }); }} disabled={deleteFL.isPending} className="flex-1">Remove</Button>
            <Button variant="outline" onClick={() => setDeleteFLId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN FINANCE PAGE
// ─────────────────────────────────────────
type TabId = "pnl" | "payments" | "expenses" | "team";
const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "pnl", label: "P&L Overview", icon: TrendingUp },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "expenses", label: "Expenses & Investments", icon: ReceiptText },
  { id: "team", label: "Team Costs", icon: Users },
];

export default function Finance() {
  const [tab, setTab] = useState<TabId>("pnl");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>Finance</h1>
        <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>Profit & loss · payments · expenses · team costs</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${active ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              style={{ background: active ? CORAL : "transparent" }}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "pnl" && <PnLTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "expenses" && <ExpensesTab />}
      {tab === "team" && <TeamTab />}
    </div>
  );
}
