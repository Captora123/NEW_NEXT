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
import { ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, CheckCircle2, Circle, MessageCircle } from "lucide-react";

const STATUSES = ["Lead", "Quoted", "Advance Paid", "Confirmed", "Completed", "Cancelled"];
const STATUS_COLORS: Record<string, string> = {
  Lead: "bg-amber-50 text-amber-700 border border-amber-200",
  Quoted: "bg-blue-50 text-blue-700 border border-blue-200",
  "Advance Paid": "bg-purple-50 text-purple-700 border border-purple-200",
  Confirmed: "bg-orange-50 text-[#E0533C] border border-orange-200",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-600 border border-red-200",
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

  const { data: client, isLoading: loadingClient } = useGetClient(clientId, { query: { queryKey: clientQKey, enabled: !!clientId } });
  const { data: notes, isLoading: loadingNotes } = useListClientNotes(clientId, { query: { queryKey: notesQKey, enabled: !!clientId } });
  const { data: payments } = useListPayments({ clientId });
  const { data: deliverables } = useListDeliverables({ clientId });

  const addNoteMut = useAddClientNote();
  const updateStatusMut = useUpdateClientStatus();
  const [noteText, setNoteText] = useState("");

  const clientDeliverable = deliverables?.find(d => d.clientId === clientId);
  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const packageAmt = client?.packageAmount ?? 0;
  const pending = Math.max(0, packageAmt - totalPaid);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMut.mutate({ id: clientId, data: { content: noteText } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: notesQKey }); setNoteText(""); toast({ title: "Note added" }); },
      onError: () => toast({ variant: "destructive", title: "Failed to add note" }),
    });
  };

  const handleStatusChange = (status: string) => {
    updateStatusMut.mutate({ id: clientId, data: { status } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: clientQKey }); toast({ title: "Status updated" }); },
      onError: () => toast({ variant: "destructive", title: "Status update failed" }),
    });
  };

  if (loadingClient) return <div className="text-slate-400 p-8">Loading client details...</div>;
  if (!client) return <div className="p-8 text-slate-400">Client not found.</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <button className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#E0533C" }}>
              {client.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>
                {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
              </div>
            </div>
          </div>
        </div>
        <Select value={client.status} onValueChange={handleStatusChange}>
          <SelectTrigger className={`w-44 text-xs font-semibold h-9 ${STATUS_COLORS[client.status] || ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        {client.whatsapp && (
          <a href={`https://wa.me/91${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />WhatsApp
            </button>
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Event details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" />Wedding Date</p>
                <p className="font-semibold text-slate-800">{client.weddingDate || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />Venue</p>
                <p className="font-semibold text-slate-800">{client.venue || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">City</p>
                <p className="font-semibold text-slate-800">{client.city || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1"><IndianRupee className="w-3 h-3" />Package</p>
                <p className="font-bold text-lg" style={{ color: "#E0533C" }}>₹{packageAmt.toLocaleString("en-IN")}</p>
              </div>
              {client.functions?.length ? (
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Functions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.functions.map(fn => (
                      <span key={fn} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#E0533C] border border-orange-200">{fn}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Payment Summary</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Package</p>
                <p className="text-lg font-bold text-slate-800 mt-1">₹{packageAmt.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Paid</p>
                <p className="text-lg font-bold text-green-700 mt-1">₹{totalPaid.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-500 font-semibold uppercase tracking-wider">Pending</p>
                <p className="text-lg font-bold text-red-600 mt-1">₹{pending.toLocaleString("en-IN")}</p>
              </div>
            </div>
            {payments?.length ? (
              <div>
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 text-sm">
                    <span className="text-slate-500">{p.paymentDate} · {p.installmentType}</span>
                    <span className="font-bold text-green-700">₹{p.amount.toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-400">({p.mode})</span></span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">No payments recorded yet.</p>}
          </div>

          {/* Deliverables */}
          {clientDeliverable && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Deliverables</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DELIVERABLE_FIELDS.map(({ key, label }) => {
                  const done = !!clientDeliverable[key];
                  return (
                    <div key={key} className={`flex items-center gap-2 p-3 rounded-xl text-sm ${done ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-400"}`}>
                      {done ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" /> : <Circle className="w-4 h-4 flex-shrink-0 text-slate-300" />}
                      <span className="font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-4">
            <h2 className="text-base font-bold text-slate-900 mb-4">Notes</h2>
            <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
              {loadingNotes ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : notes?.length ? (
                [...notes].reverse().map(note => (
                  <div key={note.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed">{note.content}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No notes yet.</p>
              )}
            </div>
            <div className="space-y-2">
              <Input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..."
                onKeyDown={e => { if (e.key === "Enter") handleAddNote(); }}
                className="bg-slate-50 border-slate-200 text-slate-700" />
              <button onClick={handleAddNote} disabled={addNoteMut.isPending || !noteText.trim()}
                className="w-full py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "#E0533C" }}>
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
