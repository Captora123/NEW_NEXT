import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFreelancers, useCreateFreelancer, useUpdateFreelancer, useDeleteFreelancer,
  getListFreelancersQueryKey,
} from "@workspace/api-client-react";
import type { Freelancer, FreelancerInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const emptyForm = (): FreelancerInput => ({
  name: "", role: "", phone: "", bankDetails: "", perShootRate: 0,
});

export default function Freelancers() {
  const qc = useQueryClient();
  const { data: freelancers, isLoading } = useListFreelancers();
  const createMut = useCreateFreelancer();
  const updateMut = useUpdateFreelancer();
  const deleteMut = useDeleteFreelancer();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Freelancer | null>(null);
  const [form, setForm] = useState<FreelancerInput>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListFreelancersQueryKey() });

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (f: Freelancer) => {
    setEditing(f);
    setForm({ name: f.name, role: f.role, phone: f.phone, bankDetails: f.bankDetails || "", perShootRate: f.perShootRate });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) { toast({ variant: "destructive", title: "Name and phone are required." }); return; }
    const payload = { ...form, perShootRate: Number(form.perShootRate) };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Freelancer updated" }); },
        onError: () => toast({ variant: "destructive", title: "Update failed" }),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Freelancer added" }); },
        onError: () => toast({ variant: "destructive", title: "Create failed" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Freelancer deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Freelancers</h1>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Freelancer</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading freelancers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {freelancers?.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">No freelancers added yet.</div>
          )}
          {freelancers?.map((freelancer) => (
            <div key={freelancer.id} className="bg-card border border-border p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                  <p className="text-sm text-primary font-medium">{freelancer.role}</p>
                  <p className="text-sm text-muted-foreground mt-1">{freelancer.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(freelancer)} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(freelancer.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="pt-4 border-t border-border grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Rate/Shoot</p>
                  <p className="font-medium text-primary">₹{freelancer.perShootRate.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Due</p>
                  <p className="font-medium text-destructive">₹{(freelancer.totalDue || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
              {freelancer.bankDetails && (
                <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">{freelancer.bankDetails}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Freelancer" : "Add Freelancer"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Candid Photographer" />
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
              </div>
              <div className="space-y-1">
                <Label>Rate per Shoot (₹)</Label>
                <Input type="number" value={form.perShootRate || ""} onChange={e => setForm(f => ({ ...f, perShootRate: Number(e.target.value) }))} placeholder="8000" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Bank Details</Label>
                <Input value={form.bankDetails || ""} onChange={e => setForm(f => ({ ...f, bankDetails: e.target.value }))} placeholder="Bank AC / UPI ID" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1">
                {editing ? "Save Changes" : "Add Freelancer"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Freelancer?</DialogTitle></DialogHeader>
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
