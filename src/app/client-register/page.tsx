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

    // Check for repetitive fake numbers like 1111111111 or 0000000000
    if (/^(\d)\1+$/.test(digits)) {
      return "Please enter a valid, non-repetitive phone number.";
    }

    // For standard 10-digit Indian numbers
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
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address (e.g. name@company.com).";
    }
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
    if (fieldName === "contactName") err = validateName(formData.contactName, "Client name");
    if (fieldName === "companyName") err = validateName(formData.companyName, "Company name");
    if (fieldName === "password") err = validatePassword(formData.password);

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: err || "",
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let cleanVal = value;

    if (name === "phone") {
      // Disallow non-numeric characters except + and spaces/dashes, cap at 16 characters
      cleanVal = value.replace(/[^\d+\s-]/g, "").slice(0, 16);
      if (touched.phone) {
        const err = validatePhone(cleanVal);
        setFieldErrors((prev) => ({ ...prev, phone: err || "" }));
      }
    } else if (name === "email") {
      if (touched.email) {
        const err = validateEmail(cleanVal);
        setFieldErrors((prev) => ({ ...prev, email: err || "" }));
      }
    } else if (name === "contactName") {
      if (touched.contactName) {
        const err = validateName(cleanVal, "Client name");
        setFieldErrors((prev) => ({ ...prev, contactName: err || "" }));
      }
    } else if (name === "companyName") {
      if (touched.companyName) {
        const err = validateName(cleanVal, "Company name");
        setFieldErrors((prev) => ({ ...prev, companyName: err || "" }));
      }
    } else if (name === "password") {
      if (touched.password) {
        const err = validatePassword(cleanVal);
        setFieldErrors((prev) => ({ ...prev, password: err || "" }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: cleanVal,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const nameErr = validateName(formData.contactName, "Client full name");
    const compErr = validateName(formData.companyName, "Company name");
    const phoneErr = validatePhone(formData.phone);
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password);

    const allErrors = {
      contactName: nameErr || "",
      companyName: compErr || "",
      phone: phoneErr || "",
      email: emailErr || "",
      password: passErr || "",
    };

    setFieldErrors(allErrors);
    setTouched({
      contactName: true,
      companyName: true,
      phone: true,
      email: true,
      password: true,
    });

    const firstError = nameErr || compErr || phoneErr || emailErr || passErr;
    if (firstError) {
      setError(firstError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/mdz-crm/api/client/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase(),
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
          <img src="/mdz-crm/mdz-logo.jpg" alt="Millionaire OS Logo" className="w-8 h-8 object-contain rounded-lg ring-1 ring-emerald-500/30 shadow-xs" />
          <span className="font-extrabold text-base tracking-tight font-sans flex items-center gap-1.5 select-none">
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent font-black">Millionaire</span>
            <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-300 bg-clip-text text-transparent font-black">OS</span>
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
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Client Full Name *</span>
                </span>
                {touched.contactName && !fieldErrors.contactName && formData.contactName && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
              </label>
              <input
                type="text"
                name="contactName"
                required
                autoComplete="off"
                value={formData.contactName}
                onChange={handleChange}
                onBlur={() => handleBlur("contactName")}
                placeholder="Enter client full name"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none transition-all ${
                  fieldErrors.contactName
                    ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20"
                    : touched.contactName && formData.contactName
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                    : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                }`}
              />
              {fieldErrors.contactName && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.contactName}</span>
                </p>
              )}
            </div>

            {/* 2. Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Company Name *</span>
                </span>
                {touched.companyName && !fieldErrors.companyName && formData.companyName && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
              </label>
              <input
                type="text"
                name="companyName"
                required
                autoComplete="off"
                value={formData.companyName}
                onChange={handleChange}
                onBlur={() => handleBlur("companyName")}
                placeholder="Enter company or brand name"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none transition-all ${
                  fieldErrors.companyName
                    ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20"
                    : touched.companyName && formData.companyName
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                    : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                }`}
              />
              {fieldErrors.companyName && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.companyName}</span>
                </p>
              )}
            </div>

            {/* 3. Phone Number & 4. Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Phone Number *</span>
                  </span>
                  {touched.phone && !fieldErrors.phone && formData.phone && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={16}
                  autoComplete="off"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur("phone")}
                  placeholder="e.g. +91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none transition-all font-mono ${
                    fieldErrors.phone
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20"
                      : touched.phone && formData.phone
                      ? "border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  }`}
                />
                {fieldErrors.phone ? (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.phone}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-stone-400 dark:text-stone-500">
                    10-digit mobile or WhatsApp number
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Email Address *</span>
                  </span>
                  {touched.email && !fieldErrors.email && formData.email && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  placeholder="name@company.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none transition-all ${
                    fieldErrors.email
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20"
                      : touched.email && formData.email
                      ? "border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 5. Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Create Password *</span>
                </span>
                {touched.password && !fieldErrors.password && formData.password && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
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
                  onBlur={() => handleBlur("password")}
                  placeholder="Minimum 6 characters"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none transition-all ${
                    fieldErrors.password
                      ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20"
                      : touched.password && formData.password
                      ? "border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  }`}
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
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
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
