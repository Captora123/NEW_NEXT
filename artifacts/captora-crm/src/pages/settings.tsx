import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Palette, Shield, Users, Save, Eye, EyeOff } from "lucide-react";

type Tab = "branding" | "system" | "users";

export default function Settings() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("branding");

  const [branding, setBranding] = useState({
    studioName: "Captora Photography",
    tagline: "Capturing Moments, Crafting Memories",
    city: "Lucknow, India",
  });

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveBranding = () => {
    toast({ title: "Branding saved", description: "Studio details updated successfully." });
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPass) {
      toast({ variant: "destructive", title: "Fill in all password fields." });
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast({ variant: "destructive", title: "New passwords do not match." });
      return;
    }
    if (passwords.newPass.length < 6) {
      toast({ variant: "destructive", title: "Password must be at least 6 characters." });
      return;
    }
    try {
      const token = localStorage.getItem("captora_token");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Basic ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      if (res.ok) {
        toast({ title: "Password changed successfully." });
        setPasswords({ current: "", newPass: "", confirm: "" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: err.error || "Failed to change password." });
      }
    } catch {
      toast({ variant: "destructive", title: "Network error. Please try again." });
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "branding", label: "Studio Branding", icon: Camera },
    { id: "system", label: "Security", icon: Shield },
    { id: "users", label: "Users & Access", icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your studio preferences and account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/60 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Branding tab */}
      {tab === "branding" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold mb-1">Studio Identity</h2>
            <p className="text-xs text-muted-foreground">Customize your studio name and description shown across the app.</p>
          </div>

          {/* Logo upload placeholder */}
          <div>
            <Label className="text-sm font-medium">Studio Logo</Label>
            <div className="mt-2 border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Click to upload logo</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label>Studio Name</Label>
              <Input
                value={branding.studioName}
                onChange={e => setBranding(b => ({ ...b, studioName: e.target.value }))}
                placeholder="Your Studio Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input
                value={branding.tagline}
                onChange={e => setBranding(b => ({ ...b, tagline: e.target.value }))}
                placeholder="A short tagline..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={branding.city}
                onChange={e => setBranding(b => ({ ...b, city: e.target.value }))}
                placeholder="City, State"
              />
            </div>
          </div>

          {/* Theme Colors */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Theme Accent Color</Label>
            <div className="flex gap-3 flex-wrap">
              {[
                { name: "Gold", color: "#C5A059" },
                { name: "Emerald", color: "#10b981" },
                { name: "Violet", color: "#8b5cf6" },
                { name: "Rose", color: "#f43f5e" },
                { name: "Sky", color: "#0ea5e9" },
              ].map(c => (
                <button
                  key={c.color}
                  title={c.name}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${c.color === "#C5A059" ? "border-white" : "border-transparent hover:border-white/50"}`}
                  style={{ backgroundColor: c.color }}
                  onClick={() => toast({ title: `Theme: ${c.name}`, description: "Theme colors can be customized in the CSS." })}
                />
              ))}
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Gold is the current theme</span>
              </div>
            </div>
          </div>

          <Button onClick={handleSaveBranding} className="gap-2">
            <Save className="w-4 h-4" />
            Save Branding
          </Button>
        </div>
      )}

      {/* Security tab */}
      {tab === "system" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold mb-1">Change Password</h2>
            <p className="text-xs text-muted-foreground">Update your admin login password.</p>
          </div>

          <div className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={passwords.newPass}
                  onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                  placeholder="Min 6 characters"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleChangePassword} className="gap-2 w-full">
              <Shield className="w-4 h-4" />
              Update Password
            </Button>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold mb-1">Portal Access</h2>
            <p className="text-xs text-muted-foreground">Manage who has access to the CRM.</p>
          </div>

          <div className="space-y-3">
            {[
              { name: "Abhishek", role: "Super Admin", status: "Active", initials: "A" },
            ].map(u => (
              <div key={u.name} className="flex items-center justify-between p-4 border border-border/60 rounded-xl bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center text-sm font-bold text-background">
                    {u.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full">{u.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border border-dashed border-border/60 rounded-xl text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Multi-user support coming soon</p>
            <p className="text-xs text-muted-foreground mt-1">Invite team members with role-based access control</p>
          </div>
        </div>
      )}
    </div>
  );
}
