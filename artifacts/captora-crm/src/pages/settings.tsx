import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Shield, Users, Save, Eye, EyeOff, Palette } from "lucide-react";

type Tab = "branding" | "security" | "users";

export default function Settings() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("branding");
  const [branding, setBranding] = useState({ studioName: "Captora Photography", tagline: "Capturing Moments, Crafting Memories", city: "Lucknow, India" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveBranding = () => {
    toast({ title: "Branding saved", description: "Studio details updated successfully." });
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPass) { toast({ variant: "destructive", title: "Fill in all password fields." }); return; }
    if (passwords.newPass !== passwords.confirm) { toast({ variant: "destructive", title: "New passwords do not match." }); return; }
    if (passwords.newPass.length < 6) { toast({ variant: "destructive", title: "Password must be at least 6 characters." }); return; }
    try {
      const token = localStorage.getItem("captora_token");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Basic ${token}` } : {}) },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      if (res.ok) { toast({ title: "Password changed successfully." }); setPasswords({ current: "", newPass: "", confirm: "" }); }
      else { const err = await res.json().catch(() => ({})); toast({ variant: "destructive", title: err.error || "Failed to change password." }); }
    } catch { toast({ variant: "destructive", title: "Network error. Please try again." }); }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "branding", label: "Studio Branding", icon: Camera },
    { id: "security", label: "Security", icon: Shield },
    { id: "users", label: "Users & Access", icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your studio preferences and account</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Branding */}
      {tab === "branding" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Studio Identity</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize how your studio appears across the app.</p>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-slate-300 transition-colors cursor-pointer">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: "#FFF1F0" }}>
              <Camera className="w-7 h-7" style={{ color: "#E0533C" }} />
            </div>
            <p className="text-sm font-semibold text-slate-700">Click to upload studio logo</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG · max 2MB</p>
          </div>

          <div className="grid gap-4">
            <div className="space-y-1.5"><Label>Studio Name</Label><Input value={branding.studioName} onChange={e => setBranding(b => ({ ...b, studioName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Tagline</Label><Input value={branding.tagline} onChange={e => setBranding(b => ({ ...b, tagline: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={branding.city} onChange={e => setBranding(b => ({ ...b, city: e.target.value }))} /></div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-slate-400" />
              <Label>Accent Color</Label>
            </div>
            <div className="flex gap-3 flex-wrap">
              {[{ name: "Coral", color: "#E0533C" }, { name: "Emerald", color: "#10B981" }, { name: "Violet", color: "#8B5CF6" }, { name: "Rose", color: "#F43F5E" }, { name: "Sky", color: "#0EA5E9" }].map(c => (
                <button key={c.color} title={c.name}
                  className={`w-9 h-9 rounded-full border-4 transition-all hover:scale-110 ${c.color === "#E0533C" ? "border-slate-400" : "border-transparent"}`}
                  style={{ background: c.color }}
                  onClick={() => toast({ title: `Theme: ${c.name}`, description: "Coral is the active accent color." })}
                />
              ))}
            </div>
          </div>

          <button onClick={handleSaveBranding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#E0533C" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")} onMouseLeave={e => (e.currentTarget.style.background = "#E0533C")}>
            <Save className="w-4 h-4" />Save Branding
          </button>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update your admin login password.</p>
          </div>
          <div className="space-y-4 max-w-sm">
            <div className="space-y-1.5"><Label>Current Password</Label><Input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="Current password" /></div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="Min 6 characters" className="pr-10" />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" className="pr-10" />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <button onClick={handleChangePassword}
              className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#E0533C" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#C9432C")} onMouseLeave={e => (e.currentTarget.style.background = "#E0533C")}>
              <Shield className="w-4 h-4" />Update Password
            </button>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Portal Access</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage who has access to the CRM.</p>
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "#E0533C" }}>A</div>
              <div>
                <p className="text-sm font-bold text-slate-900">Abhishek</p>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Active</span>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Multi-user support coming soon</p>
            <p className="text-xs text-slate-400 mt-1">Invite team members with role-based access</p>
          </div>
        </div>
      )}
    </div>
  );
}
