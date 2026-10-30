"use client";

import React, { useState } from "react";
import {
  Building2,
  Share2,
  Wrench,
  Package,
  Layers,
  FileEdit,
  FolderArchive,
  Info,
  FolderOpen,
  KeyRound,
  UserCheck,
  MessageSquare,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  ExternalLink,
} from "lucide-react";

export interface BrandAssetItem {
  available: boolean;
  linkOrLocation: string;
}

export interface ClientOnboardingData {
  // 1. Client & Business Details
  clientName: string;
  businessBrandName: string;
  contactNumber: string;
  emailAddress: string;
  website: string;
  businessLocation: string;

  // 2. Social Media Handles
  instagramHandle: string;
  facebookHandle: string;
  youtubeHandle: string;
  linkedinHandle: string;
  tiktokHandle: string;
  pinterestHandle: string;
  otherSocialHandle: string;

  // 3. Services Required
  servicesRequired: string[];
  servicesRequiredOther?: string;

  // 4. Package Selected
  packageName: string;
  startDate: string;
  endDate: string;
  contractDuration: string;

  // 5. Required Deliverables
  postsPerWeek: number;
  reelsPerWeek: number;
  storiesPerWeek: number;
  deliverablesChecklist: string[];
  deliverablesChecklistOther?: string;

  // 6. Content Requirements
  contentStyleTone: string;
  preferredLanguage: string;
  contentReferences: string;
  specialRequirements: string;

  // 7. Brand Assets Available
  brandAssets: {
    logo: BrandAssetItem;
    brandGuidelines: BrandAssetItem;
    photosImages: BrandAssetItem;
    videosReels: BrandAssetItem;
    productImages: BrandAssetItem;
    otherAssets: BrandAssetItem;
  };

  // 8. Product / Service Information
  productServiceInfo: string;

  // 9. Google Drive / Folder Link
  googleDriveFolderLink: string;

  // 10. Required Account Access
  accountAccess: string[];
  accountAccessOther?: string;

  // 11. Main Point of Contact
  pocName: string;
  pocDesignation: string;
  pocContactNumber: string;
  pocEmailAddress: string;

  // 12. Preferred Communication Method
  communicationMethods: string[];
  communicationMethodOther?: string;

  // 13. Important Client Notes
  importantClientNotes: string;
}

export const SAMPLE_ONBOARDING_DATA: ClientOnboardingData = {
  clientName: "",
  businessBrandName: "",
  contactNumber: "",
  emailAddress: "",
  website: "",
  businessLocation: "India",

  instagramHandle: "",
  facebookHandle: "",
  youtubeHandle: "",
  linkedinHandle: "",
  tiktokHandle: "",
  pinterestHandle: "",
  otherSocialHandle: "",

  servicesRequired: [
    "Social Media Management",
    "Content Creation",
    "Strategy & Planning",
    "Reels / Video Editing",
    "Graphic Design",
  ],
  servicesRequiredOther: "",

  packageName: "Digital Growth Retainer",
  startDate: "",
  endDate: "",
  contractDuration: "6 Months Retainer",

  postsPerWeek: 4,
  reelsPerWeek: 7,
  storiesPerWeek: 10,
  deliverablesChecklist: [
    "Content Calendar",
    "Hashtag Research",
    "Caption Writing",
    "Graphic Design",
    "Video Editing",
    "Monthly Report",
  ],
  deliverablesChecklistOther: "",

  contentStyleTone: "Professional, luxury aesthetic, high authority",
  preferredLanguage: "English & Hinglish",
  contentReferences: "Clean high-contrast visuals, minimalist typography, cinematic b-roll",
  specialRequirements: "Festive launches, seasonal sales, founder personal brand series",

  brandAssets: {
    logo: { available: true, linkOrLocation: "Google Drive Assets Folder" },
    brandGuidelines: { available: true, linkOrLocation: "PDF Brand Guide" },
    photosImages: { available: true, linkOrLocation: "Raw photo folder" },
    videosReels: { available: true, linkOrLocation: "4K footage drive" },
    productImages: { available: true, linkOrLocation: "Product shoot catalogue" },
    otherAssets: { available: false, linkOrLocation: "" },
  },

  productServiceInfo:
    "Premium lifestyle products and commercial service offerings targeting high-intent consumers and B2B clients.",

  googleDriveFolderLink: "",

  accountAccess: [
    "Instagram (Creator/Admin)",
    "Facebook Page (Admin)",
    "Meta Business Suite",
    "Google Drive Assets",
  ],
  accountAccessOther: "",

  pocName: "",
  pocDesignation: "Founder / Managing Director",
  pocContactNumber: "",
  pocEmailAddress: "",

  communicationMethods: ["WhatsApp", "Google Meet", "Email"],
  communicationMethodOther: "",

  importantClientNotes: "Review SLA within 24-48 hours. Target launch ready before 1st of upcoming month.",
};

