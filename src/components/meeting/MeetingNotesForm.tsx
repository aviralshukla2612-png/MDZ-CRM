"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  Target,
  FileText,
  TrendingUp,
  MessageSquare,
  ListPlus,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  HelpCircle,
  CheckSquare,
  CalendarDays,
  StickyNote,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  Briefcase,
} from "lucide-react";

export interface MeetingParticipant {
  name: string;
  role: string;
  representing: string;
  contact?: string;
}

export interface MeetingActionItem {
  task: string;
  assignedTo: string;
  deadline: string;
  status: "Pending" | "In Progress" | "Not Started" | "Completed";
  comments: string;
}

export interface MeetingNotesData {
  // 1. Meeting Details
  clientBrandName: string;
  meetingDate: string;
  meetingTime: string;
  meetingTypes: string[];
  meetingTypeOther: string;

  // 2. Participants
  participants: MeetingParticipant[];

  // 3. Meeting Objective
  meetingObjective: string;

  // 4. Discussion Points (1 - 5)
  discussionPoints: string[];

  // 5. Key Updates
  keyUpdates: string[];

  // 6. Client Feedback
  clientFeedback: string[];

  // 7. Client Requirements
  clientRequirements: string[];

  // 8. Decisions Made
  decisionsMade: string[];

  // 9. Approved Ideas
  approvedIdeas: string[];

  // 10. Changes Requested
  changesRequested: string[];

  // 11. Pending Questions
  pendingQuestions: string[];

  // 12. Action Items Table
  actionItems: MeetingActionItem[];

  // 13. Follow-up Required
  followUpsRequired: string[];
  followUpOther: string;

  // 14. Next Meeting Date
  nextMeetingDate: string;
  nextMeetingTime: string;
  nextMeetingTypes: string[];
  nextMeetingTypeOther: string;

  // 15. Important Notes
  importantNotes: string;
}

