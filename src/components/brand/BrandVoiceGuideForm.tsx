"use client";

import React from "react";
import {
  Sparkles,
  Volume2,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Globe,
  Smile,
  Hash,
  Share2,
  PenTool,
  Sliders,
  Type,
  HelpCircle,
} from "lucide-react";

export interface BrandVoiceGuideData {
  // 1. Brand Overview
  brandName?: string;
  industryNiche?: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  targetAudience?: string;

  // 2. Brand Personality
  personalityTraits: string[];
  personalityOther?: string;

  // 3. Brand Voice
  voiceTypes: string[];
  voiceOther?: string;

  // 4. Tone
  toneTypes: string[];
  toneOther?: string;

  // 5. Communication Style
  commStyles: string[];
  commStyleOther?: string;

  // 6. Brand Character
  characterAge?: string;
  characterProfession?: string;
  characterPersonality?: string;
  characterInterests?: string;
  characterValues?: string;

  // 7 & 8. How Sound / NOT Sound
  shouldSound?: string;
  shouldNotSound?: string;

  // 9 & 10. Words to Use / Avoid
  wordsToUse?: string;
  wordsToAvoid?: string;

  // 11 & 12. Language & Guidelines
  preferredLanguages: string[];
  languageOther?: string;
  languageGuidelines?: string;

  // 13. Formality
  formalityLevel?: string;

  // 14. Sentence Style
  sentenceStyles: string[];
  sentenceStyleOther?: string;

  // 15. Caption Style
  captionStyles: string[];
  captionStyleOther?: string;

  // 16. CTA Style
  ctaStyles: string[];
  ctaStyleOther?: string;

  // 17. Emoji Usage
  emojiUsage?: string;
  preferredEmojis?: string;

  // 18. Punctuation Style
  punctuationRules: string[];
  punctuationOther?: string;

  // 19 & 20. Voice Examples
  correctVoiceExamples?: string;
  incorrectVoiceExamples?: string;

  // 21. Platform-Specific Tone
  platformTones?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
    pinterest?: string;
  };
}

export const DEFAULT_BRAND_VOICE_GUIDE: BrandVoiceGuideData = {
  brandName: "",
  industryNiche: "",
  tagline: "",
  mission: "",
  vision: "",
  targetAudience: "",
  personalityTraits: [],
  personalityOther: "",
  voiceTypes: [],
  voiceOther: "",
  toneTypes: [],
  toneOther: "",
  commStyles: [],
  commStyleOther: "",
  characterAge: "",
  characterProfession: "",
  characterPersonality: "",
  characterInterests: "",
  characterValues: "",
  shouldSound: "",
  shouldNotSound: "",
  wordsToUse: "",
  wordsToAvoid: "",
  preferredLanguages: [],
  languageOther: "",
  languageGuidelines: "",
  formalityLevel: "",
  sentenceStyles: [],
  sentenceStyleOther: "",
  captionStyles: [],
  captionStyleOther: "",
  ctaStyles: [],
  ctaStyleOther: "",
  emojiUsage: "",
  preferredEmojis: "",
  punctuationRules: [],
  punctuationOther: "",
  correctVoiceExamples: "",
  incorrectVoiceExamples: "",
  platformTones: {
    instagram: "",
    facebook: "",
    youtube: "",
    linkedin: "",
    tiktok: "",
    pinterest: "",
  },
};

