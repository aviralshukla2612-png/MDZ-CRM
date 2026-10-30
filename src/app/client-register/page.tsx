"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  FolderOpen,
  Globe,
  Instagram,
  Youtube,
  Linkedin,
  Film,
  Sparkles,
  Target,
  FileText,
  Check,
  TrendingUp,
  Megaphone,
  Users,
  MessageSquare,
  KeyRound,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  BrandVoiceGuideForm,
  BrandVoiceGuideData,
  DEFAULT_BRAND_VOICE_GUIDE,
} from "@/components/brand/BrandVoiceGuideForm";
import { DEFAULT_CAMPAIGN_PLANNER } from "@/components/campaign/CampaignPlannerForm";
import { DEFAULT_SCOPE_DOCUMENT } from "@/components/scope/ClientScopeDocumentForm";
import {
  ClientOnboardingData,
  DEFAULT_ONBOARDING_DATA,
} from "@/components/onboarding/ClientOnboardingForm";
import {
  CompetitorAnalysisForm,
  CompetitorAnalysisData,
  DEFAULT_COMPETITOR_ANALYSIS,
} from "@/components/competitor/CompetitorAnalysisForm";
import {
  ContentPillarsForm,
  ContentPillarsData,
  DEFAULT_CONTENT_PILLARS,
} from "@/components/pillars/ContentPillarsForm";
import {
  MeetingNotesData,
  DEFAULT_MEETING_NOTES,
} from "@/components/meeting/MeetingNotesForm";

const GOAL_OPTIONS = [
  "Increase Brand Awareness",
  "Generate Qualified Leads",
  "Scale Online Sales / Revenue",
  "Build Active Engaged Community",
  "Position as Thought Leader",
  "Product Launch Support",
  "Improve Engagement Rate",
  "Paid Ads Scaling",
];

const ACCESS_ITEMS = [
  { id: "Instagram (Professional Account Invite)", label: "Instagram Account Access / Professional Invite", icon: Instagram, hint: "Grant Partner / Analyst permissions in Meta Business Suite" },
  { id: "Facebook Page & Meta Business Suite", label: "Facebook Page & Meta Business Suite Portfolio Access", icon: Globe, hint: "Allows automated posting and community engagement" },
  { id: "Meta Ads Manager & Pixel Dataset", label: "Meta Ads Manager & Pixel / Dataset Access", icon: Target, hint: "Required if running performance paid campaigns" },
  { id: "Google Business Profile Access", label: "Google Business Profile (Manager / Review Rights)", icon: Building2, hint: "For local SEO, reviews, and verified profile updates" },
  { id: "Google Drive Assets Folder Access", label: "Central Google Drive Assets Folder Access", icon: FolderOpen, hint: "Shared folder for editor footage & high-res outputs" },
  { id: "Canva Team Workspace Invite", label: "Canva Team Invite / Brand Kit Access", icon: Sparkles, hint: "For fast typography, graphic templates & color palettes" },
];

const ONBOARDING_SUB_STEPS = [
  { id: 1, title: "Platform & Social Access Permissions", shortTitle: "Platform Access", icon: "🔑", desc: "Select which business accounts and tools you grant our team permission to operate." },
  { id: 2, title: "Central Brand Assets & Media Drive", shortTitle: "Drive & Media", icon: "📁", desc: "Provide your central raw footage drive folder, brand guidelines, and visual assets." },
  { id: 3, title: "Kickoff Protocols & Fast Approvals", shortTitle: "Kickoff Protocols", icon: "🚀", desc: "Specify communication channels, rapid approval point of contact, and target launch timeline." },
];

