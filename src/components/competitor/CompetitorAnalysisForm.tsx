"use client";

import React, { useState } from "react";
import {
  Search,
  Globe,
  Users,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  RotateCcw,
  Check,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";

export interface CompetitorProfile {
  name: string;
  website: string;
  primaryHandle: string;
  followers: {
    instagram: string;
    facebook: string;
    youtube: string;
    linkedin: string;
    tiktok: string;
    x: string;
  };
  postingFrequency: string;
  contentPillars: string;
  contentFormats: string[];
  contentFormatsOther: string;
  bestPerformingContent: string;
  averageEngagement: string;
  engagementRate: string;
  reelsStrategy: string;
  carouselStrategy: string;
  captionStyle: string;
  hookStyle: string;
  ctaStrategy: string;
  hashtagStrategy: string;
  visualStyle: string;
  brandVoice: string;
  offersPromotions: string;
  audienceResponse: string;
  strengths: string;
  weaknesses: string;
  whatTheyDoWell: string;
  whatTheyAreMissing: string;
  contentGaps: string;
  opportunitiesForUs: string;
  ideasToLearnFrom: string;
  thingsToAvoid: string;
}

export interface CompetitorAnalysisData {
  competitor1: CompetitorProfile;
  competitor2: CompetitorProfile;
  competitor3: CompetitorProfile;
  keyTakeaways: string;
  overallOpportunities: string;
  strategyIdeas: string;
}

const createEmptyCompetitor = (defaultName = ""): CompetitorProfile => ({
  name: defaultName,
  website: "",
  primaryHandle: "",
  followers: {
    instagram: "",
    facebook: "",
    youtube: "",
    linkedin: "",
    tiktok: "",
    x: "",
  },
  postingFrequency: "",
  contentPillars: "",
  contentFormats: [],
  contentFormatsOther: "",
  bestPerformingContent: "",
  averageEngagement: "",
  engagementRate: "",
  reelsStrategy: "",
  carouselStrategy: "",
  captionStyle: "",
  hookStyle: "",
  ctaStrategy: "",
  hashtagStrategy: "",
  visualStyle: "",
  brandVoice: "",
  offersPromotions: "",
  audienceResponse: "",
  strengths: "",
  weaknesses: "",
  whatTheyDoWell: "",
  whatTheyAreMissing: "",
  contentGaps: "",
  opportunitiesForUs: "",
  ideasToLearnFrom: "",
  thingsToAvoid: "",
});

export const DEFAULT_COMPETITOR_ANALYSIS: CompetitorAnalysisData = {
  competitor1: createEmptyCompetitor("Competitor 1"),
  competitor2: createEmptyCompetitor("Competitor 2"),
  competitor3: createEmptyCompetitor("Competitor 3"),
  keyTakeaways: "",
  overallOpportunities: "",
  strategyIdeas: "",
};

const FORMAT_OPTIONS = ["Reels", "Carousels", "Single Posts", "Stories", "Live"];

interface CompetitorAnalysisFormProps {
  value?: CompetitorAnalysisData;
  onChange: (data: CompetitorAnalysisData) => void;
  className?: string;
}

export function CompetitorAnalysisForm({
  value = DEFAULT_COMPETITOR_ANALYSIS,
  onChange,
  className = "",
}: CompetitorAnalysisFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"c1" | "c2" | "c3" | "summary">("c1");

  const data: CompetitorAnalysisData = {
    competitor1: { ...createEmptyCompetitor("Competitor 1"), ...(value.competitor1 || {}) },
    competitor2: { ...createEmptyCompetitor("Competitor 2"), ...(value.competitor2 || {}) },
    competitor3: { ...createEmptyCompetitor("Competitor 3"), ...(value.competitor3 || {}) },
    keyTakeaways: value.keyTakeaways || "",
    overallOpportunities: value.overallOpportunities || "",
    strategyIdeas: value.strategyIdeas || "",
  };

  const updateCompetitor = (
    key: "competitor1" | "competitor2" | "competitor3",
    field: keyof CompetitorProfile,
    val: any
  ) => {
    onChange({
      ...data,
      [key]: {
        ...data[key],
        [field]: val,
      },
    });
  };

  const updateFollower = (
    key: "competitor1" | "competitor2" | "competitor3",
    platform: keyof CompetitorProfile["followers"],
    val: string
  ) => {
    onChange({
      ...data,
      [key]: {
        ...data[key],
        followers: {
          ...data[key].followers,
          [platform]: val,
        },
      },
    });
  };

  const toggleFormat = (
    key: "competitor1" | "competitor2" | "competitor3",
    format: string
  ) => {
    const current = data[key].contentFormats || [];
    const updated = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    updateCompetitor(key, "contentFormats", updated);
  };

  const prefillSampleAnalysis = () => {
    onChange({
      competitor1: {
        name: "PrimeFit Athletics",
        website: "https://primefit.example.com",
        primaryHandle: "@primefit_global",
        followers: {
          instagram: "120K",
          facebook: "45K",
          youtube: "85K",
          linkedin: "12K",
          tiktok: "210K",
          x: "15K",
        },
        postingFrequency: "5 reels / week",
        contentPillars: "Workout tutorials, athlete transformations, product drops",
        contentFormats: ["Reels", "Carousels", "Stories"],
        contentFormatsOther: "",
        bestPerformingContent: "POV workout split reels & viral hook audio trends",
        averageEngagement: "4.2K likes, 120 comments",
        engagementRate: "3.5%",
        reelsStrategy: "Fast paced, dynamic cuts under 15s with bold text hooks",
        carouselStrategy: "10-slide workout guides with swipe cues",
        captionStyle: "Concise bullet points with CTA to save post",
        hookStyle: "'Stop making this mistake if you want to grow...'",
        ctaStrategy: "'Save this for your next session'",
        hashtagStrategy: "5 niche tags + 3 branded tags",
        visualStyle: "High contrast, dark athletic moody grading",
        brandVoice: "Authoritative, intense, motivational",
        offersPromotions: "Seasonal 20% bundle drops",
        audienceResponse: "High save rate, high follower loyalty",
        strengths: "Elite video production quality and consistent branding",
        weaknesses: "Very little community interaction or reply to comments",
        whatTheyDoWell: "Visual consistency and high-speed hook execution",
        whatTheyAreMissing: "Customer case studies and authentic founder stories",
        contentGaps: "Beginner fitness education and transparent pricing",
        opportunitiesForUs: "Win on authentic founder presence, community AMAs, and honest breakdowns",
        ideasToLearnFrom: "Their bold subtitle animations and 3-second hook structure",
        thingsToAvoid: "Overly corporate detached tone",
      },
      competitor2: {
        name: "Aura Lifestyle Co",
        website: "https://auralifestyle.example.com",
        primaryHandle: "@auralife_official",
        followers: {
          instagram: "85K",
          facebook: "20K",
          youtube: "15K",
          linkedin: "5K",
          tiktok: "95K",
          x: "8K",
        },
        postingFrequency: "Daily reels & carousels",
        contentPillars: "Aesthetic lifestyle, daily routines, wellness tips",
        contentFormats: ["Reels", "Carousels"],
        contentFormatsOther: "",
        bestPerformingContent: "Morning routine aesthetics and calm aesthetic packaging",
        averageEngagement: "2.1K likes, 80 comments",
        engagementRate: "2.5%",
        reelsStrategy: "Slow aesthetic b-roll with soothing ambient sound",
        carouselStrategy: "Minimalist typography slides on cream backgrounds",
        captionStyle: "Poetic, journal-like reflections",
        hookStyle: "'A gentle reminder for your Tuesday morning...'",
        ctaStrategy: "'Share with someone who needs peace today'",
        hashtagStrategy: "Broad lifestyle aesthetic tags",
        visualStyle: "Warm earthy tones, soft natural lighting",
        brandVoice: "Gentle, empowering, mindful",
        offersPromotions: "Free shipping codes in bio",
        audienceResponse: "Strong emotional resonance and aesthetic saves",
        strengths: "Cohesive aesthetic grid and warm community feel",
        weaknesses: "Weak direct sales call-to-actions, vague product benefits",
        whatTheyDoWell: "Building an aspirational lifestyle universe",
        whatTheyAreMissing: "Proof of clinical efficacy or product science",
        contentGaps: "Before/After proof, clear product differentiation",
        opportunitiesForUs: "Combine aesthetic beauty with strong, quantifiable product value",
        ideasToLearnFrom: "Their color grading and seamless carousel transitions",
        thingsToAvoid: "Style over substance with no clear buying journey",
      },
      competitor3: {
        name: "Zenith Performance",
        website: "https://zenithperformance.example.com",
        primaryHandle: "@zenith_prep",
        followers: {
          instagram: "45K",
          facebook: "12K",
          youtube: "30K",
          linkedin: "25K",
          tiktok: "15K",
          x: "10K",
        },
        postingFrequency: "3 long-form carousels / week",
        contentPillars: "Scientific research, data breakdowns, founder talks",
        contentFormats: ["Carousels", "Single Posts"],
        contentFormatsOther: "",
        bestPerformingContent: "Clinical study infographics & whitepaper breakdowns",
        averageEngagement: "1.5K likes, 150 comments",
        engagementRate: "3.3%",
        reelsStrategy: "Rarely posts short reels, mostly podcast clips",
        carouselStrategy: "Dense information-rich graphic carousels",
        captionStyle: "Long-form micro-blog essays",
        hookStyle: "'The data is finally in: here is what 500 studies show...'",
        ctaStrategy: "'Download the full research PDF via link in bio'",
        hashtagStrategy: "Scientific industry hashtags",
        visualStyle: "Clinical blue and white chart aesthetics",
        brandVoice: "Academic, analytical, serious",
        offersPromotions: "Annual subscription discounts",
        audienceResponse: "Extremely high comment debate and bookmark rate",
        strengths: "Unmatched scientific credibility and intellectual depth",
        weaknesses: "Content can be dry, difficult for beginners to digest",
        whatTheyDoWell: "Definitive authority and undeniable domain proof",
        whatTheyAreMissing: "Short-form viral hooks and mobile-first entertainment",
        contentGaps: "Fast snackable video summaries and relatable memes",
        opportunitiesForUs: "Translate deep authority into fast, engaging short-form reels",
        ideasToLearnFrom: "Using charts and verifiable data to silence skeptics",
        thingsToAvoid: "Boring long text blocks that get skipped on mobile feeds",
      },
      keyTakeaways: "Competitors are either purely aesthetic (no proof) or purely technical (too boring).",
      overallOpportunities: "Own the sweet spot: fast-paced dynamic reels with undeniable visual proof and real community replies.",
      strategyIdeas: "Engineer 3-second hook reels followed by 10-slide value carousels and authentic weekly founder AMAs.",
    });
  };

  const clearAnalysis = () => {
    onChange(DEFAULT_COMPETITOR_ANALYSIS);
  };

  const currentCompKey =
    activeTab === "c1" ? "competitor1" : activeTab === "c2" ? "competitor2" : "competitor3";
  const currentComp = data[currentCompKey];

  return (
    <div
      className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#1a1714] p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* Native Form Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Competitor Analysis & Market Intelligence</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-normal">
                Optional Deep Dive
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Analyze your top 3 competitors to help our creative team identify content gaps and winning hooks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={prefillSampleAnalysis}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Intel</span>
          </button>
          <button
            type="button"
            onClick={clearAnalysis}
            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            aria-label="Toggle section"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Competitor Pill Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "c1" as const, label: data.competitor1.name || "Competitor 1", num: "1" },
              { id: "c2" as const, label: data.competitor2.name || "Competitor 2", num: "2" },
              { id: "c3" as const, label: data.competitor3.name || "Competitor 3", num: "3" },
              { id: "summary" as const, label: "Market Gaps & Strategy", num: "★" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white dark:bg-[#1f1c18] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-emerald-500"
                  }`}
                >
                  <span className={`text-[10px] px-1 rounded ${isActive ? "bg-emerald-700" : "bg-stone-200 dark:bg-stone-800"}`}>
                    {tab.num}
                  </span>
                  <span className="truncate max-w-[140px] sm:max-w-none">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content: Competitor 1, 2, or 3 */}
          {activeTab !== "summary" && (
            <div className="space-y-4 animate-fade-in">
              {/* Row 1: Brand Name & Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Competitor Name *
                  </label>
                  <input
                    type="text"
                    value={currentComp.name}
                    onChange={(e) => updateCompetitor(currentCompKey, "name", e.target.value)}
                    placeholder="e.g. Brand Alpha"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={currentComp.website}
                    onChange={(e) => updateCompetitor(currentCompKey, "website", e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Row 2: Handle & Posting Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Primary Social Handle
                  </label>
                  <input
                    type="text"
                    value={currentComp.primaryHandle}
                    onChange={(e) => updateCompetitor(currentCompKey, "primaryHandle", e.target.value)}
                    placeholder="@brand_instagram"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Posting Frequency
                  </label>
                  <input
                    type="text"
                    value={currentComp.postingFrequency}
                    onChange={(e) => updateCompetitor(currentCompKey, "postingFrequency", e.target.value)}
                    placeholder="e.g. 5 reels/week, 3 carousels/week"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Follower Base */}
              <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200/80 dark:border-stone-800">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Estimated Follower Counts</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                  {[
                    { key: "instagram" as const, label: "Instagram", icon: Instagram, color: "text-pink-500" },
                    { key: "youtube" as const, label: "YouTube", icon: Youtube, color: "text-red-500" },
                    { key: "facebook" as const, label: "Facebook", icon: Facebook, color: "text-blue-600" },
                    { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
                    { key: "tiktok" as const, label: "TikTok", icon: Users, color: "text-stone-700 dark:text-stone-300" },
                    { key: "x" as const, label: "X / Twitter", icon: Twitter, color: "text-stone-700 dark:text-stone-300" },
                  ].map((plat) => {
                    const IconComponent = plat.icon;
                    return (
                      <div key={plat.key} className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 flex items-center gap-1 truncate">
                          <IconComponent className={`w-3 h-3 ${plat.color}`} />
                          <span>{plat.label}</span>
                        </span>
                        <input
                          type="text"
                          value={currentComp.followers[plat.key]}
                          onChange={(e) => updateFollower(currentCompKey, plat.key, e.target.value)}
                          placeholder="e.g. 50K"
                          className="w-full px-2 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Preferred Formats Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Their Primary Content Formats
                </label>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((fmt) => {
                    const isSelected = currentComp.contentFormats?.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => toggleFormat(currentCompKey, fmt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white dark:bg-[#1f1c18] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-emerald-500"
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : null}
                        <span>{fmt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Content Themes & Best Performing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Best Performing Content / Viral Formats
                  </label>
                  <input
                    type="text"
                    value={currentComp.bestPerformingContent}
                    onChange={(e) => updateCompetitor(currentCompKey, "bestPerformingContent", e.target.value)}
                    placeholder="e.g. 15s POV reels, bold carousel guides"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Average Engagement Rate / Reach
                  </label>
                  <input
                    type="text"
                    value={currentComp.averageEngagement}
                    onChange={(e) => updateCompetitor(currentCompKey, "averageEngagement", e.target.value)}
                    placeholder="e.g. ~3.5% engagement, 3K-5K views"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Hooks, Captions & Visuals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Hook & Reels Strategy
                  </label>
                  <input
                    type="text"
                    value={currentComp.hookStyle}
                    onChange={(e) => updateCompetitor(currentCompKey, "hookStyle", e.target.value)}
                    placeholder="e.g. Negative frame, controversial opening line"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Visual Aesthetics & Brand Voice
                  </label>
                  <input
                    type="text"
                    value={currentComp.visualStyle}
                    onChange={(e) => updateCompetitor(currentCompKey, "visualStyle", e.target.value)}
                    placeholder="e.g. Minimalist luxury, high contrast, warm neutral"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 7: Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Key Strengths (What they do well)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={currentComp.whatTheyDoWell}
                    onChange={(e) => updateCompetitor(currentCompKey, "whatTheyDoWell", e.target.value)}
                    placeholder="What gives them authority or loyal followers?"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Weaknesses & Content Gaps</span>
                  </label>
                  <textarea
                    rows={2}
                    value={currentComp.whatTheyAreMissing}
                    onChange={(e) => updateCompetitor(currentCompKey, "whatTheyAreMissing", e.target.value)}
                    placeholder="What are they missing or doing poorly that we can exploit?"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Row 8: Opportunities & Things to Avoid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Opportunities For Our Brand</span>
                  </label>
                  <textarea
                    rows={2}
                    value={currentComp.opportunitiesForUs}
                    onChange={(e) => updateCompetitor(currentCompKey, "opportunitiesForUs", e.target.value)}
                    placeholder="How our agency can position you to win in this space"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Things To Avoid From Their Playbook
                  </label>
                  <textarea
                    rows={2}
                    value={currentComp.thingsToAvoid}
                    onChange={(e) => updateCompetitor(currentCompKey, "thingsToAvoid", e.target.value)}
                    placeholder="Mistakes, cliches, or bad habits we shouldn't copy"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Summary & Market Gaps */}
          {activeTab === "summary" && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Key Market Takeaways</span>
                </label>
                <textarea
                  rows={3}
                  value={data.keyTakeaways}
                  onChange={(e) => onChange({ ...data, keyTakeaways: e.target.value })}
                  placeholder="Summary of what the competitive landscape looks like right now..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Overall Market Gaps & Opportunities to Exploit
                </label>
                <textarea
                  rows={3}
                  value={data.overallOpportunities}
                  onChange={(e) => onChange({ ...data, overallOpportunities: e.target.value })}
                  placeholder="What can your brand do that none of the competitors are doing?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Creative Strategy & Hook Ideas
                </label>
                <textarea
                  rows={3}
                  value={data.strategyIdeas}
                  onChange={(e) => onChange({ ...data, strategyIdeas: e.target.value })}
                  placeholder="Initial creative concepts, angles, or content series to test..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
