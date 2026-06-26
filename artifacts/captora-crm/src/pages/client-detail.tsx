import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetClient, useListClientNotes, useAddClientNote, useUpdateClientStatus,
  useListPayments, useListDeliverables,
  getListClientNotesQueryKey, getGetClientQueryKey,
} from "@workspace/api-client-react";
import type { Deliverable } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, CheckCircle2, Circle } from "lucide-react";

const STATUSES = ["Lead", "Quoted", "Advance Paid", "Confirmed", "Completed", "Cancelled"];
const STATUS_COLORS: Record<string, string> = {
  Lead: "bg-yellow-500/10 text-yellow-400",
  Quoted: "bg-blue-500/10 text-blue-400",
  "Advance Paid": "bg-purple-500/10 text-purple-400",
  Confirmed: "bg-primary/10 text-primary",
  Completed: "bg-green-500/10 text-green-400",
  Cancelled: "bg-destructive/10 text-destructive",
};

type DeliverableKey = keyof Pick<Deliverable,
  "editedPhotos" | "cinematicHighlight" | "traditionalVideo" | "instagramReels" |
  "albumOrdered" | "albumDelivered" | "rawDataCopied"
>;

const DELIVERABLE_FIELDS: { key: DeliverableKey; label: string }[] = [
  { key: "editedPhotos", label: "Edited Photos" },
  { key: "rawDataCopied", label: "Raw Data" },
  { key: "cinematicHighlight", label: "Cinematic Highlight" },
  { key: "traditionalVideo", label: "Traditional Video" },
  { key: "instagramReels", label: "Instagram Reels" },
  { key: "albumOrdered", label: "Album Ordered" },
  { key: "albumDelivered", label: "Album Delivered" },
];

export default function ClientDetail() {
  const params = useParams();
  const clientId = parseInt(params.id || "0", 10);
  const qc = useQueryClient();
  const { toast } = useToast();

  const clientQKey = getGetClientQueryKey(clientId);
  const notesQKey = getListClientNotesQueryKey(clientId);

  const { data: client, isLoading: loadingClient } = useGetClient(clientId, {
    query: { queryKey: clientQKey, enabled: !!clientId }
  });
  const { data: notes, isLoading: loadingNotes } = useListClientNotes(clientId, {
    query: { queryKey: notesQKey, enabled: !!clientId }
  });
  const { data: payments } = useListPayments({ clientId });
  const { data: deliverables } = useListDeliverables({ clientId });

  const addNoteMut = useAddClientNote();
  const updateStatusMut = useUpdateClientStatus();

  const [noteText, setNoteText] = useState("");

  const clientDeliverable = deliverables?.find(d => d.clientId === clientId);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMut.mutate({ id: clientId, data: { content: noteText } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: notesQKey });
        setNoteText("");
        toast({ title: "Note added" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to add note" }),
    });
  };

  const handleStatusChange = (status: string) => {
    updateStatusMut.mutate({ id: clientId, data: { status } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: clientQKey });
        toast({ title: "Status updated" });
      },
      onError: () => toast({ variant: "destructive", title: "Status update failed" }),
    });
  };

  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const packageAmt = client?.packageAmount ?? 0;
  const pending = packageAmt - totalPaid;

  if (loadingClient) return <div className="text-muted-foreground p-8">Loading client details...</div>;
  if (!client) return <div className="p-8 text-muted-foreground">Client not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>
            {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
          </div>
        </div>
        <Select value={client.status} onValueChange={handleStatusChange}>
          <SelectTrigger className={`w-44 text-xs font-medium ${STATUS_COLORS[client.status] || ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" />Wedding Date</p>
                <p className="font-medium">{client.weddingDate || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />Venue</p>
                <p className="font-medium">{client.venue || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">City</p>
                <p className="font-medium">{client.city || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1 mb-1"><IndianRupee className="w-3 h-3" />Package</p>
                <p className="font-medium text-primary">₹{packageAmt.toLocaleString("en-IN")}</p>
              </div>
              {client.functions?.length ? (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-2">Functions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.functions.map(fn => (
                      <span key={fn} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{fn}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Package</p>
                <p className="font-bold text-base">₹{packageAmt.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <p className="text-muted-foreground">Paid</p>
                <p className="font-bold text-base text-green-400">₹{totalPaid.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <p className="text-muted-foreground">Pending</p>
                <p className="font-bold text-base text-destructive">₹{Math.max(0, pending).toLocaleString("en-IN")}</p>
              </div>
            </div>
            {payments?.length ? (
              <div className="divide-y divide-border">
                {payments.map(p => (
                  <div key={p.id} className="py-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">{p.paymentDate} — {p.installmentType}</span>
                    <span className="font-medium text-primary">₹{p.amount.toLocaleString("en-IN")} <span className="text-muted-foreground font-normal text-xs">({p.mode})</span></span>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm">No payments recorded yet.</p>}
          </div>

          {clientDeliverable && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Deliverables</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {DELIVERABLE_FIELDS.map(({ key, label }) => {
                  const done = !!clientDeliverable[key];
                  return (
                    <div key={key} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${done ? "text-green-400" : "text-muted-foreground"}`}>
                      {done ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <Circle className="w-4 h-4 flex-shrink-0" />}
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {loadingNotes ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
              ) : notes?.length ? (
                [...notes].reverse().map(note => (
                  <div key={note.id} className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}
            </div>
            <div className="space-y-2">
              <Input
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note..."
                onKeyDown={e => { if (e.key === "Enter") handleAddNote(); }}
              />
              <Button onClick={handleAddNote} disabled={addNoteMut.isPending || !noteText.trim()} className="w-full" size="sm">
                Add Note
              </Button>
            </div>
          </div>

          {client.whatsapp && (
            <a
              href={`https://wa.me/91${client.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full gap-2">
                <Phone className="w-4 h-4" />
                WhatsApp
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
