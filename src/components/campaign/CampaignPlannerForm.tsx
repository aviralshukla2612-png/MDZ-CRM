"use client";

import React, { useState } from "react";
import {
  Calendar,
  Target,
  Users,
  Gift,
  Share2,
  Layers,
  Palette,
  Hash,
  Tv,
  Rocket,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

export interface ContentScheduleItem {
  id: string;
  date: string;
  contentType: string;
  platform: string;
  topicCaption: string;
  status: "Planned" | "In Progress" | "Ready" | "Published";
}

export interface TeamResponsibilityItem {
  id: string;
  teamMember: string;
  role: string;
  responsibilities: string;
  deadline: string;
}

export interface ApprovalDeadlineItem {
  id: string;
  contentType: string;
  approvalDate: string;
}

export interface CampaignPlannerData {
  // 1. Campaign Details
  campaignName: string;
  campaignType: string;
  campaignTheme: string;
  campaignDuration: string;
  startDate: string;
  endDate: string;

  // 2. Campaign Objective
  objectives: string[];
  objectiveOther?: string;

  // 3. Target Audience
  audienceAgeGroup: string;
  audienceGender: string;
  audienceLocation: string;
  audienceInterests: string;
  audiencePainPoints: string;
  audienceGoals: string;

  // 4. Campaign Offer & Message
  campaignOffer: string;
  keyMessage: string;
  usp: string;
  campaignCta: string;

  // 5. Platforms & Content Formats
  platforms: string[];
  platformOther?: string;
  contentFormats: string[];
  contentFormatOther?: string;

  // 6. Content Required (Quantities)
  reelsQty: number;
  staticPostsQty: number;
  carouselsQty: number;
  storiesQty: number;
  bannersQty: number;
  adCreativesQty: number;
  otherContentQty: number;
  otherContentLabel?: string;

  // 7. Creative & Copy Requirements
  creativeRequirements: string;
  copyRequirements: string;

  // 8. Campaign Hashtag & Influencers
  campaignHashtag: string;
  additionalHashtags: string;
  influencerRequirements: string;

  // 9. Paid Ads Requirements
  runPaidAds: boolean;
  adPlatforms: string[];
  adPlatformOther?: string;
  adObjectives: string;
  adCreativeRequirements: string;
  budget: string;

  // 10. Launch Plan
  preLaunchActivities: string[];
  preLaunchOther?: string;
  launchActivities: string[];
  launchOther?: string;

  // 11. Content Schedule (Table)
  contentSchedule: ContentScheduleItem[];

  // 12. Team Responsibilities (Table)
  teamResponsibilities: TeamResponsibilityItem[];

  // 13. Approval Deadlines (Table)
  approvalDeadlines: ApprovalDeadlineItem[];

  // 14. Campaign Status & Stage
  currentStatus: "Not Started" | "Planning" | "In Progress" | "Live" | "Completed" | "On Hold";
  stages: string[];

  // 15. Performance Metrics (Targets)
  targetMetrics: {
    reachImpressions: string;
    engagementRate: string;
    websiteTraffic: string;
    leadsGenerated: string;
    salesConversions: string;
    followerGrowth: string;
    other: string;
  };

  // 16. Results (Actuals)
  actualResults: {
    reachImpressions: string;
    engagementRate: string;
    websiteTraffic: string;
    leadsGenerated: string;
    salesConversions: string;
    followerGrowth: string;
    other: string;
  };

  // 17. Learnings
  learningsWorkedWell: string;
  learningsDidntWork: string;
  keyLearnings: string;

  // 18. Next Steps
  actionsForFuture: string;
  recommendations: string;
  ideasToExplore: string;
}

export const DEFAULT_CAMPAIGN_PLANNER: CampaignPlannerData = {
  campaignName: "",
  campaignType: "Product Launch",
  campaignTheme: "",
  campaignDuration: "",
  startDate: "",
  endDate: "",

  objectives: [],
  objectiveOther: "",

  audienceAgeGroup: "",
  audienceGender: "All",
  audienceLocation: "",
  audienceInterests: "",
  audiencePainPoints: "",
  audienceGoals: "",

  campaignOffer: "",
  keyMessage: "",
  usp: "",
  campaignCta: "",

  platforms: [],
  platformOther: "",
  contentFormats: [],
  contentFormatOther: "",

  reelsQty: 0,
  staticPostsQty: 0,
  carouselsQty: 0,
  storiesQty: 0,
  bannersQty: 0,
  adCreativesQty: 0,
  otherContentQty: 0,
  otherContentLabel: "",

  creativeRequirements: "",
  copyRequirements: "",

  campaignHashtag: "",
  additionalHashtags: "",
  influencerRequirements: "",

  runPaidAds: false,
  adPlatforms: [],
  adPlatformOther: "",
  adObjectives: "",
  adCreativeRequirements: "",
  budget: "",

  preLaunchActivities: [],
  preLaunchOther: "",
  launchActivities: [],
  launchOther: "",

  contentSchedule: [],
  teamResponsibilities: [],
  approvalDeadlines: [],

  currentStatus: "Planning",
  stages: ["Planning"],

  targetMetrics: {
    reachImpressions: "",
    engagementRate: "",
    websiteTraffic: "",
    leadsGenerated: "",
    salesConversions: "",
    followerGrowth: "",
    other: "",
  },

  actualResults: {
    reachImpressions: "",
    engagementRate: "",
    websiteTraffic: "",
    leadsGenerated: "",
    salesConversions: "",
    followerGrowth: "",
    other: "",
  },

  learningsWorkedWell: "",
  learningsDidntWork: "",
  keyLearnings: "",

  actionsForFuture: "",
  recommendations: "",
  ideasToExplore: "",
};

export const SAMPLE_CAMPAIGN_PLANNER: CampaignPlannerData = {
  campaignName: "Q4 Brand Elevation & Lead Push",
  campaignType: "Product Launch",
  campaignTheme: "Redefining Industry Standards",
  campaignDuration: "30 Days",
  startDate: "",
  endDate: "",

  objectives: ["Brand Awareness", "Lead Generation"],
  objectiveOther: "",

  audienceAgeGroup: "18 - 35",
  audienceGender: "All",
  audienceLocation: "India / Tier 1 Cities",
  audienceInterests: "Fashion, Tech, Lifestyle & High Growth",
  audiencePainPoints: "Lack of brand trust, inconsistent creative quality",
  audienceGoals: "Achieve recognizable market status and high ROI",

  campaignOffer: "Complimentary Strategy Audit & Priority Creative Slot",
  keyMessage: "Premium bespoke content that drives authority and conversions.",
  usp: "48-Hour review SLAs with cinematic 4K short-form video execution.",
  campaignCta: "Book a Discovery Call / Shop Now",

  platforms: ["Instagram", "Facebook", "LinkedIn"],
  platformOther: "",
  contentFormats: ["Reels / Short Videos", "Carousels", "Stories"],
  contentFormatOther: "",

  reelsQty: 15,
  staticPostsQty: 10,
  carouselsQty: 8,
  storiesQty: 20,
  bannersQty: 4,
  adCreativesQty: 6,
  otherContentQty: 0,
  otherContentLabel: "",

  creativeRequirements: "Minimalist luxury, high contrast, clean typography, vibrant color accents.",
  copyRequirements: "Hook-first headline, value-driven bullets, actionable CTA with relevant hashtags.",

  campaignHashtag: "#ScaleWithMillionaire",
  additionalHashtags: "#BrandGrowth #DirectResponse #LuxuryMarketing",
  influencerRequirements: "Micro-influencers (10K-100K) with high niche engagement in D2C / B2B.",

  runPaidAds: true,
  adPlatforms: ["Meta Ads (Instagram/Facebook)", "Google Ads"],
  adPlatformOther: "",
  adObjectives: "Lead Generation & High-Intent Traffic",
  adCreativeRequirements: "9:16 vertical video with animated hooks + 1:1 carousel ads",
  budget: "25000",

  preLaunchActivities: ["Teaser Content", "Audience Warm-up", "Influencer Seeding"],
  preLaunchOther: "",
  launchActivities: ["Main Content Release", "Paid Ads Go Live", "Community Engagement"],
  launchOther: "",

  contentSchedule: [
    {
      id: "sch-1",
      date: "",
      contentType: "Reel / Short Video",
      platform: "Instagram",
      topicCaption: "Hook: Why conventional campaigns fail to build real brand equity",
      status: "Planned",
    },
    {
      id: "sch-2",
      date: "",
      contentType: "Carousel",
      platform: "Instagram / LinkedIn",
      topicCaption: "5 Essential Pillars of Modern Organic Brand Growth",
      status: "Planned",
    },
  ],

  teamResponsibilities: [
    {
      id: "resp-1",
      teamMember: "Creative Director",
      role: "Concept & Art Direction",
      responsibilities: "Hook approval, moodboard, narrative structure",
      deadline: "Pre-Launch",
    },
    {
      id: "resp-2",
      teamMember: "Lead Video Editor",
      role: "Post-Production",
      responsibilities: "Pacing, sound design, typography, 4K render",
      deadline: "Day -2",
    },
  ],

  approvalDeadlines: [
    { id: "app-1", contentType: "Reels / Short Videos", approvalDate: "" },
    { id: "app-2", contentType: "Ad Creatives & Copy", approvalDate: "" },
  ],

  currentStatus: "Planning",
  stages: ["Planning", "Content Creation"],

  targetMetrics: {
    reachImpressions: "150,000+",
    engagementRate: "4.8%",
    websiteTraffic: "5,000 Visitors",
    leadsGenerated: "85 High-Intent Leads",
    salesConversions: "18 Closed Deals",
    followerGrowth: "1,200 New Followers",
    other: "",
  },

  actualResults: {
    reachImpressions: "",
    engagementRate: "",
    websiteTraffic: "",
    leadsGenerated: "",
    salesConversions: "",
    followerGrowth: "",
    other: "",
  },

  learningsWorkedWell: "",
  learningsDidntWork: "",
  keyLearnings: "",

  actionsForFuture: "",
  recommendations: "",
  ideasToExplore: "",
};

const OBJECTIVE_OPTIONS = [
  "Brand Awareness",
  "Lead Generation",
  "Sales / Conversions",
  "Product Launch",
  "Community Engagement",
  "Website Traffic",
  "App Downloads",
  "Repositioning / Rebranding",
];

const PLATFORM_OPTIONS = [
  "Instagram",
  "Facebook",
  "YouTube",
  "LinkedIn",
  "TikTok",
  "Twitter (X)",
  "Pinterest",
];

const CONTENT_FORMAT_OPTIONS = [
  "Reels / Short Videos",
  "Static Posts",
  "Carousels",
  "Stories",
  "Live Sessions",
  "UGC / Testimonials",
  "Infographics",
];

const PRE_LAUNCH_OPTIONS = [
  "Teaser Content",
  "Audience Warm-up",
  "Email/SMS (if applicable)",
  "Influencer Seeding",
];

const LAUNCH_OPTIONS = [
  "Main Content Release",
  "Paid Ads Go Live",
  "Influencer Posts",
  "Community Engagement",
];

const AD_PLATFORM_OPTIONS = [
  "Meta Ads (Instagram/Facebook)",
  "Google Ads",
  "YouTube Ads",
];

const STAGE_OPTIONS = [
  "Planning",
  "Content Creation",
  "Approval",
  "Live",
  "Completed",
  "On Hold",
];

interface Props {
  value: CampaignPlannerData;
  onChange: (data: CampaignPlannerData) => void;
  isCompact?: boolean;
}

export function CampaignPlannerForm({ value, onChange, isCompact = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(!isCompact);

  const update = (patch: Partial<CampaignPlannerData>) => {
    onChange({ ...value, ...patch });
  };

  const toggleArrayItem = (key: keyof CampaignPlannerData, item: string) => {
    const list = (value[key] as string[]) || [];
    const exists = list.includes(item);
    const updated = exists ? list.filter((i) => i !== item) : [...list, item];
    update({ [key]: updated });
  };

  // Content schedule helper
  const addScheduleItem = () => {
    const newItem: ContentScheduleItem = {
      id: `sch-${Date.now()}`,
      date: "",
      contentType: "Reel",
      platform: "Instagram",
      topicCaption: "",
      status: "Planned",
    };
    update({ contentSchedule: [...(value.contentSchedule || []), newItem] });
  };

  const removeScheduleItem = (id: string) => {
    update({
      contentSchedule: (value.contentSchedule || []).filter((s) => s.id !== id),
    });
  };

  const updateScheduleItem = (id: string, patch: Partial<ContentScheduleItem>) => {
    update({
      contentSchedule: (value.contentSchedule || []).map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  };

  // Team helper
  const addTeamItem = () => {
    const newItem: TeamResponsibilityItem = {
      id: `resp-${Date.now()}`,
      teamMember: "",
      role: "",
      responsibilities: "",
      deadline: "",
    };
    update({ teamResponsibilities: [...(value.teamResponsibilities || []), newItem] });
  };

  const removeTeamItem = (id: string) => {
    update({
      teamResponsibilities: (value.teamResponsibilities || []).filter((t) => t.id !== id),
    });
  };

  const updateTeamItem = (id: string, patch: Partial<TeamResponsibilityItem>) => {
    update({
      teamResponsibilities: (value.teamResponsibilities || []).map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    });
  };

  // Approval deadline helper
  const addApprovalItem = () => {
    const newItem: ApprovalDeadlineItem = {
      id: `app-${Date.now()}`,
      contentType: "Reels / Short Videos",
      approvalDate: "",
    };
    update({ approvalDeadlines: [...(value.approvalDeadlines || []), newItem] });
  };

  const removeApprovalItem = (id: string) => {
    update({
      approvalDeadlines: (value.approvalDeadlines || []).filter((a) => a.id !== id),
    });
  };

  const updateApprovalItem = (id: string, patch: Partial<ApprovalDeadlineItem>) => {
    update({
      approvalDeadlines: (value.approvalDeadlines || []).map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14120E] shadow-sm overflow-hidden transition-all">
      {/* Header Banner */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                Strategic Blueprint
              </span>
              <span className="text-xs text-stone-300 font-mono hidden sm:inline">
                PLAN • CREATE • EXECUTE • TRACK • GROW
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
              <span>CAMPAIGN PLANNER</span>
              <span className="text-xs font-normal text-emerald-300 opacity-90 hidden md:inline">
                (18-Module Strategic Execution System)
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-300 font-medium hidden sm:inline">
            {isExpanded ? "Collapse Planner" : "Expand Planner"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 text-stone-900 dark:text-stone-100">
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Use this planner to outline, organize, and execute your social media campaign from strategy to execution, tracking deliverables, creative tone, and performance goals.
          </p>

          {/* Grid of Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Campaign Details */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Campaign Details
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={value.campaignName}
                    onChange={(e) => update({ campaignName: e.target.value })}
                    placeholder="e.g. Festive Q4 Growth Surge / Luxury Launch"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                      Campaign Type
                    </label>
                    <input
                      type="text"
                      value={value.campaignType}
                      onChange={(e) => update({ campaignType: e.target.value })}
                      placeholder="e.g. Product Launch, Seasonal, Engagement"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                      Campaign Duration
                    </label>
                    <input
                      type="text"
                      value={value.campaignDuration}
                      onChange={(e) => update({ campaignDuration: e.target.value })}
                      placeholder="e.g. 30 Days, 6 Weeks"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                    Campaign Theme / Concept
                  </label>
                  <textarea
                    rows={2}
                    value={value.campaignTheme}
                    onChange={(e) => update({ campaignTheme: e.target.value })}
                    placeholder="e.g. Modern Minimalism meets High Performance. Celebrating founder journey and premium craft."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={value.startDate}
                      onChange={(e) => update({ startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-stone-700 dark:text-stone-300">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={value.endDate}
                      onChange={(e) => update({ endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Campaign Objective */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  Campaign Objective (What do you want to achieve?)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {OBJECTIVE_OPTIONS.map((obj) => {
                  const isChecked = (value.objectives || []).includes(obj);
                  return (
                    <label
                      key={obj}
                      onClick={() => toggleArrayItem("objectives", obj)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all select-none ${
                        isChecked
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold"
                          : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-3.5 h-3.5 accent-emerald-600 rounded"
                      />
                      <span>{obj}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-1">
                <input
                  type="text"
                  value={value.objectiveOther || ""}
                  onChange={(e) => update({ objectiveOther: e.target.value })}
                  placeholder="Other objective..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 3. Target Audience */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  Target Audience
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Age Group
                  </label>
                  <input
                    type="text"
                    value={value.audienceAgeGroup}
                    onChange={(e) => update({ audienceAgeGroup: e.target.value })}
                    placeholder="e.g. 18-35"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={value.audienceGender}
                    onChange={(e) => update({ audienceGender: e.target.value })}
                    placeholder="e.g. All / Male / Female"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Location
                  </label>
                  <input
                    type="text"
                    value={value.audienceLocation}
                    onChange={(e) => update({ audienceLocation: e.target.value })}
                    placeholder="e.g. India / Metros / Global"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Interests
                  </label>
                  <input
                    type="text"
                    value={value.audienceInterests}
                    onChange={(e) => update({ audienceInterests: e.target.value })}
                    placeholder="e.g. Fitness, Travel, Fashion, Entrepreneurship"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Pain Points
                  </label>
                  <textarea
                    rows={2}
                    value={value.audiencePainPoints}
                    onChange={(e) => update({ audiencePainPoints: e.target.value })}
                    placeholder="e.g. Wasting hours on low-performing marketing, overwhelmed by technical jargon..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Goals / Desires
                  </label>
                  <textarea
                    rows={2}
                    value={value.audienceGoals}
                    onChange={(e) => update({ audienceGoals: e.target.value })}
                    placeholder="e.g. Effortless growth, premium social proof, high conversion leads..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Campaign Offer & Message */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  4
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-emerald-600" />
                  Campaign Offer & Message
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Campaign Offer
                  </label>
                  <input
                    type="text"
                    value={value.campaignOffer}
                    onChange={(e) => update({ campaignOffer: e.target.value })}
                    placeholder="e.g. 20% Off, Free Trial, Limited Time Bonus Strategy"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Key Message
                  </label>
                  <textarea
                    rows={2}
                    value={value.keyMessage}
                    onChange={(e) => update({ keyMessage: e.target.value })}
                    placeholder="e.g. Elevate your presence. Experience flawless execution without the operational headache."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    USP / Key Selling Point
                  </label>
                  <input
                    type="text"
                    value={value.usp}
                    onChange={(e) => update({ usp: e.target.value })}
                    placeholder="e.g. Direct access to elite creatives, guaranteed turnaround times"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Campaign Call-to-Action (CTA)
                  </label>
                  <input
                    type="text"
                    value={value.campaignCta}
                    onChange={(e) => update({ campaignCta: e.target.value })}
                    placeholder="e.g. Shop Now, Book Discovery Call, Sign Up Today"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Platforms & Content Formats */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  5
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  Platforms & Content Formats
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-semibold block text-stone-700 dark:text-stone-300">
                  Target Platforms:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORM_OPTIONS.map((plat) => {
                    const isChecked = (value.platforms || []).includes(plat);
                    return (
                      <button
                        type="button"
                        key={plat}
                        onClick={() => toggleArrayItem("platforms", plat)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                          isChecked
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-400"
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>

                <span className="font-semibold block pt-2 text-stone-700 dark:text-stone-300">
                  Content Formats:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CONTENT_FORMAT_OPTIONS.map((fmt) => {
                    const isChecked = (value.contentFormats || []).includes(fmt);
                    return (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => toggleArrayItem("contentFormats", fmt)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                          isChecked
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-400"
                        }`}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 6. Content Required (Quantities) */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  6
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Content Required (List content needed for this campaign)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { label: "Reels / Short Videos", key: "reelsQty" as const },
                  { label: "Static Posts", key: "staticPostsQty" as const },
                  { label: "Carousels", key: "carouselsQty" as const },
                  { label: "Stories", key: "storiesQty" as const },
                  { label: "Banners / Graphics", key: "bannersQty" as const },
                  { label: "Ad Creatives", key: "adCreativesQty" as const },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] flex items-center justify-between"
                  >
                    <span className="font-semibold text-stone-700 dark:text-stone-300 truncate mr-2">
                      {item.label}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={value[item.key] ?? 0}
                      onChange={(e) => update({ [item.key]: Number(e.target.value) || 0 })}
                      className="w-14 px-2 py-1 text-center rounded border border-stone-200 dark:border-stone-700 font-mono font-bold bg-stone-50 dark:bg-[#191613] text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Creative & Copy Requirements */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  7
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  Creative & Copy Requirements
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Creative Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={value.creativeRequirements}
                    onChange={(e) => update({ creativeRequirements: e.target.value })}
                    placeholder="e.g. Color theme, mood, style, reference videos, brand identity elements..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Copy / Caption Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={value.copyRequirements}
                    onChange={(e) => update({ copyRequirements: e.target.value })}
                    placeholder="e.g. Tone, key points to include, primary hashtags, CTA style..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 8. Campaign Hashtag & Influencers */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  8
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-600" />
                  Campaign Hashtag & Influencers
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Primary Campaign Hashtag
                  </label>
                  <input
                    type="text"
                    value={value.campaignHashtag}
                    onChange={(e) => update({ campaignHashtag: e.target.value })}
                    placeholder="e.g. #YourCampaignName"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Additional Hashtags
                  </label>
                  <input
                    type="text"
                    value={value.additionalHashtags}
                    onChange={(e) => update({ additionalHashtags: e.target.value })}
                    placeholder="e.g. #brandname #offer #trending #niche"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Influencer / Collaboration Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={value.influencerRequirements}
                    onChange={(e) => update({ influencerRequirements: e.target.value })}
                    placeholder="e.g. Influencer tier, follower range, content deliverables, barter vs paid..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 9. Paid Ads Requirements */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  9
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-emerald-600" />
                  Paid Ads Requirements
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    Run Paid Ads for this campaign?
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="runPaidAds"
                        checked={value.runPaidAds === true}
                        onChange={() => update({ runPaidAds: true })}
                        className="accent-emerald-600"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="runPaidAds"
                        checked={value.runPaidAds === false}
                        onChange={() => update({ runPaidAds: false })}
                        className="accent-emerald-600"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {value.runPaidAds && (
                  <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                    <div>
                      <span className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                        Ad Platforms:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {AD_PLATFORM_OPTIONS.map((adPlat) => {
                          const isChecked = (value.adPlatforms || []).includes(adPlat);
                          return (
                            <button
                              type="button"
                              key={adPlat}
                              onClick={() => toggleArrayItem("adPlatforms", adPlat)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                                isChecked
                                  ? "bg-amber-600 text-white border-amber-600"
                                  : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                              }`}
                            >
                              {adPlat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                          Ad Objectives
                        </label>
                        <input
                          type="text"
                          value={value.adObjectives}
                          onChange={(e) => update({ adObjectives: e.target.value })}
                          placeholder="e.g. Reach, Traffic, Leads, Conversions"
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                          Estimated Budget (₹)
                        </label>
                        <input
                          type="text"
                          value={value.budget}
                          onChange={(e) => update({ budget: e.target.value })}
                          placeholder="e.g. ₹ 25,000"
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                        Ad Creative Requirements
                      </label>
                      <input
                        type="text"
                        value={value.adCreativeRequirements}
                        onChange={(e) => update({ adCreativeRequirements: e.target.value })}
                        placeholder="e.g. 9:16 vertical hook video, 1:1 carousel, strong CTA banner"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 10. Launch Plan */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  10
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-emerald-600" />
                  Launch Plan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                    Pre-Launch Activities:
                  </span>
                  <div className="space-y-1.5">
                    {PRE_LAUNCH_OPTIONS.map((opt) => {
                      const isChecked = (value.preLaunchActivities || []).includes(opt);
                      return (
                        <label
                          key={opt}
                          onClick={() => toggleArrayItem("preLaunchActivities", opt)}
                          className="flex items-center gap-2 cursor-pointer select-none text-stone-600 dark:text-stone-300"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="w-3.5 h-3.5 accent-emerald-600 rounded"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                    Launch Activities:
                  </span>
                  <div className="space-y-1.5">
                    {LAUNCH_OPTIONS.map((opt) => {
                      const isChecked = (value.launchActivities || []).includes(opt);
                      return (
                        <label
                          key={opt}
                          onClick={() => toggleArrayItem("launchActivities", opt)}
                          className="flex items-center gap-2 cursor-pointer select-none text-stone-600 dark:text-stone-300"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="w-3.5 h-3.5 accent-emerald-600 rounded"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 11: Content Schedule Table */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  11
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Content Schedule
                </span>
              </div>
              <button
                type="button"
                onClick={addScheduleItem}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Post</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700 text-stone-400 font-semibold">
                    <th className="pb-2 w-28">Date</th>
                    <th className="pb-2 w-32">Content Type</th>
                    <th className="pb-2 w-28">Platform</th>
                    <th className="pb-2">Topic / Caption Hook</th>
                    <th className="pb-2 w-28">Status</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {(value.contentSchedule || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-2">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateScheduleItem(item.id, { date: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none text-[11px]"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.contentType}
                          onChange={(e) => updateScheduleItem(item.id, { contentType: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none text-[11px]"
                        >
                          <option value="Reel / Short Video">Reel / Video</option>
                          <option value="Carousel">Carousel</option>
                          <option value="Static Post">Static Post</option>
                          <option value="Story">Story</option>
                          <option value="Ad Creative">Ad Creative</option>
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.platform}
                          onChange={(e) => updateScheduleItem(item.id, { platform: e.target.value })}
                          placeholder="Instagram"
                          className="w-full px-2 py-1 rounded bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none text-[11px]"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.topicCaption}
                          onChange={(e) => updateScheduleItem(item.id, { topicCaption: e.target.value })}
                          placeholder="Topic headline or hook..."
                          className="w-full px-2 py-1 rounded bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none text-[11px]"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateScheduleItem(item.id, { status: e.target.value as any })
                          }
                          className="w-full px-2 py-1 rounded bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none text-[11px] font-semibold"
                        >
                          <option value="Planned">Planned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Ready">Ready</option>
                          <option value="Published">Published</option>
                        </select>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeScheduleItem(item.id)}
                          className="p-1 rounded text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 12 & 13: Team Responsibilities & Approval Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 12. Team Responsibilities */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    12
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Team Responsibilities
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addTeamItem}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <div className="space-y-2">
                {(value.teamResponsibilities || []).map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs items-center relative"
                  >
                    <input
                      type="text"
                      value={t.teamMember}
                      onChange={(e) => updateTeamItem(t.id, { teamMember: e.target.value })}
                      placeholder="Name / Role"
                      className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613]"
                    />
                    <input
                      type="text"
                      value={t.role}
                      onChange={(e) => updateTeamItem(t.id, { role: e.target.value })}
                      placeholder="Role (e.g. Editor)"
                      className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613]"
                    />
                    <input
                      type="text"
                      value={t.responsibilities}
                      onChange={(e) => updateTeamItem(t.id, { responsibilities: e.target.value })}
                      placeholder="Responsibilities"
                      className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613]"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={t.deadline}
                        onChange={(e) => updateTeamItem(t.id, { deadline: e.target.value })}
                        placeholder="Deadline"
                        className="w-full px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613]"
                      />
                      <button
                        type="button"
                        onClick={() => removeTeamItem(t.id)}
                        className="p-1 text-stone-400 hover:text-rose-500 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 13. Approval Deadlines */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    13
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Approval Deadlines
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addApprovalItem}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <div className="space-y-2">
                {(value.approvalDeadlines || []).map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] flex items-center gap-2 text-xs"
                  >
                    <input
                      type="text"
                      value={a.contentType}
                      onChange={(e) => updateApprovalItem(a.id, { contentType: e.target.value })}
                      placeholder="Deliverable Type (e.g. Hero Reel)"
                      className="flex-1 px-2.5 py-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613]"
                    />
                    <input
                      type="date"
                      value={a.approvalDate}
                      onChange={(e) => updateApprovalItem(a.id, { approvalDate: e.target.value })}
                      className="px-2.5 py-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613]"
                    />
                    <button
                      type="button"
                      onClick={() => removeApprovalItem(a.id)}
                      className="p-1 text-stone-400 hover:text-rose-500 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 14: Campaign Status */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
              <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                14
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                Campaign Status & Stage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs items-center">
              <div className="space-y-1">
                <label className="font-semibold block text-stone-700 dark:text-stone-300">
                  Current Status:
                </label>
                <select
                  value={value.currentStatus}
                  onChange={(e) => update({ currentStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 font-bold text-emerald-600 dark:text-emerald-400"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-stone-700 dark:text-stone-300">
                  Active Stages:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STAGE_OPTIONS.map((stg) => {
                    const isChecked = (value.stages || []).includes(stg);
                    return (
                      <button
                        type="button"
                        key={stg}
                        onClick={() => toggleArrayItem("stages", stg)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                          isChecked
                            ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white"
                            : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400"
                        }`}
                      >
                        {stg}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 15 & 16: Performance Metrics (Target vs Results) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 15. Performance Metrics (Target) */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  15
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  Performance Metrics (Target)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { label: "Reach / Impressions", key: "reachImpressions" as const },
                  { label: "Engagement Rate", key: "engagementRate" as const },
                  { label: "Website Traffic", key: "websiteTraffic" as const },
                  { label: "Leads Generated", key: "leadsGenerated" as const },
                  { label: "Sales / Conversions", key: "salesConversions" as const },
                  { label: "Follower Growth", key: "followerGrowth" as const },
                ].map((m) => (
                  <div key={m.key} className="flex items-center justify-between gap-3">
                    <span className="text-stone-600 dark:text-stone-400 font-medium">
                      {m.label}
                    </span>
                    <input
                      type="text"
                      value={value.targetMetrics?.[m.key] || ""}
                      onChange={(e) =>
                        update({
                          targetMetrics: {
                            ...value.targetMetrics,
                            [m.key]: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. 50,000+"
                      className="w-40 px-2.5 py-1 rounded bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 text-right font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 16. Results (Actuals) */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  16
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Results (Actual Achieved)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { label: "Reach / Impressions", key: "reachImpressions" as const },
                  { label: "Engagement Rate", key: "engagementRate" as const },
                  { label: "Website Traffic", key: "websiteTraffic" as const },
                  { label: "Leads Generated", key: "leadsGenerated" as const },
                  { label: "Sales / Conversions", key: "salesConversions" as const },
                  { label: "Follower Growth", key: "followerGrowth" as const },
                ].map((m) => (
                  <div key={m.key} className="flex items-center justify-between gap-3">
                    <span className="text-stone-600 dark:text-stone-400 font-medium">
                      {m.label}
                    </span>
                    <input
                      type="text"
                      value={value.actualResults?.[m.key] || ""}
                      onChange={(e) =>
                        update({
                          actualResults: {
                            ...value.actualResults,
                            [m.key]: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. 62,400"
                      className="w-40 px-2.5 py-1 rounded bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 text-right font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 17 & 18: Learnings & Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 17. Learnings */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  17
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                  Learnings
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    What worked well?
                  </label>
                  <textarea
                    rows={2}
                    value={value.learningsWorkedWell}
                    onChange={(e) => update({ learningsWorkedWell: e.target.value })}
                    placeholder="e.g. Contrarian hooks had 3x higher watch time..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    What didn't work?
                  </label>
                  <textarea
                    rows={2}
                    value={value.learningsDidntWork}
                    onChange={(e) => update({ learningsDidntWork: e.target.value })}
                    placeholder="e.g. Long technical text on carousels dropped slide-completion..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Key learnings:
                  </label>
                  <input
                    type="text"
                    value={value.keyLearnings}
                    onChange={(e) => update({ keyLearnings: e.target.value })}
                    placeholder="e.g. Focus on first 3-second visual contrast"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 18. Next Steps */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  18
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  Next Steps
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Actions for future campaigns:
                  </label>
                  <textarea
                    rows={2}
                    value={value.actionsForFuture}
                    onChange={(e) => update({ actionsForFuture: e.target.value })}
                    placeholder="e.g. Double down on short-form founder video series..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Recommendations:
                  </label>
                  <input
                    type="text"
                    value={value.recommendations}
                    onChange={(e) => update({ recommendations: e.target.value })}
                    placeholder="e.g. Increase monthly reel quota to 30 with dedicated ad boost"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Ideas to explore:
                  </label>
                  <input
                    type="text"
                    value={value.ideasToExplore}
                    onChange={(e) => update({ ideasToExplore: e.target.value })}
                    placeholder="e.g. Podcast micro-snippets, founder webinar launch"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
