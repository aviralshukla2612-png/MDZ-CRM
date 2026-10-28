"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  ShoppingBag,
  Users,
  ShieldCheck,
  Smile,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Target,
  FileText,
  Calendar,
} from "lucide-react";

export interface PillarItem {
  pillarName: string;
  description: string;
  purpose: string;
  targetAudience: string;
  topicsCovered: string[];
  subTopics: string[];
  formats: string[];
  formatsOther: string;
  contentExamples: string[];
  ctaIdeas: string;
  priority: "High" | "Medium" | "Low";
  keywords: string;
  plannedFrequency: string;
}

export interface ContentPillarsData {
  educational: PillarItem;
  promotional: PillarItem;
  engagement: PillarItem;
  trustAuthority: PillarItem;
  entertainment: PillarItem;
  overallNotes: string;
}

const createDefaultPillar = (
  name: string,
  desc: string,
  purpose: string,
  audience: string,
  topics: string[],
  subTopics: string[],
  formats: string[],
  examples: string[],
  cta: string,
  priority: "High" | "Medium" | "Low",
  keywords: string,
  frequency: string
): PillarItem => ({
  pillarName: name,
  description: desc,
  purpose,
  targetAudience: audience,
  topicsCovered: topics,
  subTopics,
  formats,
  formatsOther: "",
  contentExamples: examples,
  ctaIdeas: cta,
  priority,
  keywords,
  plannedFrequency: frequency,
});

export const DEFAULT_CONTENT_PILLARS: ContentPillarsData = {
  educational: createDefaultPillar(
    "Tips, How-to, Guides",
    "Actionable industry insights, step-by-step tutorials and best practices.",
    "Teach, inform, and build top-of-mind educational authority.",
    "Prospects seeking practical solutions and domain clarity.",
    ["Core framework breakdown", "Common mistakes to avoid", "Step-by-step implementation"],
    ["Beginner mistakes", "Pro tips & shortcuts", "Tools & resource checklist"],
    ["Reels / Short Videos", "Carousels"],
    ["3 mistakes killing your retention", "How we saved ₹50K in ad spend", "5-step workflow breakdown"],
    "Save for later · Follow for more · Comment your thoughts",
    "High",
    "how to, guide, strategy, tips, best practices",
    "3 posts/week"
  ),
  promotional: createDefaultPillar(
    "Product / Service Promotion",
    "Direct showcase of our client offerings, features, and launch campaigns.",
    "Drive conversions, inbound inquiries, and direct sales.",
    "High-intent prospects and warm followers ready to take action.",
    ["Feature spotlight", "Service package comparison", "Limited time offer / seasonal drop"],
    ["Pricing & deliverables", "How to get started", "FAQ on onboarding"],
    ["Reels / Short Videos", "Single Posts", "Stories"],
    ["Behind the scenes of our flagship service", "Client bundle launch offer", "Why clients switch to us"],
    "Shop now · Book a strategy call · DM for details",
    "Medium",
    "discount, offer, service, package, book now",
    "2 posts/week"
  ),
  engagement: createDefaultPillar(
    "Polls, Questions, Trends",
    "Interactive, community-focused content designed to spark discussions.",
    "Start conversations, boost algorithmic engagement, and foster community.",
    "Broad active followers, peers, and industry enthusiasts.",
    ["This or That debates", "Industry hot takes", "Audience AMA & Q&A"],
    ["Agree or disagree", "Share your biggest struggle", "Vote on next topic"],
    ["Carousels", "Stories", "Reels / Short Videos"],
    ["Which aesthetic do you prefer? A or B", "What is your biggest roadblock this month?", "Hot take: why traditional ads fail"],
    "Comment below · Share your opinion · Tag a friend",
    "High",
    "debate, hot take, question, poll, vote, opinion",
    "3 posts/week"
  ),
  trustAuthority: createDefaultPillar(
    "Case Studies, Reviews, Behind the Scenes",
    "Evidence of client success, testimonials, awards, and work culture.",
    "Build credibility, eliminate buying skepticism, and showcase expertise.",
    "Skeptical buyers, enterprise decision-makers, and high-ticket clients.",
    ["Client case study results", "Before & After transformations", "Founder journey & team behind the scenes"],
    ["Measurable ROAS/revenue stats", "Client video testimonial", "Process transparency breakdown"],
    ["Carousels", "Reels / Short Videos"],
    ["How Brand X scaled from 10K to 250K followers", "Honest client review video", "A day in our production studio"],
    "Read full case study · Visit our website · DM for consultation",
    "High",
    "case study, results, testimonial, review, transformation",
    "2 posts/week"
  ),
  entertainment: createDefaultPillar(
    "Memes, Day in Life, Relatable Content",
    "Humorous, culturally relevant, and humanizing content.",
    "Entertain, connect emotionally, and make the brand relatable.",
    "Casual social scrollers, everyday consumers, and younger demographics.",
    ["Relatable workplace humor", "Expectation vs Reality", "Trending sound adaptation"],
    ["Client vs agency dynamics", "Monday morning feeling", "Industry insider jokes"],
    ["Reels / Short Videos", "Single Posts"],
    ["When the client says 'make it pop'", "Expectation vs reality of launching a brand", "POV: working late before a big campaign"],
    "Follow for more · Tag someone who needs this · Share if you relate",
    "Medium",
    "humor, relatable, meme, pov, behind the scenes",
    "2 posts/week"
  ),
  overallNotes:
    "Maintain a balanced 40% Educational, 20% Trust, 20% Engagement, 10% Promotional, 10% Entertainment distribution across all channels.",
};

