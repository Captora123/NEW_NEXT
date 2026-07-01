"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListClients, useCreateClient, useUpdateClient, useDeleteClient,
  useCreatePayment, getListClientsQueryKey,
} from "@workspace/api-client-react";
import type { Client, ClientInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/lib/studio-context";
import { Plus, Pencil, Trash2, Search, ExternalLink, Phone, ChevronRight } from "lucide-react";

const STATUSES = ["Lead", "Quoted", "Advance Paid", "Confirmed", "Completed", "Cancelled"];
const STATUS_COLORS: Record<string, string> = {
  Lead: "bg-amber-50 text-amber-700 border border-amber-200",
  Quoted: "bg-blue-50 text-blue-700 border border-blue-200",
  "Advance Paid": "bg-purple-50 text-purple-700 border border-purple-200",
  Confirmed: "bg-orange-50 text-[#E0533C] border border-orange-200",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
};

const emptyForm = (): ClientInput => ({
  name: "", phone: "", email: "", city: "", venue: "", weddingDate: "",
  packageAmount: 0, status: "Lead", functions: [], whatsapp: "",
});

export default function Clients() {
  const qc = useQueryClient();
  const { data: clients, isLoading } = useListClients();
  const createMut = useCreateClient();
  const updateMut = useUpdateClient();
  const deleteMut = useDeleteClient();
  const { toast } = useToast();
  const { config, theme } = useStudio();
  const ACCENT = theme.accent;
  const categories = config.serviceCategories;
  const createPaymentMut = useCreatePayment();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientInput>(emptyForm());
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListClientsQueryKey() });
  const openAdd = () => { setEditing(null); setForm(emptyForm()); setAdvancePayment(0); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email || "", city: c.city || "", venue: c.venue || "", weddingDate: c.weddingDate || "", packageAmount: c.packageAmount ?? 0, status: c.status, functions: c.functions || [], whatsapp: c.whatsapp || "" });
    setOpen(true);
  };
  const today = new Date().toISOString().split("T")[0];

  const handleSave = () => {
    if (!form.name) { toast({ variant: "destructive", title: "Client name is required." }); return; }
    const payload = { ...form, packageAmount: Number(form.packageAmount) };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Client updated" }); },
        onError: () => toast({ variant: "destructive", title: "Update failed" }),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onSuccess: (created) => {
          invalidate(); setOpen(false);
          if (advancePayment > 0 && created?.id) {
            createPaymentMut.mutate({ data: { clientId: created.id, amount: advancePayment, paymentDate: today, installmentType: "Advance", mode: "Cash", notes: "Advance payment at booking" } }, {
              onSuccess: () => { invalidate(); toast({ title: `Client added · Advance ₹${advancePayment.toLocaleString("en-IN")} recorded` }); },
              onError: () => toast({ title: "Client added (advance payment failed)", variant: "destructive" }),
            });
          } else { toast({ title: "Client added" }); }
        },
        onError: () => toast({ variant: "destructive", title: "Create failed" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Client deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  const toggleCategory = (cat: string) =>
    setForm(f => ({ ...f, functions: f.functions?.includes(cat) ? f.functions.filter(x => x !== cat) : [...(f.functions || []), cat] }));

  const filtered = clients?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || (c.city || "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients?.length ?? 0} total clients</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: ACCENT }}>
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Client</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, city..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all" />
      </div>

      {isLoading ? <div className="text-slate-400 text-sm py-8">Loading clients...</div> : (
        <>
          <div className="sm:hidden space-y-2">
            {filtered.map(client => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: ACCENT }}>{client.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-slate-900 truncate">{client.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_COLORS[client.status] || "bg-slate-100 text-slate-600"}`}>{client.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                      {client.weddingDate && <span>{client.weddingDate}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="font-semibold text-slate-700">₹{(client.packageAmount ?? 0).toLocaleString("en-IN")}</span>
                      {(client.totalPending ?? 0) > 0 && <span className="text-red-500">₹{(client.totalPending ?? 0).toLocaleString("en-IN")} due</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={e => { e.preventDefault(); openEdit(client); }} className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={e => { e.preventDefault(); setDeleteId(client.id); }} className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    <ChevronRight className="w-4 h-4 text-slate-200" />
                  </div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">No clients found.</div>}
          </div>

          <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Client", "Phone", "Event Date", "Package", "Pending", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr key={client.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/clients/${client.id}`}>
                        <div className="flex items-center gap-3 cursor-pointer group">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: ACCENT }}>{client.name[0]}</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 group-hover:underline">{client.name}</p>
                            <p className="text-xs text-slate-400">{client.city || "—"}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600"><div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{client.phone || "—"}</div></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{client.weddingDate || "—"}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">₹{(client.packageAmount ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-red-600">₹{(client.totalPending ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[client.status] || "bg-slate-100 text-slate-600"}`}>{client.status}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/clients/${client.id}`}><button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><ExternalLink className="w-4 h-4" /></button></Link>
                        <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(client.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">No clients found.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-3">
          <DialogHeader><DialogTitle>{editing ? "Edit Client" : "Add New Client"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2"><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Client's full name" /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={form.whatsapp || ""} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city || ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Lucknow" /></div>
              <div className="space-y-1.5"><Label>Venue</Label><Input value={form.venue || ""} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Event Date</Label><Input type="date" value={form.weddingDate || ""} onChange={e => setForm(f => ({ ...f, weddingDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Package Amount (₹)</Label><Input type="number" value={form.packageAmount || ""} onChange={e => setForm(f => ({ ...f, packageAmount: Number(e.target.value) }))} /></div>
              {!editing && (
                <div className="space-y-1.5">
                  <Label>Advance Received (₹)</Label>
                  <Input type="number" value={advancePayment || ""} onChange={e => setAdvancePayment(Number(e.target.value))} placeholder="optional" />
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Service Categories</Label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {categories.map(cat => (
                    <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                      style={form.functions?.includes(cat) ? { borderColor: ACCENT, background: `${ACCENT}18`, color: ACCENT } : { borderColor: "#E2E8F0", color: "#64748B" }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: ACCENT }}>
                {editing ? "Save Changes" : "Add Client"}
              </button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm mx-3">
          <DialogHeader><DialogTitle>Delete Client?</DialogTitle></DialogHeader>
          <p className="text-slate-500 text-sm">This will permanently delete the client and all associated data.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteMut.isPending} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