export const DEFAULT_ONBOARDING_DATA: ClientOnboardingData = {
  clientName: "",
  businessBrandName: "",
  contactNumber: "",
  emailAddress: "",
  website: "",
  businessLocation: "",

  instagramHandle: "",
  facebookHandle: "",
  youtubeHandle: "",
  linkedinHandle: "",
  tiktokHandle: "",
  pinterestHandle: "",
  otherSocialHandle: "",

  servicesRequired: [],
  servicesRequiredOther: "",

  packageName: "",
  startDate: "",
  endDate: "",
  contractDuration: "",

  postsPerWeek: 0,
  reelsPerWeek: 0,
  storiesPerWeek: 0,
  deliverablesChecklist: [],
  deliverablesChecklistOther: "",

  contentStyleTone: "",
  preferredLanguage: "",
  contentReferences: "",
  specialRequirements: "",

  brandAssets: {
    logo: { available: false, linkOrLocation: "" },
    brandGuidelines: { available: false, linkOrLocation: "" },
    photosImages: { available: false, linkOrLocation: "" },
    videosReels: { available: false, linkOrLocation: "" },
    productImages: { available: false, linkOrLocation: "" },
    otherAssets: { available: false, linkOrLocation: "" },
  },

  productServiceInfo: "",

  googleDriveFolderLink: "",

  accountAccess: [],
  accountAccessOther: "",

  pocName: "",
  pocDesignation: "",
  pocContactNumber: "",
  pocEmailAddress: "",

  communicationMethods: [],
  communicationMethodOther: "",

  importantClientNotes: "",
};

const SERVICES_OPTIONS = [
  "Social Media Management",
  "Paid Ads (Meta / Google)",
  "Content Creation",
  "Community Management",
  "Strategy & Planning",
  "Influencer Collaboration",
  "Reels / Video Editing",
  "Profile Optimization",
  "Graphic Design",
];

const DELIVERABLES_OPTIONS = [
  "Content Calendar",
  "Caption Writing",
  "Hashtag Research",
  "Graphic Design",
  "Video Editing",
  "Monthly Report",
];

const ACCESS_OPTIONS = [
  "Instagram (Creator/Admin)",
  "LinkedIn (Admin)",
  "Facebook Page (Admin)",
  "TikTok (Admin)",
  "Meta Business Suite",
  "Website / CMS Access",
  "YouTube (Editor/Admin)",
  "Ad Account Access",
  "Google Business Profile (GMB)",
];

const COMM_METHODS = ["WhatsApp", "Email", "Google Meet", "Phone Call"];

interface Props {
  value: ClientOnboardingData;
  onChange: (data: ClientOnboardingData) => void;
  isCompact?: boolean;
}

