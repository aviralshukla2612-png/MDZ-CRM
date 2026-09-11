import React from "react";
import Link from "next/link";
import { ShieldCheck, FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | MDZ OS",
  description: "Terms and Conditions of Service for MDZ OS Client Portal access.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090E18] text-slate-900 dark:text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Terms v1.0</span>
          </div>
        </div>

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
                All software source code, designs, and documentation generated during project development remain the property of Millionaire Digital until applicable contract milestones and payment terms are fully satisfied.
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
        </div>
      </div>
    </div>
  );
}