export default function ClientRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [onboardingSubStep, setOnboardingSubStep] = useState<1 | 2 | 3>(1);

  const [formData, setFormData] = useState({
    // Step 1: Company & Credentials
    companyName: "",
    brandName: "",
    contactName: "",
    designation: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    gstNumber: "",
    registeredAddress: "",

    // Step 2: Client Strategic Brief & Objectives (from Client Brief Sheet)
    productsServices: "",
    goals: [] as string[],
    targetAudience: "",
    usp: "",
    competitors: "",
    competitorAnalysis: DEFAULT_COMPETITOR_ANALYSIS,
    contentPillars: DEFAULT_CONTENT_PILLARS,
    currentChallenges: "",

    // Step 3: Brand Assets & Creative Identity (from Brand Voice & Onboarding Sheet)
    websiteUrl: "",
    brandGuideUrl: "",
    rawFootageDriveUrl: "",
    primaryColorHex: "#059669",
    instagramHandle: "",
    youtubeHandle: "",
    facebookUrl: "",
    linkedinUrl: "",
    brandVoiceTone: "",
    preferredLanguage: "English & Hinglish",
    brandVoiceGuide: DEFAULT_BRAND_VOICE_GUIDE,

    // Step 4: Client Onboarding Form & Access Checklist
    accessChecklist: [] as string[],
    accessNotes: "",
    brandAssetDriveUrl: "",
    preferredChannel: "WhatsApp VIP Group",
    pocRapidApprovals: "",
    targetLaunchDate: "",
    onboardingNotes: "",
    onboardingForm: DEFAULT_ONBOARDING_DATA,
    meetingNotes: DEFAULT_MEETING_NOTES,

    // Step 5: Monthly Deliverables Quota & Scope (from Scope Document)
    reelsQuota: 0,
    carouselsQuota: 0,
    storiesQuota: 0,
    approvalSlaAcknowledged: false,
    revisionPolicyAcknowledged: false,
    campaignPlanner: DEFAULT_CAMPAIGN_PLANNER,
    scopeDocument: DEFAULT_SCOPE_DOCUMENT,
    termsAccepted: false,
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation functions
  const validatePhone = (rawPhone: string): string | null => {
    const trimmed = rawPhone.trim();
    if (!trimmed) return "Phone number is required.";
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length !== 10) {
      return "Please enter a valid 10-digit mobile number.";
    }
    return null;
  };

  const validateEmail = (emailStr: string): string | null => {
    const trimmed = emailStr.trim();
    if (!trimmed) return "Email address is required.";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return "Please enter a valid business email address.";
    return null;
  };

  const validateName = (nameStr: string, label: string): string | null => {
    const trimmed = nameStr.trim();
    if (!trimmed) return `${label} is required.`;
    if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
    return null;
  };

  const validatePassword = (passStr: string): string | null => {
    if (!passStr) return "Password is required.";
    if (passStr.length < 6) return "Password must be at least 6 characters long.";
    return null;
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    let err: string | null = null;
    if (fieldName === "phone") err = validatePhone(formData.phone);
    if (fieldName === "email") err = validateEmail(formData.email);
    if (fieldName === "contactName") err = validateName(formData.contactName, "Contact full name");
    if (fieldName === "companyName") err = validateName(formData.companyName, "Company legal name");
    if (fieldName === "password") err = validatePassword(formData.password);

    setFieldErrors((prev) => ({ ...prev, [fieldName]: err || "" }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let cleanVal: any = value;

    if (type === "checkbox") {
      cleanVal = (e.target as HTMLInputElement).checked;
    } else if (name === "phone" || name === "whatsapp" || name === "pocRapidApprovals") {
      cleanVal = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "reelsQuota" || name === "carouselsQuota" || name === "storiesQuota") {
      cleanVal = Math.max(0, Number(value) || 0);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: cleanVal,
    }));
  };

  const toggleGoal = (goal: string) => {
    setFormData((prev) => {
      const exists = prev.goals.includes(goal);
      return {
        ...prev,
        goals: exists ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
      };
    });
  };

  const toggleAccessItem = (item: string) => {
    setFormData((prev) => {
      const exists = prev.accessChecklist.includes(item);
      return {
        ...prev,
        accessChecklist: exists
          ? prev.accessChecklist.filter((a) => a !== item)
          : [...prev.accessChecklist, item],
      };
    });
  };

  const validateStep1 = () => {
    const nameErr = validateName(formData.contactName, "Contact full name");
    const compErr = validateName(formData.companyName, "Company legal name");
    const phoneErr = validatePhone(formData.phone);
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password);

    setTouched({
      contactName: true,
      companyName: true,
      phone: true,
      email: true,
      password: true,
    });

    setFieldErrors({
      contactName: nameErr || "",
      companyName: compErr || "",
      phone: phoneErr || "",
      email: emailErr || "",
      password: passErr || "",
    });

    return !nameErr && !compErr && !phoneErr && !emailErr && !passErr;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        setError("Please fill out all required company and contact fields correctly.");
        return;
      }
      setError(null);
      setCurrentStep(2);
      if (typeof window !== "undefined") window.scrollTo({ top: 120, behavior: "smooth" });
    } else if (currentStep === 4) {
      if (onboardingSubStep < 3) {
        setOnboardingSubStep((prev) => (prev + 1) as any);
        if (typeof window !== "undefined") window.scrollTo({ top: 140, behavior: "smooth" });
      } else {
        setError(null);
        setCurrentStep(5);
        if (typeof window !== "undefined") window.scrollTo({ top: 120, behavior: "smooth" });
      }
    } else {
      setError(null);
      setCurrentStep((prev) => Math.min(prev + 1, 5) as any);
      if (typeof window !== "undefined") window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentStep === 4 && onboardingSubStep > 1) {
      setOnboardingSubStep((prev) => (prev - 1) as any);
      if (typeof window !== "undefined") window.scrollTo({ top: 140, behavior: "smooth" });
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1) as any);
      if (typeof window !== "undefined") window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep1()) {
      setCurrentStep(1);
      setError("Please fix errors in Step 1 before submitting.");
      return;
    }

    if (!formData.termsAccepted) {
      setError("You must accept the terms of service to continue.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        onboardingForm: {
          ...formData.onboardingForm,
          clientName: formData.companyName,
          businessBrandName: formData.brandName || formData.companyName,
          contactNumber: formData.phone,
          emailAddress: formData.email,
          website: formData.websiteUrl,
          instagramHandle: formData.instagramHandle,
          facebookHandle: formData.facebookUrl,
          youtubeHandle: formData.youtubeHandle,
          linkedinHandle: formData.linkedinUrl,
          googleDriveFolderLink: formData.rawFootageDriveUrl || formData.brandAssetDriveUrl,
          brandAssetsDriveLink: formData.brandAssetDriveUrl || formData.rawFootageDriveUrl,
          productServiceInfo: formData.productsServices,
          contentStyleTone: formData.brandVoiceTone,
          preferredLanguage: formData.preferredLanguage,
          accountAccess: formData.accessChecklist,
          accessNotes: formData.accessNotes,
          communicationChannels: [formData.preferredChannel || "WhatsApp VIP Group"],
          targetLaunchDate: formData.targetLaunchDate,
          pocName: formData.contactName,
          pocDesignation: formData.designation,
          pocContactNumber: formData.pocRapidApprovals || formData.whatsapp || formData.phone,
          pocEmailAddress: formData.email,
          onboardingNotes: formData.onboardingNotes,
        },
        scopeDocument: {
          ...formData.scopeDocument,
          deliverablesReels: Number(formData.reelsQuota) || 0,
          deliverablesCarousels: Number(formData.carouselsQuota) || 0,
          deliverablesStories: Number(formData.storiesQuota) || 0,
        },
      };

      const res = await fetch("/mdz-crm/api/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed. Please verify your details.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 2200);
      }
    } catch (err: any) {
      console.error("Client registration error:", err);
      setError("Network error occurred connecting to registration service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0D0C0A] text-stone-900 dark:text-stone-100 flex flex-col justify-between p-4 sm:p-6 transition-colors font-sans">
      {/* Top Navbar */}
      <div className="flex items-center justify-between max-w-3xl mx-auto w-full pt-2">
        <Link href="/login" className="flex items-center gap-2 font-bold text-base text-stone-900 dark:text-stone-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black flex items-center justify-center text-sm shadow-xs">
            M
          </div>
          <span className="font-extrabold text-base tracking-tight font-sans">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent font-black">
              Millionaire OS
            </span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Registration Card */}
      <div className="max-w-3xl mx-auto w-full my-6">
        <div className="bg-white dark:bg-[#161411] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header & Step Wizard Indicator */}
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                CLIENT PORTAL & AGENCY ONBOARDING
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">
                Step {currentStep} of 5
              </span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              {currentStep === 1 && "Company & Account Credentials"}
              {currentStep === 2 && "Client Strategic Brief & Objectives"}
              {currentStep === 3 && "Brand Assets & Creative Identity"}
              {currentStep === 4 && "Client Onboarding Form & Access Center"}
              {currentStep === 5 && "Retainer Deliverables Scope & SLAs"}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {currentStep === 1 && "Set up your workspace credentials and point of contact details."}
              {currentStep === 2 && "Define your products, target audience, USP and goals to align our creative team."}
              {currentStep === 3 && "Share your Google Drive assets folder, social media handles, and brand voice style."}
              {currentStep === 4 && "Complete all 13 sections of your onboarding form and grant essential platform permissions."}
              {currentStep === 5 && "Confirm your monthly content quotas and operational turnaround commitments."}
            </p>

            {/* Step Wizard Progress Bar */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep >= s ? "bg-emerald-600" : "bg-stone-200 dark:bg-stone-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">Workspace Onboarding Successful!</p>
                <p className="opacity-90">Redirecting to sign-in portal...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ================= STEP 1: COMPANY & CREDENTIALS ================= */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Legal Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Company / Legal Entity Name *</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("companyName")}
                      placeholder="e.g. Acme Lifestyle Pvt Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    {fieldErrors.companyName && (
                      <span className="text-[11px] text-rose-500">{fieldErrors.companyName}</span>
                    )}
                  </div>

                  {/* Brand Display Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Brand / Trading Name</span>
                    </label>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      placeholder="e.g. Acme Brand"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Person Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Primary Contact Full Name *</span>
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("contactName")}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    {fieldErrors.contactName && (
                      <span className="text-[11px] text-rose-500">{fieldErrors.contactName}</span>
                    )}
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Designation / Role</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Founder, Marketing Head"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Work Email (Sign-In ID) *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                      placeholder="e.g. contact@acme.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    {fieldErrors.email && (
                      <span className="text-[11px] text-rose-500">{fieldErrors.email}</span>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Account Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleBlur("password")}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <span className="text-[11px] text-rose-500">{fieldErrors.password}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mobile Number *</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur("phone")}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    {fieldErrors.phone && (
                      <span className="text-[11px] text-rose-500">{fieldErrors.phone}</span>
                    )}
                  </div>

                  {/* GSTIN */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">GSTIN (Tax ID - Optional)</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Registered Office Address (Optional)</label>
                  <input
                    type="text"
                    name="registeredAddress"
                    value={formData.registeredAddress}
                    onChange={handleChange}
                    placeholder="e.g. Suite 402, Signature Towers, Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* ================= STEP 2: CLIENT BRIEF & STRATEGY ================= */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Client Strategic Brief (Initial Discovery)</span>
                  </p>
                  <p className="text-[11px] opacity-80">
                    This brief helps our strategy and content teams engineer the right reels, hooks, and messaging for your brand.
                  </p>
                </div>

                {/* Main Products / Services */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Main Products or Services Offered
                  </label>
                  <input
                    type="text"
                    name="productsServices"
                    value={formData.productsServices}
                    onChange={handleChange}
                    placeholder="e.g. Luxury Handcrafted Jewellery, D2C Wellness Supplements, Real Estate Advisory"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Business & Social Goals */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Primary Business & Social Media Goals
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_OPTIONS.map((goal) => {
                      const isSelected = formData.goals.includes(goal);
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => toggleGoal(goal)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-stone-50 dark:bg-[#1f1c18] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-emerald-500"
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <Target className="w-3 h-3 opacity-50" />}
                          <span>{goal}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Audience */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Target Audience & Demographics
                    </label>
                    <input
                      type="text"
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleChange}
                      placeholder="e.g. Age 24-45, HNI luxury buyers, Tier-1 Metro cities"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* USP */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Unique Selling Proposition (USP)
                    </label>
                    <input
                      type="text"
                      name="usp"
                      value={formData.usp}
                      onChange={handleChange}
                      placeholder="What sets your brand apart? (e.g. 100% Handcrafted, 24h dispatch)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top Competitors */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Main Competitors (Names or Social Handles)
                    </label>
                    <input
                      type="text"
                      name="competitors"
                      value={formData.competitors}
                      onChange={handleChange}
                      placeholder="e.g. Brand Alpha, @competitor_insta"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Current Challenges */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Current Content / Marketing Roadblocks
                    </label>
                    <input
                      type="text"
                      name="currentChallenges"
                      value={formData.currentChallenges}
                      onChange={handleChange}
                      placeholder="e.g. Inconsistent posting, low reach, creative fatigue"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Competitor Analysis Matrix */}
                <div className="pt-2">
                  <CompetitorAnalysisForm
                    value={formData.competitorAnalysis}
                    onChange={(analysis) =>
                      setFormData((prev) => {
                        const compNames = [
                          analysis.competitor1?.name,
                          analysis.competitor2?.name,
                          analysis.competitor3?.name,
                        ]
                          .filter(Boolean)
                          .join(", ");
                        return {
                          ...prev,
                          competitorAnalysis: analysis,
                          competitors: compNames || prev.competitors,
                        };
                      })
                    }
                  />
                </div>

                {/* Content Pillars Sheet */}
                <div className="pt-2">
                  <ContentPillarsForm
                    value={formData.contentPillars}
                    onChange={(pillars) =>
                      setFormData((prev) => ({
                        ...prev,
                        contentPillars: pillars,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* ================= STEP 3: BRAND ASSETS & CREATIVE IDENTITY ================= */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Website */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-600" />
                      <span>Official Website URL</span>
                    </label>
                    <input
                      type="url"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      placeholder="https://yourbrand.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                      <span>Instagram Handle</span>
                    </label>
                    <input
                      type="text"
                      name="instagramHandle"
                      value={formData.instagramHandle}
                      onChange={handleChange}
                      placeholder="@yourbrand.official"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* YouTube */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-rose-600" />
                      <span>YouTube Channel Link / Handle</span>
                    </label>
                    <input
                      type="text"
                      name="youtubeHandle"
                      value={formData.youtubeHandle}
                      onChange={handleChange}
                      placeholder="@yourchannel"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                      <span>LinkedIn Company URL</span>
                    </label>
                    <input
                      type="text"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      placeholder="linkedin.com/company/yourbrand"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Brand Accent Color */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="primaryColorHex"
                        value={formData.primaryColorHex}
                        onChange={handleChange}
                        className="w-10 h-10 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer p-0.5 bg-white dark:bg-stone-800"
                      />
                      <input
                        type="text"
                        name="primaryColorHex"
                        value={formData.primaryColorHex}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Brand Voice / Tone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Brand Voice & Persona Style
                    </label>
                    <select
                      name="brandVoiceTone"
                      value={formData.brandVoiceTone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Luxury, aesthetic, high-authority, polished">Luxury, Aesthetic & High-Authority</option>
                      <option value="Bold, energetic, inspirational, modern">Bold, Energetic & Modern</option>
                      <option value="Professional, trustworthy, expert, corporate">Professional, Trustworthy & Corporate</option>
                      <option value="Relatable, friendly, humorous, community-first">Relatable, Friendly & Community-first</option>
                      <option value="Educational, structured, value-driven">Educational, Structured & Value-driven</option>
                    </select>
                  </div>

                  {/* Content Language */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Preferred Content Language
                    </label>
                    <select
                      name="preferredLanguage"
                      value={formData.preferredLanguage}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="English & Hinglish">English & Hinglish (Recommended)</option>
                      <option value="English Only">English Only (Global / Corporate)</option>
                      <option value="Hindi Only">Hindi Only (Regional Reach)</option>
                    </select>
                  </div>
                </div>

                {/* Brand Voice & Tone Architecture Guide */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                  <BrandVoiceGuideForm
                    value={formData.brandVoiceGuide}
                    onChange={(guide) =>
                      setFormData((prev) => ({
                        ...prev,
                        brandVoiceGuide: guide,
                        brandVoiceTone: guide.toneTypes?.length ? guide.toneTypes.join(", ") : prev.brandVoiceTone,
                        preferredLanguage: guide.preferredLanguages?.length ? guide.preferredLanguages.join(", ") : prev.preferredLanguage,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* ================= STEP 4: CLIENT ONBOARDING & ACCESS CENTER ================= */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                {/* Step 4 Sub-Stepper Header */}
                <div className="rounded-2xl bg-stone-50 dark:bg-[#1a1713] border border-stone-200 dark:border-stone-800 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                        Onboarding Phase {onboardingSubStep} of 3
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 tracking-tight">
                        {ONBOARDING_SUB_STEPS[onboardingSubStep - 1].title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {ONBOARDING_SUB_STEPS[onboardingSubStep - 1].desc}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-400">
                      {Math.round((onboardingSubStep / 3) * 100)}% Complete
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
                      style={{ width: `${(onboardingSubStep / 3) * 100}%` }}
                    />
                  </div>

                  {/* Sub-Step Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-semibold">
                    {ONBOARDING_SUB_STEPS.map((s) => {
                      const isCurrent = s.id === onboardingSubStep;
                      const isDone = s.id < onboardingSubStep;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setOnboardingSubStep(s.id as any)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-white dark:bg-stone-900 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/20"
                              : isDone
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/50 dark:border-emerald-800/50 text-stone-700 dark:text-stone-300"
                              : "bg-transparent border-transparent text-stone-400 hover:border-stone-300 dark:hover:border-stone-700"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                              isCurrent
                                ? "bg-emerald-600 text-white font-bold"
                                : isDone
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : "bg-stone-200 dark:bg-stone-800 text-stone-500"
                            }`}
                          >
                            {isDone ? <Check className="w-3 h-3" /> : s.id}
                          </span>
                          <span className="truncate text-xs font-bold">{s.shortTitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Step 1: Platform & Social Media Access */}
                {onboardingSubStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Platform Access Permissions (Select all applicable)
                      </label>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Select the accounts your dedicated marketing team will manage or run campaigns on.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ACCESS_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isSelected = formData.accessChecklist.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleAccessItem(item.id)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-xs"
                                : "bg-stone-50 dark:bg-[#1f1c18] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-emerald-600 text-white"
                                  : "bg-stone-200 dark:bg-stone-800 text-stone-500"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold truncate text-stone-900 dark:text-stone-100">
                                  {item.id}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </div>
                              <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2">
                                {item.hint}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Account Access Notes or User Credentials (Optional)
                      </label>
                      <textarea
                        rows={2}
                        name="accessNotes"
                        value={formData.accessNotes}
                        onChange={handleChange}
                        placeholder="e.g. Sent invite to team@millionairedizital.com, or password manager vault link..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-Step 2: Central Brand Assets & Drive Setup */}
                {onboardingSubStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Central Google Drive Folder (Raw Footage & High-Res Assets)</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Recommended</span>
                      </label>
                      <input
                        type="url"
                        name="rawFootageDriveUrl"
                        value={formData.rawFootageDriveUrl}
                        onChange={handleChange}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      />
                      <p className="text-[10px] text-stone-400">
                        Our video editing and animation team will fetch raw footage from here and upload 4K ready-to-post deliverables.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Brand Guidelines / Canva Brand Kit / Figma Link (Optional)</span>
                        </span>
                      </label>
                      <input
                        type="url"
                        name="brandGuideUrl"
                        value={formData.brandGuideUrl}
                        onChange={handleChange}
                        placeholder="https://canva.com/brand-kit/... or Google Drive link"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Brand Colors, Typography or Visual Preferences (Optional)
                      </label>
                      <textarea
                        rows={2}
                        name="onboardingNotes"
                        value={formData.onboardingNotes}
                        onChange={handleChange}
                        placeholder="e.g. Primary Hex: #059669, Fonts: Inter & Outfit, clean luxury aesthetic with high contrast..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-Step 3: Kickoff Protocols & Fast Approvals */}
                {onboardingSubStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Preferred Channel */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          Preferred Communication Channel
                        </label>
                        <select
                          name="preferredChannel"
                          value={formData.preferredChannel}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="WhatsApp VIP Group">WhatsApp VIP Dedicated Group (Fastest)</option>
                          <option value="Email Thread">Email Official Thread</option>
                          <option value="MDZ Client Portal">MDZ Client Portal Direct Chat</option>
                          <option value="Slack Channel">Slack Dedicated Channel</option>
                        </select>
                      </div>

                      {/* Rapid Approvals Contact */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          Dedicated WhatsApp for 24h Approvals
                        </label>
                        <input
                          type="tel"
                          name="pocRapidApprovals"
                          maxLength={10}
                          value={formData.pocRapidApprovals}
                          onChange={handleChange}
                          placeholder={formData.phone || "e.g. 9876543210"}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Target Campaign Launch / First Deliverable Live Date
                      </label>
                      <input
                        type="date"
                        name="targetLaunchDate"
                        value={formData.targetLaunchDate}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 5: MONTHLY SCOPE & SLAS ================= */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-fade-in">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-emerald-600" />
                    <span>Monthly Content Quota & Retainer Scope</span>
                  </p>
                  <p className="text-[11px] opacity-80">
                    Define your target monthly assets. This establishes your production pipeline and live delivery tracking spreadsheet.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Monthly Reels Quota */}
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 space-y-2 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Short Videos / Reels
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min="0"
                        name="reelsQuota"
                        value={formData.reelsQuota || ""}
                        onChange={handleChange}
                        placeholder="e.g. 20"
                        className="w-20 text-center font-mono font-bold text-xl py-1 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400">Target Reels / Month</span>
                  </div>

                  {/* Monthly Carousels Quota */}
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 space-y-2 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      High-Value Carousels
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min="0"
                        name="carouselsQuota"
                        value={formData.carouselsQuota || ""}
                        onChange={handleChange}
                        placeholder="e.g. 10"
                        className="w-20 text-center font-mono font-bold text-xl py-1 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400">Target Carousels / Month</span>
                  </div>

                  {/* Monthly Stories Quota */}
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 space-y-2 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Stories & Statics
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min="0"
                        name="storiesQuota"
                        value={formData.storiesQuota || ""}
                        onChange={handleChange}
                        placeholder="e.g. 30"
                        className="w-20 text-center font-mono font-bold text-xl py-1 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <span className="text-[10px] text-stone-400">Stories & Statics / Month</span>
                  </div>
                </div>

                {/* Plan Summary Card */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                      TOTAL MONTHLY DELIVERABLES
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-800 dark:text-emerald-200">
                      {Number(formData.reelsQuota) + Number(formData.carouselsQuota) + Number(formData.storiesQuota)} Content Assets
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-600 text-white">
                    Growth Retainer
                  </span>
                </div>

                {/* Operational SLA Policies */}
                <div className="space-y-2 p-3.5 rounded-xl bg-stone-50 dark:bg-[#1f1c18] border border-stone-200 dark:border-stone-700 text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Operational Governance & Commitments</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-400 text-[11px]">
                    <li><strong>Review SLA:</strong> Client reviews drafts within 24-48 hours via portal or drive.</li>
                    <li><strong>Revision Policy:</strong> 2 rounds of creative revisions included per content deliverable.</li>
                    <li><strong>IP Ownership:</strong> Full commercial content ownership transfers to client upon invoice clearance.</li>
                  </ul>
                </div>

                {/* Terms Acceptance */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      I accept the{" "}
                      <Link href="/terms-and-conditions" target="_blank" className="text-emerald-600 underline font-bold">
                        Client Master Services Agreement (v1.0)
                      </Link>{" "}
                      and confirm the onboarding details provided.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation & Submission Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
              {currentStep > 1 || (currentStep === 4 && onboardingSubStep > 1) ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>
                    {currentStep === 4 && onboardingSubStep > 1 ? "Previous Section" : "Previous"}
                  </span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Already have an account? Sign In
                </Link>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span>
                    {currentStep === 4 && onboardingSubStep < 3 ? "Next Section" : "Continue"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || success}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Registering Brand Account...</span>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-stone-400 py-2">
        © 2026 Millionaire Dizital OS • Client Portal & Agency Governance Engine
      </div>
    </div>
  );
}