export const SAMPLE_BRAND_VOICE_GUIDE: BrandVoiceGuideData = {
  brandName: "Acme Tech Solutions",
  industryNiche: "SaaS & AI Productivity",
  tagline: "Engineering Tomorrow, Today",
  mission: "Empower high-ticket creators with data-driven workflows",
  vision: "To be the undisputed benchmark in commercial video storytelling",
  targetAudience: "Founders, CXOs, High-Net-Worth Buyers aged 25-45",
  personalityTraits: ["Professional", "Trustworthy", "Modern"],
  personalityOther: "",
  voiceTypes: ["Professional", "Conversational"],
  voiceOther: "",
  toneTypes: ["Friendly", "Informative"],
  toneOther: "",
  commStyles: ["Simple & Easy to Understand", "Conversational & Relatable"],
  commStyleOther: "",
  characterAge: "28-40 years",
  characterProfession: "Expert / Mentor",
  characterPersonality: "Confident, Knowledgeable, Approachable",
  characterInterests: "Industry Growth, Innovation, Quality",
  characterValues: "Excellence, Integrity, Transparency",
  shouldSound: "Clear, helpful and solution-focused. Positive, encouraging, and authoritative without arrogance.",
  shouldNotSound: "Overly salesy, aggressive, vague, or robotic.",
  wordsToUse: "Growth, Precision, Scalable, Quality, Execution, Consistency",
  wordsToAvoid: "Cheap, Overnight riches, Guaranteed 100x, Magic hack, Spammy jargon",
  preferredLanguages: ["English", "Hinglish (English + Hindi)"],
  languageOther: "",
  languageGuidelines: "Use simple English for educational carousels and technical updates; Hinglish colloquialisms for short-form reels.",
  formalityLevel: "Balanced (Mix of both)",
  sentenceStyles: ["Short & Crisp", "Conversational"],
  sentenceStyleOther: "",
  captionStyles: ["Hook + Value + CTA", "Storytelling"],
  captionStyleOther: "",
  ctaStyles: ["Engagement (Like, Comment, Share)", "Lead Generation (DM, Sign Up)"],
  ctaStyleOther: "",
  emojiUsage: "Use Occasionally",
  preferredEmojis: "🔥 ✨ 🚀 📈",
  punctuationRules: ["Use full stops (.)", "Keep it minimal"],
  punctuationOther: "",
  correctVoiceExamples: "Here is how to optimize your workflow in 3 steps without adding headcount.",
  incorrectVoiceExamples: "BUY NOW LIMITED TIME ONLY 50% OFF BEST AGENCY EVER!!",
  platformTones: {
    instagram: "Visual, trendy, engaging & relatable reels",
    facebook: "Community-driven, descriptive updates",
    youtube: "Educational, in-depth breakdowns",
    linkedin: "Professional thought leadership & case studies",
    tiktok: "Fast-paced, entertaining, hook-driven",
    pinterest: "Aesthetic, curated, visual inspiration",
  },
};

const PERSONALITY_OPTIONS = [
  "Professional", "Friendly", "Approachable", "Trustworthy", "Expert", "Creative",
  "Fun", "Motivational", "Informative", "Empathetic", "Bold", "Minimal",
  "Premium", "Energetic", "Supportive", "Traditional", "Modern",
];

const VOICE_OPTIONS = [
  "Educational", "Humorous", "Inspirational", "Authoritative",
  "Conversational", "Friendly", "Professional",
];

const TONE_OPTIONS = [
  "Formal", "Casual", "Friendly", "Professional",
  "Motivational", "Fun", "Empathetic", "Direct",
  "Persuasive", "Informative", "Story-driven",
];

const COMM_STYLE_OPTIONS = [
  "Simple & Easy to Understand",
  "Conversational & Relatable",
  "Story-driven",
  "Data & Fact-based",
  "Short & Crisp",
  "Detailed & In-depth",
  "Visual-first",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Hinglish (English + Hindi)",
];

const FORMALITY_OPTIONS = [
  "Mostly Formal",
  "Mostly Casual",
  "Balanced (Mix of both)",
  "Depends on platform/content type",
];

const SENTENCE_STYLE_OPTIONS = [
  "Short & Crisp",
  "Medium Length",
  "Detailed",
  "Conversational",
  "Question-based",
];

const CAPTION_STYLE_OPTIONS = [
  "Hook + Value + CTA",
  "Storytelling",
  "List-based",
  "Question-based",
  "Minimal",
];

const CTA_STYLE_OPTIONS = [
  "Engagement (Like, Comment, Share)",
  "Lead Generation (DM, Sign Up)",
  "Sales (Buy Now, Book Now)",
  "Community Building (Follow, Join)",
];

const EMOJI_USAGE_OPTIONS = [
  "Use Frequently",
  "Use Occasionally",
  "Minimal Use",
  "Avoid Completely",
];

