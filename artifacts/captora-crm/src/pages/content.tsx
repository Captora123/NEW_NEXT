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
import { Plus, Trash2, ChevronRight } from "lucide-react";

const STATUSES = ["Idea", "Script Written", "Shot", "Editing", "Done"];
const TYPES = ["Reel", "Post", "Story", "YouTube", "Blog", "Ad"];

const STATUS_COLORS: Record<string, string> = {
  Idea: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Script Written": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Shot: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Editing: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Done: "bg-green-500/10 text-green-400 border-green-500/20",
};

const KANBAN_COLS = ["Idea", "Script Written", "Shot", "Editing", "Done"];

const emptyForm = (): ContentIdeaInput => ({
  title: "", type: "Reel", status: "Idea", assignedTo: "", dueDate: "",
});

export default function Content() {
  const qc = useQueryClient();
  const { data: ideas, isLoading } = useListContentIdeas();
  const createMut = useCreateContentIdea();
  const updateMut = useUpdateContentIdea();
  const deleteMut = useDeleteContentIdea();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContentIdeaInput>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListContentIdeasQueryKey() });

  const handleSave = () => {
    if (!form.title) { toast({ variant: "destructive", title: "Title is required." }); return; }
    createMut.mutate({ data: form }, {
      onSuccess: () => { invalidate(); setOpen(false); setForm(emptyForm()); toast({ title: "Idea added" }); },
      onError: () => toast({ variant: "destructive", title: "Failed to add idea" }),
    });
  };

  const advanceStatus = (idea: ContentIdea) => {
    const idx = KANBAN_COLS.indexOf(idea.status || "Idea");
    if (idx >= KANBAN_COLS.length - 1) return;
    const newStatus = KANBAN_COLS[idx + 1];
    updateMut.mutate({ id: idea.id, data: { title: idea.title, type: idea.type, status: newStatus, assignedTo: idea.assignedTo || "", dueDate: idea.dueDate || "" } }, {
      onSuccess: () => { invalidate(); toast({ title: `Moved to ${newStatus}` }); },
    });
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Idea deleted" }); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Content Planner</h1>
        <Button onClick={() => { setForm(emptyForm()); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Idea</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading content ideas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {KANBAN_COLS.map((col) => (
            <div key={col} className="bg-muted/20 border border-border rounded-lg p-3 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded border ${STATUS_COLORS[col]}`}>{col}</h2>
                <span className="text-xs text-muted-foreground">{ideas?.filter(i => i.status === col).length || 0}</span>
              </div>
              <div className="space-y-2">
                {ideas?.filter(i => (i.status || "Idea") === col).map(idea => (
                  <div key={idea.id} className="bg-card border border-border p-3 rounded-md shadow-sm group">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium text-sm leading-snug flex-1">{idea.title}</p>
                      <button onClick={() => setDeleteId(idea.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="px-1.5 py-0.5 bg-muted rounded text-xs">{idea.type}</span>
                      {col !== "Done" && (
                        <button onClick={() => advanceStatus(idea)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors">
                          Move <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {idea.assignedTo && <p className="text-xs text-muted-foreground mt-1.5">{idea.assignedTo}</p>}
                    {idea.dueDate && <p className="text-xs text-muted-foreground">Due: {idea.dueDate}</p>}
                  </div>
                ))}
                {!ideas?.filter(i => (i.status || "Idea") === col).length && (
                  <p className="text-xs text-muted-foreground text-center py-4">No ideas here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Content Idea</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Winter Wedding Highlights Reel" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status || "Idea"} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Assigned To</Label>
                <Input value={form.assignedTo || ""} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Team member name" />
              </div>
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate || ""} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending} className="flex-1">Add Idea</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Idea?</DialogTitle></DialogHeader>
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
