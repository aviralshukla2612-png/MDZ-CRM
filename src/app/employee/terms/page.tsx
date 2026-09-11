"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, FileText, CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function EmployeeTermsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/terms/employee");
      const json = await res.json();
      if (json.success) {
        setTerms(json.terms);
        setUserStatus(json.userStatus);
      }
    } catch (e) {
      console.error("Failed to load employee terms:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!isAgreed) return;

    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/terms/employee/accept", {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        showToast("✓ Employee Terms accepted successfully", "success");
        router.push("/employee");
      } else {
        showToast(json.error || "Failed to accept terms", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred during acceptance", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isAlreadyAccepted = userStatus && !userStatus.needsAcceptance;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090E18] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090E18] text-slate-900 dark:text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Bar with Logout Button (Never Trapped) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Employee Terms {terms?.version || "v1.0"}</span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/mdz-crm/login" })}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Terms Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {terms?.title || "Employee Terms and Conditions of Service"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Version: <strong>{terms?.version || "v1.0"}</strong> • Last Updated:{" "}
                  {terms?.publishedAt ? new Date(terms.publishedAt).toLocaleDateString() : "Current"}
                </p>
              </div>
            </div>
          </div>

          {/* Terms Content Scrollbox */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
            {terms?.content}
          </div>

          {/* Acceptance Box */}
          {isAlreadyAccepted ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>You have already accepted version {terms?.version}. No further action is required.</span>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-800 dark:text-slate-200 font-medium">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
                <span>I have read, understood, and agree to abide by the Employee Terms & Conditions of Service.</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  disabled={!isAgreed || submitting}
                  onClick={handleAcceptTerms}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 touch-target"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Acceptance...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept & Continue to Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
