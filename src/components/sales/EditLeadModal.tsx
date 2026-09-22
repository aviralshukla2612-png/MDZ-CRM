"use client";

import React, { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import {
  Target,
  Building,
  User,
  Mail,
  Phone,
  IndianRupee,
  Briefcase,
  Flag,
  FileText,
  Sparkles,
} from "lucide-react";

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
}

export function EditLeadModal({ isOpen, onClose, lead, onSuccess }: EditLeadModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState("NEW");
  const [priority, setPriority] = useState("MEDIUM");
  const [leadValue, setLeadValue] = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [source, setSource] = useState("WEBSITE");
  const [gstNo, setGstNo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (lead) {
      setCompanyName(lead.clientName || lead.companyName || "");
      setContactPerson(lead.contactPerson || "");
      setEmail(lead.email && lead.email !== "prospect@example.com" && lead.email !== "No Email" ? lead.email : "");
      
      const cleanPhone = (lead.phone || lead.mobile || "").replace(/\D/g, "");
      setPhone(cleanPhone.length > 10 && cleanPhone.startsWith("91") ? cleanPhone.slice(2) : cleanPhone.slice(0, 10));
      
      setStage(lead.stage || lead.status || "NEW");
      setPriority(lead.leadPriority || lead.priority || "MEDIUM");
      setLeadValue(lead.leadValue || lead.estimatedBudget ? String(lead.leadValue || lead.estimatedBudget) : "");
      setExpectedRevenue(lead.expectedRevenue || lead.expectedValue ? String(lead.expectedRevenue || lead.expectedValue) : "");
      setProjectScope(lead.projectScope || lead.interestedService || "");
      setSource(lead.source || "WEBSITE");
      setGstNo(lead.gstNo || (lead.remarks && lead.remarks.startsWith("GST: ") ? lead.remarks.replace("GST: ", "") : ""));
      setNotes(lead.description || lead.remarks || "");
    }
  }, [lead]);

  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("91")) {
      digits = digits.slice(2);
    }
    setPhone(digits.slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id) return;

    const cleanPhoneDigits = phone.replace(/\D/g, "");
    if (!cleanPhoneDigits || cleanPhoneDigits.length !== 10) {
      showToast("✕ Phone number must be exactly 10 digits.", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/mdz-crm/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: companyName.trim() || contactPerson.trim(),
          companyName: companyName.trim() || contactPerson.trim(),
          contactPerson: contactPerson.trim(),
          phone: `+91 ${cleanPhoneDigits}`,
          mobile: `+91 ${cleanPhoneDigits}`,
          email: email.trim() || null,
          stage,
          status: stage,
          leadPriority: priority,
          priority,
          leadValue: Number(leadValue) || 0,
          estimatedBudget: Number(leadValue) || 0,
          expectedRevenue: Number(expectedRevenue) || Number(leadValue) || 0,
          expectedValue: Number(expectedRevenue) || Number(leadValue) || 0,
          projectScope: projectScope.trim() || "General Inquiry",
          interestedService: projectScope.trim() || "General Inquiry",
          source,
          gstNo: gstNo.trim() || undefined,
          description: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Lead details updated successfully!", "success");
        onSuccess();
        onClose();
      } else {
        showToast(json.error || "Failed to update lead", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An unexpected error occurred while saving lead", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Lead Information"
      subtitle={`Modify CRM parameters for ${lead?.leadNumber || "Lead"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans pb-4">
        {/* Company & Contact Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Company / Brand Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Paramount Retail Group"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all pl-9 font-medium"
              />
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Contact Person *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Vikram Patel"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all pl-9 font-medium"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prospect@company.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all pl-9 font-mono"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">
                Phone Number (10 digits) *
              </label>
              <span
                className={`text-[10px] font-mono font-bold ${
                  phone.length === 10
                    ? "text-emerald-600 dark:text-emerald-400"
                    : phone.length > 0
                    ? "text-amber-500"
                    : "text-slate-400"
                }`}
              >
                {phone.length}/10
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-slate-400 dark:text-slate-500 font-mono select-none pointer-events-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="9822211000"
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl p-2.5 pl-12 text-slate-900 dark:text-slate-100 outline-none transition-all font-mono tracking-wider text-xs font-bold ${
                  phone.length === 10
                    ? "border-emerald-500/60 focus:border-emerald-500"
                    : "border-slate-200 dark:border-slate-800 focus:border-amber-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Pipeline Stage & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Pipeline Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all font-bold cursor-pointer"
            >
              <option value="NEW">📋 New Prospects</option>
              <option value="CONTACTED">📞 Contacted</option>
              <option value="REQUIREMENTS">📐 Requirements</option>
              <option value="PROPOSAL">📑 Proposal Sent</option>
              <option value="NEGOTIATION">🤝 Negotiation</option>
              <option value="WON">🏆 Won / Closing</option>
              <option value="LOST">❌ Lost</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all font-bold cursor-pointer"
            >
              <option value="HOT">🔥 Hot Priority</option>
              <option value="HIGH">⚡ High Priority</option>
              <option value="MEDIUM">⚖️ Medium Priority</option>
              <option value="LOW">⏳ Low Priority</option>
            </select>
          </div>
        </div>

        {/* Budget & Expected Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Estimated Budget (₹ INR)
            </label>
            <div className="relative">
              <input
                type="number"
                value={leadValue}
                onChange={(e) => setLeadValue(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all pl-9 font-mono font-bold"
              />
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Lead Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all font-medium cursor-pointer"
            >
              <option value="WEBSITE">🌐 Website Direct</option>
              <option value="INSTAGRAM">📸 Instagram / Meta</option>
              <option value="FACEBOOK">🔵 Facebook Ads / Page</option>
              <option value="LINKEDIN">💼 LinkedIn</option>
              <option value="WHATSAPP">💬 WhatsApp Inbound</option>
              <option value="GOOGLE_ADS">🎯 Google Ads</option>
              <option value="WEBHOOK">⚡ Webhook / API</option>
              <option value="REFERRAL">👥 Client Referral</option>
              <option value="COLD_CALL">📞 Cold Call / Outreach</option>
              <option value="OTHER">✨ Other</option>
            </select>
          </div>
        </div>

        {/* Project Scope & GST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Interested Service / Scope
            </label>
            <input
              type="text"
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              placeholder="e.g. Custom E-Commerce & Mobile App"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              GST Number (Optional)
            </label>
            <input
              type="text"
              value={gstNo}
              onChange={(e) => setGstNo(e.target.value.toUpperCase())}
              placeholder="e.g. 24AAAAA0000A1Z5"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all font-mono uppercase"
            />
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            Prospect Notes & Requirements
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter specific client requirements, timeline expectations, tech preferences..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all text-xs resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving Changes..." : "Save Lead Details"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
