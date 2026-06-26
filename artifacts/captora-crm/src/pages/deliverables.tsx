import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDeliverables, useListClients, useUpsertClientDeliverables,
  getListDeliverablesQueryKey,
} from "@workspace/api-client-react";
import type { Deliverable } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Plus } from "lucide-react";

type DeliverableKey = keyof Pick<Deliverable,
  "editedPhotos" | "cinematicHighlight" | "traditionalVideo" | "instagramReels" |
  "albumOrdered" | "albumDelivered" | "rawDataCopied" | "magazineDelivered" | "photoFrameDelivered"
>;

const FIELDS: { key: DeliverableKey; label: string }[] = [
  { key: "editedPhotos", label: "Edited Photos" },
  { key: "rawDataCopied", label: "Raw Data Copied" },
  { key: "cinematicHighlight", label: "Cinematic Highlight" },
  { key: "traditionalVideo", label: "Traditional Video" },
  { key: "instagramReels", label: "Instagram Reels" },
  { key: "albumOrdered", label: "Album Ordered" },
  { key: "albumDelivered", label: "Album Delivered" },
  { key: "magazineDelivered", label: "Magazine Delivered" },
  { key: "photoFrameDelivered", label: "Photo Frame" },
];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
  Delivered: "bg-green-50 text-green-700 border border-green-200",
  "Revision Requested": "bg-red-50 text-red-600 border border-red-200",
};
const STATUS_OPTIONS = Object.keys(STATUS_COLORS);

export default function Deliverables() {
  const qc = useQueryClient();
  const { data: deliverables, isLoading } = useListDeliverables();
  const { data: clients } = useListClients();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const upsertMut = useUpsertClientDeliverables();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListDeliverablesQueryKey() });
  const getClientName = (id: number) => clients?.find(c => c.id === id)?.name || `Client #${id}`;

  const updateField = (d: Deliverable, field: DeliverableKey, value: boolean) => {
    upsertMut.mutate({ clientId: d.clientId, data: { [field]: value } }, {
      onSuccess: invalidate,
      onError: () => toast({ variant: "destructive", title: "Update failed" }),
    });
  };

  const updateStatus = (d: Deliverable, status: string) => {
    upsertMut.mutate({ clientId: d.clientId, data: { status } }, {
      onSuccess: invalidate,
      onError: () => toast({ variant: "destructive", title: "Status update failed" }),
    });
  };

  const createDeliverable = () => {
    if (!newClientId) return;
    upsertMut.mutate({ clientId: Number(newClientId), data: {} }, {
      onSuccess: () => { invalidate(); setOpen(false); setNewClientId(""); toast({ title: "Deliverables tracker created" }); },
      onError: () => toast({ variant: "destructive", title: "Failed to create" }),
    });
  };

  const existingIds = new Set(deliverables?.map(d => d.clientId));
  const availableClients = clients?.filter(c => !existingIds.has(c.id));

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deliverables</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track delivery status per client</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#E0533C" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")} onMouseLeave={e => (e.currentTarget.style.background = "#E0533C")}>
          <Plus className="w-4 h-4" />Track Client
        </button>
      </div>

      {isLoading ? <div className="text-slate-400 text-sm">Loading...</div> : (
        <div className="grid gap-4">
          {!deliverables?.length && (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
              <p className="font-medium">No deliverables tracked yet.</p>
              <p className="text-sm mt-1">Add a client to start tracking.</p>
            </div>
          )}
          {deliverables?.map((d) => {
            const doneCount = FIELDS.filter(f => !!d[f.key]).length;
            const pct = Math.round((doneCount / FIELDS.length) * 100);
            return (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{getClientName(d.clientId)}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{doneCount}/{FIELDS.length} delivered · {pct}% complete</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress bar */}
                    <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#16A34A" : "#E0533C" }} />
                    </div>
                    <Select value={d.status || "Pending"} onValueChange={v => updateStatus(d, v)}>
                      <SelectTrigger className={`w-40 text-xs font-semibold h-8 ${STATUS_COLORS[d.status || "Pending"]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FIELDS.map(({ key, label }) => {
                    const done = !!d[key];
                    return (
                      <button key={key} onClick={() => updateField(d, key, !done)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                          done
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                        }`}>
                        {done ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" /> : <Circle className="w-4 h-4 flex-shrink-0 text-slate-300" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
                {d.completedAt && (
                  <p className="mt-4 text-xs text-slate-400">Completed: {new Date(d.completedAt).toLocaleDateString("en-IN")}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Track Deliverables</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={newClientId} onValueChange={setNewClientId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {availableClients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                {!availableClients?.length && <SelectItem value="none" disabled>All clients already tracked</SelectItem>}
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <button onClick={createDeliverable} disabled={!newClientId || newClientId === "none" || upsertMut.isPending}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60" style={{ background: "#E0533C" }}>Add</button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
