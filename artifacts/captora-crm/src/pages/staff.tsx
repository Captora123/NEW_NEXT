import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListStaff, useCreateStaffMember, useUpdateStaffMember, useDeleteStaffMember,
  getListStaffQueryKey,
} from "@workspace/api-client-react";
import type { StaffMember, StaffInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const emptyForm = (): StaffInput => ({
  name: "", role: "", phone: "", monthlySalary: 0, joiningDate: "",
});

export default function Staff() {
  const qc = useQueryClient();
  const { data: staffList, isLoading } = useListStaff();
  const createMut = useCreateStaffMember();
  const updateMut = useUpdateStaffMember();
  const deleteMut = useDeleteStaffMember();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffInput>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListStaffQueryKey() });

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role, phone: s.phone, monthlySalary: s.monthlySalary, joiningDate: s.joiningDate });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.role) {
      toast({ variant: "destructive", title: "Name and role are required." });
      return;
    }
    const payload: StaffInput = { ...form, monthlySalary: Number(form.monthlySalary) };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: { name: payload.name, role: payload.role, monthlySalary: payload.monthlySalary, phone: payload.phone } }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Staff updated" }); },
        onError: () => toast({ variant: "destructive", title: "Update failed" }),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Staff member added" }); },
        onError: () => toast({ variant: "destructive", title: "Create failed" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Staff deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading staff...</div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Monthly Salary</th>
                <th className="p-4 font-medium">Joining Date</th>
                <th className="p-4 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffList?.map((staff) => (
                <tr key={staff.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">{staff.name}</td>
                  <td className="p-4 text-primary font-medium">{staff.role}</td>
                  <td className="p-4">{staff.phone || "—"}</td>
                  <td className="p-4 font-medium">₹{staff.monthlySalary.toLocaleString("en-IN")}</td>
                  <td className="p-4 text-muted-foreground">{staff.joiningDate || "—"}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(staff)} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(staff.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!staffList?.length && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No staff members added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <Label>Role *</Label>
                <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Lead Photographer" />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
              </div>
              <div className="space-y-1">
                <Label>Monthly Salary (₹)</Label>
                <Input type="number" value={form.monthlySalary || ""} onChange={e => setForm(f => ({ ...f, monthlySalary: Number(e.target.value) }))} placeholder="35000" />
              </div>
              <div className="space-y-1">
                <Label>Joining Date</Label>
                <Input type="date" value={form.joiningDate || ""} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1">
                {editing ? "Save Changes" : "Add Staff"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Staff Member?</DialogTitle></DialogHeader>
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