export const DEFAULT_MEETING_NOTES: MeetingNotesData = {
  clientBrandName: "",
  meetingDate: "",
  meetingTime: "11:00 AM - 12:00 PM",
  meetingTypes: ["Strategy Call", "Discovery Call"],
  meetingTypeOther: "",

  participants: [
    { name: "Rahul Sharma", role: "Managing Director", representing: "Client", contact: "+91 98765 43210" },
    { name: "Aman Gupta", role: "Account Lead / SMM", representing: "Agency", contact: "aman@mdz.agency" },
    { name: "Priya Nair", role: "Lead Video Editor", representing: "Agency", contact: "" },
  ],

  meetingObjective: "Discuss content strategy, review past performance, plan upcoming festive campaign & deliverables.",

  discussionPoints: [
    "Q4 social growth roadmap and target follower milestones",
    "Creative hook formulas for high-retention short reels",
    "Client approval turnaround SLAs & raw footage handover schedule",
    "Paid ads budget allocation for Meta performance campaigns",
    "Brand voice refinement for conversational Hinglish captions",
  ],

  keyUpdates: [
    "Completed photoshoot assets delivered into central Google Drive folder",
    "October content calendar approved with 30 reels and 15 carousels",
    "Instagram professional invite accepted by agency team",
    "Meta Pixel installed on client website checkout page",
  ],

  clientFeedback: [
    "Reels editing quality is top tier; loved the sound design on recent videos",
    "Carousels need slightly larger font on mobile for readability",
    "Engagement in comment section has doubled over the past 2 weeks",
    "Requested more founder-led speaking clips in upcoming shoots",
  ],

  clientRequirements: [
    "Need 2 expedited reels for festive flash sale this Friday",
    "Add subtitle translation in Hindi for regional reach",
    "Share weekly reporting dashboard on WhatsApp group every Monday",
    "Include testimonial quotes in carousel design layouts",
  ],

  decisionsMade: [
    "Posting schedule finalized: 1 Reel daily at 6:30 PM IST",
    "Raw footage drive folder will be updated every Sunday evening",
    "Client will review draft scripts within 24 hours of submission",
    "Approved festive ad spend budget of ₹30,000 for next 14 days",
  ],

  approvedIdeas: [
    "'Myth vs Reality' 3-part reel series debunking industry misconceptions",
    "Comment-to-DM automation offering free downloadable PDF checklist",
    "Behind-the-scenes video showing product packaging and dispatch",
  ],

  changesRequested: [
    "Update CTA in Reel #3 from 'Visit Link' to 'Comment OFFER below'",
    "Swap thumbnail font on Carousel #2 to match brand guidelines",
    "Trim intro hook in Reel #5 by 1.5 seconds for faster pacing",
  ],

  pendingQuestions: [
    "Will client provide voiceover audio or should agency record in-house?",
    "Need confirmation on discount coupon code for festive flash sale",
    "Can founder record 3 talking-head clips before Wednesday?",
  ],

  actionItems: [
    { task: "Reel approval for festive campaign", assignedTo: "Client", deadline: "8 Oct 2024", status: "Pending", comments: "Client to review and share feedback" },
    { task: "Script changes for educational series", assignedTo: "SMM", deadline: "7 Oct 2024", status: "In Progress", comments: "Update script as per client feedback" },
    { task: "Design high-contrast thumbnails", assignedTo: "Designer", deadline: "9 Oct 2024", status: "Not Started", comments: "Outfit font with brand color accents" },
    { task: "Schedule verified reels in Meta Suite", assignedTo: "SMM", deadline: "10 Oct 2024", status: "Pending", comments: "Pre-load with approved caption copies" },
    { task: "Setup comment DM automation workflow", assignedTo: "Lead Developer", deadline: "11 Oct 2024", status: "Not Started", comments: "Test keyword triggers" },
  ],

  followUpsRequired: [
    "Share revised content",
    "Provide additional information",
    "Schedule next call",
    "Client to share assets",
  ],
  followUpOther: "Send WhatsApp summary to stakeholder group",

  nextMeetingDate: "",
  nextMeetingTime: "11:00 AM",
  nextMeetingTypes: ["Strategy Call", "Review Call"],
  nextMeetingTypeOther: "",

  importantNotes: "Client was very enthusiastic about high-pacing reels. Priority this month is driving inbound DM inquiries rather than just vanity likes.",
};

const MEETING_TYPE_OPTIONS = ["Discovery Call", "Strategy Call", "Progress Update", "Review Call"];
const NEXT_MEETING_TYPE_OPTIONS = ["Strategy Call", "Review Call", "Emergency Sync"];
const FOLLOWUP_OPTIONS = [
  "Share revised content",
  "Provide additional information",
  "Schedule next call",
  "Client to share assets",
];

interface MeetingNotesFormProps {
  value?: MeetingNotesData;
  onChange: (data: MeetingNotesData) => void;
  className?: string;
}

