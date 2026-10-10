"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { BrandingConfig, DEFAULT_BRANDING } from "@/lib/branding";

export interface ThemeStyleDefinition {
  name: string;
  label: string;
  primaryGradient: string;
  secondaryGradient: string;
  accentBadge: string;
  ringClass: string;
  cardHighlight: string;
  activeNavGlow: string;
  swatchBg: string;
  primaryHex: string;
  primaryHoverHex: string;
  primarySoftHex: string;
  sidebarBorder: string;
  sidebarHeaderLabel: string;
  sidebarHeaderBorder: string;
  sidebarActive: string;
  sidebarActiveIcon: string;
  sidebarHover: string;
  sidebarFooterCard: string;
  sidebarFooterIcon: string;
  sidebarFooterTitle: string;
  primaryButton: string;
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
    primaryHex: "#059669",
    primaryHoverHex: "#10B981",
    primarySoftHex: "rgba(5, 150, 105, 0.15)",
    sidebarBorder: "border-emerald-200/80 dark:border-emerald-900/40",
    sidebarHeaderLabel: "text-emerald-700 dark:text-emerald-400",
    sidebarHeaderBorder: "border-emerald-100 dark:border-emerald-900/30",
    sidebarActive: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 font-bold shadow-xs dark:shadow-lg border border-emerald-200 dark:border-emerald-500/30 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-emerald-500 dark:before:bg-emerald-400 before:rounded-r-full",
    sidebarActiveIcon: "text-emerald-600 dark:text-emerald-400",
    sidebarHover: "hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-200",
    sidebarFooterCard: "bg-gradient-to-br from-emerald-50/80 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/40 border-emerald-200/80 dark:border-emerald-900/40",
    sidebarFooterIcon: "text-emerald-500 dark:text-emerald-400",
    sidebarFooterTitle: "text-emerald-900 dark:text-emerald-300",
    primaryButton: "bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-emerald-600/20",
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
    primaryHex: "#D97706",
    primaryHoverHex: "#F59E0B",
    primarySoftHex: "rgba(217, 119, 6, 0.15)",
    sidebarBorder: "border-amber-200/80 dark:border-amber-900/40",
    sidebarHeaderLabel: "text-amber-700 dark:text-amber-400",
    sidebarHeaderBorder: "border-amber-100 dark:border-amber-900/30",
    sidebarActive: "bg-amber-50 dark:bg-amber-500/15 text-amber-950 dark:text-amber-200 font-bold shadow-xs dark:shadow-lg border border-amber-200 dark:border-amber-500/30 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-amber-500 dark:before:bg-amber-400 before:rounded-r-full",
    sidebarActiveIcon: "text-amber-600 dark:text-amber-400",
    sidebarHover: "hover:bg-amber-50/60 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-200",
    sidebarFooterCard: "bg-gradient-to-br from-amber-50/80 to-yellow-50 dark:from-amber-950/30 dark:to-stone-900/40 border-amber-200/80 dark:border-amber-900/40",
    sidebarFooterIcon: "text-amber-500 dark:text-amber-400",
    sidebarFooterTitle: "text-amber-900 dark:text-amber-300",
    primaryButton: "bg-amber-600 hover:bg-amber-500 active:scale-95 text-white shadow-amber-600/20",
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
    primaryHex: "#4F46E5",
    primaryHoverHex: "#6366F1",
    primarySoftHex: "rgba(79, 70, 229, 0.15)",
    sidebarBorder: "border-indigo-200/80 dark:border-indigo-900/40",
    sidebarHeaderLabel: "text-indigo-700 dark:text-indigo-400",
    sidebarHeaderBorder: "border-indigo-100 dark:border-indigo-900/30",
    sidebarActive: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs dark:shadow-lg border border-indigo-200 dark:border-indigo-500/30 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-indigo-500 dark:before:bg-indigo-400 before:rounded-r-full",
    sidebarActiveIcon: "text-indigo-600 dark:text-indigo-400",
    sidebarHover: "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 hover:text-indigo-900 dark:hover:text-indigo-200",
    sidebarFooterCard: "bg-gradient-to-br from-indigo-50/80 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/40 border-indigo-200/80 dark:border-indigo-900/40",
    sidebarFooterIcon: "text-indigo-500 dark:text-indigo-400",
    sidebarFooterTitle: "text-indigo-900 dark:text-indigo-300",
    primaryButton: "bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/20",
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
    primaryHex: "#2563EB",
    primaryHoverHex: "#3B82F6",
    primarySoftHex: "rgba(37, 99, 235, 0.15)",
    sidebarBorder: "border-blue-200/80 dark:border-blue-900/40",
    sidebarHeaderLabel: "text-blue-700 dark:text-blue-400",
    sidebarHeaderBorder: "border-blue-100 dark:border-blue-900/30",
    sidebarActive: "bg-blue-50 dark:bg-blue-500/15 text-blue-950 dark:text-blue-200 font-bold shadow-xs dark:shadow-lg border border-blue-200 dark:border-blue-500/30 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-blue-500 dark:before:bg-blue-400 before:rounded-r-full",
    sidebarActiveIcon: "text-blue-600 dark:text-blue-400",
    sidebarHover: "hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:text-blue-900 dark:hover:text-blue-200",
    sidebarFooterCard: "bg-gradient-to-br from-blue-50/80 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/40 border-blue-200/80 dark:border-blue-900/40",
    sidebarFooterIcon: "text-blue-500 dark:text-blue-400",
    sidebarFooterTitle: "text-blue-900 dark:text-blue-300",
    primaryButton: "bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-blue-600/20",
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
    primaryHex: "#E11D48",
    primaryHoverHex: "#F43F5E",
    primarySoftHex: "rgba(225, 29, 72, 0.15)",
    sidebarBorder: "border-rose-200/80 dark:border-rose-900/40",
    sidebarHeaderLabel: "text-rose-700 dark:text-rose-400",
    sidebarHeaderBorder: "border-rose-100 dark:border-rose-900/30",
    sidebarActive: "bg-rose-50 dark:bg-rose-500/15 text-rose-950 dark:text-rose-200 font-bold shadow-xs dark:shadow-lg border border-rose-200 dark:border-rose-500/30 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-rose-500 dark:before:bg-rose-400 before:rounded-r-full",
    sidebarActiveIcon: "text-rose-600 dark:text-rose-400",
    sidebarHover: "hover:bg-rose-50/60 dark:hover:bg-rose-950/40 hover:text-rose-900 dark:hover:text-rose-200",
    sidebarFooterCard: "bg-gradient-to-br from-rose-50/80 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/40 border-rose-200/80 dark:border-rose-900/40",
    sidebarFooterIcon: "text-rose-500 dark:text-rose-400",
    sidebarFooterTitle: "text-rose-900 dark:text-rose-300",
    primaryButton: "bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-rose-600/20",
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
    primaryHex: "#9333EA",
    primaryHoverHex: "#A855F7",
    primarySoftHex: "rgba(147, 51, 234, 0.15)",
    sidebarBorder: "border-purple-200/80 dark:border-purple-900/40",
    sidebarHeaderLabel: "text-purple-700 dark:text-purple-400",
    sidebarHeaderBorder: "border-purple-100 dark:border-purple-900/30",
    sidebarActive: "bg-purple-50 dark:bg-purple-500/15 text-purple-950 dark:text-purple-200 font-bold shadow-xs dark:shadow-lg border border-purple-200 dark:border-purple-500/30 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-purple-500 dark:before:bg-purple-400 before:rounded-r-full",
    sidebarActiveIcon: "text-purple-600 dark:text-purple-400",
    sidebarHover: "hover:bg-purple-50/60 dark:hover:bg-purple-950/40 hover:text-purple-900 dark:hover:text-purple-200",
    sidebarFooterCard: "bg-gradient-to-br from-purple-50/80 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/40 border-purple-200/80 dark:border-purple-900/40",
    sidebarFooterIcon: "text-purple-500 dark:text-purple-400",
    sidebarFooterTitle: "text-purple-900 dark:text-purple-300",
    primaryButton: "bg-purple-600 hover:bg-purple-500 active:scale-95 text-white shadow-purple-600/20",
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
    primaryHex: "#475569",
    primaryHoverHex: "#64748B",
    primarySoftHex: "rgba(71, 85, 105, 0.15)",
    sidebarBorder: "border-slate-300/80 dark:border-slate-800/80",
    sidebarHeaderLabel: "text-slate-800 dark:text-slate-300",
    sidebarHeaderBorder: "border-slate-200 dark:border-slate-800",
    sidebarActive: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-xs dark:shadow-lg border border-slate-300 dark:border-slate-700 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-slate-800 dark:before:bg-slate-200 before:rounded-r-full",
    sidebarActiveIcon: "text-slate-800 dark:text-slate-200",
    sidebarHover: "hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100",
    sidebarFooterCard: "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900/60 dark:to-slate-800/60 border-slate-300 dark:border-slate-700",
    sidebarFooterIcon: "text-slate-600 dark:text-slate-300",
    sidebarFooterTitle: "text-slate-900 dark:text-slate-100",
    primaryButton: "bg-slate-800 hover:bg-slate-700 active:scale-95 text-white shadow-slate-800/20",
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

    const handleUpdate = () => {
      fetchBranding();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mdz_branding_updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mdz_branding_updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      }
    };
  }, [fetchBranding]);

  useEffect(() => {
    if (typeof document !== "undefined" && (branding.faviconUrl || branding.logoUrl)) {
      const fav = branding.faviconUrl || branding.logoUrl;
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = fav;
    }
  }, [branding.faviconUrl, branding.logoUrl]);

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

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--primary-main", themeStyle.primaryHex);
      root.style.setProperty("--primary-hover", themeStyle.primaryHoverHex);
      root.style.setProperty("--primary-soft", themeStyle.primarySoftHex);
      root.setAttribute("data-theme", branding.themeColor);
    }
  }, [themeStyle, branding.themeColor]);

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