const FORMAT_OPTIONS = [
  "Reels / Short Videos",
  "Carousels",
  "Single Posts",
  "Stories",
  "Live Sessions",
];

interface ContentPillarsFormProps {
  value?: ContentPillarsData;
  onChange: (data: ContentPillarsData) => void;
  className?: string;
}

export function ContentPillarsForm({
  value = DEFAULT_CONTENT_PILLARS,
  onChange,
  className = "",
}: ContentPillarsFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "educational" | "promotional" | "engagement" | "trustAuthority" | "entertainment" | "notes"
  >("educational");

  const data: ContentPillarsData = {
    educational: { ...DEFAULT_CONTENT_PILLARS.educational, ...(value.educational || {}) },
    promotional: { ...DEFAULT_CONTENT_PILLARS.promotional, ...(value.promotional || {}) },
    engagement: { ...DEFAULT_CONTENT_PILLARS.engagement, ...(value.engagement || {}) },
    trustAuthority: { ...DEFAULT_CONTENT_PILLARS.trustAuthority, ...(value.trustAuthority || {}) },
    entertainment: { ...DEFAULT_CONTENT_PILLARS.entertainment, ...(value.entertainment || {}) },
    overallNotes: value.overallNotes ?? DEFAULT_CONTENT_PILLARS.overallNotes,
  };

  const updatePillar = (
    pillarKey: keyof Omit<ContentPillarsData, "overallNotes">,
    field: keyof PillarItem,
    val: any
  ) => {
    onChange({
      ...data,
      [pillarKey]: {
        ...data[pillarKey],
        [field]: val,
      },
    });
  };

  const toggleFormat = (
    pillarKey: keyof Omit<ContentPillarsData, "overallNotes">,
    format: string
  ) => {
    const current = data[pillarKey].formats || [];
    const updated = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    updatePillar(pillarKey, "formats", updated);
  };

  const updateArrayField = (
    pillarKey: keyof Omit<ContentPillarsData, "overallNotes">,
    field: "topicsCovered" | "subTopics" | "contentExamples",
    index: number,
    val: string
  ) => {
    const list = [...(data[pillarKey][field] || ["", "", ""])];
    list[index] = val;
    updatePillar(pillarKey, field, list);
  };

  const pillarsConfig = [
    {
      key: "educational" as const,
      num: 1,
      title: "Educational",
      fullTitle: "Educational Content",
      badge: "Teach · Inform · Add Value",
      icon: GraduationCap,
    },
    {
      key: "promotional" as const,
      num: 2,
      title: "Promotional",
      fullTitle: "Promotional Content",
      badge: "Showcase · Sell · Conversions",
      icon: ShoppingBag,
    },
    {
      key: "engagement" as const,
      num: 3,
      title: "Engagement",
      fullTitle: "Engagement Content",
      badge: "Start Debates · Community",
      icon: Users,
    },
    {
      key: "trustAuthority" as const,
      num: 4,
      title: "Trust & Authority",
      fullTitle: "Trust / Authority Content",
      badge: "Case Studies · Proof · Credibility",
      icon: ShieldCheck,
    },
    {
      key: "entertainment" as const,
      num: 5,
      title: "Entertainment",
      fullTitle: "Entertainment Content",
      badge: "Memes · Relatable · Culture",
      icon: Smile,
    },
  ];

  const currentCfg = pillarsConfig.find((c) => c.key === activeTab);
  const currentPillar = activeTab !== "notes" ? data[activeTab] : null;

  return (
    <div
      className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#1a1714] p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* Native Form Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Content Pillars & Strategy Plan</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-normal">
                5 Strategic Buckets
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Define your core content buckets so our agency creates balanced, high-converting social media deliverables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CONTENT_PILLARS)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Strategy</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                educational: createDefaultPillar("", "", "", "", ["", "", ""], ["", "", ""], [], ["", "", ""], "", "High", "", ""),
                promotional: createDefaultPillar("", "", "", "", ["", "", ""], ["", "", ""], [], ["", "", ""], "", "Medium", "", ""),
                engagement: createDefaultPillar("", "", "", "", ["", "", ""], ["", "", ""], [], ["", "", ""], "", "High", "", ""),
                trustAuthority: createDefaultPillar("", "", "", "", ["", "", ""], ["", "", ""], [], ["", "", ""], "", "High", "", ""),
                entertainment: createDefaultPillar("", "", "", "", ["", "", ""], ["", "", ""], [], ["", "", ""], "", "Medium", "", ""),
                overallNotes: "",
              })
            }
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
          {/* Pillar Pill Tabs */}
          <div className="flex flex-wrap gap-2">
            {pillarsConfig.map((cfg) => {
              const isActive = activeTab === cfg.key;
              return (
                <button
                  key={cfg.key}
                  type="button"
                  onClick={() => setActiveTab(cfg.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white dark:bg-[#1f1c18] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-emerald-500"
                  }`}
                >
                  <span className={`text-[10px] px-1 rounded ${isActive ? "bg-emerald-700" : "bg-stone-200 dark:bg-stone-800"}`}>
                    {cfg.num}
                  </span>
                  <span>{cfg.title}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeTab === "notes"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white dark:bg-[#1f1c18] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-emerald-500"
              }`}
            >
              <span>Strategy Notes</span>
            </button>
          </div>

          {/* Active Pillar Form Body */}
          {activeTab !== "notes" && currentCfg && currentPillar && (
            <div className="space-y-4 animate-fade-in">
              {/* Badge Bar */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200/80 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                    {currentCfg.num}
                  </span>
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                    {currentCfg.fullTitle}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                  {currentCfg.badge}
                </span>
              </div>

              {/* Row 1: Pillar Name & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Content Pillar Name
                  </label>
                  <input
                    type="text"
                    value={currentPillar.pillarName}
                    onChange={(e) => updatePillar(currentCfg.key, "pillarName", e.target.value)}
                    placeholder="e.g. Tips, How-to, Guides"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Target Audience for this Bucket
                  </label>
                  <input
                    type="text"
                    value={currentPillar.targetAudience}
                    onChange={(e) => updatePillar(currentCfg.key, "targetAudience", e.target.value)}
                    placeholder="e.g. Beginners seeking practical solutions"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Purpose & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Purpose of this Pillar
                  </label>
                  <input
                    type="text"
                    value={currentPillar.purpose}
                    onChange={(e) => updatePillar(currentCfg.key, "purpose", e.target.value)}
                    placeholder="e.g. Teach, inform, and build top-of-mind educational authority"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Pillar Description / Angle
                  </label>
                  <input
                    type="text"
                    value={currentPillar.description}
                    onChange={(e) => updatePillar(currentCfg.key, "description", e.target.value)}
                    placeholder="Actionable industry insights, step-by-step tutorials..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Topics Covered & Sub-topics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200/80 dark:border-stone-800">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Core Topics Covered (3 Items)
                  </label>
                  <div className="space-y-1.5">
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={currentPillar.topicsCovered?.[idx] || ""}
                        onChange={(e) => updateArrayField(currentCfg.key, "topicsCovered", idx, e.target.value)}
                        placeholder={`• Topic ${idx + 1}`}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200/80 dark:border-stone-800">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Sub-topics & Angles (3 Items)
                  </label>
                  <div className="space-y-1.5">
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={currentPillar.subTopics?.[idx] || ""}
                        onChange={(e) => updateArrayField(currentCfg.key, "subTopics", idx, e.target.value)}
                        placeholder={`• Sub-topic ${idx + 1}`}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 4: Preferred Formats Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Preferred Content Formats
                </label>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((fmt) => {
                    const isSelected = currentPillar.formats?.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => toggleFormat(currentCfg.key, fmt)}
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

              {/* Row 5: Content Examples & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200/80 dark:border-stone-800">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Content Headline / Hook Examples
                  </label>
                  <div className="space-y-1.5">
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={currentPillar.contentExamples?.[idx] || ""}
                        onChange={(e) => updateArrayField(currentCfg.key, "contentExamples", idx, e.target.value)}
                        placeholder={`Example ${idx + 1}`}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Call To Action (CTA) Ideas
                    </label>
                    <input
                      type="text"
                      value={currentPillar.ctaIdeas}
                      onChange={(e) => updatePillar(currentCfg.key, "ctaIdeas", e.target.value)}
                      placeholder="e.g. Save for later · Follow for more · Comment below"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Relevant Keywords / Hashtags
                    </label>
                    <input
                      type="text"
                      value={currentPillar.keywords}
                      onChange={(e) => updatePillar(currentCfg.key, "keywords", e.target.value)}
                      placeholder="e.g. how to, tips, strategy, guide"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Frequency & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Planned Frequency
                  </label>
                  <input
                    type="text"
                    value={currentPillar.plannedFrequency}
                    onChange={(e) => updatePillar(currentCfg.key, "plannedFrequency", e.target.value)}
                    placeholder="e.g. 3 posts/week"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Strategic Priority
                  </label>
                  <div className="flex gap-2">
                    {(["High", "Medium", "Low"] as const).map((pri) => {
                      const isSelected = currentPillar.priority === pri;
                      return (
                        <button
                          key={pri}
                          type="button"
                          onClick={() => updatePillar(currentCfg.key, "priority", pri)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? pri === "High"
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : pri === "Medium"
                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                : "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white dark:bg-[#1f1c18] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-emerald-500"
                          }`}
                        >
                          {pri}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Overall Strategy Notes */}
          {activeTab === "notes" && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Content Distribution & Channel Strategy Notes</span>
                </label>
                <textarea
                  rows={4}
                  value={data.overallNotes}
                  onChange={(e) => onChange({ ...data, overallNotes: e.target.value })}
                  placeholder="e.g. Maintain a balanced 40% Educational, 20% Trust, 20% Engagement, 10% Promotional distribution..."
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
