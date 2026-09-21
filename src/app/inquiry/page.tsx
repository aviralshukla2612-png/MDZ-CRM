"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  Phone,
  Mail,
  Briefcase,
  Target,
  Sparkles,
  Layers,
  Clock,
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  FileIcon,
  ShieldCheck,
  Compass,
  TrendingUp,
  Share2,
  Tv,
  Globe,
  Video,
  Search,
  Bot,
  Megaphone,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Step 2 Industries
const INDUSTRIES = [
  { id: "Fashion & Jewellery", label: "Fashion & Jewellery", icon: "💎" },
  { id: "Technology & SaaS", label: "Technology & SaaS", icon: "💻" },
  { id: "Beauty & Wellness", label: "Beauty, Salon & Wellness", icon: "💄" },
  { id: "Real Estate", label: "Real Estate & Construction", icon: "🏢" },
  { id: "FMCG & D2C", label: "FMCG, D2C & Retail", icon: "🛍️" },
  { id: "Events & Media", label: "Events & Media Production", icon: "🎬" },
  { id: "Travel & Hospitality", label: "Travel & Hospitality", icon: "✈️" },
  { id: "Healthcare & Fitness", label: "Healthcare & Fitness", icon: "🏥" },
  { id: "Education & EdTech", label: "Education & Coaching", icon: "🎓" },
  { id: "Food & Beverages", label: "Food, Cafe & Restaurant", icon: "🍽️" },
  { id: "Other", label: "Other Industry", icon: "✨" },
];

// Step 2 Business Types
const BUSINESS_TYPES = ["B2B", "B2C", "D2C", "Enterprise", "Agency", "Startup", "Local Business"];

// Step 3 Goals
const GOALS = [
  {
    id: "GENERATE_LEADS",
    title: "Generate More Qualified Leads",
    desc: "Acquire high-intent inbound prospects and sales inquiries.",
    icon: Target,
  },
  {
    id: "INCREASE_SALES",
    title: "Increase Sales & Revenue",
    desc: "Boost conversion rates and maximize customer lifetime value.",
    icon: TrendingUp,
  },
  {
    id: "GROW_SOCIAL_MEDIA",
    title: "Grow Social Media & Community",
    desc: "Scale brand following, viral reach, and organic engagement.",
    icon: Share2,
  },
  {
    id: "BRAND_AWARENESS",
    title: "Build Brand Authority & Recall",
    desc: "Position your brand as the undisputed leader in your industry.",
    icon: Sparkles,
  },
  {
    id: "LAUNCH_PRODUCT",
    title: "Launch a New Product / Brand",
    desc: "Execute a high-impact multi-channel launch campaign.",
    icon: Megaphone,
  },
  {
    id: "RUN_PAID_ADS",
    title: "Run High-ROI Paid Advertising",
    desc: "Profitable performance marketing on Meta, Google & YouTube.",
    icon: Tv,
  },
  {
    id: "BUILD_WEBSITE",
    title: "Build / Redesign High-Converting Website",
    desc: "State-of-the-art UI/UX web experiences that convert visitors.",
    icon: Globe,
  },
  {
    id: "VIDEO_PRODUCTION",
    title: "Video Shoots & High-Impact Reels",
    desc: "Cinematic commercial shoots, podcasting, and short-form video.",
    icon: Video,
  },
  {
    id: "SEO_RANKING",
    title: "SEO & Search Engine Domination",
    desc: "Rank #1 on Google search results for your primary keywords.",
    icon: Search,
  },
];

