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
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  BrandVoiceGuideForm,
  BrandVoiceGuideData,
  DEFAULT_BRAND_VOICE_GUIDE,
} from "@/components/brand/BrandVoiceGuideForm";
import {
  CampaignPlannerForm,
  DEFAULT_CAMPAIGN_PLANNER,
} from "@/components/campaign/CampaignPlannerForm";
import {
  ClientScopeDocumentForm,
  DEFAULT_SCOPE_DOCUMENT,
} from "@/components/scope/ClientScopeDocumentForm";
import {
  ClientOnboardingForm,
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
  MeetingNotesForm,
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
  { id: "Instagram (Professional Account Invite)", label: "Instagram Account Access / Professional Invite", icon: Instagram },
  { id: "Facebook Page & Meta Business Suite", label: "Facebook Page & Meta Business Suite Portfolio Access", icon: Globe },
  { id: "Meta Ads Manager & Pixel Dataset", label: "Meta Ads Manager & Pixel / Dataset Access", icon: Target },
  { id: "Google Business Profile Access", label: "Google Business Profile (Manager / Review Rights)", icon: Building2 },
  { id: "Google Drive Assets Folder Access", label: "Central Google Drive Assets Folder Access", icon: FolderOpen },
  { id: "Canva Team Workspace Invite", label: "Canva Team Invite / Brand Kit Access", icon: Sparkles },
];

