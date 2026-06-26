import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListShoots, useCreateShoot, useUpdateShoot, useDeleteShoot,
  useListClients,
  getListShootsQueryKey,
} from "@workspace/api-client-react";
import type { Shoot, ShootInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const SHOOT_TYPES = ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception", "Engagement", "Pre-Wedding", "Maternity", "Birthday", "Corporate"];

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-500/10 text-blue-400",
  Completed: "bg-green-500/10 text-green-400",
  Cancelled: "bg-destructive/10 text-destructive",
  Postponed: "bg-yellow-500/10 text-yellow-400",
};

const emptyForm = (): ShootInput => ({
  clientId: 0, shootDate: "", venue: "", shootTime: "", functions: [], specialInstructions: "",
});

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
    setForm({
      clientId: s.clientId, shootDate: s.shootDate, shootTime: s.shootTime || "",
      venue: s.venue || "", functions: s.functions || [],
      specialInstructions: s.specialInstructions || "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.clientId || !form.shootDate) {
      toast({ variant: "destructive", title: "Client and date are required." });
      return;
    }
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

  const toggleFunction = (fn: string) => {
    setForm(f => ({
      ...f,
      functions: f.functions?.includes(fn) ? f.functions.filter(x => x !== fn) : [...(f.functions || []), fn],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Shoots</h1>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Shoot</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading shoots...</div>
      ) : (
        <div className="grid gap-3">
          {shoots?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No shoots scheduled yet.</div>
          )}
          {shoots?.map((shoot) => (
            <div key={shoot.id} className="bg-card border border-border p-4 rounded-lg flex justify-between items-center">
              <div className="flex-1">
                <p className="font-semibold text-base">{shoot.clientName || "Unknown Client"}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {shoot.shootDate}{shoot.shootTime ? ` @ ${shoot.shootTime}` : ""}
                  {shoot.functions?.length ? ` • ${shoot.functions.join(", ")}` : ""}
                </p>
                {shoot.venue && <p className="text-sm text-muted-foreground">{shoot.venue}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[shoot.status] || "bg-muted text-muted-foreground"}`}>
                  {shoot.status}
                </span>
                <button onClick={() => openEdit(shoot)} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(shoot.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Shoot" : "Add Shoot"}</DialogTitle></DialogHeader>
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
                <Label>Date *</Label>
                <Input type="date" value={form.shootDate} onChange={e => setForm(f => ({ ...f, shootDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Time</Label>
                <Input type="time" value={form.shootTime || ""} onChange={e => setForm(f => ({ ...f, shootTime: e.target.value }))} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Venue</Label>
                <Input value={form.venue || ""} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Venue name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Shoot Type (Functions)</Label>
              <div className="flex flex-wrap gap-2">
                {SHOOT_TYPES.map(fn => (
                  <button key={fn} type="button" onClick={() => toggleFunction(fn)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.functions?.includes(fn)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary"
                    }`}>{fn}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Special Instructions</Label>
              <Input value={form.specialInstructions || ""} onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))} placeholder="Any special instructions..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1">
                {editing ? "Save Changes" : "Add Shoot"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Shoot?</DialogTitle></DialogHeader>
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