// Step 4 Services
const SERVICES = [
  {
    id: "Social Media Management",
    title: "Social Media Management",
    desc: "Full-service management, daily content, community engagement & scaling.",
    badge: "Popular",
    icon: Share2,
  },
  {
    id: "Content Strategy & Calendars",
    title: "Content Strategy & Calendars",
    desc: "Data-driven creative strategy, viral hooks & monthly scheduled calendars.",
    badge: "Essential",
    icon: FileText,
  },
  {
    id: "Performance Marketing (Meta/Google)",
    title: "Performance Marketing (Meta/Google)",
    desc: "High-yield paid ad campaigns with real-time tracking and ROAS optimization.",
    badge: "High ROI",
    icon: TrendingUp,
  },
  {
    id: "Website Design & Development",
    title: "Website Design & Development",
    desc: "Modern responsive web applications, landing pages & eCommerce platforms.",
    badge: "Tech",
    icon: Globe,
  },
  {
    id: "Video Shoots & Commercial Production",
    title: "Video Shoots & Commercial Production",
    desc: "Studio video shoots, product reels, 4K commercials & aerial drone coverage.",
    badge: "Creative",
    icon: Video,
  },
  {
    id: "Branding & Visual Identity",
    title: "Branding & Visual Identity",
    desc: "Logo suites, typography guidelines, brand guidelines & packaging design.",
    badge: "Design",
    icon: Sparkles,
  },
  {
    id: "Search Engine Optimization (SEO)",
    title: "Search Engine Optimization (SEO)",
    desc: "Technical SEO audits, high-intent backlinks & search query domination.",
    badge: "Organic",
    icon: Search,
  },
  {
    id: "AI Automations & CRM Solutions",
    title: "AI Automations & CRM Solutions",
    desc: "Custom CRM systems, automated WhatsApp workflows & intelligent operations.",
    badge: "Enterprise",
    icon: Bot,
  },
  {
    id: "Influencer Marketing & PR",
    title: "Influencer Marketing & PR",
    desc: "Verified creator collaborations, press coverage & reputation management.",
    badge: "Growth",
    icon: Megaphone,
  },
];

// Step 5 Durations
const DURATIONS = [
  { type: "MONTH", months: 1, label: "1 Month", desc: "Short Sprint / Proof of Concept" },
  { type: "QUARTER", months: 3, label: "3 Months (1 Quarter)", desc: "Recommended for solid traction & results", popular: true },
  { type: "HALF_YEAR", months: 6, label: "6 Months (2 Quarters)", desc: "Consistent scaling & market dominance" },
  { type: "YEAR", months: 12, label: "1 Year", desc: "Annual strategic partnership" },
  { type: "3_YEARS", months: 36, label: "3 Years", desc: "Enterprise scale & multi-year expansion" },
  { type: "5_YEARS", months: 60, label: "5 Years", desc: "Long-term industry leadership retainer" },
  { type: "CUSTOM", months: 8, label: "Custom Duration", desc: "Select custom engagement timeline" },
];