export default function ClientRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [formData, setFormData] = useState({
    // Step 1: Company & Credentials
    companyName: "",
    brandName: "",
    contactName: "",
    designation: "Founder / Managing Director",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    gstNumber: "",
    registeredAddress: "",

    // Step 2: Client Strategic Brief & Objectives (from Client Brief Sheet)
    productsServices: "",
    goals: ["Increase Brand Awareness", "Generate Qualified Leads"] as string[],
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
    brandVoiceTone: "Luxury, aesthetic, high-authority",
    preferredLanguage: "English & Hinglish",
    brandVoiceGuide: DEFAULT_BRAND_VOICE_GUIDE,

    // Step 4: Client Onboarding Form & Access Checklist
    accessChecklist: [
      "Instagram (Professional Account Invite)",
      "Facebook Page & Meta Business Suite",
      "Google Drive Assets Folder Access",
    ] as string[],
    onboardingForm: DEFAULT_ONBOARDING_DATA,
    meetingNotes: DEFAULT_MEETING_NOTES,

    // Step 5: Monthly Deliverables Quota & Scope (from Scope Document)
    reelsQuota: 30,
    carouselsQuota: 15,
    storiesQuota: 15,
    approvalSlaAcknowledged: true,
    revisionPolicyAcknowledged: true,
    campaignPlanner: DEFAULT_CAMPAIGN_PLANNER,
    scopeDocument: DEFAULT_SCOPE_DOCUMENT,
    termsAccepted: true,
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
    if (digits.length < 10) return "Phone number must contain at least 10 digits.";
    if (digits.length > 15) return "Phone number cannot exceed 15 digits.";
    if (/^(\d)\1+$/.test(digits)) return "Please enter a valid, non-repetitive phone number.";

    let checkDigits = digits;
    if (digits.length === 12 && digits.startsWith("91")) {
      checkDigits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith("0")) {
      checkDigits = digits.slice(1);
    }
    if (checkDigits.length === 10 && !/^[6-9]\d{9}$/.test(checkDigits)) {
      return "Indian mobile numbers must start with 6, 7, 8, or 9.";
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
    } else if (name === "phone" || name === "whatsapp") {
      cleanVal = value.replace(/[^\d+\s-]/g, "").slice(0, 16);
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
    } else {
      setError(null);
      setCurrentStep((prev) => Math.min(prev + 1, 5) as any);
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
      const res = await fetch("/mdz-crm/api/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
                      type="text"
                      name="phone"
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

                {/* Competitor Analysis Matrix (28-Metric Comparative Matrix) */}
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

                {/* Content Pillars Sheet (5-Pillar Strategy Matrix) */}
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
                {/* Google Drive Raw Footage & Assets Folder */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Google Drive Folder (Raw Footage & Brand Assets)</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">Recommended</span>
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
                    Your editors will directly fetch camera footage and upload final 4K deliverables to this Google Drive link.
                  </p>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* 21-Section Brand Voice & Tone Guide */}
                <div className="pt-5 border-t border-stone-200 dark:border-stone-800">
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
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200 text-xs space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                      Client Onboarding Form (13-Section Full Sheet)
                    </span>
                  </div>
                  <p className="text-[12px] opacity-90 leading-relaxed text-stone-700 dark:text-stone-300">
                    Complete all 13 onboarding sections below. Any company details or contact information you entered in previous steps are already pre-filled. Changes made here will update your master workspace profile.
                  </p>
                </div>

                <ClientOnboardingForm
                  value={{
                    ...formData.onboardingForm,
                    clientName: formData.onboardingForm.clientName || formData.companyName,
                    businessBrandName: formData.onboardingForm.businessBrandName || formData.brandName || formData.companyName,
                    contactNumber: formData.onboardingForm.contactNumber || formData.phone,
                    emailAddress: formData.onboardingForm.emailAddress || formData.email,
                    website: formData.onboardingForm.website || formData.websiteUrl,
                    instagramHandle: formData.onboardingForm.instagramHandle || formData.instagramHandle,
                    facebookHandle: formData.onboardingForm.facebookHandle || formData.facebookUrl,
                    youtubeHandle: formData.onboardingForm.youtubeHandle || formData.youtubeHandle,
                    linkedinHandle: formData.onboardingForm.linkedinHandle || formData.linkedinUrl,
                    googleDriveFolderLink: formData.onboardingForm.googleDriveFolderLink || formData.rawFootageDriveUrl,
                    productServiceInfo: formData.onboardingForm.productServiceInfo || formData.productsServices,
                    contentStyleTone: formData.onboardingForm.contentStyleTone || formData.brandVoiceTone,
                    preferredLanguage: formData.onboardingForm.preferredLanguage || formData.preferredLanguage,
                    pocName: formData.onboardingForm.pocName || formData.contactName,
                    pocDesignation: formData.onboardingForm.pocDesignation || formData.designation,
                    pocContactNumber: formData.onboardingForm.pocContactNumber || formData.phone,
                    pocEmailAddress: formData.onboardingForm.pocEmailAddress || formData.email,
                  }}
                  onChange={(updatedOnboarding) => {
                    setFormData((prev) => ({
                      ...prev,
                      onboardingForm: updatedOnboarding,
                      companyName: updatedOnboarding.clientName || prev.companyName,
                      brandName: updatedOnboarding.businessBrandName || prev.brandName,
                      phone: updatedOnboarding.contactNumber || prev.phone,
                      email: updatedOnboarding.emailAddress || prev.email,
                      websiteUrl: updatedOnboarding.website || prev.websiteUrl,
                      instagramHandle: updatedOnboarding.instagramHandle || prev.instagramHandle,
                      facebookUrl: updatedOnboarding.facebookHandle || prev.facebookUrl,
                      youtubeHandle: updatedOnboarding.youtubeHandle || prev.youtubeHandle,
                      linkedinUrl: updatedOnboarding.linkedinHandle || prev.linkedinUrl,
                      rawFootageDriveUrl: updatedOnboarding.googleDriveFolderLink || prev.rawFootageDriveUrl,
                      productsServices: updatedOnboarding.productServiceInfo || prev.productsServices,
                      brandVoiceTone: updatedOnboarding.contentStyleTone || prev.brandVoiceTone,
                      preferredLanguage: updatedOnboarding.preferredLanguage || prev.preferredLanguage,
                      accessChecklist: updatedOnboarding.accountAccess || prev.accessChecklist,
                    }));
                  }}
                />

                {/* Meeting / Call Notes Sheet (15-Section Intake) */}
                <div className="pt-2">
                  <MeetingNotesForm
                    value={formData.meetingNotes}
                    onChange={(notes) =>
                      setFormData((prev) => ({
                        ...prev,
                        meetingNotes: notes,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* ================= STEP 5: MONTHLY SCOPE & SLAS ================= */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-purple-600" />
                    <span>Monthly Production Quota & Retainer Scope</span>
                  </p>
                  <p className="text-[11px] opacity-80">
                    Define your monthly content target. This automatically establishes your brand's live delivery matrix and production deadlines.
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
                        value={formData.reelsQuota}
                        onChange={handleChange}
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
                        value={formData.carouselsQuota}
                        onChange={handleChange}
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
                        value={formData.storiesQuota}
                        onChange={handleChange}
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

                {/* 18-Module Campaign Planner Blueprint */}
                <div className="pt-2">
                  <CampaignPlannerForm
                    value={formData.campaignPlanner}
                    onChange={(planner) =>
                      setFormData((prev) => ({
                        ...prev,
                        campaignPlanner: planner,
                        reelsQuota: planner.reelsQty ?? prev.reelsQuota,
                        carouselsQuota: planner.carouselsQty ?? prev.carouselsQuota,
                        storiesQuota: planner.storiesQty ?? prev.storiesQuota,
                      }))
                    }
                  />
                </div>

                {/* 22-Section Client Expectations & Scope Document */}
                <div className="pt-2">
                  <ClientScopeDocumentForm
                    value={formData.scopeDocument}
                    onChange={(scopeDoc) =>
                      setFormData((prev) => ({
                        ...prev,
                        scopeDocument: scopeDoc,
                        reelsQuota: scopeDoc.deliverablesReels || prev.reelsQuota,
                        carouselsQuota: scopeDoc.deliverablesCarousels || prev.carouselsQuota,
                        storiesQuota: scopeDoc.deliverablesStories || prev.storiesQuota,
                      }))
                    }
                  />
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
                    <li><strong>IP Ownership:</strong> Full commercial content ownership transfers to client upon final invoice settlement.</li>
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
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
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
                  <span>Continue</span>
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
