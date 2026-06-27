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

const emptyForm = (): StaffInput => ({ name: "", role: "", phone: "", monthlySalary: 0, joiningDate: "" });

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
    if (!form.name || !form.role) { toast({ variant: "destructive", title: "Name and role are required." }); return; }
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

  const totalSalary = staffList?.reduce((s, m) => s + m.monthlySalary, 0) ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
          <p className="text-slate-500 text-sm mt-0.5">{staffList?.length ?? 0} team members · Monthly payroll ₹{totalSalary.toLocaleString("en-IN")}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#E0533C" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")} onMouseLeave={e => (e.currentTarget.style.background = "#E0533C")}>
          <Plus className="w-4 h-4" />Add Staff
        </button>
      </div>

      {isLoading ? <div className="text-slate-400 text-sm">Loading...</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Salary</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Joined</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList?.map((staff) => (
                <tr key={staff.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#E0533C" }}>
                        {staff.name[0]}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{staff.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#E0533C] border border-orange-200">{staff.role}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{staff.phone || "—"}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">₹{staff.monthlySalary.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{staff.joiningDate || "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(staff)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(staff.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!staffList?.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">No staff members added yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
              <div className="space-y-1.5"><Label>Role *</Label><Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Lead Photographer" /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" /></div>
              <div className="space-y-1.5"><Label>Monthly Salary (₹)</Label><Input type="number" value={form.monthlySalary || ""} onChange={e => setForm(f => ({ ...f, monthlySalary: Number(e.target.value) }))} placeholder="35000" /></div>
              <div className="space-y-1.5"><Label>Joining Date</Label><Input type="date" value={form.joiningDate || ""} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#E0533C" }}>
                {editing ? "Save Changes" : "Add Staff"}
              </button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Staff Member?</DialogTitle></DialogHeader>
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
