"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { BrandingConfig, DEFAULT_BRANDING } from "@/app/api/public/branding/route";

interface ThemeStyleDefinition {
  name: string;
  label: string;
  primaryGradient: string;
  secondaryGradient: string;
  accentBadge: string;
  ringClass: string;
  cardHighlight: string;
  activeNavGlow: string;
  swatchBg: string;
}

export const THEME_PALETTES: Record<string, ThemeStyleDefinition> = {
  emerald: {
    name: "emerald",
    label: "🌿 Emerald Millionaire (Classic)",
    primaryGradient: "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-300",
    secondaryGradient: "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-300",
    accentBadge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    ringClass: "ring-emerald-500/30",
    cardHighlight: "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20",
    activeNavGlow: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 before:bg-emerald-500",
    swatchBg: "from-emerald-500 to-amber-500",
  },
  amber: {
    name: "amber",
    label: "⚡ Golden Amber (Creative & High Energy)",
    primaryGradient: "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-400 dark:via-amber-300 dark:to-yellow-300",
    secondaryGradient: "bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 dark:from-orange-400 dark:via-amber-300 dark:to-orange-300",
    accentBadge: "bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    ringClass: "ring-amber-500/30",
    cardHighlight: "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20",
    activeNavGlow: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 before:bg-amber-500",
    swatchBg: "from-amber-500 to-orange-500",
  },
  indigo: {
    name: "indigo",
    label: "🚀 Modern Cyber (Tech & SaaS)",
    primaryGradient: "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-violet-300",
    secondaryGradient: "bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-300",
    accentBadge: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    ringClass: "ring-indigo-500/30",
    cardHighlight: "border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20",
    activeNavGlow: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/30 before:bg-indigo-500",
    swatchBg: "from-indigo-500 to-cyan-500",
  },
  blue: {
    name: "blue",
    label: "💎 Corporate Sapphire (Enterprise & Finance)",
    primaryGradient: "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-blue-300 dark:to-cyan-300",
    secondaryGradient: "bg-gradient-to-r from-indigo-500 via-blue-400 to-teal-500 dark:from-indigo-400 dark:via-blue-300 dark:to-teal-300",
    accentBadge: "bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    ringClass: "ring-blue-500/30",
    cardHighlight: "border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20",
    activeNavGlow: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30 before:bg-blue-500",
    swatchBg: "from-blue-600 to-cyan-400",
  },
  rose: {
    name: "rose",
    label: "🌹 Bold Crimson (Luxury & Design)",
    primaryGradient: "bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 dark:from-rose-400 dark:via-rose-300 dark:to-pink-300",
    secondaryGradient: "bg-gradient-to-r from-amber-500 via-rose-400 to-red-500 dark:from-amber-400 dark:via-rose-300 dark:to-red-300",
    accentBadge: "bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    ringClass: "ring-rose-500/30",
    cardHighlight: "border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/20",
    activeNavGlow: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 before:bg-rose-500",
    swatchBg: "from-rose-500 to-amber-500",
  },
  violet: {
    name: "violet",
    label: "🔮 Neon Amethyst (Digital & Agency)",
    primaryGradient: "bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-500 dark:from-purple-400 dark:via-violet-300 dark:to-fuchsia-300",
    secondaryGradient: "bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-500 dark:from-pink-400 dark:via-purple-300 dark:to-indigo-300",
    accentBadge: "bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    ringClass: "ring-purple-500/30",
    cardHighlight: "border-purple-500/40 bg-purple-50/20 dark:bg-purple-950/20",
    activeNavGlow: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/15 border-purple-200 dark:border-purple-500/30 before:bg-purple-500",
    swatchBg: "from-purple-500 to-fuchsia-500",
  },
  slate: {
    name: "slate",
    label: "🌌 Executive Slate (Minimalist Monochrome)",
    primaryGradient: "bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-slate-100 dark:via-slate-300 dark:to-slate-200",
    secondaryGradient: "bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400 dark:from-slate-400 dark:via-slate-300 dark:to-slate-500",
    accentBadge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700",
    ringClass: "ring-slate-500/30",
    cardHighlight: "border-slate-500/40 bg-slate-50/20 dark:bg-slate-800/20",
    activeNavGlow: "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 before:bg-slate-700",
    swatchBg: "from-slate-800 to-slate-500",
  },
};

interface BrandingContextType {
  branding: BrandingConfig;
  themeStyle: ThemeStyleDefinition;
  loading: boolean;
  refreshBranding: () => Promise<void>;
  updateBrandingOptimistic: (partial: Partial<BrandingConfig>) => void;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  themeStyle: THEME_PALETTES.emerald,
  loading: true,
  refreshBranding: async () => {},
  updateBrandingOptimistic: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mdz_cached_branding");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return DEFAULT_BRANDING;
  });

  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    try {
      const res = await fetch("/mdz-crm/api/public/branding", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setBranding(json.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("mdz_cached_branding", JSON.stringify(json.data));
        }
      }
    } catch (err) {
      console.warn("Branding fetch fallback:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const updateBrandingOptimistic = useCallback((partial: Partial<BrandingConfig>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...partial };
      if (typeof window !== "undefined") {
        localStorage.setItem("mdz_cached_branding", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const themeStyle = useMemo(() => {
    return THEME_PALETTES[branding.themeColor] || THEME_PALETTES.emerald;
  }, [branding.themeColor]);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        themeStyle,
        loading,
        refreshBranding: fetchBranding,
        updateBrandingOptimistic,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
