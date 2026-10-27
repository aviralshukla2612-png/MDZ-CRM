"use client";

import React, { useState } from "react";
import {
  Search,
  Globe,
  Share2,
  Users,
  Calendar,
  Layers,
  LayoutGrid,
  Trophy,
  BarChart3,
  Percent,
  Video,
  FileText,
  MessageSquare,
  Sparkles,
  MousePointerClick,
  Hash,
  Palette,
  Volume2,
  Tag,
  ThumbsUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  Lightbulb,
  BookOpen,
  Ban,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
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
  const [activeMobileTab, setActiveMobileTab] = useState<"c1" | "c2" | "c3">("c1");

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
          instagram: "120",
          facebook: "45",
          youtube: "85",
          linkedin: "12",
          tiktok: "210",
          x: "15",
        },
        postingFrequency: "5 reels / week",
        contentPillars: "Workout tutorials, Athlete routines, Nutrition tips",
        contentFormats: ["Reels", "Stories", "Carousels"],
        contentFormatsOther: "IG Live Q&As",
        bestPerformingContent: "15-minute quick HIIT workout reels with high tempo audio",
        averageEngagement: "1,800 likes, 120 comments",
        engagementRate: "3.2%",
        reelsStrategy: "Fast paced, dynamic cuts, bold hook text in first 2 seconds",
        carouselStrategy: "7-slide educational carousel breakdowns with actionable steps",
        captionStyle: "Concise value summary with clear CTA to save post",
        hookStyle: "Question hooks: 'Stop doing squats like this...'",
        ctaStrategy: "Comment 'WORKOUT' to get the free routine PDF in DM",
        hashtagStrategy: "5 niche training hashtags + #PrimeFitSquad",
        visualStyle: "High contrast, dark gym aesthetic with neon accents",
        brandVoice: "Authoritative, intense, motivating, highly disciplined",
        offersPromotions: "Seasonal 20% bundle discount on membership",
        audienceResponse: "Strong loyal community, high save rate on workouts",
        strengths: "Elite video editing quality and influencer athlete endorsements",
        weaknesses: "Very little community reply in comments; robotic support",
        whatTheyDoWell: "Hook retention and short video pacing are top-tier",
        whatTheyAreMissing: "Customer transformation stories and beginner onboarding",
        contentGaps: "No beginner-friendly low-impact routines or nutritional cooking",
        opportunitiesForUs: "Position as more relatable, supportive, and accessible for everyday fitness",
        ideasToLearnFrom: "Automated DM lead magnet delivery on carousel comments",
        thingsToAvoid: "Overly intimidating hardcore bodybuilder vibe",
      },
      competitor2: {
        name: "Zenith Activewear",
        website: "https://zenithactive.example.com",
        primaryHandle: "@zenith_active",
        followers: {
          instagram: "85",
          facebook: "25",
          youtube: "18",
          linkedin: "8",
          tiktok: "140",
          x: "5",
        },
        postingFrequency: "3 posts / week",
        contentPillars: "Athleisure styling, Fabric features, Sustainability",
        contentFormats: ["Carousels", "Single Posts", "Stories"],
        contentFormatsOther: "",
        bestPerformingContent: "Try-on hauls showing squat-proof fabric stretch tests",
        averageEngagement: "850 likes, 45 comments",
        engagementRate: "2.1%",
        reelsStrategy: "Aesthetic lifestyle b-roll with trending lofi audio",
        carouselStrategy: "Side-by-side color comparisons and size charts",
        captionStyle: "Casual, conversational, emoji-heavy",
        hookStyle: "Sensory hooks: 'The softest gym set you will ever wear'",
        ctaStrategy: "Link in bio to shop new seasonal color drop",
        hashtagStrategy: "Broad fashion hashtags (#athleisure #gymootd)",
        visualStyle: "Warm neutral tones, pastel beige, clean studio lighting",
        brandVoice: "Friendly, gentle, wellness-focused, mindful",
        offersPromotions: "Free shipping on orders above ₹1,999",
        audienceResponse: "Moderate engagement; high product inquiries in DMs",
        strengths: "Very aesthetically pleasing feed and visual packaging",
        weaknesses: "Irregular posting schedule and slow turnaround on reels",
        whatTheyDoWell: "Product photography and fabric detail closeups",
        whatTheyAreMissing: "Performance marketing video ads and customer UGC",
        contentGaps: "Lack of real workout testing or athlete sweat proof tests",
        opportunitiesForUs: "Combine aesthetic styling with high-performance proof tests",
        ideasToLearnFrom: "Minimalist color palette styling in carousels",
        thingsToAvoid: "Posting beautiful photos without clear purchasing CTAs",
      },
      competitor3: {
        name: "Apex Fuel & Nutra",
        website: "https://apexfuel.example.com",
        primaryHandle: "@apexfuel",
        followers: {
          instagram: "190",
          facebook: "80",
          youtube: "310",
          linkedin: "35",
          tiktok: "90",
          x: "28",
        },
        postingFrequency: "Daily reels & YouTube Shorts",
        contentPillars: "Supplement science, Myth busting, Protein recipes",
        contentFormats: ["Reels", "Stories", "Carousels", "Live"],
        contentFormatsOther: "Long-form podcast clips",
        bestPerformingContent: "Doctor/trainer breaking down fake protein powder scams",
        averageEngagement: "4,200 likes, 380 comments",
        engagementRate: "4.5%",
        reelsStrategy: "Talking-head expert with high-speed b-roll and sound effects",
        carouselStrategy: "Ingredient label comparisons vs supermarket brands",
        captionStyle: "Detailed research breakdown with scientific citations",
        hookStyle: "Controversial / Myth-busting: 'Your whey protein is lying to you'",
        ctaStrategy: "Check lab test certificates via link in bio",
        hashtagStrategy: "Scientific fitness tags (#supplements #nutritionfacts)",
        visualStyle: "Medical clean white & bold red, scientific graphs",
        brandVoice: "Scientific, unapologetic, fact-first, transparent",
        offersPromotions: "Buy 1 Get 1 on shaker bottles; bundle discounts",
        audienceResponse: "Extremely high comment debate and share rate",
        strengths: "Immense credibility and scientific backing",
        weaknesses: "Overly technical jargon can confuse casual fitness buyers",
        whatTheyDoWell: "Viral controversy hooks and myth-busting content",
        whatTheyAreMissing: "Lifestyle appeal; feel-good community stories",
        contentGaps: "Quick 2-minute snack recipes for working professionals",
        opportunitiesForUs: "Simplify the science with approachable infographics",
        ideasToLearnFrom: "Displaying third-party lab certifications to build trust",
        thingsToAvoid: "Attacking other brands directly in an aggressive tone",
      },
      keyTakeaways:
        "Competitors are winning through high-speed hook pacing and scientific authority, but failing to cater to beginner audiences with empathetic support.",
      overallOpportunities:
        "Own the 'Approachable High-Performance' category by combining dynamic, fast-paced reels with friendly, relatable community engagement and clear DM automation.",
      strategyIdeas:
        "1. Launch a weekly 'Myth vs Fact' short video series with doctor backed citations.\n2. Implement comment-to-DM automated lead magnets for custom workout/diet planners.\n3. Highlight real customer transformations with raw, authentic video testimonials.",
    });
  };

  const clearAnalysis = () => {
    onChange(DEFAULT_COMPETITOR_ANALYSIS);
  };

  return (
    <div
      className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151311] overflow-hidden shadow-sm transition-all ${className}`}
    >
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              COMPETITOR ANALYSIS SHEET
            </h2>
          </div>
          <p className="text-xs text-stone-300 font-mono tracking-wider uppercase">
            Analyze · Compare · Find Opportunities
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={prefillSampleAnalysis}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Intel</span>
          </button>
          <button
            type="button"
            onClick={clearAnalysis}
            className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle section"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Purpose Banner */}
      <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-900/40 flex items-start gap-3">
        <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
          <strong className="font-bold">Purpose:</strong> Use this matrix to analyze your top 3 competitors' content, social performance, visual strategy, and audience response so our team can exploit market gaps and position your brand to win.
        </p>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-6 space-y-8">
          {/* Mobile Tab Switcher */}
          <div className="block lg:hidden">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveMobileTab("c1")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeMobileTab === "c1"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400"
                }`}
              >
                Competitor 1
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab("c2")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeMobileTab === "c2"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400"
                }`}
              >
                Competitor 2
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab("c3")}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeMobileTab === "c3"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400"
                }`}
              >
                Competitor 3
              </button>
            </div>
          </div>

          {/* Master Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
            <table className="w-full text-left border-collapse min-w-[760px] text-xs">
              <thead>
                <tr>
                  <th className="w-1/4 p-3.5 bg-stone-800 text-white font-bold tracking-wider uppercase text-[11px] border-r border-stone-700">
                    Category
                  </th>
                  <th
                    className={`w-1/4 p-3.5 font-bold tracking-wider uppercase text-[11px] border-r border-stone-200 dark:border-stone-800 ${
                      activeMobileTab === "c1" ? "table-cell" : "hidden lg:table-cell"
                    } bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200`}
                  >
                    Competitor 1
                  </th>
                  <th
                    className={`w-1/4 p-3.5 font-bold tracking-wider uppercase text-[11px] border-r border-stone-200 dark:border-stone-800 ${
                      activeMobileTab === "c2" ? "table-cell" : "hidden lg:table-cell"
                    } bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200`}
                  >
                    Competitor 2
                  </th>
                  <th
                    className={`w-1/4 p-3.5 font-bold tracking-wider uppercase text-[11px] ${
                      activeMobileTab === "c3" ? "table-cell" : "hidden lg:table-cell"
                    } bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200`}
                  >
                    Competitor 3
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {/* 1. Competitor Name */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Competitor Name</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].name}
                          onChange={(e) => updateCompetitor(ckey, "name", e.target.value)}
                          placeholder="e.g. Brand Name"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 2. Website */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-stone-500" />
                    <span>Website</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].website}
                          onChange={(e) => updateCompetitor(ckey, "website", e.target.value)}
                          placeholder="https://"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 3. Social Media Primary Handle */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-stone-500" />
                    <span>Social Media Handles</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-stone-400">
                            <Instagram className="w-3.5 h-3.5 text-pink-500" />
                            <Facebook className="w-3.5 h-3.5 text-blue-600" />
                            <Youtube className="w-3.5 h-3.5 text-red-500" />
                            <Linkedin className="w-3.5 h-3.5 text-blue-700" />
                            <span className="text-[10px] font-bold">TikTok</span>
                            <Twitter className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                          </div>
                          <input
                            type="text"
                            value={data[ckey].primaryHandle}
                            onChange={(e) => updateCompetitor(ckey, "primaryHandle", e.target.value)}
                            placeholder="@username"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Platform-wise Followers */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Platform-wise Followers</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    const f = data[ckey].followers;
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-1">
                            <Instagram className="w-3 h-3 text-pink-500 shrink-0" />
                            <input
                              type="text"
                              value={f.instagram}
                              onChange={(e) => updateFollower(ckey, "instagram", e.target.value)}
                              placeholder="0"
                              className="w-12 px-1.5 py-1 text-[11px] rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center font-mono"
                            />
                            <span className="text-[10px] text-stone-400">K</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Facebook className="w-3 h-3 text-blue-600 shrink-0" />
                            <input
                              type="text"
                              value={f.facebook}
                              onChange={(e) => updateFollower(ckey, "facebook", e.target.value)}
                              placeholder="0"
                              className="w-12 px-1.5 py-1 text-[11px] rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center font-mono"
                            />
                            <span className="text-[10px] text-stone-400">K</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                            <input
                              type="text"
                              value={f.youtube}
                              onChange={(e) => updateFollower(ckey, "youtube", e.target.value)}
                              placeholder="0"
                              className="w-12 px-1.5 py-1 text-[11px] rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center font-mono"
                            />
                            <span className="text-[10px] text-stone-400">K</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Linkedin className="w-3 h-3 text-blue-700 shrink-0" />
                            <input
                              type="text"
                              value={f.linkedin}
                              onChange={(e) => updateFollower(ckey, "linkedin", e.target.value)}
                              placeholder="0"
                              className="w-12 px-1.5 py-1 text-[11px] rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center font-mono"
                            />
                            <span className="text-[10px] text-stone-400">K</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-stone-500 shrink-0">TT</span>
                            <input
                              type="text"
                              value={f.tiktok}
                              onChange={(e) => updateFollower(ckey, "tiktok", e.target.value)}
                              placeholder="0"
                              className="w-12 px-1.5 py-1 text-[11px] rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center font-mono"
                            />
                            <span className="text-[10px] text-stone-400">K</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Twitter className="w-3 h-3 text-stone-700 dark:text-stone-300 shrink-0" />
                            <input
                              type="text"
                              value={f.x}
                              onChange={(e) => updateFollower(ckey, "x", e.target.value)}
                              placeholder="0"
                              className="w-12 px-1.5 py-1 text-[11px] rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-center font-mono"
                            />
                            <span className="text-[10px] text-stone-400">K</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 5. Posting Frequency */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>Posting Frequency</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].postingFrequency}
                          onChange={(e) => updateCompetitor(ckey, "postingFrequency", e.target.value)}
                          placeholder="e.g. 3 posts/week"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 6. Content Pillars */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-stone-500" />
                    <span>Content Pillars</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].contentPillars}
                          onChange={(e) => updateCompetitor(ckey, "contentPillars", e.target.value)}
                          placeholder="e.g. Education, Promotion, Lifestyle"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 7. Content Formats */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-stone-500" />
                    <span>Content Formats</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    const currentFormats = data[ckey].contentFormats || [];
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            {FORMAT_OPTIONS.map((fmt) => {
                              const checked = currentFormats.includes(fmt);
                              return (
                                <label
                                  key={fmt}
                                  className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 dark:text-stone-300"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleFormat(ckey, fmt)}
                                    className="rounded border-stone-300 dark:border-stone-700 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span>{fmt}</span>
                                </label>
                              );
                            })}
                          </div>
                          <input
                            type="text"
                            value={data[ckey].contentFormatsOther}
                            onChange={(e) => updateCompetitor(ckey, "contentFormatsOther", e.target.value)}
                            placeholder="Other format..."
                            className="w-full px-2 py-1 rounded bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 8. Best-performing Content */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-stone-500" />
                    <span>Best-performing Content</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].bestPerformingContent}
                          onChange={(e) => updateCompetitor(ckey, "bestPerformingContent", e.target.value)}
                          placeholder="e.g. Product tips reel, Client testimonial"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 9. Average Engagement */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <ThumbsUp className="w-3.5 h-3.5 text-stone-500" />
                    <span>Average Engagement</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].averageEngagement}
                          onChange={(e) => updateCompetitor(ckey, "averageEngagement", e.target.value)}
                          placeholder="e.g. 500 likes, 50 comments"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 10. Engagement Rate */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-stone-500" />
                    <span>Engagement Rate</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].engagementRate}
                          onChange={(e) => updateCompetitor(ckey, "engagementRate", e.target.value)}
                          placeholder="e.g. 2.5%"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 11. Reels Strategy */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-stone-500" />
                    <span>Reels Strategy</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].reelsStrategy}
                          onChange={(e) => updateCompetitor(ckey, "reelsStrategy", e.target.value)}
                          placeholder="e.g. Tutorials, Trends, Behind the Scenes"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 12. Carousel / Post Strategy */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span>Carousel / Post Strategy</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].carouselStrategy}
                          onChange={(e) => updateCompetitor(ckey, "carouselStrategy", e.target.value)}
                          placeholder="e.g. Tips, Lists, Case Studies"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 13. Caption Style */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                    <span>Caption Style</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].captionStyle}
                          onChange={(e) => updateCompetitor(ckey, "captionStyle", e.target.value)}
                          placeholder="e.g. Short, Storytelling, Detailed"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 14. Hook Style */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                    <span>Hook Style</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].hookStyle}
                          onChange={(e) => updateCompetitor(ckey, "hookStyle", e.target.value)}
                          placeholder="e.g. Question, Bold Statement, Problem"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 15. CTA Strategy */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <MousePointerClick className="w-3.5 h-3.5 text-stone-500" />
                    <span>CTA Strategy</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].ctaStrategy}
                          onChange={(e) => updateCompetitor(ckey, "ctaStrategy", e.target.value)}
                          placeholder="e.g. Follow, Comment, Visit Website"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 16. Hashtag/SEO Strategy */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-stone-500" />
                    <span>Hashtag/SEO Strategy</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].hashtagStrategy}
                          onChange={(e) => updateCompetitor(ckey, "hashtagStrategy", e.target.value)}
                          placeholder="e.g. Niche hashtags, Branded hashtags"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 17. Visual Style */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-stone-500" />
                    <span>Visual Style</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].visualStyle}
                          onChange={(e) => updateCompetitor(ckey, "visualStyle", e.target.value)}
                          placeholder="e.g. Clean, Minimal, Bold, Colorful"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 18. Brand Voice */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Brand Voice</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].brandVoice}
                          onChange={(e) => updateCompetitor(ckey, "brandVoice", e.target.value)}
                          placeholder="e.g. Professional, Friendly, Fun"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 19. Offers / Promotions */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-stone-500" />
                    <span>Offers / Promotions</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].offersPromotions}
                          onChange={(e) => updateCompetitor(ckey, "offersPromotions", e.target.value)}
                          placeholder="e.g. Discounts, Freebies, Limited Time"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 20. Audience Response */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                    <span>Audience Response</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <input
                          type="text"
                          value={data[ckey].audienceResponse}
                          onChange={(e) => updateCompetitor(ckey, "audienceResponse", e.target.value)}
                          placeholder="e.g. Positive, Active, High Engagement"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 21. Strengths */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Strengths</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={data[ckey].strengths}
                          onChange={(e) => updateCompetitor(ckey, "strengths", e.target.value)}
                          placeholder="What are they good at?"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 22. Weaknesses */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Weaknesses</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={data[ckey].weaknesses}
                          onChange={(e) => updateCompetitor(ckey, "weaknesses", e.target.value)}
                          placeholder="Where do they lack?"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 23. What They're Doing Well */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>What They're Doing Well</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={data[ckey].whatTheyDoWell}
                          onChange={(e) => updateCompetitor(ckey, "whatTheyDoWell", e.target.value)}
                          placeholder="Key things working for them"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 24. What They're Missing */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>What They're Missing</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={data[ckey].whatTheyAreMissing}
                          onChange={(e) => updateCompetitor(ckey, "whatTheyAreMissing", e.target.value)}
                          placeholder="What are they not doing?"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 25. Content Gaps */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Content Gaps</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={data[ckey].contentGaps}
                          onChange={(e) => updateCompetitor(ckey, "contentGaps", e.target.value)}
                          placeholder="Topics or formats they don't cover"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 26. Opportunities for Our Brand */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Opportunities for Our Brand</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={data[ckey].opportunitiesForUs}
                          onChange={(e) => updateCompetitor(ckey, "opportunitiesForUs", e.target.value)}
                          placeholder="How can we do it better?"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 27. Ideas We Can Learn From */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>Ideas We Can Learn From</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={data[ckey].ideasToLearnFrom}
                          onChange={(e) => updateCompetitor(ckey, "ideasToLearnFrom", e.target.value)}
                          placeholder="Content ideas, strategies, approaches"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 28. Things We Should Avoid */}
                <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                  <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 bg-stone-50/80 dark:bg-stone-900/60 border-r border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                    <span>Things We Should Avoid</span>
                  </td>
                  {(["competitor1", "competitor2", "competitor3"] as const).map((ckey) => {
                    const isVisible =
                      ckey === "competitor1"
                        ? activeMobileTab === "c1"
                        : ckey === "competitor2"
                        ? activeMobileTab === "c2"
                        : activeMobileTab === "c3";
                    return (
                      <td
                        key={ckey}
                        className={`p-2.5 border-r last:border-r-0 border-stone-200 dark:border-stone-800 ${
                          isVisible ? "table-cell" : "hidden lg:table-cell"
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={data[ckey].thingsToAvoid}
                          onChange={(e) => updateCompetitor(ckey, "thingsToAvoid", e.target.value)}
                          placeholder="Mistakes or things that don't work"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Row: Overall Insights & Strategy */}
          <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1a1714] space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Overall Insights & Strategy
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Key Takeaways */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Key Takeaways</span>
                </label>
                <textarea
                  rows={4}
                  value={data.keyTakeaways}
                  onChange={(e) => onChange({ ...data, keyTakeaways: e.target.value })}
                  placeholder="Main learnings from competitor analysis."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Opportunities */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Opportunities</span>
                </label>
                <textarea
                  rows={4}
                  value={data.overallOpportunities}
                  onChange={(e) => onChange({ ...data, overallOpportunities: e.target.value })}
                  placeholder="Areas where we can stand out."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Strategy Ideas for Our Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Strategy Ideas for Our Brand</span>
                </label>
                <textarea
                  rows={4}
                  value={data.strategyIdeas}
                  onChange={(e) => onChange({ ...data, strategyIdeas: e.target.value })}
                  placeholder="Actionable ideas based on this analysis."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
