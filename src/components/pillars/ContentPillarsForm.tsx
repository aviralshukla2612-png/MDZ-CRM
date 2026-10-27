"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  ShoppingBag,
  Users,
  ShieldCheck,
  Smile,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart3,
  Calendar,
  CheckCircle2,
  Tag,
  Hash,
  Layers,
  ArrowRight,
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

  const togglePillarFormat = (
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
      title: "Educational Content",
      badge: "Teach · Inform · Add Value",
      icon: GraduationCap,
      color: "emerald",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
      borderLight: "border-emerald-200 dark:border-emerald-900/50",
      badgeClass: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300",
      numClass: "bg-emerald-600 text-white",
    },
    {
      key: "promotional" as const,
      num: 2,
      title: "Promotional Content",
      badge: "Showcase · Sell · Drive Conversions",
      icon: ShoppingBag,
      color: "rose",
      bgLight: "bg-rose-50 dark:bg-rose-950/20",
      borderLight: "border-rose-200 dark:border-rose-900/50",
      badgeClass: "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300",
      numClass: "bg-rose-600 text-white",
    },
    {
      key: "engagement" as const,
      num: 3,
      title: "Engagement Content",
      badge: "Start Conversations · Build Community",
      icon: Users,
      color: "amber",
      bgLight: "bg-amber-50 dark:bg-amber-950/20",
      borderLight: "border-amber-200 dark:border-amber-900/50",
      badgeClass: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300",
      numClass: "bg-amber-600 text-white",
    },
    {
      key: "trustAuthority" as const,
      num: 4,
      title: "Trust / Authority Content",
      badge: "Build Credibility · Showcase Expertise",
      icon: ShieldCheck,
      color: "purple",
      bgLight: "bg-purple-50 dark:bg-purple-950/20",
      borderLight: "border-purple-200 dark:border-purple-900/50",
      badgeClass: "bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300",
      numClass: "bg-purple-600 text-white",
    },
    {
      key: "entertainment" as const,
      num: 5,
      title: "Entertainment / Relatable Content",
      badge: "Entertain · Connect · Make it Relatable",
      icon: Smile,
      color: "blue",
      bgLight: "bg-blue-50 dark:bg-blue-950/20",
      borderLight: "border-blue-200 dark:border-blue-900/50",
      badgeClass: "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300",
      numClass: "bg-blue-600 text-white",
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151311] overflow-hidden shadow-sm transition-all ${className}`}
    >
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              CONTENT PILLARS SHEET
            </h2>
          </div>
          <p className="text-xs text-stone-300 font-mono tracking-wider uppercase">
            PLAN · CREATE · ENGAGE · CONVERT
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CONTENT_PILLARS)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Strategy Template</span>
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
          <strong className="font-bold">Purpose:</strong> This sheet defines your brand&apos;s 5 primary content pillars, topics, formats, and CTAs so our agency creates consistent, relevant, high-converting social media deliverables.
        </p>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-6 space-y-8">
          {/* 5 Core Pillars */}
          <div className="space-y-6">
            {pillarsConfig.map((cfg) => {
              const pillar = data[cfg.key];
              const Icon = cfg.icon;

              return (
                <div
                  key={cfg.key}
                  className={`rounded-xl border ${cfg.borderLight} ${cfg.bgLight} p-4 sm:p-5 space-y-4 transition-all shadow-xs`}
                >
                  {/* Pillar Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-stone-200/60 dark:border-stone-800/80">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-md ${cfg.numClass} text-xs font-black flex items-center justify-center shadow-xs`}
                      >
                        {cfg.num}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {cfg.title}
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.badgeClass} self-start sm:self-auto`}
                    >
                      {cfg.badge}
                    </span>
                  </div>

                  {/* Top Grid: Name, Description, Purpose, Audience, Topics, Subtopics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    {/* Content Pillar Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Content Pillar Name
                      </label>
                      <input
                        type="text"
                        value={pillar.pillarName}
                        onChange={(e) => updatePillar(cfg.key, "pillarName", e.target.value)}
                        placeholder="e.g. Tips, How-to, Guides"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Pillar Description */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Pillar Description
                      </label>
                      <input
                        type="text"
                        value={pillar.description}
                        onChange={(e) => updatePillar(cfg.key, "description", e.target.value)}
                        placeholder="Brief description of this pillar."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Purpose of the Pillar */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Purpose of the Pillar
                      </label>
                      <input
                        type="text"
                        value={pillar.purpose}
                        onChange={(e) => updatePillar(cfg.key, "purpose", e.target.value)}
                        placeholder="What do you want to achieve?"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        value={pillar.targetAudience}
                        onChange={(e) => updatePillar(cfg.key, "targetAudience", e.target.value)}
                        placeholder="Who is this for?"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Topics Covered (3 Items) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Topics Covered
                      </label>
                      <div className="space-y-1">
                        {[0, 1, 2].map((idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={pillar.topicsCovered?.[idx] || ""}
                            onChange={(e) =>
                              updateArrayField(cfg.key, "topicsCovered", idx, e.target.value)
                            }
                            placeholder={`• Topic ${idx + 1}`}
                            className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Sub-topics (3 Items) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Sub-topics
                      </label>
                      <div className="space-y-1">
                        {[0, 1, 2].map((idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={pillar.subTopics?.[idx] || ""}
                            onChange={(e) =>
                              updateArrayField(cfg.key, "subTopics", idx, e.target.value)
                            }
                            placeholder={`• Sub-topic ${idx + 1}`}
                            className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Grid: Formats, Examples, CTAs, Priority, Keywords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
                    {/* Content Formats */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Content Formats
                      </label>
                      <div className="space-y-1">
                        {FORMAT_OPTIONS.map((fmt) => {
                          const checked = (pillar.formats || []).includes(fmt);
                          return (
                            <label
                              key={fmt}
                              className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 dark:text-stone-300"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePillarFormat(cfg.key, fmt)}
                                className="rounded border-stone-300 dark:border-stone-700 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{fmt}</span>
                            </label>
                          );
                        })}
                        <input
                          type="text"
                          value={pillar.formatsOther}
                          onChange={(e) => updatePillar(cfg.key, "formatsOther", e.target.value)}
                          placeholder="Other: ..."
                          className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[10px] focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Content Examples (3 items) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Content Examples
                      </label>
                      <div className="space-y-1">
                        {[0, 1, 2].map((idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={pillar.contentExamples?.[idx] || ""}
                            onChange={(e) =>
                              updateArrayField(cfg.key, "contentExamples", idx, e.target.value)
                            }
                            placeholder={`• Example ${idx + 1}`}
                            className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        ))}
                      </div>
                    </div>

                    {/* CTA Ideas */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        CTA Ideas
                      </label>
                      <textarea
                        rows={3}
                        value={pillar.ctaIdeas}
                        onChange={(e) => updatePillar(cfg.key, "ctaIdeas", e.target.value)}
                        placeholder="e.g. Save for later · Follow for more · Comment thoughts"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                      />
                    </div>

                    {/* Content Frequency / Priority */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Content Frequency / Priority
                      </label>
                      <div className="flex gap-2">
                        {(["High", "Medium", "Low"] as const).map((p) => (
                          <label
                            key={p}
                            className={`flex-1 py-1 text-center rounded border text-[11px] font-bold cursor-pointer transition-all ${
                              pillar.priority === p
                                ? p === "High"
                                  ? "bg-rose-500 border-rose-500 text-white"
                                  : p === "Medium"
                                  ? "bg-amber-500 border-amber-500 text-white"
                                  : "bg-stone-400 border-stone-400 text-white"
                                : "bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`priority-${cfg.key}`}
                              checked={pillar.priority === p}
                              onChange={() => updatePillar(cfg.key, "priority", p)}
                              className="hidden"
                            />
                            {p}
                          </label>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={pillar.plannedFrequency}
                        onChange={(e) => updatePillar(cfg.key, "plannedFrequency", e.target.value)}
                        placeholder="e.g. 3 posts/week"
                        className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                    </div>

                    {/* Relevant Keywords / Topics */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        Relevant Keywords / Topics
                      </label>
                      <textarea
                        rows={3}
                        value={pillar.keywords}
                        onChange={(e) => updatePillar(cfg.key, "keywords", e.target.value)}
                        placeholder="Add relevant keywords..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Section: Overall Notes & Strategy + Content Frequency Summary Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* Overall Notes & Strategy */}
            <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1a1714] space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Overall Notes & Strategy
                </h4>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Add any additional notes, content strategy pointers, seasonal topics, or important campaign details.
              </p>
              <textarea
                rows={5}
                value={data.overallNotes}
                onChange={(e) => onChange({ ...data, overallNotes: e.target.value })}
                placeholder="Add any additional notes, content strategy pointers, seasonal topics, or important details here..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
              />
            </div>

            {/* Content Frequency Summary Table */}
            <div className="p-4 sm:p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Content Frequency Summary
                </h4>
              </div>

              <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400">
                      <th className="p-2.5">Content Pillar</th>
                      <th className="p-2.5">Planned Frequency (per week)</th>
                      <th className="p-2.5 text-center">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-[11px]">
                    {pillarsConfig.map((cfg) => {
                      const p = data[cfg.key];
                      return (
                        <tr key={cfg.key} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                          <td className="p-2.5 font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${cfg.numClass}`} />
                            <span>{cfg.title.split(" ")[0]}</span>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={p.plannedFrequency}
                              onChange={(e) =>
                                updatePillar(cfg.key, "plannedFrequency", e.target.value)
                              }
                              placeholder="e.g. 3 posts/week"
                              className="w-full px-2 py-1 rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center justify-center gap-2">
                              {(["High", "Medium", "Low"] as const).map((pr) => (
                                <label
                                  key={pr}
                                  className="flex items-center gap-1 cursor-pointer text-[10px]"
                                >
                                  <input
                                    type="radio"
                                    name={`summary-priority-${cfg.key}`}
                                    checked={p.priority === pr}
                                    onChange={() => updatePillar(cfg.key, "priority", pr)}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span>{pr}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
