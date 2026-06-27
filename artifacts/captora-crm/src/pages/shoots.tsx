import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListShoots, useCreateShoot, useUpdateShoot, useDeleteShoot, useListClients,
  getListShootsQueryKey,
} from "@workspace/api-client-react";
import type { Shoot, ShootInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Camera, MapPin, Clock } from "lucide-react";

const SHOOT_TYPES = ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception", "Engagement", "Pre-Wedding", "Maternity", "Birthday", "Corporate"];
const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
  Postponed: "bg-amber-50 text-amber-700 border border-amber-200",
};

const emptyForm = (): ShootInput => ({ clientId: 0, shootDate: "", venue: "", shootTime: "", functions: [], specialInstructions: "" });

export default function Shoots() {
  const qc = useQueryClient();
  const { data: shoots, isLoading } = useListShoots();
  const { data: clients } = useListClients();
  const createMut = useCreateShoot();
  const updateMut = useUpdateShoot();
  const deleteMut = useDeleteShoot();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shoot | null>(null);
  const [form, setForm] = useState<ShootInput>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListShootsQueryKey() });

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (s: Shoot) => {
    setEditing(s);
    setForm({ clientId: s.clientId, shootDate: s.shootDate, shootTime: s.shootTime || "", venue: s.venue || "", functions: s.functions || [], specialInstructions: s.specialInstructions || "" });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.clientId || !form.shootDate) { toast({ variant: "destructive", title: "Client and date are required." }); return; }
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Shoot updated" }); },
        onError: () => toast({ variant: "destructive", title: "Update failed" }),
      });
    } else {
      createMut.mutate({ data: form }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Shoot added" }); },
        onError: () => toast({ variant: "destructive", title: "Create failed" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Shoot deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  const toggleFunction = (fn: string) =>
    setForm(f => ({ ...f, functions: f.functions?.includes(fn) ? f.functions.filter(x => x !== fn) : [...(f.functions || []), fn] }));

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shoots</h1>
          <p className="text-slate-500 text-sm mt-0.5">{shoots?.length ?? 0} shoots scheduled</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#E0533C" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")} onMouseLeave={e => (e.currentTarget.style.background = "#E0533C")}>
          <Plus className="w-4 h-4" />Schedule Shoot
        </button>
      </div>

      {isLoading ? <div className="text-slate-400 text-sm">Loading shoots...</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Client</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Date & Time</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Venue</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Functions</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shoots?.map((shoot) => (
                <tr key={shoot.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FFF1F0" }}>
                        <Camera className="w-3.5 h-3.5" style={{ color: "#E0533C" }} />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{shoot.clientName || `Shoot #${shoot.id}`}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700">{shoot.shootDate}</p>
                    {shoot.shootTime && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{shoot.shootTime}</p>}
                  </td>
                  <td className="px-5 py-4">
                    {shoot.venue ? <p className="text-sm text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{shoot.venue}</p> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {shoot.functions?.map(fn => (
                        <span key={fn} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#E0533C] border border-orange-200">{fn}</span>
                      ))}
                      {!shoot.functions?.length && <span className="text-slate-300 text-sm">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[shoot.status] || "bg-slate-100 text-slate-600"}`}>{shoot.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(shoot)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(shoot.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!shoots?.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">No shoots scheduled yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Shoot" : "Schedule Shoot"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={String(form.clientId || "")} onValueChange={v => setForm(f => ({ ...f, clientId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.shootDate} onChange={e => setForm(f => ({ ...f, shootDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={form.shootTime || ""} onChange={e => setForm(f => ({ ...f, shootTime: e.target.value }))} /></div>
              <div className="space-y-1.5 col-span-2"><Label>Venue</Label><Input value={form.venue || ""} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Venue name" /></div>
            </div>
            <div className="space-y-2">
              <Label>Functions</Label>
              <div className="flex flex-wrap gap-2">
                {SHOOT_TYPES.map(fn => (
                  <button key={fn} type="button" onClick={() => toggleFunction(fn)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.functions?.includes(fn) ? "border-[#E0533C] bg-orange-50 text-[#E0533C]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                    {fn}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Special Instructions</Label><Input value={form.specialInstructions || ""} onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))} placeholder="Any special instructions..." /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#E0533C" }}>
                {editing ? "Save Changes" : "Schedule Shoot"}
              </button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Shoot?</DialogTitle></DialogHeader>
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
