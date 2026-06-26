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

const DELIVERABLE_FIELDS: { key: DeliverableKey; label: string }[] = [
  { key: "editedPhotos", label: "Edited Photos" },
  { key: "rawDataCopied", label: "Raw Data Copied" },
  { key: "cinematicHighlight", label: "Cinematic Highlight" },
  { key: "traditionalVideo", label: "Traditional Video" },
  { key: "instagramReels", label: "Instagram Reels" },
  { key: "albumOrdered", label: "Album Ordered" },
  { key: "albumDelivered", label: "Album Delivered" },
  { key: "magazineDelivered", label: "Magazine Delivered" },
  { key: "photoFrameDelivered", label: "Photo Frame Delivered" },
];

const STATUS_OPTIONS = ["Pending", "In Progress", "Delivered", "Revision Requested"];
const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/10 text-yellow-400",
  "In Progress": "bg-blue-500/10 text-blue-400",
  Delivered: "bg-green-500/10 text-green-400",
  "Revision Requested": "bg-destructive/10 text-destructive",
};

export default function Deliverables() {
  const qc = useQueryClient();
  const { data: deliverables, isLoading } = useListDeliverables();
  const { data: clients } = useListClients();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [newClientId, setNewClientId] = useState("");

  const upsertMut = useUpsertClientDeliverables();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListDeliverablesQueryKey() });

  const getClientName = (clientId: number) =>
    clients?.find(c => c.id === clientId)?.name || `Client #${clientId}`;

  const updateField = (deliv: Deliverable, field: DeliverableKey, value: boolean) => {
    upsertMut.mutate({ clientId: deliv.clientId, data: { [field]: value } }, {
      onSuccess: () => invalidate(),
      onError: () => toast({ variant: "destructive", title: "Update failed" }),
    });
  };

  const updateStatus = (deliv: Deliverable, status: string) => {
    upsertMut.mutate({ clientId: deliv.clientId, data: { status } }, {
      onSuccess: () => invalidate(),
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

  const existingClientIds = new Set(deliverables?.map(d => d.clientId));
  const availableClients = clients?.filter(c => !existingClientIds.has(c.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Deliverables Tracker</h1>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Client</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading deliverables...</div>
      ) : (
        <div className="grid gap-4">
          {!deliverables?.length && (
            <div className="text-center py-12 text-muted-foreground">No deliverables tracked yet. Add a client to get started.</div>
          )}
          {deliverables?.map((deliv) => (
            <div key={deliv.id} className="bg-card border border-border p-6 rounded-lg">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-lg">{getClientName(deliv.clientId)}</h3>
                <Select value={deliv.status || "Pending"} onValueChange={v => updateStatus(deliv, v)}>
                  <SelectTrigger className={`w-44 text-xs font-medium ${STATUS_COLORS[deliv.status || "Pending"]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DELIVERABLE_FIELDS.map(({ key, label }) => {
                  const done = !!deliv[key];
                  return (
                    <button
                      key={key}
                      onClick={() => updateField(deliv, key, !done)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-sm font-medium ${
                        done
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {done
                        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-400" />
                        : <Circle className="w-4 h-4 flex-shrink-0" />
                      }
                      {label}
                    </button>
                  );
                })}
              </div>
              {deliv.completedAt && (
                <p className="mt-4 text-sm text-muted-foreground">Completed: {new Date(deliv.completedAt).toLocaleDateString("en-IN")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Track Deliverables For Client</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={newClientId} onValueChange={setNewClientId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {availableClients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                {!availableClients?.length && <SelectItem value="none" disabled>All clients already tracked</SelectItem>}
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button onClick={createDeliverable} disabled={!newClientId || newClientId === "none" || upsertMut.isPending} className="flex-1">Add</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
