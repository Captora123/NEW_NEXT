import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExpenses, useCreateExpense, useDeleteExpense, useGetExpenseSummary,
  getListExpensesQueryKey, getGetExpenseSummaryQueryKey,
} from "@workspace/api-client-react";
import type { ExpenseInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["Equipment", "Travel", "Marketing", "Software", "Office", "Food", "Accommodation", "Maintenance", "Salary Advance", "Other"];
const PAID_BY = ["UPI", "Cash", "Card", "Bank Transfer"];

const CATEGORY_COLORS: Record<string, string> = {
  Equipment: "bg-blue-500/10 text-blue-400",
  Travel: "bg-green-500/10 text-green-400",
  Marketing: "bg-purple-500/10 text-purple-400",
  Software: "bg-yellow-500/10 text-yellow-400",
  Salary: "bg-orange-500/10 text-orange-400",
  Other: "bg-muted text-muted-foreground",
};

const emptyForm = (): ExpenseInput => ({
  category: "Equipment", amount: 0, expenseDate: new Date().toISOString().split("T")[0],
  description: "", paidBy: "UPI",
});

export default function Expenses() {
  const qc = useQueryClient();
  const { data: expenses, isLoading: loadingExpenses } = useListExpenses();
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

  const totalThisMonth = expenses?.reduce((sum, e) => {
    const d = new Date(e.expenseDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      ? sum + e.amount : sum;
  }, 0) ?? summary?.totalExpenses ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Button onClick={() => { setForm(emptyForm()); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Expense</Button>
      </div>

      <div className="p-6 rounded-lg border border-border bg-card">
        <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses (This Month)</p>
        <p className="text-3xl font-bold text-destructive">₹{totalThisMonth.toLocaleString("en-IN")}</p>
      </div>

      {loadingExpenses ? (
        <div className="text-muted-foreground">Loading expenses...</div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Paid By</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium w-16">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses?.map((expense) => (
                <tr key={expense.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4">{expense.expenseDate}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{expense.description || "—"}</td>
                  <td className="p-4">{expense.paidBy}</td>
                  <td className="p-4 font-bold text-destructive">₹{expense.amount.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <button onClick={() => setDeleteId(expense.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {!expenses?.length && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No expenses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="5000" />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Paid By</Label>
                <Select value={form.paidBy} onValueChange={v => setForm(f => ({ ...f, paidBy: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAID_BY.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Description</Label>
                <Input value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending} className="flex-1">Add Expense</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Expense?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">This cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteMut.isPending} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
