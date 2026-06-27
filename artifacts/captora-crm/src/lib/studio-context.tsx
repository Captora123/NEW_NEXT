import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const DEFAULT_SERVICE_CATEGORIES = [
  "Wedding", "Pre-Wedding", "Engagement", "Haldi", "Mehendi", "Sangeet", "Reception", "Anniversary",
  "Ecommerce", "Product Photography", "Brand Shoot", "Corporate", "Real Estate", "Food & Beverage",
  "Portrait", "Maternity", "Newborn", "Family", "Fashion",
  "Birthday", "Baby Shower", "Graduation", "Conference",
  "Editorial", "Wildlife", "Travel", "Other",
];

export interface Theme {
  id: string;
  name: string;
  description: string;
  accent: string;
  sidebar: string;
  bg: string;
  cardBg: string;
}

export const THEMES: Theme[] = [
  {
    id: "default",
    name: "Coral Studio",
    description: "Classic warm coral with slate sidebar",
    accent: "#E0533C",
    sidebar: "#1E293B",
    bg: "#F5F5EE",
    cardBg: "#FFFFFF",
  },
  {
    id: "pro",
    name: "Indigo Pro",
    description: "Professional indigo with near-black sidebar",
    accent: "#6366F1",
    sidebar: "#0F172A",
    bg: "#F8FAFC",
    cardBg: "#FFFFFF",
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Fresh emerald with deep green sidebar",
    accent: "#059669",
    sidebar: "#064E3B",
    bg: "#F0FDF4",
    cardBg: "#FFFFFF",
  },
  {
    id: "warm",
    name: "Warm Amber",
    description: "Earthy amber with dark brown sidebar",
    accent: "#D97706",
    sidebar: "#1C1917",
    bg: "#FFFBEB",
    cardBg: "#FFFFFF",
  },
];

export interface StudioConfig {
  studioName: string;
  tagline: string;
  city: string;
  themeId: string;
  serviceCategories: string[];
}

const DEFAULT_CONFIG: StudioConfig = {
  studioName: "Captora Photography",
  tagline: "Capturing Moments, Crafting Memories",
  city: "Lucknow, India",
  themeId: "default",
  serviceCategories: DEFAULT_SERVICE_CATEGORIES,
};

const STORAGE_KEY = "captora_studio_config";

function loadConfig(): StudioConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: StudioConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

interface StudioContextValue {
  config: StudioConfig;
  theme: Theme;
  updateConfig: (partial: Partial<StudioConfig>) => void;
  resetConfig: () => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StudioConfig>(loadConfig);

  const theme = THEMES.find(t => t.id === config.themeId) ?? THEMES[0];

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--sidebar", theme.sidebar);
    document.documentElement.style.setProperty("--app-bg", theme.bg);
  }, [theme]);

  const updateConfig = useCallback((partial: Partial<StudioConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...partial };
      saveConfig(next);
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    saveConfig(DEFAULT_CONFIG);
  }, []);

  return (
    <StudioContext.Provider value={{ config, theme, updateConfig, resetConfig }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
