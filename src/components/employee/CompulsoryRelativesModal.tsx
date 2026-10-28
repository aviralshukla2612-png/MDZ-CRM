"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import {
  Users,
  Phone,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  UserCheck,
  X,
} from "lucide-react";

export function CompulsoryRelativesModal() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const isEmployee = session?.user?.role === "EMPLOYEE";

  const [isOpen, setIsOpen] = useState(false);
  const [isCompulsory, setIsCompulsory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form values
  const [myPhone, setMyPhone] = useState("");
  const [rel1Name, setRel1Name] = useState("");
  const [rel1Relation, setRel1Relation] = useState("Father");
  const [rel1Phone, setRel1Phone] = useState("");

  const [rel2Name, setRel2Name] = useState("");
  const [rel2Relation, setRel2Relation] = useState("Mother");
  const [rel2Phone, setRel2Phone] = useState("");

  const checkEmployeeRelatives = useCallback(async (forcedOpen = false) => {
    if (!isEmployee) return;
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/employees/me");
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        setMyPhone(d.phone || "");
        setRel1Name(d.relative1Name || "");
        setRel1Relation(d.relative1Relation || "Father");
        setRel1Phone(d.relative1Phone || "");
        setRel2Name(d.relative2Name || "");
        setRel2Relation(d.relative2Relation || "Mother");
        setRel2Phone(d.relative2Phone || "");

        const r1Digits = (d.relative1Phone || "").replace(/\D/g, "");
        const r2Digits = (d.relative2Phone || "").replace(/\D/g, "");
        const complete = r1Digits.length >= 10 && r2Digits.length >= 10;

        if (!complete) {
          setIsCompulsory(true);
          setIsOpen(true);
        } else if (forcedOpen) {
          setIsCompulsory(false);
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      }
    } catch (err) {
      console.error("Failed to check employee relative contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  useEffect(() => {
    if (isEmployee) {
      checkEmployeeRelatives();
    }

    const handleManualOpen = () => {
      checkEmployeeRelatives(true);
    };

    window.addEventListener("open_relative_contacts_modal", handleManualOpen);
    return () => {
      window.removeEventListener("open_relative_contacts_modal", handleManualOpen);
    };
  }, [isEmployee, checkEmployeeRelatives]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean1 = rel1Phone.replace(/\D/g, "");
    const clean2 = rel2Phone.replace(/\D/g, "");

    if (!rel1Phone.trim() || clean1.length < 10) {
      setErrorMessage("Relative 1 phone number is compulsory and must contain at least 10 digits.");
      return;
    }

    if (!rel2Phone.trim() || clean2.length < 10) {
      setErrorMessage("Relative 2 phone number is compulsory and must contain at least 10 digits.");
      return;
    }

    if (clean1 === clean2) {
      setErrorMessage("Relative 1 and Relative 2 must be different contact numbers.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/employees/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: myPhone.trim(),
          relative1Name: rel1Name.trim(),
          relative1Relation: rel1Relation.trim() || "Father",
          relative1Phone: rel1Phone.trim(),
          relative2Name: rel2Name.trim(),
          relative2Relation: rel2Relation.trim() || "Mother",
          relative2Phone: rel2Phone.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Failed to save emergency relative contacts.");
        return;
      }

      showToast("✓ 2 Emergency relative contacts saved & verified!", "success");
      setIsOpen(false);
      setIsCompulsory(false);

      // Notify other views
      window.dispatchEvent(
        new CustomEvent("employee_relatives_updated", {
          detail: {
            relative1Phone: rel1Phone.trim(),
            relative2Phone: rel2Phone.trim(),
            relative1Name: rel1Name.trim(),
            relative2Name: rel2Name.trim(),
            relative1Relation: rel1Relation.trim(),
            relative2Relation: rel2Relation.trim(),
            phone: myPhone.trim(),
          },
        })
      );
    } catch {
      setErrorMessage("Network error saving emergency contacts. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isEmployee || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-400/90 dark:border-amber-600/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-5 sm:p-6 shrink-0 relative">
          {!isCompulsory && (
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 text-amber-100 font-mono text-[10px] font-black uppercase tracking-wider mb-1">
                <span>⚠️ Compulsory Requirement</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                Emergency Relative Contacts (2 Numbers Required)
              </h2>
              <p className="text-xs text-amber-100/90 mt-0.5 leading-snug">
                As per company employee onboarding policy, you must provide 2 verified relative contact numbers.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Personal Mobile */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Your Personal Mobile Number</span>
              <span className="text-[10px] font-normal text-slate-500">Employee Direct Contact</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={myPhone}
                onChange={(e) => setMyPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Relative 1 (Compulsory) */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border-2 border-amber-300/80 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Relative 1 Contact (Compulsory #1)</span>
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                REQUIRED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rel1Relation}
                  onChange={(e) => setRel1Relation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-amber-500"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Relative">Other Relative</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={rel1Name}
                  onChange={(e) => setRel1Name(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Relative 1 Phone Number <span className="text-rose-500 font-black">* (10+ digits)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={rel1Phone}
                  onChange={(e) => setRel1Phone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
                <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Relative 2 (Compulsory) */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border-2 border-amber-300/80 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Relative 2 Contact (Compulsory #2)</span>
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                REQUIRED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rel2Relation}
                  onChange={(e) => setRel2Relation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-amber-500"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Relative">Other Relative</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={rel2Name}
                  onChange={(e) => setRel2Name(e.target.value)}
                  placeholder="e.g. Sunita Kumar"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Relative 2 Phone Number <span className="text-rose-500 font-black">* (10+ digits)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={rel2Phone}
                  onChange={(e) => setRel2Phone(e.target.value)}
                  placeholder="+91 98765 12340"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
                <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !rel1Phone.trim() || !rel2Phone.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving & Verifying Contacts...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Submit & Verify 2 Compulsory Numbers</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2">
              🔒 Contact details are stored securely in company records for emergency use only.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