export default function PublicInquiryPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    // Step 2
    industry: "",
    subCategory: "",
    businessType: "B2B",
    location: "",
    // Step 3
    goals: [] as string[],
    // Step 4
    services: [] as string[],
    // Step 5
    durationType: "QUARTER",
    durationMonths: 3,
    // Step 6
    targetAudience: "",
    competitors: "",
    additionalDetails: "",
    // Step 7
    confirmed: false,
    website_hp: "", // honeypot
  });

  // Attached files
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [apiError, setApiError] = useState("");

  // Step 1 Validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.companyName.trim()) errs.companyName = "Company or brand name is required";
    if (!formData.contactName.trim()) errs.contactName = "Your name is required";
    if (!formData.phone.trim() || formData.phone.trim().length < 7) errs.phone = "Valid phone or WhatsApp number is required";
    if (!formData.email.trim() || !formData.email.includes("@")) errs.email = "Valid email address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!formData.industry) errs.industry = "Please select your industry";
    if (!formData.subCategory.trim()) errs.subCategory = "Please specify your sub-category or niche";
    if (!formData.businessType) errs.businessType = "Please select your business type";
    if (!formData.location.trim()) errs.location = "Location (City, Country) is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (formData.goals.length === 0) errs.goals = "Please select at least one primary goal";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    const errs: Record<string, string> = {};
    if (formData.services.length === 0) errs.services = "Please select at least one service required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 5 Validation
  const validateStep5 = () => {
    return true;
  };

  // Step 6 Validation
  const validateStep6 = () => {
    return true;
  };

  // Step 7 Validation
  const validateStep7 = () => {
    const errs: Record<string, string> = {};
    if (!formData.confirmed) errs.confirmed = "You must confirm the details and agree to be contacted";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();
    else if (currentStep === 3) isValid = validateStep3();
    else if (currentStep === 4) isValid = validateStep4();
    else if (currentStep === 5) isValid = validateStep5();
    else if (currentStep === 6) isValid = validateStep6();
    else if (currentStep === 7) isValid = validateStep7();

    if (isValid) {
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Multi-select toggle helper
  const toggleGoal = (goalId: string) => {
    setFormData((prev) => {
      const exists = prev.goals.includes(goalId);
      const updated = exists ? prev.goals.filter((g) => g !== goalId) : [...prev.goals, goalId];
      return { ...prev, goals: updated };
    });
    if (errors.goals) setErrors((prev) => ({ ...prev, goals: "" }));
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => {
      const exists = prev.services.includes(serviceId);
      const updated = exists ? prev.services.filter((s) => s !== serviceId) : [...prev.services, serviceId];
      return { ...prev, services: updated };
    });
    if (errors.services) setErrors((prev) => ({ ...prev, services: "" }));
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const validFiles: File[] = [];
      for (const f of filesArr) {
        if (f.size > 25 * 1024 * 1024) {
          alert(`File "${f.name}" is larger than 25MB.`);
        } else {
          validFiles.push(f);
        }
      }
      setAttachedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep7()) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(formData));

      for (const file of attachedFiles) {
        formDataToSend.append("files", file);
      }

      const res = await fetch("/mdz-crm/api/public/inquiries", {
        method: "POST",
        body: formDataToSend,
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setReferenceNumber(json.referenceId || "LEAD-CONFIRMED");
        setSubmissionSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setApiError(json.error || "Failed to submit inquiry. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setApiError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step headers configuration
  const STEP_TITLES = [
    "Company Details",
    "Industry & Business",
    "Goals & Objectives",
    "Select Services",
    "Project Duration",
    "Additional Details",
    "Review & Submit",
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-emerald-500/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A0D14]/80 backdrop-blur-xl border-b border-stone-200/80 dark:border-stone-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <img
              src="/mdz-crm/mdz-logo.jpg"
              alt="Millionaire OS"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl shadow-xs ring-1 ring-emerald-500/30 group-hover:scale-105 transition-all"
            />
            <span className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent font-black">
                Millionaire
              </span>
              <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-300 bg-clip-text text-transparent font-black">
                OS
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Client Inquiry Portal
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        {submissionSuccess ? (
          /* SUCCESS STATE */
          <div className="bg-white dark:bg-[#121622] rounded-3xl border border-emerald-500/30 p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Reference ID: {referenceNumber}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight pt-2">
                Thank You, {formData.contactName}!
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                Your requirement for <strong className="text-emerald-600 dark:text-emerald-400">{formData.companyName}</strong> has been safely recorded in our system.
              </p>
            </div>

            {/* Next Steps Roadmap */}
            <div className="bg-slate-50 dark:bg-[#0D101A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-left max-w-xl mx-auto space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-500" />
                What Happens Next?
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Requirement Assessment</p>
                    <p className="text-slate-500 dark:text-slate-400">Our strategy leads will review your services, goals, and competitor scope.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Discovery & Strategy Call</p>
                    <p className="text-slate-500 dark:text-slate-400">Our team will reach out via WhatsApp/Email to schedule a 15-minute alignment call.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Tailored Proposal & Onboarding</p>
                    <p className="text-slate-500 dark:text-slate-400">Receive an itemized action roadmap and access your Client Portal.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmissionSuccess(false);
                  setCurrentStep(1);
                  setFormData({
                    companyName: "",
                    contactName: "",
                    phone: "",
                    email: "",
                    industry: "",
                    subCategory: "",
                    businessType: "B2B",
                    location: "",
                    goals: [],
                    services: [],
                    durationType: "QUARTER",
                    durationMonths: 3,
                    targetAudience: "",
                    competitors: "",
                    additionalDetails: "",
                    confirmed: false,
                    website_hp: "",
                  });
                  setAttachedFiles([]);
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Submit Another Requirement
              </button>
            </div>
          </div>
        ) : (
          /* MULTI-STEP WIZARD FORM */
          <div className="bg-white dark:bg-[#121622] rounded-3xl border border-stone-200 dark:border-stone-800/80 shadow-2xl overflow-hidden flex flex-col">
            {/* Progress Stepper Header */}
            <div className="bg-slate-50/80 dark:bg-[#0D101A]/80 border-b border-stone-200 dark:border-stone-800 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                    Step {currentStep} of {totalSteps}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {STEP_TITLES[currentStep - 1]}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    {Math.round((currentStep / totalSteps) * 100)}% Completed
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>

              {/* Desktop Steps pills */}
              <div className="hidden md:flex items-center justify-between mt-4 text-[11px] font-semibold text-slate-400">
                {STEP_TITLES.map((title, idx) => {
                  const stepNum = idx + 1;
                  const isDone = stepNum < currentStep;
                  const isCurrent = stepNum === currentStep;
                  return (
                    <div
                      key={title}
                      className={`flex items-center gap-1.5 ${
                        isCurrent
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : isDone
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                          isCurrent
                            ? "bg-emerald-500 text-white font-bold"
                            : isDone
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : stepNum}
                      </span>
                      <span className="truncate max-w-[90px]">{title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Body */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
              {/* Anti-spam honeypot (hidden) */}
              <input
                type="text"
                name="website_hp"
                value={formData.website_hp}
                onChange={(e) => setFormData({ ...formData, website_hp: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {apiError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* STEP 1: COMPANY DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Let's start with your company & contact details
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      We'll use this information to customize your project proposal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        Company / Brand Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Luxe Jewellery, TechNova Inc"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border ${
                          errors.companyName ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        } text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium`}
                      />
                      {errors.companyName && <p className="text-[11px] text-rose-500 font-semibold">{errors.companyName}</p>}
                    </div>

                    {/* Contact Person Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Karan Sharma"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border ${
                          errors.contactName ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        } text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium`}
                      />
                      {errors.contactName && <p className="text-[11px] text-rose-500 font-semibold">{errors.contactName}</p>}
                    </div>

                    {/* Mobile / WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        Mobile / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border ${
                          errors.phone ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        } text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium`}
                      />
                      {errors.phone && <p className="text-[11px] text-rose-500 font-semibold">{errors.phone}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        Business Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. contact@yourcompany.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border ${
                          errors.email ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        } text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium`}
                      />
                      {errors.email && <p className="text-[11px] text-rose-500 font-semibold">{errors.email}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: INDUSTRY & BUSINESS */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      What industry does your business operate in?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select your primary sector so we assign relevant creative directors.
                    </p>
                  </div>

                  {/* Industry Grid */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Industry Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {INDUSTRIES.map((ind) => {
                        const isSelected = formData.industry === ind.id;
                        return (
                          <button
                            key={ind.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, industry: ind.id });
                              if (errors.industry) setErrors((prev) => ({ ...prev, industry: "" }));
                            }}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                                : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                          >
                            <span className="text-lg shrink-0">{ind.icon}</span>
                            <span className="truncate">{ind.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.industry && <p className="text-[11px] text-rose-500 font-semibold">{errors.industry}</p>}
                  </div>

                  {/* Sub-category & Business Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Sub-Category / Niche <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Diamond Jewellery, Luxury Skincare, B2B SaaS"
                        value={formData.subCategory}
                        onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border ${
                          errors.subCategory ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        } text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium`}
                      />
                      {errors.subCategory && <p className="text-[11px] text-rose-500 font-semibold">{errors.subCategory}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Location (City, Country) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai, India / Dubai, UAE"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border ${
                          errors.location ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                        } text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium`}
                      />
                      {errors.location && <p className="text-[11px] text-rose-500 font-semibold">{errors.location}</p>}
                    </div>

                    {/* Business Type selector */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Business Model / Type <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {BUSINESS_TYPES.map((bt) => {
                          const isSelected = formData.businessType === bt;
                          return (
                            <button
                              key={bt}
                              type="button"
                              onClick={() => setFormData({ ...formData, businessType: bt })}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20 ring-2 ring-amber-400/30"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {bt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: GOALS */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      What are your primary business goals?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select all goals that apply to this engagement (multi-select).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {GOALS.map((g) => {
                      const Icon = g.icon;
                      const isSelected = formData.goals.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => toggleGoal(g.id)}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all space-y-2 relative ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                isSelected
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{g.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                              {g.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {errors.goals && <p className="text-xs text-rose-500 font-semibold">{errors.goals}</p>}
                </div>
              )}

              {/* STEP 4: SERVICES */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Which services are you looking to engage?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select all relevant creative, technical, or marketing services (multi-select).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SERVICES.map((s) => {
                      const Icon = s.icon;
                      const isSelected = formData.services.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all space-y-2.5 relative ${
                            isSelected
                              ? "bg-amber-50 dark:bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                isSelected
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {s.badge}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                  isSelected
                                    ? "bg-amber-500 border-amber-500 text-white"
                                    : "border-slate-300 dark:border-slate-700"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{s.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                              {s.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {errors.services && <p className="text-xs text-rose-500 font-semibold">{errors.services}</p>}
                </div>
              )}

              {/* STEP 5: PROJECT DURATION */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      What is your estimated project duration?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Select your target timeline or ongoing retainer length.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {DURATIONS.map((dur) => {
                      const isSelected = formData.durationType === dur.type;
                      return (
                        <div
                          key={dur.type}
                          onClick={() => setFormData({ ...formData, durationType: dur.type, durationMonths: dur.months })}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-900 dark:text-slate-100">{dur.label}</p>
                              {dur.popular && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{dur.desc}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {formData.durationType === "CUSTOM" && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 mt-4">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span>Custom Duration:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          {formData.durationMonths} Months
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={60}
                        value={formData.durationMonths}
                        onChange={(e) => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                        className="w-full accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>1 Month</span>
                        <span>12 Months</span>
                        <span>36 Months</span>
                        <span>60 Months</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: ADDITIONAL DETAILS & ATTACHMENTS */}
              {currentStep === 6 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Additional Details & File Attachments (Optional)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Share your target audience, top competitors, and upload logos, decks or brief documents.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Target Audience */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Target Audience & Demographics
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Age 22-45, HNI luxury buyers, Tier-1 Metro cities"
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>

                    {/* Competitors */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Top Competitors (Names or Links)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Brand A, Competitor B, www.example.com"
                        value={formData.competitors}
                        onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>

                    {/* Detailed Brief */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Project Scope Brief / Specific Requirements
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us any specific timelines, campaign vision, current pain points, or expected deliverables..."
                        value={formData.additionalDetails}
                        onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-medium resize-none"
                      />
                    </div>

                    {/* Drag & Drop File Upload Area */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Attach Brand Assets / Brief Documents</span>
                        <span className="text-[10px] text-slate-400 font-mono">Max 25MB each</span>
                      </label>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/40 group"
                      >
                        <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-500 transition-colors mb-2" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Click to upload or drag & drop files here
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          PDF, DOCX, PNG, JPG, ZIP (Stored securely in Google Drive)
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          multiple
                          className="hidden"
                        />
                      </div>

                      {/* File preview list */}
                      {attachedFiles.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {attachedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-medium border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="truncate">{file.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(idx);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: REVIEW & CONFIRMATION */}
              {currentStep === 7 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Review Your Requirement & Confirm
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Double-check your submission details before submitting.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Company Name</span>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{formData.companyName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Contact Person</span>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {formData.contactName} ({formData.phone})
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{formData.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Industry & Location</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {formData.industry} • {formData.location} ({formData.businessType})
                        </p>
                      </div>
                    </div>

                    {/* Services & Goals badges */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Selected Services ({formData.services.length})</span>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.services.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Selected Goals ({formData.goals.length})</span>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.goals.map((g) => {
                          const goalObj = GOALS.find((item) => item.id === g);
                          return (
                            <span
                              key={g}
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-300 dark:border-emerald-800"
                            >
                              {goalObj?.title || g}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {formData.durationMonths} Months ({formData.durationType})
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Attachments</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {attachedFiles.length} file(s) attached
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.confirmed}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmed: e.target.checked });
                          if (errors.confirmed) setErrors((prev) => ({ ...prev, confirmed: "" }));
                        }}
                        className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        I confirm that the information provided is correct and I agree to be contacted by the Millionaire OS strategy and leadership team.
                      </span>
                    </label>
                    {errors.confirmed && <p className="text-xs text-rose-500 font-semibold mt-2">{errors.confirmed}</p>}
                  </div>
                </div>
              )}

              {/* Navigation Controls Bar */}
              <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer ml-auto"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.confirmed}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:opacity-95 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ml-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Inquiry...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Submit Inquiry
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800/80 py-6 px-4 text-center text-xs text-stone-500 dark:text-stone-400">
        <p>© {new Date().getFullYear()} Millionaire OS • Enterprise Client Acquisition & Management System</p>
      </footer>
    </div>
  );
}