const PUNCTUATION_OPTIONS = [
  "Use full stops (.)",
  "Use exclamation marks (!)",
  "Use question marks (?)",
  "Use ellipses (...)",
  "Keep it minimal",
];

interface Props {
  value: BrandVoiceGuideData;
  onChange: (data: BrandVoiceGuideData) => void;
  accentColor?: string; // emerald, amber, indigo
}

export function BrandVoiceGuideForm({ value, onChange }: Props) {
  const guide = { ...DEFAULT_BRAND_VOICE_GUIDE, ...(value || {}) };

  const update = (patch: Partial<BrandVoiceGuideData>) => {
    onChange({ ...guide, ...patch });
  };

  const toggleArrayItem = (list: string[] = [], item: string) => {
    if (list.includes(item)) {
      return list.filter((i) => i !== item);
    }
    return [...list, item];
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-emerald-900/90 via-teal-950/90 to-slate-900 text-white border border-emerald-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black tracking-tight uppercase">
              BRAND VOICE & TONE GUIDE
            </h3>
          </div>
          <p className="text-[11px] font-mono tracking-wider text-emerald-200">
            CONSISTENT • CLEAR • RELATABLE • IMPACTFUL
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 max-w-md border border-white/10 text-[11px] text-emerald-100/90 leading-relaxed">
            <strong className="text-white inline mr-1">Purpose:</strong>
            Maintain consistent brand voice across platforms and content deliverables.
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onChange(SAMPLE_BRAND_VOICE_GUIDE)}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Load sample guide for inspiration"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Load Sample</span>
            </button>
            <button
              type="button"
              onClick={() => onChange(DEFAULT_BRAND_VOICE_GUIDE)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 text-white/80 hover:text-white text-[11px] font-semibold border border-white/10 transition-all cursor-pointer"
              title="Clear all fields"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ================= 1. Brand Overview ================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono text-[10px]">1</span>
            <span>Brand Overview</span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Brand / Business Name</label>
              <input
                type="text"
                value={guide.brandName || ""}
                onChange={(e) => update({ brandName: e.target.value })}
                placeholder="e.g. Acme Tech Solutions"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Industry / Niche</label>
                <input
                  type="text"
                  value={guide.industryNiche || ""}
                  onChange={(e) => update({ industryNiche: e.target.value })}
                  placeholder="e.g. Luxury Real Estate / SaaS"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Tagline (if any)</label>
                <input
                  type="text"
                  value={guide.tagline || ""}
                  onChange={(e) => update({ tagline: e.target.value })}
                  placeholder="e.g. Engineering Tomorrow"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Mission (short)</label>
              <input
                type="text"
                value={guide.mission || ""}
                onChange={(e) => update({ mission: e.target.value })}
                placeholder="e.g. Empower high-ticket creators with data-driven workflows"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Vision (short)</label>
              <input
                type="text"
                value={guide.vision || ""}
                onChange={(e) => update({ vision: e.target.value })}
                placeholder="e.g. To be the undisputed benchmark in commercial video storytelling"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Target Audience</label>
              <input
                type="text"
                value={guide.targetAudience || ""}
                onChange={(e) => update({ targetAudience: e.target.value })}
                placeholder="e.g. Founders, CXOs, High-Net-Worth Buyers aged 25-45"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ================= 2. Brand Personality ================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
              <span className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-mono text-[10px]">2</span>
              <span>Brand Personality</span>
            </div>
            <span className="text-[10px] text-slate-400">Select multiple</span>
          </div>

          <p className="text-[11px] text-slate-500">Select the main personality traits that describe your brand:</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {PERSONALITY_OPTIONS.map((trait) => {
              const selected = (guide.personalityTraits || []).includes(trait);
              return (
                <button
                  type="button"
                  key={trait}
                  onClick={() => update({ personalityTraits: toggleArrayItem(guide.personalityTraits, trait) })}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all text-left flex items-center gap-1.5 border cursor-pointer ${
                    selected
                      ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-3 h-3 rounded flex items-center justify-center text-[9px] border ${
                    selected ? "bg-rose-600 text-white border-rose-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span className="truncate">{trait}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <input
              type="text"
              value={guide.personalityOther || ""}
              onChange={(e) => update({ personalityOther: e.target.value })}
              placeholder="Other personality traits..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ================= 3. Brand Voice ================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
              <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-mono text-[10px]">3</span>
              <span>Brand Voice</span>
            </div>
            <span className="text-[10px] text-slate-400">Choose or define</span>
          </div>

          <p className="text-[11px] text-slate-500">How the brand communicates overall:</p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {VOICE_OPTIONS.map((v) => {
              const selected = (guide.voiceTypes || []).includes(v);
              return (
                <button
                  type="button"
                  key={v}
                  onClick={() => update({ voiceTypes: toggleArrayItem(guide.voiceTypes, v) })}
                  className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                    selected ? "bg-blue-600 text-white border-blue-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span>{v}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={guide.voiceOther || ""}
            onChange={(e) => update({ voiceOther: e.target.value })}
            placeholder="Other voice definition..."
            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
          />
        </div>

        {/* ================= 4. Tone ================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
              <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-mono text-[10px]">4</span>
              <span>Tone Spectrum</span>
            </div>
            <span className="text-[10px] text-slate-400">Contextual</span>
          </div>

          <p className="text-[11px] text-slate-500">Adjust the tone based on content type and platform:</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {TONE_OPTIONS.map((t) => {
              const selected = (guide.toneTypes || []).includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => update({ toneTypes: toggleArrayItem(guide.toneTypes, t) })}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all text-left flex items-center gap-1.5 border cursor-pointer ${
                    selected
                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3 h-3 rounded flex items-center justify-center text-[9px] border ${
                    selected ? "bg-amber-600 text-white border-amber-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span className="truncate">{t}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={guide.toneOther || ""}
            onChange={(e) => update({ toneOther: e.target.value })}
            placeholder="Other tone notes..."
            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ================= 5. Communication Style ================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
              <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-mono text-[10px]">5</span>
              <span>Communication Style</span>
            </div>
            <span className="text-[10px] text-slate-400">Delivery format</span>
          </div>

          <p className="text-[11px] text-slate-500">How the brand delivers its message:</p>

          <div className="space-y-1.5 pt-1">
            {COMM_STYLE_OPTIONS.map((style) => {
              const selected = (guide.commStyles || []).includes(style);
              return (
                <button
                  type="button"
                  key={style}
                  onClick={() => update({ commStyles: toggleArrayItem(guide.commStyles, style) })}
                  className={`w-full px-3 py-2 rounded-xl text-[11px] font-medium transition-all text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                    selected ? "bg-purple-600 text-white border-purple-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span>{style}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={guide.commStyleOther || ""}
            onChange={(e) => update({ commStyleOther: e.target.value })}
            placeholder="Other style preferences..."
            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
          />
        </div>

        {/* ================= 6. Brand Character ================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
              <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-mono text-[10px]">6</span>
              <span>Brand Character Persona</span>
            </div>
            <span className="text-[10px] text-slate-400">Humanization</span>
          </div>

          <p className="text-[11px] text-slate-500">If your brand were a person, how would you describe them?</p>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Age Range</label>
              <input
                type="text"
                value={guide.characterAge || ""}
                onChange={(e) => update({ characterAge: e.target.value })}
                placeholder="e.g. 28-38 years"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Profession / Role</label>
              <input
                type="text"
                value={guide.characterProfession || ""}
                onChange={(e) => update({ characterProfession: e.target.value })}
                placeholder="e.g. Coach, Friend, Mentor, Expert Strategist"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Personality Traits</label>
              <input
                type="text"
                value={guide.characterPersonality || ""}
                onChange={(e) => update({ characterPersonality: e.target.value })}
                placeholder="e.g. Confident, Friendly, Highly Knowledgeable"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Interests</label>
              <input
                type="text"
                value={guide.characterInterests || ""}
                onChange={(e) => update({ characterInterests: e.target.value })}
                placeholder="e.g. Business Architecture, Technology, Luxury, Wellness"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Values</label>
              <input
                type="text"
                value={guide.characterValues || ""}
                onChange={(e) => update({ characterValues: e.target.value })}
                placeholder="e.g. Honesty, Scalable Growth, Creativity"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= 7 & 8. How Sound & NOT Sound ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 text-xs">
            <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-mono text-[10px]">7</span>
            <span>How the Brand Should Sound (Key Points)</span>
          </div>
          <p className="text-[11px] text-slate-500">e.g. Clear, helpful, solution-focused, speak directly to audience with expertise.</p>
          <textarea
            rows={3}
            value={guide.shouldSound || ""}
            onChange={(e) => update({ shouldSound: e.target.value })}
            placeholder="Write key guidelines on how the brand should communicate..."
            className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 outline-none"
          />
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-300 text-xs">
            <span className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center font-mono text-[10px]">8</span>
            <span>How the Brand Should NOT Sound (Avoid)</span>
          </div>
          <p className="text-[11px] text-slate-500">e.g. Overly salesy, pushy, complex, arrogant, generic, fear-based or robotic.</p>
          <textarea
            rows={3}
            value={guide.shouldNotSound || ""}
            onChange={(e) => update({ shouldNotSound: e.target.value })}
            placeholder="Write styles and patterns that must be completely avoided..."
            className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-slate-100 outline-none"
          />
        </div>
      </div>

      {/* ================= 9 & 10. Words to Use & Words to Avoid ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
            <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono text-[10px]">9</span>
            <span className="text-emerald-700 dark:text-emerald-400">✓ Words / Phrases to Use</span>
          </div>
          <p className="text-[11px] text-slate-500">Preferred words and vocabulary that reflect your brand identity (comma separated):</p>
          <textarea
            rows={2}
            value={guide.wordsToUse || ""}
            onChange={(e) => update({ wordsToUse: e.target.value })}
            placeholder="e.g. Precision, Scalable, Playbook, Here is how, Compounding..."
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none font-mono text-[11px]"
          />
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
            <span className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-mono text-[10px]">10</span>
            <span className="text-rose-700 dark:text-rose-400">✕ Words / Phrases to Avoid</span>
          </div>
          <p className="text-[11px] text-slate-500">Forbidden terms, spam words, or slogans that do NOT align with your brand:</p>
          <textarea
            rows={2}
            value={guide.wordsToAvoid || ""}
            onChange={(e) => update({ wordsToAvoid: e.target.value })}
            placeholder="e.g. Guaranteed results, Get rich quick, Cheap, Hack..."
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none font-mono text-[11px]"
          />
        </div>
      </div>

      {/* ================= 11, 12, 13: Languages & Formality ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 11. Preferred Language */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-mono text-[10px]">11</span>
            <span>Preferred Language</span>
          </div>

          <div className="space-y-2">
            {LANGUAGE_OPTIONS.map((lang) => {
              const selected = (guide.preferredLanguages || []).includes(lang);
              return (
                <button
                  type="button"
                  key={lang}
                  onClick={() => update({ preferredLanguages: toggleArrayItem(guide.preferredLanguages, lang) })}
                  className={`w-full px-3 py-2 rounded-xl text-[11px] font-medium text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                    selected ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span>{lang}</span>
                </button>
              );
            })}
            <input
              type="text"
              value={guide.languageOther || ""}
              onChange={(e) => update({ languageOther: e.target.value })}
              placeholder="Other language..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>
        </div>

        {/* 12. English / Hindi / Hinglish Guidelines */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-mono text-[10px]">12</span>
            <span>Dialect Guidelines</span>
          </div>
          <p className="text-[11px] text-slate-500">Rules for combining English, Hindi, and Hinglish across scripts:</p>
          <textarea
            rows={4}
            value={guide.languageGuidelines || ""}
            onChange={(e) => update({ languageGuidelines: e.target.value })}
            placeholder="e.g. Simple English for educational carousels; Hinglish hooks for reels; Hindi for regional audiences..."
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none text-xs"
          />
        </div>

        {/* 13. Formal vs Casual */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center font-mono text-[10px]">13</span>
            <span>Formal vs Casual</span>
          </div>

          <p className="text-[11px] text-slate-500">Define the default level of formality:</p>

          <div className="space-y-1.5">
            {FORMALITY_OPTIONS.map((f) => {
              const selected = guide.formalityLevel === f;
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => update({ formalityLevel: f })}
                  className={`w-full px-3 py-2 rounded-xl text-[11px] font-medium text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-violet-50 dark:bg-violet-950/60 border-violet-300 dark:border-violet-800 text-violet-800 dark:text-violet-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] border ${
                    selected ? "bg-violet-600 text-white border-violet-600" : "border-slate-400"
                  }`}>
                    {selected ? "●" : ""}
                  </span>
                  <span>{f}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= 14, 15, 16: Sentence, Caption & CTA Styles ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 14. Sentence Style */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-mono text-[10px]">14</span>
            <span>Sentence Style</span>
          </div>

          <div className="space-y-1.5">
            {SENTENCE_STYLE_OPTIONS.map((style) => {
              const selected = (guide.sentenceStyles || []).includes(style);
              return (
                <button
                  type="button"
                  key={style}
                  onClick={() => update({ sentenceStyles: toggleArrayItem(guide.sentenceStyles, style) })}
                  className={`w-full px-3 py-1.5 rounded-xl text-[11px] font-medium text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3 h-3 rounded flex items-center justify-center text-[9px] border ${
                    selected ? "bg-amber-600 text-white border-amber-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span>{style}</span>
                </button>
              );
            })}
            <input
              type="text"
              value={guide.sentenceStyleOther || ""}
              onChange={(e) => update({ sentenceStyleOther: e.target.value })}
              placeholder="Other sentence style..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>
        </div>

        {/* 15. Caption Style */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 flex items-center justify-center font-mono text-[10px]">15</span>
            <span>Caption Structure</span>
          </div>

          <div className="space-y-1.5">
            {CAPTION_STYLE_OPTIONS.map((style) => {
              const selected = (guide.captionStyles || []).includes(style);
              return (
                <button
                  type="button"
                  key={style}
                  onClick={() => update({ captionStyles: toggleArrayItem(guide.captionStyles, style) })}
                  className={`w-full px-3 py-1.5 rounded-xl text-[11px] font-medium text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-pink-50 dark:bg-pink-950/60 border-pink-300 dark:border-pink-800 text-pink-800 dark:text-pink-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3 h-3 rounded flex items-center justify-center text-[9px] border ${
                    selected ? "bg-pink-600 text-white border-pink-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span>{style}</span>
                </button>
              );
            })}
            <input
              type="text"
              value={guide.captionStyleOther || ""}
              onChange={(e) => update({ captionStyleOther: e.target.value })}
              placeholder="Other caption structure..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>
        </div>

        {/* 16. CTA Style */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-mono text-[10px]">16</span>
            <span>Call to Action (CTA) Style</span>
          </div>

          <div className="space-y-1.5">
            {CTA_STYLE_OPTIONS.map((style) => {
              const selected = (guide.ctaStyles || []).includes(style);
              return (
                <button
                  type="button"
                  key={style}
                  onClick={() => update({ ctaStyles: toggleArrayItem(guide.ctaStyles, style) })}
                  className={`w-full px-3 py-1.5 rounded-xl text-[11px] font-medium text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3 h-3 rounded flex items-center justify-center text-[9px] border ${
                    selected ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span className="truncate">{style}</span>
                </button>
              );
            })}
            <input
              type="text"
              value={guide.ctaStyleOther || ""}
              onChange={(e) => update({ ctaStyleOther: e.target.value })}
              placeholder="Other CTA type..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* ================= 17 & 18: Emoji & Punctuation ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 17. Emoji Usage */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-mono text-[10px]">17</span>
            <span>Emoji Usage Guidelines</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {EMOJI_USAGE_OPTIONS.map((opt) => {
              const selected = guide.emojiUsage === opt;
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => update({ emojiUsage: opt })}
                  className={`px-3 py-2 rounded-xl text-[11px] font-medium text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] border ${
                    selected ? "bg-amber-600 text-white border-amber-600" : "border-slate-400"
                  }`}>
                    {selected ? "●" : ""}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Preferred Emojis (if any)</label>
            <input
              type="text"
              value={guide.preferredEmojis || ""}
              onChange={(e) => update({ preferredEmojis: e.target.value })}
              placeholder="e.g. 🔥 ✨ 🚀 📈 🎯"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm outline-none"
            />
          </div>
        </div>

        {/* 18. Punctuation Style */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono text-[10px]">18</span>
            <span>Punctuation Style</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PUNCTUATION_OPTIONS.map((rule) => {
              const selected = (guide.punctuationRules || []).includes(rule);
              return (
                <button
                  type="button"
                  key={rule}
                  onClick={() => update({ punctuationRules: toggleArrayItem(guide.punctuationRules, rule) })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium text-left flex items-center gap-2 border cursor-pointer ${
                    selected
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3 h-3 rounded flex items-center justify-center text-[9px] border ${
                    selected ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-400"
                  }`}>
                    {selected ? "✓" : ""}
                  </span>
                  <span className="truncate">{rule}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={guide.punctuationOther || ""}
            onChange={(e) => update({ punctuationOther: e.target.value })}
            placeholder="Other punctuation notes..."
            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
          />
        </div>
      </div>

      {/* ================= 19 & 20: Examples of Correct vs Incorrect Voice ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900/40 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-xs">
            <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-mono text-[10px]">19</span>
            <span>Examples of Correct Brand Voice</span>
          </div>
          <p className="text-[11px] text-slate-500">Sample captions, lines, or messaging that accurately represent your voice:</p>
          <textarea
            rows={3}
            value={guide.correctVoiceExamples || ""}
            onChange={(e) => update({ correctVoiceExamples: e.target.value })}
            placeholder="e.g. 'True compounding happens when you remove friction from the delivery engine...'"
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100 text-xs outline-none"
          />
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400 text-xs">
            <span className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center font-mono text-[10px]">20</span>
            <span>Examples of Incorrect Brand Voice</span>
          </div>
          <p className="text-[11px] text-slate-500">Messaging that does NOT match or ruins your brand positioning:</p>
          <textarea
            rows={3}
            value={guide.incorrectVoiceExamples || ""}
            onChange={(e) => update({ incorrectVoiceExamples: e.target.value })}
            placeholder="e.g. 'Hey guys do you want 10 million followers in 5 minutes click below fast...'"
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-rose-200 dark:border-rose-800/60 text-slate-900 dark:text-slate-100 text-xs outline-none"
          />
        </div>
      </div>

      {/* ================= 21. Platform-Specific Tone (Optional) ================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
            <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-mono text-[10px]">21</span>
            <span>Platform-Specific Tone (Optional)</span>
          </div>
          <span className="text-[10px] text-slate-400">Channel tailoring</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">📸 Instagram</label>
            <input
              type="text"
              value={guide.platformTones?.instagram || ""}
              onChange={(e) => update({ platformTones: { ...guide.platformTones, instagram: e.target.value } })}
              placeholder="e.g. Casual, Trendy, Engaging Reels"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">💼 LinkedIn</label>
            <input
              type="text"
              value={guide.platformTones?.linkedin || ""}
              onChange={(e) => update({ platformTones: { ...guide.platformTones, linkedin: e.target.value } })}
              placeholder="e.g. Professional, Thought Leadership"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">▶️ YouTube</label>
            <input
              type="text"
              value={guide.platformTones?.youtube || ""}
              onChange={(e) => update({ platformTones: { ...guide.platformTones, youtube: e.target.value } })}
              placeholder="e.g. Educational, Long-form Authority"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">🌐 Facebook</label>
            <input
              type="text"
              value={guide.platformTones?.facebook || ""}
              onChange={(e) => update({ platformTones: { ...guide.platformTones, facebook: e.target.value } })}
              placeholder="e.g. Community-focused, Informative"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">🎵 TikTok</label>
            <input
              type="text"
              value={guide.platformTones?.tiktok || ""}
              onChange={(e) => update({ platformTones: { ...guide.platformTones, tiktok: e.target.value } })}
              placeholder="e.g. Fast, Energetic, Trend-based"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">📌 Pinterest</label>
            <input
              type="text"
              value={guide.platformTones?.pinterest || ""}
              onChange={(e) => update({ platformTones: { ...guide.platformTones, pinterest: e.target.value } })}
              placeholder="e.g. Visual, Inspiring, High Aesthetic"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
