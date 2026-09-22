"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  Settings,
  Save,
  Sparkles,
  Sliders,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coffee,
  Phone,
  Palette,
  Image as ImageIcon,
  Upload,
  Globe,
  Building2,
  RotateCcw,
  Layers,
  Crown,
} from "lucide-react";
import { useBranding, THEME_PALETTES } from "@/components/providers/BrandingProvider";

// ─── Inline Input Component ───────────────────────────────────────────────────
function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  rightElement,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed pr-10"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

// ─── Password Field with Show/Hide ────────────────────────────────────────────
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rightElement={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner({ type, message }: { type: "success" | "error"; message: string }) {
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium border ${
        isSuccess
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80"
          : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/80"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();

  // White-label Branding & Customization
  const { branding, themeStyle, refreshBranding, updateBrandingOptimistic } = useBranding();
  const [brandForm, setBrandForm] = useState({
    companyName: branding.companyName,
    brandTagline: branding.brandTagline,
    companyFullTitle: branding.companyFullTitle,
    companySubtext: branding.companySubtext,
    logoUrl: branding.logoUrl,
    themeColor: branding.themeColor,
    copyrightText: branding.copyrightText,
    supportEmail: branding.supportEmail,
    supportPhone: branding.supportPhone || "",
    websiteUrl: branding.websiteUrl,
  });

  useEffect(() => {
    setBrandForm({
      companyName: branding.companyName,
      brandTagline: branding.brandTagline,
      companyFullTitle: branding.companyFullTitle,
      companySubtext: branding.companySubtext,
      logoUrl: branding.logoUrl,
      themeColor: branding.themeColor,
      copyrightText: branding.copyrightText,
      supportEmail: branding.supportEmail,
      supportPhone: branding.supportPhone || "",
      websiteUrl: branding.websiteUrl,
    });
  }, [branding]);

  const [savingBranding, setSavingBranding] = useState(false);
  const [resettingBranding, setResettingBranding] = useState(false);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await fetch("/mdz-crm/api/admin/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandForm),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ White-label branding & theme saved and applied across system!", "success");
        await refreshBranding();
      } else {
        showToast(json.error || "Failed to save branding settings", "error");
      }
    } catch {
      showToast("Network error saving branding settings", "error");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleResetBranding = async () => {
    if (!window.confirm("Are you sure you want to reset all branding, logos, and themes to default Millionaire OS settings?")) {
      return;
    }
    setResettingBranding(true);
    try {
      const res = await fetch("/mdz-crm/api/admin/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Branding restored to default Millionaire OS", "success");
        await refreshBranding();
      } else {
        showToast(json.error || "Failed to reset branding", "error");
      }
    } catch {
      showToast("Network error resetting branding", "error");
    } finally {
      setResettingBranding(false);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo file size should be less than 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBrandForm((prev) => ({ ...prev, logoUrl: result }));
        showToast("✓ Logo loaded into live preview! Click Save to apply.", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  const playbooks = [
    { name: "E-Commerce Website Playbook", stages: 6, code: "ECOM_WEB" },
    { name: "Custom SaaS Web Application Playbook", stages: 7, code: "SAAS_APP" },
    { name: "Mobile Application Playbook", stages: 5, code: "MOBILE_APP" },
    { name: "AI Workflow Automation Playbook", stages: 4, code: "AI_AUTO" },
  ];

  // Automated Lunch Break Schedule states
  const [lunchStartTime, setLunchStartTime] = useState("13:15");
  const [lunchDurationMinutes, setLunchDurationMinutes] = useState("45");
  const [lunchReminderMinutes, setLunchReminderMinutes] = useState("5");
  const [autoLunchEnabled, setAutoLunchEnabled] = useState(true);
  const [savingLunchSchedule, setSavingLunchSchedule] = useState(false);

  useEffect(() => {
    fetch("/mdz-crm/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.lunch_start_time) setLunchStartTime(json.data.lunch_start_time);
          if (json.data.lunch_duration_minutes) setLunchDurationMinutes(json.data.lunch_duration_minutes);
          if (json.data.lunch_reminder_mins_before) setLunchReminderMinutes(json.data.lunch_reminder_mins_before);
          if (json.data.auto_lunch_enabled !== undefined) {
            setAutoLunchEnabled(json.data.auto_lunch_enabled !== "false");
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveLunchSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLunchSchedule(true);
    try {
      const res = await fetch("/mdz-crm/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            lunch_start_time: lunchStartTime,
            lunch_duration_minutes: lunchDurationMinutes,
            lunch_reminder_mins_before: lunchReminderMinutes,
            auto_lunch_enabled: String(autoLunchEnabled),
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Scheduled lunch break time saved and applied across all employees!", "success");
      } else {
        showToast("Failed to save lunch schedule: " + (json.error || "Unknown error"), "error");
      }
    } catch {
      showToast("Network error saving lunch settings", "error");
    } finally {
      setSavingLunchSchedule(false);
    }
  };

  const [lunchLoading, setLunchLoading] = useState(false);

  const forceMassLunchBreak = async (e: React.MouseEvent | React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setLunchLoading(true);
    try {
      const res = await fetch("/mdz-crm/api/attendance/mass-break", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: "START_LUNCH" }) 
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Successfully forced ${data.count || '0'} active employees onto Lunch Break!`, "success");
      } else {
        showToast("Failed to trigger mass break: " + data.error, "error");
      }
    } catch {
      showToast("Failed to trigger mass break", "error");
    } finally {
      setLunchLoading(false);
    }
  };

  const forceMassResumeWork = async (e: React.MouseEvent | React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setLunchLoading(true);
    try {
      const res = await fetch("/mdz-crm/api/attendance/mass-break", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: "RESUME_WORK" }) 
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Successfully forced ${data.count || '0'} active employees back to Work!`, "success");
      } else {
        showToast("Failed to trigger mass resume: " + data.error, "error");
      }
    } catch {
      showToast("Failed to trigger mass resume", "error");
    } finally {
      setLunchLoading(false);
    }
  };

  // ── Change Email ──
  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: "",
  });
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    setEmailLoading(true);

    try {
      const res = await fetch("/mdz-crm/api/auth/update-credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          currentPassword: emailForm.currentPassword,
          newValue: emailForm.newEmail,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setEmailStatus({ type: "success", msg: data.message });
        showToast("✅ Email updated! Please log in again.", "success");
        setEmailForm({ currentPassword: "", newEmail: "" });
        // Sign out so user re-authenticates with new email
        setTimeout(() => signOut({ callbackUrl: "/mdz-crm/login" }), 2500);
      } else {
        setEmailStatus({ type: "error", msg: data.error || "Failed to update email." });
      }
    } catch {
      setEmailStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Change Password ──
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }

    setPwLoading(true);

    try {
      const res = await fetch("/mdz-crm/api/auth/update-credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          currentPassword: pwForm.currentPassword,
          newValue: pwForm.newPassword,
          confirmValue: pwForm.confirmPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setPwStatus({ type: "success", msg: data.message });
        showToast("🔐 Password updated successfully!", "success");
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwStatus({ type: "error", msg: data.error || "Failed to update password." });
      }
    } catch {
      setPwStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setPwLoading(false);
    }
  };

  // ── Change Mobile / Phone Number ──
  const [phoneForm, setPhoneForm] = useState({
    currentPassword: "",
    newPhone: "",
  });
  const [phoneStatus, setPhoneStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const handlePhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneStatus(null);
    setPhoneLoading(true);

    try {
      const res = await fetch("/mdz-crm/api/auth/update-credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "phone",
          currentPassword: phoneForm.currentPassword,
          newValue: phoneForm.newPhone,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setPhoneStatus({ type: "success", msg: data.message });
        showToast("📱 Mobile number updated successfully!", "success");
        setPhoneForm({ currentPassword: "", newPhone: "" });
      } else {
        setPhoneStatus({ type: "error", msg: data.error || "Failed to update mobile number." });
      }
    } catch {
      setPhoneStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Settings"
        description="Manage your account credentials, company configuration, and project templates."
        badge="SYSTEM CONFIG"
        icon={<Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      {/* ── Account Credentials Section ────────────────────────────────────── */}
      <div>
        {/* Section heading */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Account Credentials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logged in as{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {session?.user?.email || "you"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* ── Change Email Card ─────────────────────────────────────────── */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between">
            <div>
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 mb-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  Change Email Address
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  IDENTITY
                </span>
              </div>

              <form onSubmit={handleEmailChange} className="space-y-4">
                <PasswordField
                  label="Current Password"
                  value={emailForm.currentPassword}
                  onChange={(v) => setEmailForm((f) => ({ ...f, currentPassword: v }))}
                  placeholder="Enter your current password"
                />
                <Field
                  label="New Email Address"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(v) => setEmailForm((f) => ({ ...f, newEmail: v }))}
                  placeholder="new.email@company.com"
                />

                {emailStatus && <StatusBanner type={emailStatus.type} message={emailStatus.msg} />}

                <button
                  type="submit"
                  disabled={emailLoading || !emailForm.currentPassword || !emailForm.newEmail}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {emailLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Email…</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Update Email Address</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                  You will be signed out automatically after updating your email.
                </p>
              </form>
            </div>
          </div>

          {/* ── Change Mobile Number Card ─────────────────────────────────── */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between">
            <div>
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 mb-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  Change Mobile Number
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  CONTACT
                </span>
              </div>

              <form onSubmit={handlePhoneChange} className="space-y-4">
                <PasswordField
                  label="Current Password"
                  value={phoneForm.currentPassword}
                  onChange={(v) => setPhoneForm((f) => ({ ...f, currentPassword: v }))}
                  placeholder="Enter your current password"
                />
                <Field
                  label="New Mobile / Phone Number"
                  type="tel"
                  value={phoneForm.newPhone}
                  onChange={(v) => setPhoneForm((f) => ({ ...f, newPhone: v }))}
                  placeholder="+91 98765 43210"
                />

                {phoneStatus && <StatusBanner type={phoneStatus.type} message={phoneStatus.msg} />}

                <button
                  type="submit"
                  disabled={phoneLoading || !phoneForm.currentPassword || !phoneForm.newPhone}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {phoneLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Mobile…</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      <span>Update Mobile Number</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                  Your mobile number will update across your employee profile.
                </p>
              </form>
            </div>
          </div>

          {/* ── Change Password Card ──────────────────────────────────────── */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between">
            <div>
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 mb-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-500" />
                  Change Password
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                  SECURITY
                </span>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <PasswordField
                  label="Current Password"
                  value={pwForm.currentPassword}
                  onChange={(v) => setPwForm((f) => ({ ...f, currentPassword: v }))}
                  placeholder="Enter your current password"
                />
                <PasswordField
                  label="New Password"
                  value={pwForm.newPassword}
                  onChange={(v) => setPwForm((f) => ({ ...f, newPassword: v }))}
                  placeholder="Enter new password (min. 4 chars)"
                />
                <PasswordField
                  label="Confirm New Password"
                  value={pwForm.confirmPassword}
                  onChange={(v) => setPwForm((f) => ({ ...f, confirmPassword: v }))}
                  placeholder="Re-enter new password"
                />

                {/* Password match indicator */}
                {pwForm.newPassword && pwForm.confirmPassword && (
                  <div
                    className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                      pwForm.newPassword === pwForm.confirmPassword
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {pwForm.newPassword === pwForm.confirmPassword ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {pwForm.newPassword === pwForm.confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </div>
                )}

                {pwStatus && <StatusBanner type={pwStatus.type} message={pwStatus.msg} />}

                <button
                  type="submit"
                  disabled={
                    pwLoading ||
                    !pwForm.currentPassword ||
                    !pwForm.newPassword ||
                    !pwForm.confirmPassword
                  }
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {pwLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password…</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                  Your session remains active after a password change.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── White-Label Branding, Logo & Theme Customization ────────────────────── */}
      {(session?.user?.role === "OWNER" || session?.user?.role === "ADMIN" || session?.user?.role === "SUB_ADMIN") && (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                <Crown className="w-6 h-6 text-amber-500" />
                <span>Company Branding & White-Label Suite</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize your company logo, platform name, tagline, theme colors, and copyright for SaaS client deployments.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetBranding}
                disabled={resettingBranding}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Reset all branding to default Millionaire OS"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${resettingBranding ? "animate-spin" : ""}`} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Interactive Real-Time Live Preview Box */}
          <div className="p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Interactive Header & Sidebar Preview</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                REAL-TIME
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Header Preview */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                {brandForm.logoUrl ? (
                  <img
                    src={brandForm.logoUrl}
                    alt="Logo Preview"
                    className={`w-9 h-9 object-contain rounded-lg ring-1 ${THEME_PALETTES[brandForm.themeColor]?.ringClass || "ring-emerald-500/30"} bg-white dark:bg-slate-900 p-0.5 shadow-sm`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/mdz-crm/mdz-logo.jpg";
                    }}
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${THEME_PALETTES[brandForm.themeColor]?.swatchBg || "from-emerald-500 to-amber-500"} text-white font-black flex items-center justify-center text-sm shadow-sm`}>
                    {brandForm.companyName.charAt(0)}
                  </div>
                )}
                <span className="font-extrabold text-lg tracking-tight flex items-center gap-1.5">
                  <span className={`${THEME_PALETTES[brandForm.themeColor]?.primaryGradient || "bg-gradient-to-r from-emerald-400 to-teal-300"} bg-clip-text text-transparent font-black`}>
                    {brandForm.companyName || "Company"}
                  </span>
                  {brandForm.brandTagline && (
                    <span className={`${THEME_PALETTES[brandForm.themeColor]?.secondaryGradient || "bg-gradient-to-r from-amber-400 to-yellow-300"} bg-clip-text text-transparent font-black`}>
                      {brandForm.brandTagline}
                    </span>
                  )}
                </span>
              </div>

              {/* Sidebar Footer Preview */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">{brandForm.companyFullTitle || "Company CRM"}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {brandForm.companySubtext || "Enterprise Business Operating System."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Logo & Company Name */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  <span>Company Logo & Brand Identity</span>
                </h3>

                {/* Logo Image Upload & URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase">
                    Company Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {brandForm.logoUrl ? (
                        <img
                          src={brandForm.logoUrl}
                          alt="Logo"
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/mdz-crm/mdz-logo.jpg";
                          }}
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo File (PNG / JPG)</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={brandForm.logoUrl}
                        onChange={(e) => setBrandForm((f) => ({ ...f, logoUrl: e.target.value }))}
                        placeholder="Or enter image URL (e.g. /mdz-crm/mdz-logo.jpg)"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Company Name & Tagline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Company Primary Name"
                    value={brandForm.companyName}
                    onChange={(v) => setBrandForm((f) => ({ ...f, companyName: v }))}
                    placeholder="e.g. Millionaire or Acme"
                  />
                  <Field
                    label="Brand Tagline / Slogan"
                    value={brandForm.brandTagline}
                    onChange={(v) => setBrandForm((f) => ({ ...f, brandTagline: v }))}
                    placeholder="e.g. OS, CRM, Digital"
                  />
                </div>

                {/* Full Legal Title */}
                <Field
                  label="Full Display / Legal Title"
                  value={brandForm.companyFullTitle}
                  onChange={(v) => setBrandForm((f) => ({ ...f, companyFullTitle: v }))}
                  placeholder="e.g. Millionaire Dizital CRM"
                />

                {/* Platform Subtext */}
                <Field
                  label="Platform Subtitle / Descriptor"
                  value={brandForm.companySubtext}
                  onChange={(v) => setBrandForm((f) => ({ ...f, companySubtext: v }))}
                  placeholder="e.g. Enterprise CRM & Business Operating System."
                />
              </div>

              {/* Column 2: Theme Palettes & Support Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-500" />
                  <span>Theme Color Palette & Accents</span>
                </h3>

                {/* 7 Preset Theme Swatches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(THEME_PALETTES).map(([key, theme]) => {
                    const isSelected = brandForm.themeColor === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setBrandForm((f) => ({ ...f, themeColor: key as any }))}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                          isSelected
                            ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.swatchBg} shadow-xs shrink-0 flex items-center justify-center text-white text-xs font-bold`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {theme.label.split("(")[0]}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {theme.label.includes("(") ? theme.label.split("(")[1].replace(")", "") : key}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Support Email & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field
                    label="Support Email"
                    type="email"
                    value={brandForm.supportEmail}
                    onChange={(v) => setBrandForm((f) => ({ ...f, supportEmail: v }))}
                    placeholder="support@yourcompany.com"
                  />
                  <Field
                    label="Company Website"
                    value={brandForm.websiteUrl}
                    onChange={(v) => setBrandForm((f) => ({ ...f, websiteUrl: v }))}
                    placeholder="https://yourcompany.com"
                  />
                </div>

                {/* Copyright Text */}
                <Field
                  label="Footer Copyright Text"
                  value={brandForm.copyrightText}
                  onChange={(v) => setBrandForm((f) => ({ ...f, copyrightText: v }))}
                  placeholder="© 2026 Your Company. All rights reserved."
                />
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Changes apply globally across Header, Sidebar, Login screen, and Client Portals.
              </span>

              <button
                type="submit"
                disabled={savingBranding}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingBranding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying Branding...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Apply System Branding</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Playbooks Template & Workforce Automation ────────────────────────── */}
      {session?.user?.role === "OWNER" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Playbooks Template */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Standardized Project Playbooks
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              4 TEMPLATES
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {playbooks.map((pb) => (
              <div
                key={pb.code}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shadow-xs dark:shadow-lg hover:border-indigo-500/40 transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {pb.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Code: {pb.code} • {pb.stages} Execution Stages
                  </div>
                </div>
                <button
                  onClick={() => showToast(`✏️ Editing playbook template ${pb.code}`, "info")}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all"
                >
                  Edit Template
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Workforce Automation & Lunch Schedule */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Company Lunch & Work Session Automation
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              ALL EMPLOYEES
            </span>
          </div>

          {/* Scheduled Automatic Lunch Break Form */}
          <form onSubmit={handleSaveLunchSchedule} className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/80 dark:border-amber-800/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Scheduled Automatic Lunch Break</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Set the company lunch hour. All working employees will automatically be transitioned to lunch break at this exact time.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">Auto-Break:</span>
                  <input
                    type="checkbox"
                    checked={autoLunchEnabled}
                    onChange={(e) => setAutoLunchEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${autoLunchEnabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {autoLunchEnabled ? "ENABLED" : "DISABLED"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Lunch Start Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={lunchStartTime}
                    onChange={(e) => setLunchStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    e.g. 13:15 = 01:15 PM
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Lunch Duration Allowance
                  </label>
                  <select
                    value={lunchDurationMinutes}
                    onChange={(e) => setLunchDurationMinutes(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes (Default)</option>
                    <option value="60">60 Minutes (1 Hour)</option>
                    <option value="90">90 Minutes (1.5 Hours)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Daily lunch timer cap
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pre-Lunch Notice Reminder
                  </label>
                  <select
                    value={lunchReminderMinutes}
                    onChange={(e) => setLunchReminderMinutes(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="5">5 Minutes Before</option>
                    <option value="10">10 Minutes Before</option>
                    <option value="15">15 Minutes Before</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Popup notice before auto-break
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingLunchSchedule}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingLunchSchedule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingLunchSchedule ? "Saving Schedule..." : "Save Lunch Schedule"}</span>
                </button>
              </div>
            </div>

            {/* Force Mass Team Action */}
            <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Immediate Team Mass Override</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Instantly puts all currently working employees onto a Lunch Break right now, or forces all employees on break back to work.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={forceMassLunchBreak}
                  disabled={lunchLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {lunchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coffee className="w-4 h-4" />}
                  <span>Instant Lunch Break</span>
                </button>

                <button
                  type="button"
                  onClick={forceMassResumeWork}
                  disabled={lunchLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {lunchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Instant Resume Work</span>
                </button>
              </div>
            </div>
          </form>
        </div>
        </div>
      )}
    </div>
  );
}
