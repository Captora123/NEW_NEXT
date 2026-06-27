import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetClient, useListClientNotes, useAddClientNote, useUpdateClientStatus,
  useListPayments, useListDeliverables,
  useListClientFreelancers, useAddClientFreelancer, useRemoveClientFreelancer, useUpdateClientProjectExpenses,
  useListFreelancers,
  getListClientNotesQueryKey, getGetClientQueryKey, getListClientFreelancersQueryKey,
} from "@workspace/api-client-react";
import type { Deliverable, ClientFreelancerAssignment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee,
  CheckCircle2, Circle, MessageCircle, Plus, Trash2,
  TrendingUp, TrendingDown, UserCheck,
} from "lucide-react";

const CORAL = "#E0533C";
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

function fmt(v: number) { return "₹" + Math.round(v).toLocaleString("en-IN"); }

export default function ClientDetail() {
  const params = useParams();
  const clientId = parseInt(params.id || "0", 10);
  const qc = useQueryClient();
  const { toast } = useToast();

  const clientQKey = getGetClientQueryKey(clientId);
  const notesQKey = getListClientNotesQueryKey(clientId);
  const freelancersQKey = getListClientFreelancersQueryKey(clientId);

  const { data: client, isLoading: loadingClient } = useGetClient(clientId, { query: { queryKey: clientQKey, enabled: !!clientId } });
  const { data: notes, isLoading: loadingNotes } = useListClientNotes(clientId, { query: { queryKey: notesQKey, enabled: !!clientId } });
  const { data: payments } = useListPayments({ clientId });
  const { data: deliverables } = useListDeliverables({ clientId });
  const { data: assignments } = useListClientFreelancers(clientId, { query: { queryKey: freelancersQKey, enabled: !!clientId } });
  const { data: allFreelancers } = useListFreelancers();

  const addNoteMut = useAddClientNote();
  const updateStatusMut = useUpdateClientStatus();
  const addAssignmentMut = useAddClientFreelancer();
  const removeAssignmentMut = useRemoveClientFreelancer();
  const updateExpensesMut = useUpdateClientProjectExpenses();

  const [noteText, setNoteText] = useState("");

  // Freelancer assignment form
  const [addFLOpen, setAddFLOpen] = useState(false);
  const [flForm, setFlForm] = useState({ freelancerId: 0, functionName: "", rateForShoot: 0, notes: "" });
  const [deleteAssignId, setDeleteAssignId] = useState<number | null>(null);

  // Project expenses edit
  const [expOpen, setExpOpen] = useState(false);
  const [expForm, setExpForm] = useState({ albumCost: 0, miscExpenses: 0 });

  const clientDeliverable = deliverables?.find(d => d.clientId === clientId);
  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const packageAmt = client?.packageAmount ?? 0;
  const pending = Math.max(0, packageAmt - totalPaid);
  const freelancerSpend = assignments?.reduce((s, a) => s + a.rateForShoot, 0) ?? 0;
  const albumCost = client?.albumCost ?? 0;
  const miscExpenses = client?.miscExpenses ?? 0;
  const totalCosts = freelancerSpend + albumCost + miscExpenses;
  const netProfit = packageAmt - totalCosts;

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

  const handleAddAssignment = () => {
    if (!flForm.freelancerId || !flForm.functionName) {
      toast({ variant: "destructive", title: "Freelancer and function are required." }); return;
    }
    addAssignmentMut.mutate({ id: clientId, data: { ...flForm, rateForShoot: Number(flForm.rateForShoot) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: freelancersQKey });
        setAddFLOpen(false);
        setFlForm({ freelancerId: 0, functionName: "", rateForShoot: 0, notes: "" });
        toast({ title: "Freelancer assigned ✓" });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to assign freelancer" }),
    });
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    removeAssignmentMut.mutate({ id: clientId, assignmentId }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: freelancersQKey }); setDeleteAssignId(null); toast({ title: "Assignment removed" }); },
      onError: () => toast({ variant: "destructive", title: "Remove failed" }),
    });
  };

  const handleSaveExpenses = () => {
    updateExpensesMut.mutate({ id: clientId, data: { albumCost: Number(expForm.albumCost), miscExpenses: Number(expForm.miscExpenses) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: clientQKey });
        setExpOpen(false);
        toast({ title: "Expenses updated ✓" });
      },
      onError: () => toast({ variant: "destructive", title: "Update failed" }),
    });
  };

  const openExpenses = () => {
    setExpForm({ albumCost: albumCost, miscExpenses: miscExpenses });
    setExpOpen(true);
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: CORAL }}>
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
                <p className="font-bold text-lg" style={{ color: CORAL }}>₹{packageAmt.toLocaleString("en-IN")}</p>
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

          {/* Project P&L */}
          {packageAmt > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Project P&L</h2>
                <button onClick={openExpenses}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-[#E0533C] hover:text-[#E0533C] transition-colors">
                  Edit Costs
                </button>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                  <span className="text-slate-600">Package Value</span>
                  <span className="font-bold text-slate-900">{fmt(packageAmt)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                  <span className="text-slate-600 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-slate-400" />Freelancer Costs</span>
                  <span className="font-semibold text-red-600">− {fmt(freelancerSpend)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                  <span className="text-slate-600">Album Cost</span>
                  <span className="font-semibold text-red-600">− {fmt(albumCost)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                  <span className="text-slate-600">Misc Expenses</span>
                  <span className="font-semibold text-red-600">− {fmt(miscExpenses)}</span>
                </div>
              </div>
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${netProfit >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-center gap-2">
                  {netProfit >= 0
                    ? <TrendingUp className="w-5 h-5 text-green-600" />
                    : <TrendingDown className="w-5 h-5 text-red-600" />}
                  <span className={`text-sm font-bold ${netProfit >= 0 ? "text-green-700" : "text-red-600"}`}>Net {netProfit >= 0 ? "Profit" : "Loss"}</span>
                </div>
                <span className={`text-xl font-bold ${netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>{netProfit >= 0 ? "+" : ""}{fmt(netProfit)}</span>
              </div>
            </div>
          )}

          {/* Freelancer Assignments */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Freelancer Assignments</h2>
              <button onClick={() => setAddFLOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold"
                style={{ background: CORAL }}
                onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")}
                onMouseLeave={e => (e.currentTarget.style.background = CORAL)}>
                <Plus className="w-3.5 h-3.5" />Assign
              </button>
            </div>
            {assignments?.length ? (
              <div className="space-y-2">
                {assignments.map((a: ClientFreelancerAssignment) => (
                  <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#64748B" }}>
                        {(a.freelancerName ?? "?")[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{a.freelancerName ?? "Unknown"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#E0533C] border border-orange-200">{a.functionName}</span>
                          {a.freelancerRole && <span className="text-xs text-slate-400">{a.freelancerRole}</span>}
                          {a.notes && <span className="text-xs text-slate-400">· {a.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700">{fmt(a.rateForShoot)}</span>
                      <button onClick={() => setDeleteAssignId(a.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 px-1 text-sm font-bold text-slate-700 border-t border-slate-100 mt-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400">Total Freelancer Cost</span>
                  <span style={{ color: CORAL }}>{fmt(freelancerSpend)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No freelancers assigned yet.</p>
                <p className="text-xs text-slate-300 mt-0.5">Assign a freelancer per function to track project costs.</p>
              </div>
            )}
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
                style={{ background: CORAL }}>
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Freelancer dialog */}
      <Dialog open={addFLOpen} onOpenChange={setAddFLOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Freelancer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Freelancer *</Label>
              <Select value={String(flForm.freelancerId || "")} onValueChange={v => setFlForm(f => ({ ...f, freelancerId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select freelancer" /></SelectTrigger>
                <SelectContent>
                  {allFreelancers?.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name} {f.role ? `(${f.role})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Function *</Label>
              <Input value={flForm.functionName} onChange={e => setFlForm(f => ({ ...f, functionName: e.target.value }))}
                placeholder="e.g. Mehendi, Baraat, Reception" />
            </div>
            <div className="space-y-1.5">
              <Label>Rate for This Shoot (₹)</Label>
              <Input type="number" value={flForm.rateForShoot || ""} onChange={e => setFlForm(f => ({ ...f, rateForShoot: Number(e.target.value) }))} placeholder="8000" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={flForm.notes} onChange={e => setFlForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any specific instructions..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleAddAssignment} disabled={addAssignmentMut.isPending}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: CORAL }}>Assign Freelancer</button>
              <Button variant="outline" onClick={() => setAddFLOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm remove assignment */}
      <Dialog open={deleteAssignId !== null} onOpenChange={() => setDeleteAssignId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Assignment?</DialogTitle></DialogHeader>
          <p className="text-slate-500 text-sm">This will remove the freelancer from this project.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={() => { if (deleteAssignId) handleRemoveAssignment(deleteAssignId); }} disabled={removeAssignmentMut.isPending} className="flex-1">Remove</Button>
            <Button variant="outline" onClick={() => setDeleteAssignId(null)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit project expenses dialog */}
      <Dialog open={expOpen} onOpenChange={setExpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Project Costs</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Album Cost (₹)</Label>
              <Input type="number" value={expForm.albumCost || ""} onChange={e => setExpForm(f => ({ ...f, albumCost: Number(e.target.value) }))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Misc Expenses (₹)</Label>
              <Input type="number" value={expForm.miscExpenses || ""} onChange={e => setExpForm(f => ({ ...f, miscExpenses: Number(e.target.value) }))} placeholder="0" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveExpenses} disabled={updateExpensesMut.isPending}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: CORAL }}>Save</button>
              <Button variant="outline" onClick={() => setExpOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
