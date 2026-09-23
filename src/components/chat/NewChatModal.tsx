"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Users, MessageSquare, FolderKanban, Check, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: any) => void;
}

export function NewChatModal({ isOpen, onClose, onConversationCreated }: Props) {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"DIRECT" | "GROUP" | "PROJECT">("DIRECT");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Group form state
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setGroupName("");
      setSelectedUserIds([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "DIRECT" || activeTab === "GROUP") {
          const res = await fetch(`/mdz-crm/api/chat/users?q=${encodeURIComponent(searchQuery)}`);
          const json = await res.json();
          if (json.success) {
            setUsers(json.data || []);
          }
        } else if (activeTab === "PROJECT") {
          const res = await fetch(`/mdz-crm/api/projects`);
          const json = await res.json();
          if (json.success && json.projects) {
            setProjects(json.projects || []);
          }
        }
      } catch (err) {
        console.error("Failed to load users/projects:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, activeTab, searchQuery]);

  if (!isOpen) return null;

  const handleStartDirectChat = async (targetUser: any) => {
    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DIRECT",
          targetUserId: targetUser.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onConversationCreated(json.data);
        onClose();
      } else {
        showToast(json.error || "Failed to start direct conversation", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error starting direct chat", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast("Please enter a group name", "error");
      return;
    }
    if (selectedUserIds.length === 0) {
      showToast("Please select at least one member", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GROUP",
          name: groupName.trim(),
          memberIds: selectedUserIds,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Group created successfully", "success");
        onConversationCreated(json.data);
        onClose();
      } else {
        showToast(json.error || "Failed to create group", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error creating group", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartProjectChat = async (project: any) => {
    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PROJECT",
          projectId: project.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onConversationCreated(json.data);
        onClose();
      } else {
        showToast(json.error || "Failed to start project chat", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error starting project chat", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">New Conversation</h3>
              <p className="text-xs text-slate-400">Start a direct, group, or project chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab("DIRECT")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === "DIRECT"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Direct Message
          </button>
          <button
            onClick={() => setActiveTab("GROUP")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === "GROUP"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Group Chat
          </button>
          <button
            onClick={() => setActiveTab("PROJECT")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === "PROJECT"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Project Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "PROJECT"
                  ? "Filter projects..."
                  : "Search colleagues by name, role, department..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
              <p className="text-xs">Loading directory...</p>
            </div>
          ) : activeTab === "DIRECT" ? (
            // DIRECT LIST
            users.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">No matching colleagues found.</div>
            ) : (
              <div className="space-y-1.5">
                {users.map((u) => (
                  <button
                    key={u.id}
                    disabled={submitting}
                    onClick={() => handleStartDirectChat(u)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-white overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name?.charAt(0)?.toUpperCase() || "U"
                          )}
                        </div>
                        {u.isOnline ? (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                        ) : (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-500 border-2 border-slate-900 rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {u.designation || u.activeRole} {u.department ? `• ${u.department}` : ""}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Chat →
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : activeTab === "GROUP" ? (
            // GROUP FORM & LIST
            <form onSubmit={handleCreateGroupChat} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Marketing Sprint, Core Devs"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Select Members ({selectedUserIds.length} selected)
                  </label>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {users.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUserSelection(u.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-600/10 border-blue-500/40 text-white"
                            : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-white">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              u.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-medium">{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.designation || u.activeRole}</div>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "border-slate-700 bg-slate-900"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !groupName.trim() || selectedUserIds.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Create Group Chat
                </button>
              </div>
            </form>
          ) : (
            // PROJECT LIST
            projects.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">No active projects found.</div>
            ) : (
              <div className="space-y-2">
                {projects
                  .filter((p) =>
                    !searchQuery ||
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.projectNumber && p.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((proj) => (
                    <button
                      key={proj.id}
                      disabled={submitting}
                      onClick={() => handleStartProjectChat(proj)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <FolderKanban className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                            {proj.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {proj.projectNumber || "Project"} • {proj.status}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Open Project Chat →
                      </span>
                    </button>
                  ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
