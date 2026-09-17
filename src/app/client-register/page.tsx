"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, User, Mail, Lock, Phone, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function ClientRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    contactName: "",
    companyName: "",
    phone: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.contactName.trim()) {
      setError("Please enter client full name.");
      return;
    }
    if (!formData.companyName.trim()) {
      setError("Please enter company name.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/mdz-crm/api/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          termsAccepted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0D0C0A] text-stone-900 dark:text-stone-100 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-lg mx-auto w-full pt-2">
        <div className="flex items-center gap-2 font-bold text-base text-stone-900 dark:text-stone-100">
          <img src="/mdz-crm/mdz-logo.jpg" alt="Millionaire Dizital Logo" className="w-8 h-8 object-contain rounded-lg ring-1 ring-amber-400/50 shadow-xs" />
          <span className="font-extrabold tracking-tight">
            MILLIONAIRE DIZITAL <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">CRM</span>
          </span>
        </div>

        <ThemeToggle />
      </div>

      {/* Main Registration Card */}
      <div className="max-w-lg mx-auto w-full my-auto py-6">
        <div className="bg-white dark:bg-[#161411] rounded-2xl border border-amber-200/80 dark:border-amber-900/40 p-6 sm:p-8 shadow-xl space-y-5">
          {/* Header Title */}
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Client Registration Only</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Create Client Account
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Register your company to access your client portal, milestones, and project deliverables.
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Account created successfully! Redirecting to login...</span>
            </div>
          )}

          {/* Normal Registration Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {/* Dummy hidden inputs to absorb browser password managers */}
            <input type="text" style={{ display: "none" }} aria-hidden="true" autoComplete="off" tabIndex={-1} />
            <input type="password" style={{ display: "none" }} aria-hidden="true" autoComplete="off" tabIndex={-1} />

            {/* 1. Client Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Client Name *</span>
              </label>
              <input
                type="text"
                name="contactName"
                required
                autoComplete="off"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="Enter client full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* 2. Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Company Name *</span>
              </label>
              <input
                type="text"
                name="companyName"
                required
                autoComplete="off"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company or organization name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* 3. Phone Number & 4. Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Phone Number *</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  autoComplete="off"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* 5. Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Create Password *</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  data-lpignore="true"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-stone-950 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 touch-target mt-2"
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Register Client Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note & back to login */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 text-center space-y-2">
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Already have an account?{" "}
              <Link href="/login" className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                Sign In Here
              </Link>
            </p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500">
              * Employee accounts cannot register here and must be provisioned by management.
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-amber-600/80 dark:text-amber-400/80 pb-2 font-mono font-semibold">
        Millionaire Dizital CRM © 2026 • Enterprise Business OS
      </div>
    </div>
  );
}
