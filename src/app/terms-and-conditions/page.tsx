"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldCheck, FileText, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function TermsAndConditionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  const role = (session?.user as any)?.role || (session?.user as any)?.activeRole;
  const fromUrl = searchParams.get("from") || searchParams.get("returnUrl");

  // Determine intelligent return destination
  const getFallbackUrl = () => {
    if (fromUrl) return fromUrl;
    if (role === "CLIENT") return "/client";
    if (role === "EMPLOYEE") return "/employee";
    if (["OWNER", "ADMIN", "SUB_ADMIN", "SALES"].includes(role)) return "/";
    return "/login";
  };

  const handleBack = () => {
    if (fromUrl) {
      router.push(fromUrl);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push(getFallbackUrl());
    }
  };

  const getBackLabel = () => {
    if (fromUrl?.includes("client") || role === "CLIENT") {
      return "Back to Client Dashboard";
    }
    if (fromUrl?.includes("employee") || role === "EMPLOYEE") {
      return "Back to Employee Portal";
    }
    if (session?.user) {
      return "Back to Dashboard";
    }
    return "Back to Login";
  };

  const handleAcceptTerms = async () => {
    setAccepting(true);
    try {
      const res = await fetch("/mdz-crm/api/client/terms-accept", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAcceptedSuccess(true);
        setTimeout(() => {
          router.push(fromUrl || "/client");
        }, 1200);
      } else {
        router.push(getFallbackUrl());
      }
    } catch (err) {
      console.error("Acceptance error:", err);
      router.push(getFallbackUrl());
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090E18] text-slate-900 dark:text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs transition-all touch-target cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{getBackLabel()}</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Verified Terms v1.0</span>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Terms and Conditions of Service
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Effective Date: September 2026 • Version 1.0
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Client Access Portal Usage</h2>
              <p>
                Access to the MDZ OS Client Portal is granted exclusively to authorized representatives of enrolled client organizations. Authorized contacts agree to keep authentication credentials confidential and not disclose login access to unauthorized third parties.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">2. Intellectual Property & Deliverables</h2>
              <p>
                All software source code, designs, and documentation generated during project development remain the property of Millionaire Dizital until applicable contract milestones and payment terms are fully satisfied.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">3. Progress Calculations & Timelines</h2>
              <p>
                Project progress percentages displayed in the portal are calculated automatically based on project task completion statuses. Daily progress updates provide human-readable milestones posted by authorized project development members.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">4. Tax & GST Identification</h2>
              <p>
                Clients must provide accurate tax registration details (GSTIN) upon registration to facilitate accurate billing, invoicing, and compliance.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">5. Contact & Acceptance</h2>
              <p>
                Accepting these Terms and Conditions confirms your authorization to act on behalf of your designated client organization for project tracking and communication within MDZ OS.
              </p>
            </section>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Need assistance? Contact our engineering & operations team at{" "}
              <a href="mailto:support@millionairedizital.com" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                support@millionairedizital.com
              </a>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {role === "CLIENT" && (
                <button
                  type="button"
                  disabled={accepting || acceptedSuccess}
                  onClick={handleAcceptTerms}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Acceptance...</span>
                    </>
                  ) : acceptedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Accepted! Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept & Return to Dashboard</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                {role === "CLIENT" ? "Back to Dashboard" : "Back to Previous Page"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
