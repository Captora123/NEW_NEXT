import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListContentIdeas, useCreateContentIdea, useUpdateContentIdea, useDeleteContentIdea,
  getListContentIdeasQueryKey,
} from "@workspace/api-client-react";
import type { ContentIdea, ContentIdeaInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

const TYPES = ["Reel", "Post", "Story", "Blog", "YouTube", "BTS"];
const STATUSES = ["Idea", "Scripting", "Shooting", "Editing", "Done"];

const STATUS_COLORS: Record<string, string> = {
  Idea: "bg-slate-100 text-slate-600 border border-slate-200",
  Scripting: "bg-blue-50 text-blue-700 border border-blue-200",
  Shooting: "bg-amber-50 text-amber-700 border border-amber-200",
  Editing: "bg-purple-50 text-purple-700 border border-purple-200",
  Done: "bg-green-50 text-green-700 border border-green-200",
};

const TYPE_COLORS: Record<string, string> = {
  Reel: "bg-pink-50 text-pink-700",
  Post: "bg-blue-50 text-blue-700",
  Story: "bg-amber-50 text-amber-700",
  Blog: "bg-teal-50 text-teal-700",
  YouTube: "bg-red-50 text-red-700",
  BTS: "bg-purple-50 text-purple-700",
};

const emptyForm = (): ContentIdeaInput => ({ title: "", type: "Reel", status: "Idea", assignedTo: "", dueDate: "" });

export default function Content() {
  const qc = useQueryClient();
  const { data: ideas } = useListContentIdeas();
  const createMut = useCreateContentIdea();
  const updateMut = useUpdateContentIdea();
  const deleteMut = useDeleteContentIdea();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentIdea | null>(null);
  const [form, setForm] = useState<ContentIdeaInput>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListContentIdeasQueryKey() });

  const handleSave = () => {
    if (!form.title) { toast({ variant: "destructive", title: "Title is required." }); return; }
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form }, {
        onSuccess: () => { invalidate(); setOpen(false); toast({ title: "Idea updated" }); },
        onError: () => toast({ variant: "destructive", title: "Update failed" }),
      });
    } else {
      createMut.mutate({ data: form }, {
        onSuccess: () => { invalidate(); setOpen(false); setForm(emptyForm()); toast({ title: "Idea added" }); },
        onError: () => toast({ variant: "destructive", title: "Failed to add idea" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Idea deleted" }); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" }),
    });
  };

  const moveStatus = (idea: ContentIdea, newStatus: string) => {
    updateMut.mutate({ id: idea.id, data: { status: newStatus } }, { onSuccess: invalidate });
  };

  const byStatus = (status: string) => ideas?.filter(i => i.status === status) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Ideas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kanban board for social media planning</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm()); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#E0533C" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")} onMouseLeave={e => (e.currentTarget.style.background = "#E0533C")}>
          <Plus className="w-4 h-4" />Add Idea
        </button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {STATUSES.map(status => (
          <div key={status} className="bg-slate-100/70 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</span>
              <span className="text-xs text-slate-400 font-semibold">{byStatus(status).length}</span>
            </div>
            <div className="space-y-2 min-h-16">
              {byStatus(status).map(idea => (
                <div key={idea.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{idea.title}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[idea.type] || "bg-slate-100 text-slate-600"}`}>{idea.type}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(idea); setForm({ title: idea.title, type: idea.type, status: idea.status, assignedTo: idea.assignedTo || "", dueDate: idea.dueDate || "" }); setOpen(true); }}
                        className="p-1 rounded text-slate-300 hover:text-blue-500 transition-colors"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => setDeleteId(idea.id)} className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  {idea.assignedTo && <p className="text-xs text-slate-400 mt-1.5">→ {idea.assignedTo}</p>}
                  {/* Quick move */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {STATUSES.filter(s => s !== status).map(s => (
                      <button key={s} onClick={() => moveStatus(idea, s)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">→ {s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Idea" : "Add Content Idea"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Reel idea title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status || "Idea"} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Assigned To</Label><Input value={form.assignedTo || ""} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Team member" /></div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={form.dueDate || ""} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#E0533C" }}>
                {editing ? "Save Changes" : "Add Idea"}
              </button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Idea?</DialogTitle></DialogHeader>
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