export function ClientOnboardingForm({ value, onChange, isCompact = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(!isCompact);

  const update = (patch: Partial<ClientOnboardingData>) => {
    onChange({ ...value, ...patch });
  };

  const toggleArrayItem = (key: "servicesRequired" | "deliverablesChecklist" | "accountAccess" | "communicationMethods", item: string) => {
    const list = value[key] || [];
    const exists = list.includes(item);
    update({ [key]: exists ? list.filter((i) => i !== item) : [...list, item] });
  };

  const updateBrandAsset = (key: keyof ClientOnboardingData["brandAssets"], patch: Partial<BrandAssetItem>) => {
    update({
      brandAssets: {
        ...value.brandAssets,
        [key]: { ...value.brandAssets[key], ...patch },
      },
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14120E] shadow-sm overflow-hidden transition-all">
      {/* Header Banner */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-teal-900 to-stone-900 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                Official Agency Onboarding
              </span>
              <span className="text-xs text-stone-300 font-mono hidden sm:inline">
                LET'S BUILD SOMETHING GREAT TOGETHER
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
              <span>CLIENT ONBOARDING FORM</span>
              <span className="text-xs font-normal text-emerald-300 opacity-90 hidden md:inline">
                (13-Section Intake & Access Center)
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-300 font-medium hidden sm:inline">
            {isExpanded ? "Collapse Onboarding" : "Expand Onboarding"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 text-stone-900 dark:text-stone-100">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs">
            <p className="font-bold flex items-center gap-1.5 mb-0.5">
              <span>Welcome!</span>
            </p>
            <p className="text-[11px] opacity-90">
              This form helps us gather all the essential information, social media access, brand assets, and communication channels needed to launch your brand smoothly and deliver optimal results.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Client & Business Details */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  Client & Business Details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={value.clientName}
                    onChange={(e) => update({ clientName: e.target.value })}
                    placeholder="e.g. John Doe / Apex Brands"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Business / Brand Name
                  </label>
                  <input
                    type="text"
                    value={value.businessBrandName}
                    onChange={(e) => update({ businessBrandName: e.target.value })}
                    placeholder="e.g. Apex Luxury"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={value.contactNumber}
                    onChange={(e) => update({ contactNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={value.emailAddress}
                    onChange={(e) => update({ emailAddress: e.target.value })}
                    placeholder="contact@brand.com"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Website (if any)
                  </label>
                  <input
                    type="text"
                    value={value.website}
                    onChange={(e) => update({ website: e.target.value })}
                    placeholder="https://yourbrand.com"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Business Location
                  </label>
                  <input
                    type="text"
                    value={value.businessLocation}
                    onChange={(e) => update({ businessLocation: e.target.value })}
                    placeholder="City, State, Country"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Social Media Handles */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  Social Media Handles
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold flex items-center gap-1 mb-1 text-stone-600 dark:text-stone-400">
                    <Instagram className="w-3 h-3 text-pink-600" /> Instagram
                  </label>
                  <input
                    type="text"
                    value={value.instagramHandle}
                    onChange={(e) => update({ instagramHandle: e.target.value })}
                    placeholder="@yourbrand"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold flex items-center gap-1 mb-1 text-stone-600 dark:text-stone-400">
                    <Facebook className="w-3 h-3 text-blue-600" /> Facebook
                  </label>
                  <input
                    type="text"
                    value={value.facebookHandle}
                    onChange={(e) => update({ facebookHandle: e.target.value })}
                    placeholder="facebook.com/yourpage"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold flex items-center gap-1 mb-1 text-stone-600 dark:text-stone-400">
                    <Youtube className="w-3 h-3 text-red-600" /> YouTube
                  </label>
                  <input
                    type="text"
                    value={value.youtubeHandle}
                    onChange={(e) => update({ youtubeHandle: e.target.value })}
                    placeholder="youtube.com/@channel"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold flex items-center gap-1 mb-1 text-stone-600 dark:text-stone-400">
                    <Linkedin className="w-3 h-3 text-blue-700" /> LinkedIn
                  </label>
                  <input
                    type="text"
                    value={value.linkedinHandle}
                    onChange={(e) => update({ linkedinHandle: e.target.value })}
                    placeholder="linkedin.com/company/brand"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    TikTok
                  </label>
                  <input
                    type="text"
                    value={value.tiktokHandle}
                    onChange={(e) => update({ tiktokHandle: e.target.value })}
                    placeholder="@brand_tiktok"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Pinterest / Other
                  </label>
                  <input
                    type="text"
                    value={value.pinterestHandle || value.otherSocialHandle}
                    onChange={(e) => update({ pinterestHandle: e.target.value, otherSocialHandle: e.target.value })}
                    placeholder="Platform and handle"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Services Required */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                  Services Required (Select all you need)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {SERVICES_OPTIONS.map((srv) => {
                  const isChecked = (value.servicesRequired || []).includes(srv);
                  return (
                    <label
                      key={srv}
                      onClick={() => toggleArrayItem("servicesRequired", srv)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold"
                          : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-3.5 h-3.5 accent-emerald-600 rounded"
                      />
                      <span>{srv}</span>
                    </label>
                  );
                })}
              </div>

              <input
                type="text"
                value={value.servicesRequiredOther || ""}
                onChange={(e) => update({ servicesRequiredOther: e.target.value })}
                placeholder="Other services..."
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 text-xs"
              />
            </div>

            {/* 4. Package Selected */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  4
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  Package Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Package Name
                  </label>
                  <input
                    type="text"
                    value={value.packageName}
                    onChange={(e) => update({ packageName: e.target.value })}
                    placeholder="e.g. Growth Retainer, Elite Retainer"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Contract Duration
                  </label>
                  <input
                    type="text"
                    value={value.contractDuration}
                    onChange={(e) => update({ contractDuration: e.target.value })}
                    placeholder="e.g. 3 Months, 6 Months, 1 Year"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={value.startDate}
                    onChange={(e) => update({ startDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={value.endDate}
                    onChange={(e) => update({ endDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Required Deliverables */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  5
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Required Deliverables
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] text-center">
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">Posts / Week</span>
                  <input
                    type="number"
                    min={0}
                    value={value.postsPerWeek}
                    onChange={(e) => update({ postsPerWeek: Number(e.target.value) || 0 })}
                    className="w-full text-center font-mono font-bold py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613] text-emerald-600"
                  />
                </div>
                <div className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] text-center">
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">Reels / Week</span>
                  <input
                    type="number"
                    min={0}
                    value={value.reelsPerWeek}
                    onChange={(e) => update({ reelsPerWeek: Number(e.target.value) || 0 })}
                    className="w-full text-center font-mono font-bold py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613] text-emerald-600"
                  />
                </div>
                <div className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] text-center">
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">Stories / Week</span>
                  <input
                    type="number"
                    min={0}
                    value={value.storiesPerWeek}
                    onChange={(e) => update({ storiesPerWeek: Number(e.target.value) || 0 })}
                    className="w-full text-center font-mono font-bold py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613] text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {DELIVERABLES_OPTIONS.map((item) => {
                  const isChecked = (value.deliverablesChecklist || []).includes(item);
                  return (
                    <label
                      key={item}
                      onClick={() => toggleArrayItem("deliverablesChecklist", item)}
                      className="flex items-center gap-2 cursor-pointer select-none text-stone-600 dark:text-stone-300"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-3.5 h-3.5 accent-emerald-600 rounded"
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 6. Content Requirements */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  6
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FileEdit className="w-3.5 h-3.5 text-emerald-600" />
                  Content Requirements
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                      Content Style / Tone
                    </label>
                    <input
                      type="text"
                      value={value.contentStyleTone}
                      onChange={(e) => update({ contentStyleTone: e.target.value })}
                      placeholder="e.g. Professional, Fun, Educational"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                      Preferred Language
                    </label>
                    <input
                      type="text"
                      value={value.preferredLanguage}
                      onChange={(e) => update({ preferredLanguage: e.target.value })}
                      placeholder="e.g. English, Hindi, Hinglish"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Content References (Links or examples you like)
                  </label>
                  <input
                    type="text"
                    value={value.contentReferences}
                    onChange={(e) => update({ contentReferences: e.target.value })}
                    placeholder="https://instagram.com/..., links, moodboard"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Special Requirements
                  </label>
                  <input
                    type="text"
                    value={value.specialRequirements}
                    onChange={(e) => update({ specialRequirements: e.target.value })}
                    placeholder="e.g. Festivals, seasonal offers, product reveals"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 7. Brand Assets Available */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3 lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  7
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-emerald-600" />
                  Brand Assets Available (Share link or upload location)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  { key: "logo" as const, label: "Logo (Vector / PNG)" },
                  { key: "brandGuidelines" as const, label: "Brand Guidelines" },
                  { key: "photosImages" as const, label: "Photos / Images" },
                  { key: "videosReels" as const, label: "Videos / Raw Reels" },
                  { key: "productImages" as const, label: "Product Images" },
                  { key: "otherAssets" as const, label: "Other Assets" },
                ].map((asset) => {
                  const data = value.brandAssets?.[asset.key] || { available: false, linkOrLocation: "" };
                  return (
                    <div
                      key={asset.key}
                      className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] space-y-1.5"
                    >
                      <label className="flex items-center gap-2 font-bold cursor-pointer select-none text-stone-800 dark:text-stone-200">
                        <input
                          type="checkbox"
                          checked={data.available}
                          onChange={(e) => updateBrandAsset(asset.key, { available: e.target.checked })}
                          className="accent-emerald-600 rounded"
                        />
                        <span>{asset.label}</span>
                      </label>
                      <input
                        type="text"
                        value={data.linkOrLocation}
                        onChange={(e) => updateBrandAsset(asset.key, { linkOrLocation: e.target.value })}
                        placeholder="Share link or upload location"
                        className="w-full px-2 py-1 rounded bg-stone-50 dark:bg-[#191613] border border-stone-200 dark:border-stone-700 outline-none text-[11px]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 8. Product / Service Information */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  8
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  Product / Service Information
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-[11px] text-stone-500">
                  Please give a brief about your main products or services, key features, and price points:
                </p>
                <textarea
                  rows={3}
                  value={value.productServiceInfo}
                  onChange={(e) => update({ productServiceInfo: e.target.value })}
                  placeholder="Describe your products/services, key features, pricing range, and important details..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* 9. Google Drive / Folder Link */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  9
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Google Drive / Folder Link
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-[11px] text-stone-500">
                  If you have a Google Drive folder with brand assets or product footage, paste the link here:
                </p>
                <input
                  type="url"
                  value={value.googleDriveFolderLink}
                  onChange={(e) => update({ googleDriveFolderLink: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            {/* 10. Required Account Access */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3 lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  10
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  Required Account Access (Check all applicable)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {ACCESS_OPTIONS.map((item) => {
                  const isChecked = (value.accountAccess || []).includes(item);
                  return (
                    <label
                      key={item}
                      onClick={() => toggleArrayItem("accountAccess", item)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold"
                          : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-3.5 h-3.5 accent-emerald-600 rounded"
                      />
                      <span className="truncate">{item}</span>
                    </label>
                  );
                })}
              </div>

              <input
                type="text"
                value={value.accountAccessOther || ""}
                onChange={(e) => update({ accountAccessOther: e.target.value })}
                placeholder="Other account access..."
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 text-xs"
              />
            </div>

            {/* 11. Main Point of Contact */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  11
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Main Point of Contact
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={value.pocName}
                    onChange={(e) => update({ pocName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={value.pocDesignation}
                    onChange={(e) => update({ pocDesignation: e.target.value })}
                    placeholder="e.g. Founder, Marketing Head"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={value.pocContactNumber}
                    onChange={(e) => update({ pocContactNumber: e.target.value })}
                    placeholder="+91 Phone"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={value.pocEmailAddress}
                    onChange={(e) => update({ pocEmailAddress: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 12. Preferred Communication Method */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  12
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Preferred Communication Method
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  {COMM_METHODS.map((m) => {
                    const isChecked = (value.communicationMethods || []).includes(m);
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => toggleArrayItem("communicationMethods", m)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isChecked
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={value.communicationMethodOther || ""}
                  onChange={(e) => update({ communicationMethodOther: e.target.value })}
                  placeholder="Other preferred method (e.g. Slack workspace)..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 text-xs"
                />
              </div>
            </div>

            {/* 13. Important Client Notes */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3 lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  13
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-emerald-600" />
                  Important Client Notes
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-[11px] text-stone-500">
                  Anything else we should know before we start? Add any expectations, deadlines, or special instructions:
                </p>
                <textarea
                  rows={3}
                  value={value.importantClientNotes}
                  onChange={(e) => update({ importantClientNotes: e.target.value })}
                  placeholder="Add any specific considerations, upcoming launch events, brand sensitivities, or instructions..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