export function MeetingNotesForm({
  value = DEFAULT_MEETING_NOTES,
  onChange,
  className = "",
}: MeetingNotesFormProps) {
  const [isOpen, setIsOpen] = useState(true);

  const data: MeetingNotesData = {
    clientBrandName: value.clientBrandName || "",
    meetingDate: value.meetingDate || "",
    meetingTime: value.meetingTime || "11:00 AM - 12:00 PM",
    meetingTypes: value.meetingTypes || ["Strategy Call"],
    meetingTypeOther: value.meetingTypeOther || "",
    participants: value.participants || DEFAULT_MEETING_NOTES.participants,
    meetingObjective: value.meetingObjective || "",
    discussionPoints: value.discussionPoints?.length ? value.discussionPoints : ["", "", "", "", ""],
    keyUpdates: value.keyUpdates?.length ? value.keyUpdates : ["", "", "", ""],
    clientFeedback: value.clientFeedback?.length ? value.clientFeedback : ["", "", "", ""],
    clientRequirements: value.clientRequirements?.length ? value.clientRequirements : ["", "", "", ""],
    decisionsMade: value.decisionsMade?.length ? value.decisionsMade : ["", "", "", ""],
    approvedIdeas: value.approvedIdeas?.length ? value.approvedIdeas : ["", "", ""],
    changesRequested: value.changesRequested?.length ? value.changesRequested : ["", "", ""],
    pendingQuestions: value.pendingQuestions?.length ? value.pendingQuestions : ["", "", ""],
    actionItems: value.actionItems?.length ? value.actionItems : DEFAULT_MEETING_NOTES.actionItems,
    followUpsRequired: value.followUpsRequired || [],
    followUpOther: value.followUpOther || "",
    nextMeetingDate: value.nextMeetingDate || "",
    nextMeetingTime: value.nextMeetingTime || "11:00 AM",
    nextMeetingTypes: value.nextMeetingTypes || ["Strategy Call"],
    nextMeetingTypeOther: value.nextMeetingTypeOther || "",
    importantNotes: value.importantNotes || "",
  };

  const updateField = <K extends keyof MeetingNotesData>(field: K, val: MeetingNotesData[K]) => {
    onChange({ ...data, [field]: val });
  };

  const toggleMeetingType = (t: string) => {
    const exists = data.meetingTypes.includes(t);
    const updated = exists ? data.meetingTypes.filter((x) => x !== t) : [...data.meetingTypes, t];
    updateField("meetingTypes", updated);
  };

  const toggleNextMeetingType = (t: string) => {
    const exists = data.nextMeetingTypes.includes(t);
    const updated = exists ? data.nextMeetingTypes.filter((x) => x !== t) : [...data.nextMeetingTypes, t];
    updateField("nextMeetingTypes", updated);
  };

  const toggleFollowUp = (item: string) => {
    const exists = data.followUpsRequired.includes(item);
    const updated = exists ? data.followUpsRequired.filter((x) => x !== item) : [...data.followUpsRequired, item];
    updateField("followUpsRequired", updated);
  };

  const updateListItem = (
    field:
      | "discussionPoints"
      | "keyUpdates"
      | "clientFeedback"
      | "clientRequirements"
      | "decisionsMade"
      | "approvedIdeas"
      | "changesRequested"
      | "pendingQuestions",
    index: number,
    val: string
  ) => {
    const list = [...(data[field] || [])];
    list[index] = val;
    updateField(field, list);
  };

  // Participant Helpers
  const addParticipant = () => {
    updateField("participants", [
      ...data.participants,
      { name: "", role: "", representing: "Client", contact: "" },
    ]);
  };

  const updateParticipant = (index: number, field: keyof MeetingParticipant, val: string) => {
    const list = [...data.participants];
    list[index] = { ...list[index], [field]: val };
    updateField("participants", list);
  };

  const removeParticipant = (index: number) => {
    updateField(
      "participants",
      data.participants.filter((_, i) => i !== index)
    );
  };

  // Action Item Helpers
  const addActionItem = () => {
    updateField("actionItems", [
      ...data.actionItems,
      { task: "", assignedTo: "SMM", deadline: "", status: "Pending", comments: "" },
    ]);
  };

  const updateActionItem = (index: number, field: keyof MeetingActionItem, val: any) => {
    const list = [...data.actionItems];
    list[index] = { ...list[index], [field]: val };
    updateField("actionItems", list);
  };

  const removeActionItem = (index: number) => {
    updateField(
      "actionItems",
      data.actionItems.filter((_, i) => i !== index)
    );
  };

  return (
    <div
      className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151311] overflow-hidden shadow-sm transition-all ${className}`}
    >
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-teal-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              MEETING / CALL NOTES
            </h2>
          </div>
          <p className="text-xs text-stone-300 font-mono tracking-wider uppercase">
            DISCUSS · PLAN · DECIDE · TRACK · FOLLOW UP
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_MEETING_NOTES)}
            className="px-3 py-1.5 rounded-lg bg-teal-600/90 hover:bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Call Notes Sample</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle section"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Purpose Banner */}
      <div className="px-5 py-3 bg-teal-50 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-900/40 flex items-start gap-3">
        <Target className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <p className="text-xs text-teal-950 dark:text-teal-200 leading-relaxed">
          <strong className="font-bold">Purpose:</strong> Use this template to capture key discussion points, decisions, action items and next steps from client meetings or calls so all deliverables remain on track with zero ambiguity.
        </p>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Top Row: 1. Meeting Details & 2. Participants */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 1. Meeting Details (5 Cols) */}
            <div className="lg:col-span-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2 border-b border-emerald-200/60 dark:border-emerald-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Meeting Details
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Client / Brand Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    Client / Brand Name
                  </label>
                  <input
                    type="text"
                    value={data.clientBrandName}
                    onChange={(e) => updateField("clientBrandName", e.target.value)}
                    placeholder="e.g. Acme Corp / PrimeFit"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Meeting Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-stone-400" />
                      <span>Meeting Date</span>
                    </label>
                    <input
                      type="date"
                      value={data.meetingDate}
                      onChange={(e) => updateField("meetingDate", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  {/* Meeting Time */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>Meeting Time</span>
                    </label>
                    <input
                      type="text"
                      value={data.meetingTime}
                      onChange={(e) => updateField("meetingTime", e.target.value)}
                      placeholder="e.g. 11:00 AM - 12:00 PM"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Meeting Type Checkboxes */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    Meeting Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MEETING_TYPE_OPTIONS.map((opt) => {
                      const isChecked = data.meetingTypes.includes(opt);
                      return (
                        <label
                          key={opt}
                          className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 dark:text-stone-300"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMeetingType(opt)}
                            className="rounded border-stone-300 dark:border-stone-700 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={data.meetingTypeOther}
                    onChange={(e) => updateField("meetingTypeOther", e.target.value)}
                    placeholder="Other meeting type..."
                    className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 2. Participants Table (7 Cols) */}
            <div className="lg:col-span-7 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-900/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">
                    2
                  </span>
                  <Users className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Participants
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Person</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400">
                      <th className="p-2">Name</th>
                      <th className="p-2">Role / Designation</th>
                      <th className="p-2">Representing</th>
                      <th className="p-2">Contact</th>
                      <th className="p-2 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {data.participants.map((p, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updateParticipant(idx, "name", e.target.value)}
                            placeholder="Name"
                            className="w-full px-1.5 py-1 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={p.role}
                            onChange={(e) => updateParticipant(idx, "role", e.target.value)}
                            placeholder="Role / Title"
                            className="w-full px-1.5 py-1 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={p.representing}
                            onChange={(e) => updateParticipant(idx, "representing", e.target.value)}
                            className="w-full px-1.5 py-1 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                          >
                            <option value="Client">Client</option>
                            <option value="Agency">Agency</option>
                            <option value="Third-party">Third-party</option>
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={p.contact || ""}
                            onChange={(e) => updateParticipant(idx, "contact", e.target.value)}
                            placeholder="Email / Phone"
                            className="w-full px-1.5 py-1 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          {data.participants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeParticipant(idx)}
                              className="text-stone-400 hover:text-rose-500 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row 2: 3. Meeting Objective & 4. Discussion Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 3. Meeting Objective */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-blue-200/60 dark:border-blue-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                  3
                </span>
                <Target className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Meeting Objective
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                What was the main purpose of this meeting?
              </p>
              <textarea
                rows={5}
                value={data.meetingObjective}
                onChange={(e) => updateField("meetingObjective", e.target.value)}
                placeholder="e.g. Discuss content strategy, review performance, plan upcoming campaign, etc."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden resize-none"
              />
            </div>

            {/* 4. Discussion Points (1-5) */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-amber-200/60 dark:border-amber-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-amber-600 text-white text-[11px] font-black flex items-center justify-center">
                  4
                </span>
                <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Discussion Points
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                List the main topics discussed during the meeting.
              </p>
              <div className="space-y-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={data.discussionPoints[i] || ""}
                      onChange={(e) => updateListItem("discussionPoints", i, e.target.value)}
                      placeholder={`Topic ${i + 1}`}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: 5. Key Updates & 6. Client Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 5. Key Updates */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-rose-200/60 dark:border-rose-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">
                  5
                </span>
                <TrendingUp className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Key Updates
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Important updates shared by the client or our team.
              </p>
              <div className="space-y-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-rose-500 font-bold text-xs shrink-0">•</span>
                    <input
                      type="text"
                      value={data.keyUpdates[i] || ""}
                      onChange={(e) => updateListItem("keyUpdates", i, e.target.value)}
                      placeholder={`Update ${i + 1}`}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Client Feedback */}
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-purple-200/60 dark:border-purple-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-[11px] font-black flex items-center justify-center">
                  6
                </span>
                <MessageSquare className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Client Feedback
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Client&apos;s feedback on ongoing work, content, performance, etc.
              </p>
              <div className="space-y-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-purple-500 font-bold text-xs shrink-0">•</span>
                    <input
                      type="text"
                      value={data.clientFeedback[i] || ""}
                      onChange={(e) => updateListItem("clientFeedback", i, e.target.value)}
                      placeholder={`Feedback ${i + 1}`}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: 7. Client Requirements & 8. Decisions Made */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 7. Client Requirements */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-blue-200/60 dark:border-blue-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                  7
                </span>
                <ListPlus className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Client Requirements
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                New requirements or specific requests from the client.
              </p>
              <div className="space-y-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold text-xs shrink-0">•</span>
                    <input
                      type="text"
                      value={data.clientRequirements[i] || ""}
                      onChange={(e) => updateListItem("clientRequirements", i, e.target.value)}
                      placeholder={`Requirement ${i + 1}`}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Decisions Made */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-emerald-200/60 dark:border-emerald-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                  8
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Decisions Made
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Key decisions finalized during the meeting.
              </p>
              <div className="space-y-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold text-xs shrink-0">•</span>
                    <input
                      type="text"
                      value={data.decisionsMade[i] || ""}
                      onChange={(e) => updateListItem("decisionsMade", i, e.target.value)}
                      placeholder={`Decision ${i + 1}`}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 5: 9. Approved Ideas, 10. Changes Requested, 11. Pending Questions (3 Cols) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 9. Approved Ideas */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-amber-200/60 dark:border-amber-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-amber-600 text-white text-[11px] font-black flex items-center justify-center">
                  9
                </span>
                <Lightbulb className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Approved Ideas
                </h3>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Ideas or concepts approved by the client.
              </p>
              <div className="space-y-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-amber-500 text-xs">•</span>
                    <input
                      type="text"
                      value={data.approvedIdeas[i] || ""}
                      onChange={(e) => updateListItem("approvedIdeas", i, e.target.value)}
                      placeholder={`Approved Idea ${i + 1}`}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 10. Changes Requested */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-rose-200/60 dark:border-rose-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">
                  10
                </span>
                <RotateCcw className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Changes Requested
                </h3>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Revisions or changes requested by the client.
              </p>
              <div className="space-y-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-rose-500 text-xs">•</span>
                    <input
                      type="text"
                      value={data.changesRequested[i] || ""}
                      onChange={(e) => updateListItem("changesRequested", i, e.target.value)}
                      placeholder={`Change ${i + 1}`}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 11. Pending Questions */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-blue-200/60 dark:border-blue-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                  11
                </span>
                <HelpCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Pending Questions
                </h3>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Questions that need further clarification.
              </p>
              <div className="space-y-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-blue-500 text-xs">•</span>
                    <input
                      type="text"
                      value={data.pendingQuestions[i] || ""}
                      onChange={(e) => updateListItem("pendingQuestions", i, e.target.value)}
                      placeholder={`Question ${i + 1}`}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 6: 12. Action Items Table */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                  12
                </span>
                <CheckSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Action Items
                </h3>
              </div>
              <button
                type="button"
                onClick={addActionItem}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">Task</th>
                    <th className="p-2">Assigned To</th>
                    <th className="p-2">Deadline</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Comments</th>
                    <th className="p-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {data.actionItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="p-2 text-center font-bold text-stone-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.task}
                          onChange={(e) => updateActionItem(idx, "task", e.target.value)}
                          placeholder="Task name"
                          className="w-full px-2 py-1 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.assignedTo}
                          onChange={(e) => updateActionItem(idx, "assignedTo", e.target.value)}
                          placeholder="e.g. SMM / Client"
                          className="w-full px-2 py-1 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.deadline}
                          onChange={(e) => updateActionItem(idx, "deadline", e.target.value)}
                          placeholder="e.g. 8 Oct 2024"
                          className="w-full px-2 py-1 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <select
                          value={item.status}
                          onChange={(e) => updateActionItem(idx, "status", e.target.value)}
                          className={`w-full px-2 py-1 rounded font-bold text-[11px] border ${
                            item.status === "Completed"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                              : item.status === "In Progress"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300"
                              : item.status === "Pending"
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300"
                              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300"
                          }`}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.comments}
                          onChange={(e) => updateActionItem(idx, "comments", e.target.value)}
                          placeholder="Comments..."
                          className="w-full px-2 py-1 rounded bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        {data.actionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeActionItem(idx)}
                            className="text-stone-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 7: 13. Follow-up Required, 14. Next Meeting Date, 15. Important Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 13. Follow-up Required */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-emerald-200/60 dark:border-emerald-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                  13
                </span>
                <CalendarDays className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Follow-up Required
                </h3>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Any follow-ups needed after this meeting?
              </p>
              <div className="space-y-1.5">
                {FOLLOWUP_OPTIONS.map((item) => {
                  const isChecked = data.followUpsRequired.includes(item);
                  return (
                    <label
                      key={item}
                      className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 dark:text-stone-300"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFollowUp(item)}
                        className="rounded border-stone-300 dark:border-stone-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
                <input
                  type="text"
                  value={data.followUpOther}
                  onChange={(e) => updateField("followUpOther", e.target.value)}
                  placeholder="Other follow-up..."
                  className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 14. Next Meeting Date */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-blue-200/60 dark:border-blue-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                  14
                </span>
                <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Next Meeting Date
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-stone-700 dark:text-stone-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={data.nextMeetingDate}
                    onChange={(e) => updateField("nextMeetingDate", e.target.value)}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-stone-700 dark:text-stone-300">
                    Time
                  </label>
                  <input
                    type="text"
                    value={data.nextMeetingTime}
                    onChange={(e) => updateField("nextMeetingTime", e.target.value)}
                    placeholder="e.g. 11:00 AM"
                    className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-stone-700 dark:text-stone-300">
                    Meeting Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {NEXT_MEETING_TYPE_OPTIONS.map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-1 cursor-pointer text-[10px] text-stone-700 dark:text-stone-300"
                      >
                        <input
                          type="checkbox"
                          checked={data.nextMeetingTypes.includes(t)}
                          onChange={() => toggleNextMeetingType(t)}
                          className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 15. Important Notes */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 border-b border-amber-200/60 dark:border-amber-900/50 pb-2">
                <span className="w-5 h-5 rounded-md bg-amber-600 text-white text-[11px] font-black flex items-center justify-center">
                  15
                </span>
                <StickyNote className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Important Notes
                </h3>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Any additional notes, insights or observations from the meeting.
              </p>
              <textarea
                rows={5}
                value={data.importantNotes}
                onChange={(e) => updateField("importantNotes", e.target.value)}
                placeholder="Write any important notes here..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden resize-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
