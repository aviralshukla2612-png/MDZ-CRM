"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  Camera,
  FileText,
  CheckSquare,
  Megaphone,
  Ticket,
  QrCode,
  UserCheck,
  RefreshCw,
  Trash2,
  X,
  Radio,
  ExternalLink,
  Layers,
  BarChart3,
  Award,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  PhoneCall,
  Briefcase,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface EventProject {
  id: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  venueName: string;
  venueAddress?: string;
  clientId?: string | null;
  clientName: string;
  eventOwner: string;
  productionManager?: string;
  estimatedBudget: number;
  approvedBudget: number;
  quotationAmount: number;
  actualCost: number;
  priority: string;
  riskLevel: string;
  riskOverview?: string;
  blockersOverview?: string;
  notes?: string;
  closureSignOff: boolean;
  _count?: {
    timelineItems: number;
    runOfShows: number;
    crewMembers: number;
    vendors: number;
    budgetItems: number;
    marketingItems: number;
    guests: number;
    incidents: number;
    mediaItems: number;
  };
}

export default function EventManagementPage() {
  const { showToast } = useToast();
  const toast = {
    success: (msg: string) => showToast(msg, "success"),
    error: (msg: string) => showToast(msg, "error"),
    info: (msg: string) => showToast(msg, "info"),
  };

  const [events, setEvents] = useState<EventProject[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "timeline"
    | "crew"
    | "vendors"
    | "budget"
    | "marketing"
    | "guests"
    | "live"
    | "media"
    | "closure"
  >("overview");

  // Modals state
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showRunOfShowModal, setShowRunOfShowModal] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Form states
  const [newEventData, setNewEventData] = useState({
    title: "",
    type: "CORPORATE",
    status: "PLANNING",
    startDate: "",
    endDate: "",
    venueName: "",
    venueAddress: "",
    clientName: "",
    eventOwner: "Lead Producer",
    productionManager: "",
    estimatedBudget: 0,
    approvedBudget: 0,
    quotationAmount: 0,
    priority: "MEDIUM",
    riskLevel: "LOW",
    riskOverview: "",
    blockersOverview: "",
    notes: "",
  });

  const [timelineData, setTimelineData] = useState({
    title: "",
    type: "MILESTONE",
    startTime: "",
    endTime: "",
    dependencies: "",
    assignedTo: "",
    notes: "",
  });

  const [runOfShowData, setRunOfShowData] = useState({
    timeSlot: "",
    activity: "",
    responsiblePerson: "",
    department: "Stage",
    stageLocation: "Main Stage",
    status: "UPCOMING",
    cueNotes: "",
  });

  const [crewData, setCrewData] = useState({
    name: "",
    role: "",
    department: "Production",
    shiftStartTime: "",
    shiftEndTime: "",
    phone: "",
    isBackup: false,
    isFreelancer: false,
  });

  const [vendorData, setVendorData] = useState({
    vendorName: "",
    category: "DECOR",
    contactPerson: "",
    phone: "",
    email: "",
    quoteAmount: 0,
    approvedAmount: 0,
    advancePaid: 0,
    paymentMilestones: "50% Advance, 50% Post-Event",
    deliverablesTracked: "",
    arrivalStatus: "EXPECTED",
  });

  const [budgetData, setBudgetData] = useState({
    category: "PRODUCTION",
    description: "",
    estimatedCost: 0,
    actualCost: 0,
    advancePaid: 0,
    balancePaid: 0,
    status: "APPROVED",
    vendorName: "",
  });

  const [marketingData, setMarketingData] = useState({
    title: "",
    type: "POSTER",
    platform: "INSTAGRAM",
    scheduledDate: "",
    assignee: "",
    approvalStatus: "APPROVED",
    publishingStatus: "SCHEDULED",
    creativeUrl: "",
  });

  const [guestData, setGuestData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "VIP",
    accessRights: "ALL_ACCESS",
    rsvpStatus: "ATTENDING",
    passType: "REGULAR",
    complimentaryApproved: false,
  });

  const [incidentData, setIncidentData] = useState({
    title: "",
    description: "",
    severity: "HIGH",
    reportedBy: "",
    owner: "",
    escalationNotes: "",
  });

  const [mediaData, setMediaData] = useState({
    shotTitle: "",
    coverageType: "PHOTO",
    photographer: "",
    videographer: "",
    prioritySameDay: false,
    deliveryUrl: "",
  });

  const [closureData, setClosureData] = useState({
    equipmentReconciled: false,
    vendorPaymentsClosed: false,
    budgetReconciled: false,
    clientFeedback: "",
    clientRating: 5,
    lessonsLearned: "",
    performanceReportSummary: "",
    eventArchiveUrl: "",
    finalSignOffBy: "",
  });

  // Fetch events list
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/events");
      const json = await res.json();
      if (json.success && json.data) {
        setEvents(json.data);
        if (json.data.length > 0 && !selectedEventId) {
          setSelectedEventId(json.data[0].id);
        }
      }
    } catch (err) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  // Fetch active event detail
  const fetchActiveEventDetail = async (id: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/events/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setActiveEvent(json.data);
        if (json.data.closure) {
          setClosureData({
            equipmentReconciled: json.data.closure.equipmentReconciled || false,
            vendorPaymentsClosed: json.data.closure.vendorPaymentsClosed || false,
            budgetReconciled: json.data.closure.budgetReconciled || false,
            clientFeedback: json.data.closure.clientFeedback || "",
            clientRating: json.data.closure.clientRating || 5,
            lessonsLearned: json.data.closure.lessonsLearned || "",
            performanceReportSummary: json.data.closure.performanceReportSummary || "",
            eventArchiveUrl: json.data.closure.eventArchiveUrl || "",
            finalSignOffBy: json.data.closure.finalSignOffBy || "",
          });
        }
      }
    } catch (err) {
      toast.error("Failed to load event details");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchActiveEventDetail(selectedEventId);
    }
  }, [selectedEventId]);

  // Handle Event Creation
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/mdz-crm/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEventData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Event created successfully!");
        setShowNewEventModal(false);
        await fetchEvents();
        setSelectedEventId(json.data.id);
      } else {
        toast.error(json.error || "Failed to create event");
      }
    } catch (err) {
      toast.error("Error creating event");
    }
  };

  // Calculate Countdown
  const getCountdownString = (startDateStr: string) => {
    if (!startDateStr) return "Date TBD";
    const eventTime = new Date(startDateStr).getTime();
    const now = new Date().getTime();
    const diff = eventTime - now;

    if (diff < 0 && Math.abs(diff) < 86400000 * 2) return "🔴 LIVE / HAPPENING NOW";
    if (diff < 0) return "✅ COMPLETED";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `T-minus ${days}d ${hours}h`;
  };

  // Handlers for Sub-items
  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timelineData),
      });
      if ((await res.json()).success) {
        toast.success("Timeline milestone added");
        setShowTimelineModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to add timeline item");
    }
  };

  const handleAddRunOfShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/run-of-show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runOfShowData),
      });
      if ((await res.json()).success) {
        toast.success("Run-of-show slot added");
        setShowRunOfShowModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to add slot");
    }
  };

  const handleAddCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/crew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crewData),
      });
      if ((await res.json()).success) {
        toast.success("Crew member added to roster");
        setShowCrewModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to add crew member");
    }
  };

  const handleCrewAction = async (memberId: string, action: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/crew`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action }),
      });
      if ((await res.json()).success) {
        toast.success(`Crew status updated: ${action}`);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to update crew status");
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorData),
      });
      if ((await res.json()).success) {
        toast.success("Vendor added");
        setShowVendorModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to add vendor");
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });
      if ((await res.json()).success) {
        toast.success("Budget entry recorded");
        setShowBudgetModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to add budget entry");
    }
  };

  const handleAddMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/marketing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marketingData),
      });
      if ((await res.json()).success) {
        toast.success("Marketing item scheduled");
        setShowMarketingModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to schedule marketing");
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestData),
      });
      if ((await res.json()).success) {
        toast.success("Guest registered");
        setShowGuestModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to register guest");
    }
  };

  const handleToggleCheckIn = async (guestId: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/guests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, action: "TOGGLE_CHECK_IN" }),
      });
      if ((await res.json()).success) {
        toast.success("Guest check-in status toggled");
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to toggle check-in");
    }
  };

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incidentData),
      });
      if ((await res.json()).success) {
        toast.success("Incident logged and escalated");
        setShowIncidentModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to log incident");
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/incidents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId, status: "RESOLVED" }),
      });
      if ((await res.json()).success) {
        toast.success("Incident marked as resolved");
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to update incident");
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaData),
      });
      if ((await res.json()).success) {
        toast.success("Media coverage shot added");
        setShowMediaModal(false);
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to add media shot");
    }
  };

  const handleSaveClosure = async (isFinalSignOff = false) => {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/mdz-crm/api/events/${selectedEventId}/closure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...closureData, isFinalSignOff }),
      });
      if ((await res.json()).success) {
        toast.success(isFinalSignOff ? "Event officially signed off & closed!" : "Closure progress saved");
        fetchEvents();
        fetchActiveEventDetail(selectedEventId);
      }
    } catch {
      toast.error("Failed to save closure");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                Event Management Department
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  Full Suite
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                End-to-end event production, timelines, crew roster, vendors, live operations & closures
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewEventModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-md shadow-orange-600/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Event Project
          </button>
        </div>
      </div>

      {/* Event Quick-Selector Switcher */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Active Events:
          </span>
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEventId(ev.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedEventId === ev.id
                  ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  ev.status === "LIVE"
                    ? "bg-red-500 animate-pulse"
                    : ev.status === "COMPLETED"
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />
              <span>{ev.title}</span>
              <span className="text-[10px] text-slate-400">
                ({new Date(ev.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Selected Event Dashboard */}
      {activeEvent ? (
        <div className="space-y-6">
          {/* Master Event Hero Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    {activeEvent.type}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                      activeEvent.status === "LIVE"
                        ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300"
                        : activeEvent.status === "COMPLETED"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300"
                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300"
                    }`}
                  >
                    {activeEvent.status}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {getCountdownString(activeEvent.startDate)}
                  </span>
                </div>

                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
                  {activeEvent.title}
                </h2>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                    <span>Client: <strong>{activeEvent.clientName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span>{new Date(activeEvent.startDate).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>{activeEvent.venueName} {activeEvent.venueAddress && `(${activeEvent.venueAddress})`}</span>
                  </div>
                </div>
              </div>

              {/* Budget & Producers Mini Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quotation</div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    ₹{activeEvent.quotationAmount?.toLocaleString() || "0"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Budget</div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    ₹{activeEvent.approvedBudget?.toLocaleString() || "0"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lead Producer</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {activeEvent.eventOwner || "N/A"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Production Mgr</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {activeEvent.productionManager || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk / Blocker Alert banner if present */}
            {(activeEvent.riskOverview || activeEvent.blockersOverview) && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {activeEvent.riskOverview && (
                    <p><strong>Risk Factors ({activeEvent.riskLevel}):</strong> {activeEvent.riskOverview}</p>
                  )}
                  {activeEvent.blockersOverview && (
                    <p><strong>Active Blockers:</strong> {activeEvent.blockersOverview}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Department Sub-Tabs Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
            {[
              { id: "overview", label: "Master Overview", icon: Layers },
              { id: "timeline", label: "Timeline & Run-of-Show", icon: Clock },
              { id: "crew", label: "Team & Crew Roster", icon: Users },
              { id: "vendors", label: "Vendors & Partners", icon: Briefcase },
              { id: "budget", label: "Budget & Procurement", icon: DollarSign },
              { id: "marketing", label: "Marketing & Promo", icon: Megaphone },
              { id: "guests", label: "Guests & Registration", icon: Ticket },
              { id: "live", label: "Live Operations & Alerts", icon: Radio },
              { id: "media", label: "Media & Coverage", icon: Camera },
              { id: "closure", label: "Post-Event Closure", icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: MASTER OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Event Highlights & Notes */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <CheckSquare className="w-4 h-4 text-orange-500" />
                    Event Directives & Strategic Scope
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {activeEvent.notes || "No special directives logged yet."}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Priority Tier</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{activeEvent.priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Sign-Off Status</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {activeEvent.closureSignOff ? "Signed Off & Completed" : "In Active Planning"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Guests</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {activeEvent.guests?.length || 0} Registered
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Task & Run-of-Show Sneak Peek */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <Clock className="w-4 h-4 text-orange-500" />
                      Run-of-Show Minute-by-Minute Timeline
                    </h3>
                    <button
                      onClick={() => setActiveTab("timeline")}
                      className="text-xs text-orange-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      View All Slots <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {activeEvent.runOfShows?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No run-of-show schedule populated yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeEvent.runOfShows?.slice(0, 4).map((slot: any) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                              {slot.timeSlot}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{slot.activity}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {slot.department}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Quick Metric Stats */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Production Readiness
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Crew Assigned:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{activeEvent.crewMembers?.length || 0} members</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Partners & Vendors:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{activeEvent.vendors?.length || 0} onboarded</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Marketing Assets:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{activeEvent.marketingItems?.length || 0} scheduled</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Live Incidents:</span>
                      <strong className="text-rose-500 font-bold">
                        {activeEvent.incidents?.filter((i: any) => i.status !== "RESOLVED").length || 0} Open
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white space-y-3 shadow-lg shadow-orange-500/20">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider">Quick Action Shortcuts</h4>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowTimelineModal(true)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur transition-all flex items-center justify-between"
                    >
                      <span>Add Milestone / Task</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowCrewModal(true)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur transition-all flex items-center justify-between"
                    >
                      <span>Assign Crew Member</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowIncidentModal(true)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur transition-all flex items-center justify-between"
                    >
                      <span>Report Live Incident</span>
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE & RUN-OF-SHOW */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              {/* Actions Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Event Planning Milestones & Minute-by-Minute Run of Show
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage preparation tasks, dependencies, rehearsal schedules, and stage cues
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTimelineModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Milestone
                  </button>
                  <button
                    onClick={() => setShowRunOfShowModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Run-of-Show Cue
                  </button>
                </div>
              </div>

              {/* Run of Show Schedule Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Minute-by-Minute Stage & Operational Schedule
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Time Slot</th>
                        <th className="py-2.5 px-3">Activity & Stage Cue</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Stage / Location</th>
                        <th className="py-2.5 px-3">Responsible</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeEvent.runOfShows?.map((slot: any) => (
                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                            {slot.timeSlot}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-white">{slot.activity}</div>
                            {slot.cueNotes && (
                              <div className="text-[10px] text-slate-400 mt-0.5">Cue: {slot.cueNotes}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {slot.department}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{slot.stageLocation}</td>
                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {slot.responsiblePerson || "Unassigned"}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                slot.status === "LIVE_NOW"
                                  ? "bg-red-500 text-white animate-pulse"
                                  : slot.status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {slot.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Milestones & Dependencies List */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-500" />
                  Milestones, Rehearsals & Setup Tasks
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeEvent.timelineItems?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950 text-orange-600">
                            {item.type}
                          </span>
                        </div>
                        {item.dependencies && (
                          <div className="text-[10px] text-slate-400">Depends on: {item.dependencies}</div>
                        )}
                        {item.assignedTo && (
                          <div className="text-[10px] text-slate-500">Lead: {item.assignedTo}</div>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEAM & CREW ROSTER */}
          {activeTab === "crew" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Crew Roster, Shifts & On-Site Attendance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Department assignments, shift check-in/check-out, and duty handovers
                  </p>
                </div>
                <button
                  onClick={() => setShowCrewModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Crew Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeEvent.crewMembers?.map((member: any) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{member.name}</h4>
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">{member.role}</span>
                        <div className="text-[10px] text-slate-400">{member.department}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.status === "CHECKED_IN"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : member.status === "CHECKED_OUT"
                            ? "bg-slate-200 dark:bg-slate-700 text-slate-500"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <div>Shift: {member.shiftStartTime || "TBD"} - {member.shiftEndTime || "TBD"}</div>
                      {member.phone && <div>Contact: {member.phone}</div>}
                      {member.isBackup && <span className="text-amber-500 font-bold block">★ Backup Crew</span>}
                      {member.isFreelancer && <span className="text-blue-500 font-bold block">★ External Freelancer</span>}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => handleCrewAction(member.id, "CHECK_IN")}
                        className="flex-1 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] hover:bg-emerald-100"
                      >
                        Check In
                      </button>
                      <button
                        onClick={() => handleCrewAction(member.id, "CHECK_OUT")}
                        className="flex-1 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[10px] hover:bg-slate-200"
                      >
                        Check Out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: VENDORS & PARTNERS */}
          {activeTab === "vendors" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Vendors, Artists & Production Partners
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quotations, advance & balance due, delivery milestones, and arrival tracking
                  </p>
                </div>
                <button
                  onClick={() => setShowVendorModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Partner / Vendor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEvent.vendors?.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{v.vendorName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {v.category}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.arrivalStatus === "ARRIVED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {v.arrivalStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                      <div>Approved Quote: <strong className="text-slate-800 dark:text-slate-200">₹{v.approvedAmount}</strong></div>
                      <div>Advance Paid: <strong className="text-emerald-600">₹{v.advancePaid}</strong></div>
                      <div>Balance Due: <strong className="text-rose-600">₹{v.balanceDue}</strong></div>
                      <div>Contact: {v.contactPerson || v.phone || "N/A"}</div>
                    </div>

                    {v.paymentMilestones && (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-400">
                        Milestones: {v.paymentMilestones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BUDGET & PROCUREMENT */}
          {activeTab === "budget" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Budget, Cost Breakdown & Profitability
                  </h3>
                  <p className="text-xs text-slate-500">
                    Purchase requests, category cost tracking, and actual vs approved variance
                  </p>
                </div>
                <button
                  onClick={() => setShowBudgetModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Expense / PO
                </button>
              </div>

              {/* Profitability Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Quotation / Revenue</span>
                  <div className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    ₹{activeEvent.quotationAmount?.toLocaleString() || "0"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Budget</span>
                  <div className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    ₹{activeEvent.approvedBudget?.toLocaleString() || "0"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Actual Spend</span>
                  <div className="text-lg font-extrabold text-orange-600 dark:text-orange-400">
                    ₹{activeEvent.actualCost?.toLocaleString() || "0"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Profit Margin</span>
                  <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{(activeEvent.quotationAmount - activeEvent.actualCost)?.toLocaleString() || "0"}
                  </div>
                </div>
              </div>

              {/* Budget Line Items */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Vendor</th>
                        <th className="py-2.5 px-3">Estimated Cost</th>
                        <th className="py-2.5 px-3">Actual Cost</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeEvent.budgetItems?.map((b: any) => (
                        <tr key={b.id}>
                          <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{b.category}</td>
                          <td className="py-3 px-3 text-slate-800 dark:text-slate-200">{b.description}</td>
                          <td className="py-3 px-3 text-slate-500">{b.vendorName || "In-House"}</td>
                          <td className="py-3 px-3">₹{b.estimatedCost}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">₹{b.actualCost}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MARKETING & PROMO */}
          {activeTab === "marketing" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Event Marketing, Social Promo & Creatives
                  </h3>
                  <p className="text-xs text-slate-500">
                    Poster schedules, promotional reels, sponsor creatives, and influencer tasks
                  </p>
                </div>
                <button
                  onClick={() => setShowMarketingModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule Creative / Ad
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeEvent.marketingItems?.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-600">
                        {m.type}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{m.platform}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{m.title}</h4>
                    <div className="text-[11px] text-slate-500">
                      Scheduled: {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : "TBD"}
                    </div>
                    {m.assignee && <div className="text-[11px] text-slate-500">Lead: {m.assignee}</div>}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {m.publishingStatus}
                      </span>
                      {m.creativeUrl && (
                        <a
                          href={m.creativeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-orange-500 hover:underline flex items-center gap-1"
                        >
                          View Creative <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: GUESTS & REGISTRATION */}
          {activeTab === "guests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Guest List, RSVP Tracking & QR Check-In
                  </h3>
                  <p className="text-xs text-slate-500">
                    VIP passes, complimentary ticket approvals, and fast real-time check-in
                  </p>
                </div>
                <button
                  onClick={() => setShowGuestModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Register Attendee
                </button>
              </div>

              {/* Guest Table with Live Check-In Toggle */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Ticket Code</th>
                        <th className="py-2.5 px-3">Guest Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Access Rights</th>
                        <th className="py-2.5 px-3">RSVP</th>
                        <th className="py-2.5 px-3">Check-In Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeEvent.guests?.map((g: any) => (
                        <tr key={g.id}>
                          <td className="py-3 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                            {g.ticketCode}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-white">{g.name}</div>
                            {g.email && <div className="text-[10px] text-slate-400">{g.email}</div>}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {g.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{g.accessRights}</td>
                          <td className="py-3 px-3 font-semibold text-emerald-600">{g.rsvpStatus}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                g.isCheckedIn
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {g.isCheckedIn ? "Checked In" : "Pending"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleToggleCheckIn(g.id)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                g.isCheckedIn
                                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  : "bg-emerald-600 text-white hover:bg-emerald-500"
                              }`}
                            >
                              {g.isCheckedIn ? "Undo" : "Check In"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: LIVE OPERATIONS & ALERTS */}
          {activeTab === "live" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Live Event Command & Incident Escalations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Urgent live incident reporting, stage blockers, and rapid resolutions
                  </p>
                </div>
                <button
                  onClick={() => setShowIncidentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Log Urgent Incident
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEvent.incidents?.map((inc: any) => (
                  <div
                    key={inc.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            inc.severity === "CRITICAL"
                              ? "bg-rose-500 text-white animate-pulse"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-600"
                          }`}
                        >
                          {inc.severity} Severity
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">{inc.title}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.status === "RESOLVED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400">{inc.description}</p>
                    {inc.escalationNotes && (
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-400">
                        Escalation: {inc.escalationNotes}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Reported by: {inc.reportedBy || "Field Crew"}</span>
                      {inc.status !== "RESOLVED" && (
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: MEDIA & COVERAGE */}
          {activeTab === "media" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Media Production, Shot List & Footage Transfer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Photographer/cinematographer shot plan, same-day reels, and post-event archive links
                  </p>
                </div>
                <button
                  onClick={() => setShowMediaModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Shot List Item
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeEvent.mediaItems?.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600">
                        {m.coverageType}
                      </span>
                      {m.prioritySameDay && (
                        <span className="text-[10px] font-bold text-amber-500 animate-pulse">★ Same-Day Priority</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{m.shotTitle}</h4>
                    <div className="text-[11px] text-slate-500">
                      Camera: {m.photographer || m.videographer || "Media Crew"}
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {m.footageTransferred ? "Footage Transferred" : "Pending Dump"}
                      </span>
                      {m.deliveryUrl && (
                        <a
                          href={m.deliveryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-orange-500 hover:underline flex items-center gap-1"
                        >
                          Drive / Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: POST-EVENT CLOSURE */}
          {activeTab === "closure" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Post-Event Closure, Reconciliation & Sign-Off
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vendor payment closures, equipment audit, lessons learned, and final client sign-off
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={closureData.equipmentReconciled}
                      onChange={(e) =>
                        setClosureData({ ...closureData, equipmentReconciled: e.target.checked })
                      }
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <div className="text-xs">
                      <strong className="block text-slate-800 dark:text-slate-200">Equipment Reconciled</strong>
                      <span className="text-slate-400 text-[11px]">All lights, AV, and rentals returned safely</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={closureData.vendorPaymentsClosed}
                      onChange={(e) =>
                        setClosureData({ ...closureData, vendorPaymentsClosed: e.target.checked })
                      }
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <div className="text-xs">
                      <strong className="block text-slate-800 dark:text-slate-200">Vendor Payments Closed</strong>
                      <span className="text-slate-400 text-[11px]">All balances settled and receipts filed</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={closureData.budgetReconciled}
                      onChange={(e) =>
                        setClosureData({ ...closureData, budgetReconciled: e.target.checked })
                      }
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <div className="text-xs">
                      <strong className="block text-slate-800 dark:text-slate-200">Budget Reconciled</strong>
                      <span className="text-slate-400 text-[11px]">Final profitability verified with accounts</span>
                    </div>
                  </label>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client Feedback & Testimonial
                    </label>
                    <textarea
                      rows={3}
                      value={closureData.clientFeedback}
                      onChange={(e) => setClosureData({ ...closureData, clientFeedback: e.target.value })}
                      placeholder="Enter client review, quote, and satisfaction notes..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Team Debrief & Lessons Learned
                    </label>
                    <textarea
                      rows={3}
                      value={closureData.lessonsLearned}
                      onChange={(e) => setClosureData({ ...closureData, lessonsLearned: e.target.value })}
                      placeholder="What went exceptionally well? What should be improved next time?"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Final Deliverables / Archive URL (Drive / Cloud)
                      </label>
                      <input
                        type="url"
                        value={closureData.eventArchiveUrl}
                        onChange={(e) => setClosureData({ ...closureData, eventArchiveUrl: e.target.value })}
                        placeholder="https://drive.google.com/..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Final Sign-Off Authority
                      </label>
                      <input
                        type="text"
                        value={closureData.finalSignOffBy}
                        onChange={(e) => setClosureData({ ...closureData, finalSignOffBy: e.target.value })}
                        placeholder="e.g. Lead Producer Name"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleSaveClosure(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Save Draft Notes
                  </button>
                  <button
                    onClick={() => handleSaveClosure(true)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    Official Final Sign-Off & Event Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Events Scheduled Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first event project to start planning timelines, coordinating crew, managing budgets, and running live operations.
          </p>
          <button
            onClick={() => setShowNewEventModal(true)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md"
          >
            Create Event Project
          </button>
        </div>
      )}

      {/* MODAL: CREATE EVENT PROJECT */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Create New Event Project</h3>
              <button onClick={() => setShowNewEventModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={newEventData.title}
                    onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                    placeholder="e.g. Annual Tech Leadership Summit 2026"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Event Type</label>
                  <select
                    value={newEventData.type}
                    onChange={(e) => setNewEventData({ ...newEventData, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="CORPORATE">Corporate Conference / Summit</option>
                    <option value="CONCERT">Concert / Live Show</option>
                    <option value="WEDDING">Luxury Wedding</option>
                    <option value="PRODUCT_LAUNCH">Product Launch</option>
                    <option value="EXHIBITION">Exhibition / Expo</option>
                    <option value="GALA">Gala Dinner / Awards</option>
                    <option value="PRIVATE_PARTY">Private VIP Party</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newEventData.clientName}
                    onChange={(e) => setNewEventData({ ...newEventData, clientName: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEventData.startDate}
                    onChange={(e) => setNewEventData({ ...newEventData, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Venue Name *</label>
                  <input
                    type="text"
                    required
                    value={newEventData.venueName}
                    onChange={(e) => setNewEventData({ ...newEventData, venueName: e.target.value })}
                    placeholder="e.g. Grand Hyatt Ballroom"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Venue Address / City</label>
                  <input
                    type="text"
                    value={newEventData.venueAddress}
                    onChange={(e) => setNewEventData({ ...newEventData, venueAddress: e.target.value })}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quotation (Revenue)</label>
                  <input
                    type="number"
                    value={newEventData.quotationAmount}
                    onChange={(e) => setNewEventData({ ...newEventData, quotationAmount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Approved Budget</label>
                  <input
                    type="number"
                    value={newEventData.approvedBudget}
                    onChange={(e) => setNewEventData({ ...newEventData, approvedBudget: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Production Manager</label>
                  <input
                    type="text"
                    value={newEventData.productionManager}
                    onChange={(e) => setNewEventData({ ...newEventData, productionManager: e.target.value })}
                    placeholder="e.g. Rohan Verma"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Event Scope & Directives</label>
                <textarea
                  rows={3}
                  value={newEventData.notes}
                  onChange={(e) => setNewEventData({ ...newEventData, notes: e.target.value })}
                  placeholder="Key deliverables, stage specifications, special artist requirements..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md shadow-orange-600/25"
                >
                  Save & Launch Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TIMELINE ITEM */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Milestone / Task</h3>
              <button onClick={() => setShowTimelineModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTimeline} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={timelineData.title}
                  onChange={(e) => setTimelineData({ ...timelineData, title: e.target.value })}
                  placeholder="e.g. Trussing & Sound Rigging Setup"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category / Type</label>
                <select
                  value={timelineData.type}
                  onChange={(e) => setTimelineData({ ...timelineData, type: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="MILESTONE">Milestone</option>
                  <option value="PREPARATION_TASK">Preparation Task</option>
                  <option value="REHEARSAL">Rehearsal Schedule</option>
                  <option value="SETUP">Venue Setup</option>
                  <option value="DISMANTLE">Venue Dismantling</option>
                  <option value="CHECKLIST">Planning Checklist</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Lead</label>
                <input
                  type="text"
                  value={timelineData.assignedTo}
                  onChange={(e) => setTimelineData({ ...timelineData, assignedTo: e.target.value })}
                  placeholder="e.g. Production Team Lead"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD RUN OF SHOW */}
      {showRunOfShowModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Run-of-Show Minute Cue</h3>
              <button onClick={() => setShowRunOfShowModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRunOfShow} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Time Slot *</label>
                  <input
                    type="text"
                    required
                    value={runOfShowData.timeSlot}
                    onChange={(e) => setRunOfShowData({ ...runOfShowData, timeSlot: e.target.value })}
                    placeholder="e.g. 10:00 AM - 10:15 AM"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={runOfShowData.department}
                    onChange={(e) => setRunOfShowData({ ...runOfShowData, department: e.target.value })}
                    placeholder="e.g. Stage / Audio"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Activity / Segment *</label>
                <input
                  type="text"
                  required
                  value={runOfShowData.activity}
                  onChange={(e) => setRunOfShowData({ ...runOfShowData, activity: e.target.value })}
                  placeholder="e.g. CEO Keynote Entry + Spotlight Cue"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cue Notes / Audio Trigger</label>
                <input
                  type="text"
                  value={runOfShowData.cueNotes}
                  onChange={(e) => setRunOfShowData({ ...runOfShowData, cueNotes: e.target.value })}
                  placeholder="e.g. Play intro track 02 on wireless mic un-mute"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRunOfShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Save Cue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CREW */}
      {showCrewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Assign Crew Member</h3>
              <button onClick={() => setShowCrewModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCrew} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={crewData.name}
                    onChange={(e) => setCrewData({ ...crewData, name: e.target.value })}
                    placeholder="e.g. Aman Sharma"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                  <input
                    type="text"
                    required
                    value={crewData.role}
                    onChange={(e) => setCrewData({ ...crewData, role: e.target.value })}
                    placeholder="e.g. Floor Manager / Audio Tech"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={crewData.department}
                    onChange={(e) => setCrewData({ ...crewData, department: e.target.value })}
                    placeholder="Production / Technical"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={crewData.phone}
                    onChange={(e) => setCrewData({ ...crewData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={crewData.isBackup}
                    onChange={(e) => setCrewData({ ...crewData, isBackup: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>Backup Staff</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={crewData.isFreelancer}
                    onChange={(e) => setCrewData({ ...crewData, isFreelancer: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>External Freelancer</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCrewModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VENDOR */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Vendor / Partner</h3>
              <button onClick={() => setShowVendorModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={vendorData.vendorName}
                    onChange={(e) => setVendorData({ ...vendorData, vendorName: e.target.value })}
                    placeholder="e.g. Star Lights & Sound"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={vendorData.category}
                    onChange={(e) => setVendorData({ ...vendorData, category: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="DECOR">Decor & Fabrication</option>
                    <option value="PRODUCTION_SOUND_LIGHT">Sound, Light & Trussing</option>
                    <option value="ARTIST_PERFORMER">Artist / Emcee / Band</option>
                    <option value="PHOTOGRAPHY_CINEMA">Photo & Cinema</option>
                    <option value="CATERING_FB">Catering & F&B</option>
                    <option value="VENUE">Venue Partner</option>
                    <option value="SECURITY_TRANSPORT">Security & Logistics</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Approved Amount (₹)</label>
                  <input
                    type="number"
                    value={vendorData.approvedAmount}
                    onChange={(e) => setVendorData({ ...vendorData, approvedAmount: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={vendorData.advancePaid}
                    onChange={(e) => setVendorData({ ...vendorData, advancePaid: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BUDGET */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Record Expense / Purchase</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBudget} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={budgetData.description}
                  onChange={(e) => setBudgetData({ ...budgetData, description: e.target.value })}
                  placeholder="e.g. Stage LED Screen Setup"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={budgetData.category}
                    onChange={(e) => setBudgetData({ ...budgetData, category: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="PRODUCTION">Production & AV</option>
                    <option value="VENUE">Venue Rental</option>
                    <option value="DECOR">Decor & Floral</option>
                    <option value="ARTISTS">Artists & Talent</option>
                    <option value="CATERING">Catering & Hospitality</option>
                    <option value="MARKETING">Marketing & Print</option>
                    <option value="LOGISTICS">Logistics & Transport</option>
                    <option value="MISC">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Actual Cost (₹)</label>
                  <input
                    type="number"
                    value={budgetData.actualCost}
                    onChange={(e) => setBudgetData({ ...budgetData, actualCost: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Save Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MARKETING */}
      {showMarketingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Schedule Marketing Asset</h3>
              <button onClick={() => setShowMarketingModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMarketing} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={marketingData.title}
                  onChange={(e) => setMarketingData({ ...marketingData, title: e.target.value })}
                  placeholder="e.g. Speaker Reveal Carousel Post"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Asset Type</label>
                  <select
                    value={marketingData.type}
                    onChange={(e) => setMarketingData({ ...marketingData, type: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="POSTER">Key Visual / Poster</option>
                    <option value="REEL">Promo Reel / Video</option>
                    <option value="STORY">Countdown Story</option>
                    <option value="SPONSOR_CREATIVE">Sponsor Co-Branded</option>
                    <option value="AD_CAMPAIGN">Paid Ad Campaign</option>
                    <option value="INFLUENCER">Influencer Collab</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Platform</label>
                  <select
                    value={marketingData.platform}
                    onChange={(e) => setMarketingData({ ...marketingData, platform: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="PR_MEDIA">PR / Press Release</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMarketingModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD GUEST */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Register Attendee</h3>
              <button onClick={() => setShowGuestModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGuest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Guest Name *</label>
                <input
                  type="text"
                  required
                  value={guestData.name}
                  onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={guestData.category}
                    onChange={(e) => setGuestData({ ...guestData, category: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="VIP">VIP</option>
                    <option value="SPEAKER">Speaker / Performer</option>
                    <option value="DELEGATE">Delegate</option>
                    <option value="MEDIA">Press / Media</option>
                    <option value="SPONSOR">Sponsor</option>
                    <option value="GENERAL">General Entry</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Access Rights</label>
                  <input
                    type="text"
                    value={guestData.accessRights}
                    onChange={(e) => setGuestData({ ...guestData, accessRights: e.target.value })}
                    placeholder="ALL_ACCESS / BACKSTAGE"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INCIDENT */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Log Urgent Incident
              </h3>
              <button onClick={() => setShowIncidentModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddIncident} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Incident Headline *</label>
                <input
                  type="text"
                  required
                  value={incidentData.title}
                  onChange={(e) => setIncidentData({ ...incidentData, title: e.target.value })}
                  placeholder="e.g. Wireless mic frequency interference on Main Stage"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Severity</label>
                <select
                  value={incidentData.severity}
                  onChange={(e) => setIncidentData({ ...incidentData, severity: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="CRITICAL">CRITICAL (Show Blocker)</option>
                  <option value="HIGH">HIGH (Urgent Resolution)</option>
                  <option value="MEDIUM">MEDIUM (Operational Glitch)</option>
                  <option value="LOW">LOW (Minor)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Incident Description *</label>
                <textarea
                  rows={3}
                  required
                  value={incidentData.description}
                  onChange={(e) => setIncidentData({ ...incidentData, description: e.target.value })}
                  placeholder="Detailed situation, impact on stage, who is on it..."
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow"
                >
                  Escalate Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDIA SHOT */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Coverage Shot Plan</h3>
              <button onClick={() => setShowMediaModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMedia} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Shot Title *</label>
                <input
                  type="text"
                  required
                  value={mediaData.shotTitle}
                  onChange={(e) => setMediaData({ ...mediaData, shotTitle: e.target.value })}
                  placeholder="e.g. VIP Red Carpet Arrival & Step-and-Repeat"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Coverage Type</label>
                  <select
                    value={mediaData.coverageType}
                    onChange={(e) => setMediaData({ ...mediaData, coverageType: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="PHOTO">Photography</option>
                    <option value="VIDEO">Cinematography</option>
                    <option value="DRONE">Drone Aerial</option>
                    <option value="INTERVIEW">Backstage Interview</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-500">
                    <input
                      type="checkbox"
                      checked={mediaData.prioritySameDay}
                      onChange={(e) => setMediaData({ ...mediaData, prioritySameDay: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span>Same-Day Edit</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow"
                >
                  Add Shot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
