import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useListClients, useCreateClient, useUpdateClient, useDeleteClient,
  getListClientsQueryKey,
} from "@workspace/api-client-react";
import type { Client, ClientInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

const STATUSES = ["Lead", "Quoted", "Advance Paid", "Confirmed", "Completed", "Cancelled"];
const FUNCTIONS = ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception", "Engagement", "Ring Ceremony"];

const STATUS_COLORS: Record<string, string> = {
  Lead: "bg-yellow-500/10 text-yellow-400",
  Quoted: "bg-blue-500/10 text-blue-400",
  "Advance Paid": "bg-purple-500/10 text-purple-400",
  Confirmed: "bg-primary/10 text-primary",
  Completed: "bg-green-500/10 text-green-400",
  Cancelled: "bg-destructive/10 text-destructive",
};

const emptyForm = (): ClientInput => ({
  name: "", phone: "", status: "Lead",
  whatsapp: "", email: "", weddingDate: "",
  venue: "", city: "", functions: [], packageAmount: 0,
});

export default function Clients() {
  const qc = useQueryClient();
  const { data: clients, isLoading } = useListClients();
  const createMut = useCreateClient();
  const updateMut = useUpdateClient();
  const deleteMut = useDeleteClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientInput>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListClientsQueryKey() });

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name, phone: c.phone, status: c.status,
      whatsapp: c.whatsapp || "", email: c.email || "",
      weddingDate: c.weddingDate || "", venue: c.venue || "",
      city: c.city || "", functions: c.functions || [],
      packageAmount: c.packageAmount || 0,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) { toast({ variant: "destructive", title: "Name and phone are required." }); return; }
    const payload = { ...form, packageAmount: Number(form.packageAmount) };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Client updated" }); },
        onError: () => toast({ variant: "destructive", title: "Update failed" }),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Client added" }); },
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

  const toggleFunction = (fn: string) => {
    setForm(f => ({
      ...f,
      functions: f.functions?.includes(fn) ? f.functions.filter(x => x !== fn) : [...(f.functions || []), fn],
    }));
  };

  const filtered = clients?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <div className="flex gap-3">
          <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Client</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading clients...</div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Wedding Date</th>
                <th className="p-4 font-medium">Package</th>
                <th className="p-4 font-medium">City</th>
                <th className="p-4 font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">{client.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[client.status] || "bg-muted text-muted-foreground"}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4">{client.phone}</td>
                  <td className="p-4">{client.weddingDate || "—"}</td>
                  <td className="p-4 font-medium text-primary">
                    {client.packageAmount ? `₹${client.packageAmount.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="p-4">{client.city || "—"}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link href={`/clients/${client.id}`}>
                        <button className="p-1 text-muted-foreground hover:text-foreground"><Eye className="w-4 h-4" /></button>
                      </Link>
                      <button onClick={() => openEdit(client)} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(client.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bride & Groom name" />
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp || ""} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="9876543210" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Email</Label>
                <Input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Package Amount (₹)</Label>
                <Input type="number" value={form.packageAmount || ""} onChange={e => setForm(f => ({ ...f, packageAmount: Number(e.target.value) }))} placeholder="250000" />
              </div>
              <div className="space-y-1">
                <Label>Wedding Date</Label>
                <Input type="date" value={form.weddingDate || ""} onChange={e => setForm(f => ({ ...f, weddingDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={form.city || ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Lucknow" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Venue</Label>
                <Input value={form.venue || ""} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Hotel/Venue name" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Functions</Label>
                <div className="flex flex-wrap gap-2">
                  {FUNCTIONS.map(fn => (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => toggleFunction(fn)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.functions?.includes(fn)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:border-primary"
                      }`}
                    >{fn}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1">
                {editing ? "Save Changes" : "Add Client"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Client?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">This will permanently delete the client and all associated data. This cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteMut.isPending} className="flex-1">Delete</Button>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
