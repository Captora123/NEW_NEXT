"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudio, THEMES, DEFAULT_SERVICE_CATEGORIES } from "@/lib/studio-context";
import {
  Camera, Shield, Save, Eye, EyeOff,
  Palette, Tag, RotateCcw, Plus, X, Check,
} from "lucide-react";

type Tab = "branding" | "themes" | "services" | "security";

export default function Settings() {
  const { toast } = useToast();
  const { config, theme, updateConfig, resetConfig } = useStudio();
  const ACCENT = theme.accent;

  const [tab, setTab] = useState<Tab>("branding");
  const [branding, setBranding] = useState({ studioName: config.studioName, tagline: config.tagline, city: config.city });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const handleSaveBranding = () => {
    updateConfig({ studioName: branding.studioName, tagline: branding.tagline, city: branding.city });
    toast({ title: "Branding saved", description: "Studio details updated." });
  };

  const handleSetTheme = (themeId: string) => {
    updateConfig({ themeId });
    toast({ title: `Theme applied: ${THEMES.find(t => t.id === themeId)?.name}` });
  };

  const handleReset = () => {
    resetConfig();
    setBranding({ studioName: "Captora Photography", tagline: "Capturing Moments, Crafting Memories", city: "Lucknow, India" });
    toast({ title: "Reset to default", description: "All settings restored." });
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPass) { toast({ variant: "destructive", title: "Fill in all password fields." }); return; }
    if (passwords.newPass !== passwords.confirm) { toast({ variant: "destructive", title: "New passwords do not match." }); return; }
    if (passwords.newPass.length < 6) { toast({ variant: "destructive", title: "Password must be at least 6 characters." }); return; }
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("captora_token") : null;
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Basic ${token}` } : {}) },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      if (res.ok) { toast({ title: "Password changed successfully." }); setPasswords({ current: "", newPass: "", confirm: "" }); }
      else { const err = await res.json().catch(() => ({})); toast({ variant: "destructive", title: (err as { error?: string }).error || "Failed to change password." }); }
    } catch { toast({ variant: "destructive", title: "Network error. Please try again." }); }
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (config.serviceCategories.includes(trimmed)) { toast({ variant: "destructive", title: "Category already exists." }); return; }
    updateConfig({ serviceCategories: [...config.serviceCategories, trimmed] });
    setNewCategory("");
  };

  const removeCategory = (cat: string) => { updateConfig({ serviceCategories: config.serviceCategories.filter(c => c !== cat) }); };

  const resetCategories = () => { updateConfig({ serviceCategories: DEFAULT_SERVICE_CATEGORIES }); toast({ title: "Service categories reset." }); };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "branding", label: "Branding", icon: Camera },
    { id: "themes", label: "Themes", icon: Palette },
    { id: "services", label: "Services", icon: Tag },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your studio preferences and account</p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit min-w-full sm:min-w-0">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center sm:justify-start"
                style={tab === t.id ? { background: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#64748B" }}>
                <Icon className="w-4 h-4" /><span className="hidden sm:inline ml-1">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === "branding" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Studio Identity</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize how your studio appears across the app.</p>
          </div>
          <div className="grid gap-4">
            <div className="space-y-1.5"><Label>Studio Name</Label><Input value={branding.studioName} onChange={e => setBranding(b => ({ ...b, studioName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Tagline</Label><Input value={branding.tagline} onChange={e => setBranding(b => ({ ...b, tagline: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={branding.city} onChange={e => setBranding(b => ({ ...b, city: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSaveBranding}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: ACCENT }}>
              <Save className="w-4 h-4" />Save Branding
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-600 text-sm font-semibold border border-slate-200 hover:bg-slate-50">
              <RotateCcw className="w-4 h-4" />Reset All
            </button>
          </div>
        </div>
      )}

      {tab === "themes" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Layout Themes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose a color theme for your dashboard.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEMES.map(t => {
              const isActive = config.themeId === t.id;
              return (
                <button key={t.id} onClick={() => handleSetTheme(t.id)}
                  className="relative text-left p-4 rounded-xl border-2 transition-all hover:shadow-md"
                  style={{ borderColor: isActive ? t.accent : "#E2E8F0", background: t.bg }}>
                  {isActive && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: t.accent }}>
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="flex gap-2 mb-3">
                    <div className="w-8 rounded-lg flex-shrink-0 h-14" style={{ background: t.sidebar }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded-md" style={{ background: t.accent, width: "60%" }} />
                      <div className="h-2.5 rounded bg-slate-200 w-full" />
                      <div className="h-2.5 rounded bg-slate-100 w-4/5" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  <div className="flex gap-1.5 mt-2">
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: t.accent }} />
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: t.sidebar }} />
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: t.bg }} />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="pt-2 border-t border-slate-100">
            <button onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-600 text-sm font-semibold border border-slate-200 hover:bg-slate-50">
              <RotateCcw className="w-4 h-4" />Reset to Default Theme
            </button>
          </div>
        </div>
      )}

      {tab === "services" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Service Categories</h2>
              <p className="text-xs text-slate-400 mt-0.5">These categories appear when adding clients and scheduling shoots.</p>
            </div>
            <button onClick={resetCategories}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 flex-shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />Reset
            </button>
          </div>
          <div className="flex gap-2">
            <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} placeholder="Add new category (e.g. Corporate Event)" className="flex-1" />
            <button onClick={addCategory} className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-1.5" style={{ background: ACCENT }}>
              <Plus className="w-4 h-4" />Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.serviceCategories.map(cat => (
              <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-sm text-slate-700 font-medium">{cat}</span>
                <button onClick={() => removeCategory(cat)} className="w-4 h-4 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {config.serviceCategories.length === 0 && <p className="text-sm text-slate-400">No categories yet.</p>}
          </div>
          <p className="text-xs text-slate-400">{config.serviceCategories.length} categories · Changes save instantly</p>
        </div>
      )}

      {tab === "security" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
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
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" className="pr-10" />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button onClick={handleChangePassword}
              className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ background: ACCENT }}>
              <Shield className="w-4 h-4" />Update Password
            </button>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: ACCENT }}>A</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Admin</p>
                  <p className="text-xs text-slate-400">Super Admin · Full Access</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
