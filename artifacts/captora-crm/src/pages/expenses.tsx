import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExpenses, useCreateExpense, useDeleteExpense, useGetExpenseSummary,
  getListExpensesQueryKey, getGetExpenseSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Expense, ExpenseInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ReceiptText } from "lucide-react";

const CATEGORIES = ["Equipment", "Travel", "Food", "Software", "Marketing", "Rent", "Utilities", "Salary", "Freelancer", "Other"];

const CAT_COLORS: Record<string, string> = {
  Equipment: "bg-blue-50 text-blue-700 border border-blue-200",
  Travel: "bg-green-50 text-green-700 border border-green-200",
  Food: "bg-amber-50 text-amber-700 border border-amber-200",
  Software: "bg-purple-50 text-purple-700 border border-purple-200",
  Marketing: "bg-pink-50 text-pink-700 border border-pink-200",
  Rent: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Utilities: "bg-teal-50 text-teal-700 border border-teal-200",
  Salary: "bg-orange-50 text-[#E0533C] border border-orange-200",
  Freelancer: "bg-rose-50 text-rose-700 border border-rose-200",
  Other: "bg-slate-100 text-slate-600 border border-slate-200",
};

const NOW = new Date();
const emptyForm = (): ExpenseInput => ({ category: "Equipment", amount: 0, expenseDate: NOW.toISOString().split("T")[0], description: "", paidBy: "" });

export default function Expenses() {
  const qc = useQueryClient();
  const { data: expenses, isLoading } = useListExpenses();
  const { data: summary } = useGetExpenseSummary();
  const createMut = useCreateExpense();
  const deleteMut = useDeleteExpense();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExpenseInput>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetExpenseSummaryQueryKey() });
  };

  const handleSave = () => {
    if (!form.amount || !form.category) { toast({ variant: "destructive", title: "Category and amount are required." }); return; }
    createMut.mutate({ data: { ...form, amount: Number(form.amount) } }, {
      onSuccess: () => { invalidate(); setOpen(false); setForm(emptyForm()); toast({ title: "Expense recorded" }); },
      onError: () => toast({ variant: "destructive", title: "Failed to record expense" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Expense deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track all business costs and overheads</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#E0533C" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")} onMouseLeave={e => (e.currentTarget.style.background = "#E0533C")}>
          <Plus className="w-4 h-4" />Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-x-auto">
          {isLoading ? <div className="p-8 text-slate-400 text-sm">Loading...</div> : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Description</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Category</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                  <th className="px-5 py-3.5 w-16" />
                </tr>
              </thead>
              <tbody>
                {expenses?.map((e: Expense) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">{e.description || "—"}</p>
                      {e.paidBy && <p className="text-xs text-slate-400 mt-0.5">Paid by {e.paidBy}</p>}
                    </td>
                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CAT_COLORS[e.category] || CAT_COLORS.Other}`}>{e.category}</span></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{e.expenseDate}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-800">₹{e.amount.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4"><button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
                {!expenses?.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">No expenses recorded yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ReceiptText className="w-4 h-4 text-slate-400" />
              <h3 className="font-bold text-slate-900 text-sm">Total Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">₹{(summary?.totalExpenses ?? 0).toLocaleString("en-IN")}</p>
          </div>
          {summary?.byCategory && summary.byCategory.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-4">By Category</h3>
              <div className="space-y-3">
                {summary.byCategory.map(cat => (
                  <div key={cat.category} className="flex justify-between items-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CAT_COLORS[cat.category] || CAT_COLORS.Other}`}>{cat.category}</span>
                    <span className="text-sm font-bold text-slate-700">₹{cat.total.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2"><Label>Description</Label><Input value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this for?" /></div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="5000" /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.expenseDate || ""} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Paid By</Label><Input value={form.paidBy || ""} onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))} placeholder="Name" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={createMut.isPending} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#E0533C" }}>Add Expense</button>
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
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteMut.isPending} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
