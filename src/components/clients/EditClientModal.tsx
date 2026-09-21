"use client";

import React, { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { Building, Save, Mail, Phone, MapPin, FileText, User } from "lucide-react";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onSuccess: () => void;
}

export function EditClientModal({
  isOpen,
  onClose,
  client,
  onSuccess,
}: EditClientModalProps) {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      setCompanyName(client.companyName || "");
      setContactPerson(client.contactPerson || client.contacts?.[0]?.name || "");
      setEmail(client.email || "");
      setPhone(client.phone || "");
      setBillingAddress(client.billingAddress || "");
      setGstNumber(client.gstNumber || client.taxId || "");
      setNotes(typeof client.notes === "string" ? client.notes : "");
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("Company Name is required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/mdz-crm/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim() || undefined,
          email: email.trim(),
          phone: phone.trim(),
          billingAddress: billingAddress.trim() || undefined,
          gstNumber: gstNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Failed to update client profile", "error");
        return;
      }

      showToast("✓ Client profile updated successfully!", "success");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Edit Client Error:", err);
      showToast("Network error updating client.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Client Profile"
      subtitle={`Update company, contact details, and billing information for ${client?.companyName || "Client"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Client ID badge */}
        <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Client Code: {client?.clientCode || client?.clientNumber || client?.id}
            </span>
          </div>
        </div>

        {/* Company Name & Contact Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-indigo-500" />
              <span>Company / Business Name <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp Ltd"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Primary Contact Person</span>
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Phone / Mobile</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium font-mono"
            />
          </div>
        </div>

        {/* GST / Tax ID */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
            GST Number / Tax Identifier
          </label>
          <input
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            placeholder="e.g. 24AAAAA0000A1Z5"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium font-mono uppercase"
          />
        </div>

        {/* Billing Address */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>Billing / Office Address</span>
          </label>
          <textarea
            rows={2}
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder="Full business address for invoicing..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none font-medium"
          />
        </div>

        {/* Client Notes */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>Internal Client Notes</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Account background or key relationship details..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none font-medium"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{submitting ? "Saving..." : "Save Client Profile"}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
