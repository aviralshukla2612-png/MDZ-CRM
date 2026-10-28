"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Building2,
  CheckCircle2,
  Sparkles,
  Zap,
  BarChart3,
  Users,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useBranding } from "@/components/providers/BrandingProvider";

export default function LoginPage() {
  const router = useRouter();
  const { branding, themeStyle } = useBranding();
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotDevUrl, setForgotDevUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (new URLSearchParams(window.location.search).get("registered") === "true") {
        setRegisteredSuccess(true);
      }

      // Automatically purge legacy fragmented NextAuth chunk cookies only (e.g. .session-token.0)
      try {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.match(/\.session-token\.\d+$/)) {
            document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
            document.cookie = `${name}=; Path=/mdz-crm; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          }
        }
      } catch (e) {
        console.warn("Cookie cleanup error:", e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId.trim()) {
      setError("Please enter your corporate email, phone number, or Employee ID.");
      return;
    }

    setLoading(true);
    setError(null);

    console.log("SIGN IN TRIGGERED FOR IDENTIFIER:", emailOrId);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: emailOrId.trim(),
        password: password,
        callbackUrl: "/mdz-crm",
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin" || res.error.toLowerCase().includes("credentials")) {
          setError("Invalid email, phone number, or password. Please check your credentials.");
        } else {
          setError(res.error);
        }
      } else if (res?.ok) {
        // Ensure mobile WebKit cookie jar commits Set-Cookie before navigating
        router.refresh();
        setTimeout(() => {
          window.location.replace("/mdz-crm");
        }, 80);
      } else {
        setError("Sign in failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign in exception:", err);
      setError(err?.message || "An unexpected error occurred connecting to the auth service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] dark:bg-[#0D0C0A] text-stone-900 dark:text-stone-100 flex flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3.5 sm:px-6 lg:px-8 transition-colors overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 sm:py-3 z-10">
        <div className="flex items-center gap-2 sm:gap-2.5 font-bold text-stone-900 dark:text-stone-100 min-w-0">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={`${branding.companyName} Logo`}
              className={`w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg ring-1 ${themeStyle.ringClass} shadow-xs bg-white dark:bg-slate-900 p-0.5 shrink-0`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/mdz-crm/mdz-logo.jpg";
              }}
            />
          ) : (
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${themeStyle.swatchBg} text-white font-black flex items-center justify-center text-xs sm:text-sm shadow-xs shrink-0`}>
              {branding.companyName.charAt(0)}
            </div>
          )}
          <span className="font-extrabold text-sm sm:text-base tracking-tight font-sans flex items-center gap-1.5 truncate select-none">
            <span className={`${themeStyle.primaryGradient} bg-clip-text text-transparent font-black truncate`}>
              {branding.companyName}
            </span>
            {branding.brandTagline && (
              <span className={`hidden xs:inline ${themeStyle.secondaryGradient} bg-clip-text text-transparent font-black truncate text-xs sm:text-sm`}>
                {branding.brandTagline}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto my-auto py-3 sm:py-6 lg:py-8 flex-1 flex items-center">
        <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-12 lg:items-center">
          {/* Left Column: Brand Showcase (Visible on Laptops & Desktops) */}
          <section className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center space-y-6 xl:space-y-8 pr-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/25 dark:border-amber-400/20 text-xs font-bold text-amber-700 dark:text-amber-300 w-fit backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Enterprise Business OS • v1.0 Production</span>
              </div>
              <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-stone-900 dark:text-stone-100 tracking-tight leading-[1.18]">
                Centralized command for your{" "}
                <span className={`${themeStyle.primaryGradient} bg-clip-text text-transparent font-black`}>
                  workspace & clients
                </span>
              </h2>
              <p className="text-sm xl:text-base text-stone-600 dark:text-stone-400 leading-relaxed max-w-lg">
                Manage deliverables, automated client intake matrices, workforce attendance, and real-time financial metrics in one unified platform.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white/60 dark:bg-[#161411]/60 backdrop-blur-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">Live Delivery Matrices</h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                  Real-time Google Sheet sync, 28-client pipeline tracking, and milestone verification.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white/60 dark:bg-[#161411]/60 backdrop-blur-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">Role-Governed RBAC</h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                  Authoritative isolation for Owners, Sub-Admins, Sales, Developers, and Clients.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white/60 dark:bg-[#161411]/60 backdrop-blur-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">Workforce Attendance</h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                  IP-verified work clocks, shift tracking, and leave entitlement governance.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white/60 dark:bg-[#161411]/60 backdrop-blur-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">High-Trust Client Portal</h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                  Dedicated client deliverables hub, scope change requests, and invoice tracking.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-stone-200/70 dark:border-stone-800/80">
              <div>
                <div className="text-base xl:text-lg font-black text-stone-900 dark:text-stone-100">99.9%</div>
                <div className="text-[10px] xl:text-[11px] text-stone-500 dark:text-stone-400 font-medium">Uptime Guarantee</div>
              </div>
              <div>
                <div className="text-base xl:text-lg font-black text-stone-900 dark:text-stone-100">256-Bit</div>
                <div className="text-[10px] xl:text-[11px] text-stone-500 dark:text-stone-400 font-medium">Session Encryption</div>
              </div>
              <div>
                <div className="text-base xl:text-lg font-black text-stone-900 dark:text-stone-100">Zero Leak</div>
                <div className="text-[10px] xl:text-[11px] text-stone-500 dark:text-stone-400 font-medium">Data Architecture</div>
              </div>
            </div>
          </section>

          {/* Right Column: Authentication Card (All Devices: Phone, Tablet, Laptop) */}
          <section className="w-full max-w-md sm:max-w-lg lg:max-w-none lg:col-span-6 xl:col-span-5 mx-auto">
            <div className="bg-white/95 dark:bg-[#161411]/95 rounded-2xl sm:rounded-3xl border border-amber-200/80 dark:border-amber-900/40 p-4 sm:p-7 md:p-8 shadow-xl backdrop-blur-xl space-y-4 sm:space-y-6">
              {/* Card Header */}
              <div className="space-y-1 text-left">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                    Welcome back
                  </h1>
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                    Secure Login
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Sign in with your email, phone number, or Employee ID.
                </p>
              </div>

              {/* Status Banners */}
              {registeredSuccess && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-medium flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Client Account Created Successfully!</p>
                    <p className="text-emerald-700 dark:text-emerald-300">You can now sign in with your email and password.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4" autoComplete="off">
                {/* Input: Email, Phone Number, or Employee ID */}
                <div className="space-y-1 sm:space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                    <span>Email, Phone, or Employee ID</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      inputMode="text"
                      name="user-email-field"
                      value={emailOrId}
                      onChange={(e) => setEmailOrId(e.target.value)}
                      placeholder="e.g. name@company.com, phone, or EMP-01"
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-stone-50 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl text-base sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 transition-all min-h-[46px] sm:min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Input: Password */}
                <div className="space-y-1 sm:space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline py-1 px-1 -mr-1 tap-target"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      name="user-password-field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-stone-50 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl text-base sm:text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 transition-all min-h-[46px] sm:min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl sm:rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Responsive Divider */}
              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
                <span className="bg-white dark:bg-[#161411] px-2.5 text-[10px] sm:text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider absolute">
                  External Clients & Quotes
                </span>
              </div>

              {/* Action Cards (Responsive Grid: Stacks on mobile, clean 2-col on tablets/larger) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                {/* Client-Only Registration Box */}
                <div className="rounded-xl border border-amber-300/80 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/70 to-yellow-50/40 dark:from-amber-950/25 dark:to-yellow-950/10 p-3 sm:p-3.5 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 text-left min-w-0">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 flex-wrap">
                        <span>Client Registration</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold">Clients Only</span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug line-clamp-2">
                        Access deliverables, milestones, and client invoices.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/client-register"
                    className="w-full min-h-[38px] py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.99] dark:bg-amber-600 dark:hover:bg-amber-500 text-stone-950 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <span>Register as Client</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Instant Inquiry Without Registration Box */}
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 p-3 sm:p-3.5 flex flex-col justify-between space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 text-left min-w-0">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 flex-wrap">
                        <span>Project Inquiry</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-semibold">1-Min Quote</span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug line-clamp-2">
                        Get a custom proposal without creating an account.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/inquiry"
                    className="w-full min-h-[38px] py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Instant Project Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Note on Employee Accounts */}
              <div className="text-[10px] text-stone-500 dark:text-stone-400 text-center leading-relaxed">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Notice:</span> Employee self-registration is restricted. Employee credentials are provisioning-issued by CRM administration.
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Forgot Password Bottom Sheet / Modal */}
      <BottomSheet
        isOpen={isForgotOpen}
        onClose={() => {
          setIsForgotOpen(false);
          setForgotSubmitted(false);
          setForgotError(null);
          setForgotDevUrl(null);
        }}
        title="Reset Password"
        subtitle="A secure verification link will be sent to your registered corporate email."
      >
        {forgotSubmitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Reset Instructions Dispatched</h4>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              If an account with that email exists, check your inbox for instructions to reset your password.
            </p>
            {forgotDevUrl && (
              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Quick Access Reset Link:
                </span>
                <Link
                  href={forgotDevUrl.replace("https://www.millionairedizital.com/mdz-crm", "").replace("http://localhost:3040/mdz-crm", "") || forgotDevUrl}
                  onClick={() => setIsForgotOpen(false)}
                  className="inline-block text-xs font-bold text-amber-600 dark:text-amber-400 underline hover:opacity-80 break-all"
                >
                  Click here to set new password now &rarr;
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setForgotError(null);
              setForgotDevUrl(null);
              const targetEmail = (forgotEmail || emailOrId).trim();
              if (!targetEmail) {
                setForgotError("Please enter your registered email address.");
                return;
              }

              try {
                setForgotLoading(true);
                const res = await fetch("/mdz-crm/api/auth/forgot-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: targetEmail }),
                });
                const data = await res.json();
                if (data.success) {
                  setForgotSubmitted(true);
                  if (data.devResetUrl) {
                    setForgotDevUrl(data.devResetUrl);
                  }
                } else {
                  setForgotError(data.error || "Failed to process password reset request.");
                }
              } catch {
                setForgotError("Network error. Please check your connection and try again.");
              } finally {
                setForgotLoading(false);
              }
            }}
            className="space-y-4"
          >
            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                {forgotError}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Registered Email
              </label>
              <input
                type="email"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={forgotEmail || emailOrId}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your registered email (e.g. name@company.com)"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-base sm:text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>{forgotLoading ? "Sending..." : "Send Reset Instructions"}</span>
            </button>
          </form>
        )}
      </BottomSheet>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 py-2 sm:py-3 font-mono font-medium">
        Millionaire Dizital CRM © 2026 • Enterprise Business OS
      </footer>
    </div>
  );
}
