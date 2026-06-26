import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPayments, useCreatePayment, useDeletePayment,
  useGetPaymentsSummary, useListClients,
  getListPaymentsQueryKey, getGetPaymentsSummaryQueryKey,
} from "@workspace/api-client-react";
import type { PaymentInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const MODES = ["UPI", "Cash", "Card", "Bank Transfer", "Cheque"];
const INSTALLMENT_TYPES = ["Advance", "Second Installment", "Final Payment", "Full Payment"];

const emptyForm = (): PaymentInput => ({
  clientId: 0, amount: 0, paymentDate: new Date().toISOString().split("T")[0],
  mode: "UPI", installmentType: "Advance", notes: "",
});

export default function Payments() {
  const qc = useQueryClient();
  const { data: payments, isLoading: loadingPayments } = useListPayments();
  const { data: summary, isLoading: loadingSummary } = useGetPaymentsSummary();
  const { data: clients } = useListClients();
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <Button onClick={() => { setForm(emptyForm()); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Record Payment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-lg border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Received</p>
          {loadingSummary ? <div className="h-8 bg-muted animate-pulse rounded w-32" /> :
            <p className="text-3xl font-bold text-primary">₹{(summary?.totalReceived || 0).toLocaleString("en-IN")}</p>}
        </div>
        <div className="p-6 rounded-lg border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Pending</p>
          {loadingSummary ? <div className="h-8 bg-muted animate-pulse rounded w-32" /> :
            <p className="text-3xl font-bold text-destructive">₹{(summary?.totalPending || 0).toLocaleString("en-IN")}</p>}
        </div>
      </div>

      {loadingPayments ? (
        <div className="text-muted-foreground">Loading payments...</div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Mode</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium w-16">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments?.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4">{payment.paymentDate}</td>
                  <td className="p-4 font-medium">{payment.clientName}</td>
                  <td className="p-4 font-bold text-primary">₹{payment.amount.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium">{payment.mode}</span>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">{payment.installmentType}</td>
                  <td className="p-4">
                    <button onClick={() => setDeleteId(payment.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {!payments?.length && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No payments recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Client *</Label>
              <Select value={String(form.clientId || "")} onValueChange={v => setForm(f => ({ ...f, clientId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} placeholder="50000" />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={v => setForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Installment Type</Label>
                <Select value={form.installmentType} onValueChange={v => setForm(f => ({ ...f, installmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INSTALLMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending} className="flex-1">Record Payment</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Payment?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">This action cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteMut.isPending} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
