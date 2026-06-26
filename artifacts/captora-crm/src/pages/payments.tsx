import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPayments, useCreatePayment, useDeletePayment, useListClients,
  useGetPaymentsSummary,
  getListPaymentsQueryKey, getGetPaymentsSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Payment, PaymentInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, IndianRupee } from "lucide-react";

const MODES = ["Cash", "Online", "Cheque", "Card", "UPI"];
const TYPES = ["Advance", "Milestone", "Final", "Refund", "Other"];

const emptyForm = (): PaymentInput => ({ clientId: 0, amount: 0, mode: "Cash", installmentType: "Advance", paymentDate: new Date().toISOString().split("T")[0], notes: "" });

export default function Payments() {
  const qc = useQueryClient();
  const { data: payments, isLoading } = useListPayments();
  const { data: clients } = useListClients();
  const { data: summary } = useGetPaymentsSummary();
  const createMut = useCreatePayment();
  const deleteMut = useDeletePayment();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PaymentInput>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetPaymentsSummaryQueryKey() });
  };

  const handleSave = () => {
    if (!form.clientId || !form.amount) { toast({ variant: "destructive", title: "Client and amount are required." }); return; }
    createMut.mutate({ data: { ...form, amount: Number(form.amount) } }, {
      onSuccess: () => { invalidate(); setOpen(false); setForm(emptyForm()); toast({ title: "Payment recorded" }); },
      onError: () => toast({ variant: "destructive", title: "Failed to record payment" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Payment deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  const getClientName = (id: number) => clients?.find(c => c.id === id)?.name || `Client #${id}`;

  const modeColor: Record<string, string> = {
    Cash: "bg-green-50 text-green-700 border border-green-200",
    Online: "bg-blue-50 text-blue-700 border border-blue-200",
    UPI: "bg-purple-50 text-purple-700 border border-purple-200",
    Cheque: "bg-amber-50 text-amber-700 border border-amber-200",
    Card: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track all installments and transactions</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#E0533C" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")} onMouseLeave={e => (e.currentTarget.style.background = "#E0533C")}>
          <Plus className="w-4 h-4" />Record Payment
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Received", value: summary?.totalReceived, color: "#16A34A", bg: "#F0FDF4" },
          { label: "Total Pending", value: summary?.totalPending, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Transactions", value: payments?.length, color: "#4F46E5", bg: "#EEF2FF" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                <IndianRupee className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{(s.value ?? 0).toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? <div className="text-slate-400 text-sm">Loading payments...</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Client</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Mode</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-20">Del</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((p: Payment) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{getClientName(p.clientId)}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{p.paymentDate}</td>
                  <td className="px-5 py-4 text-sm font-bold text-green-700">₹{p.amount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">{p.installmentType}</span></td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${modeColor[p.mode] || "bg-slate-100 text-slate-600"}`}>{p.mode}</span></td>
                  <td className="px-5 py-4"><button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
              {!payments?.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">No payments recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

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
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Input value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={createMut.isPending} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#E0533C" }}>Record Payment</button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Payment?</DialogTitle></DialogHeader>
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
