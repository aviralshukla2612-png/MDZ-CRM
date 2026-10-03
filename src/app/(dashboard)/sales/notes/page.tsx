"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Save,
  Check,
  Copy,
  Tag,
  Clock,
  Sparkles,
  Edit3,
  Filter,
  X,
  Download,
  Notebook,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All Notes", icon: Notebook },
  { id: "GENERAL", label: "General Drafts", icon: FileText },
  { id: "CALL_LOG", label: "Call Notes", icon: Sparkles },
  { id: "DEAL_DRAFT", label: "Deal Pitches & Quotes", icon: Edit3 },
  { id: "REMINDER", label: "Follow-up Reminders", icon: Clock },
];

export default function SalesPersonalNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNote, setActiveNote] = useState<Partial<Note> | null>(null);

  // Editor states
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorCategory, setEditorCategory] = useState("GENERAL");
  const [editorTags, setEditorTags] = useState("");
  const [editorIsPinned, setEditorIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      let url = "/api/sales/notes";
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") {
        params.append("category", selectedCategory);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setNotes(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorCategory(note.category);
    let parsedTags = "";
    try {
      const arr = JSON.parse(note.tags);
      if (Array.isArray(arr)) parsedTags = arr.join(", ");
    } catch {
      parsedTags = note.tags || "";
    }
    setEditorTags(parsedTags);
    setEditorIsPinned(note.isPinned);
  };

  const handleNewNote = () => {
    setActiveNote(null);
    setEditorTitle("Untitled Draft Note");
    setEditorContent("");
    setEditorCategory(selectedCategory !== "ALL" ? selectedCategory : "GENERAL");
    setEditorTags("");
    setEditorIsPinned(false);
  };

  const handleSaveNote = async () => {
    if (!editorTitle.trim()) return;

    try {
      setSaving(true);
      const tagsArray = editorTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: editorTitle,
        content: editorContent,
        category: editorCategory,
        tags: tagsArray,
        isPinned: editorIsPinned,
      };

      let res;
      if (activeNote?.id) {
        res = await fetch(`/api/sales/notes/${activeNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/sales/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success) {
        setActiveNote(json.data);
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this personal draft note?")) return;

    try {
      const res = await fetch(`/api/sales/notes/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        if (activeNote?.id === id) {
          handleNewNote();
        }
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/sales/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      const json = await res.json();
      if (json.success) {
        if (activeNote?.id === note.id) {
          setEditorIsPinned(!note.isPinned);
        }
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleCopyNote = (content: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      note.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Sales Personal Space
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Sales Drafts & Personal Notes</h1>
          <p className="text-slate-300 text-sm mt-1">
            Private, secure workspace for call scripts, client pitch ideas, follow-up reminders, and draft notes.
          </p>
        </div>
        <button
          onClick={handleNewNote}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Main Grid: Sidebar List + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Categories + Notes List */}
        <div className="lg:col-span-4 space-y-4">
          {/* Category Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Notes List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading your notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No saved notes found in this view.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1 flex-1">
                        {note.title || "Untitled Note"}
                      </h3>
                      <button
                        onClick={(e) => handleTogglePin(note, e)}
                        className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition ${
                          note.isPinned ? "text-amber-500 fill-amber-500" : "text-slate-400"
                        }`}
                        title={note.isPinned ? "Unpin Note" : "Pin Note"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2">
                      {note.content || "Empty draft note..."}
                    </p>

                    <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
                        {note.category}
                      </span>
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Editor */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between min-h-[500px]">
          <div className="space-y-4">
            {/* Editor Header / Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category:</span>
                <select
                  value={editorCategory}
                  onChange={(e) => setEditorCategory(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GENERAL">General</option>
                  <option value="CALL_LOG">Call Notes</option>
                  <option value="DEAL_DRAFT">Deal Pitches & Quotes</option>
                  <option value="REMINDER">Follow-up Reminder</option>
                </select>

                <button
                  type="button"
                  onClick={() => setEditorIsPinned(!editorIsPinned)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    editorIsPinned
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{editorIsPinned ? "Pinned" : "Pin Note"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeNote?.id && (
                  <>
                    <button
                      onClick={(e) => handleCopyNote(editorContent, activeNote.id!, e)}
                      className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1"
                      title="Copy content"
                    >
                      {copiedId === activeNote.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteNote(activeNote.id!)}
                      className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleSaveNote}
                  disabled={saving || !editorTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : activeNote?.id ? "Save Changes" : "Save Note"}</span>
                </button>
              </div>
            </div>

            {/* Title Input */}
            <div>
              <input
                type="text"
                placeholder="Note Title (e.g. Call script for Enterprise Lead)"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                className="w-full text-xl font-bold bg-transparent border-b border-transparent focus:border-indigo-500 text-slate-900 dark:text-white focus:outline-none py-1"
              />
            </div>

            {/* Tags Input */}
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Tags comma separated (e.g. lead, pricing, follow-up)"
                value={editorTags}
                onChange={(e) => setEditorTags(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Content Textarea */}
            <div>
              <textarea
                placeholder="Write your personal sales draft notes, objection handling scripts, custom quote ideas, or daily scratchpad notes here..."
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                rows={16}
                className="w-full p-4 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
              />
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>
              {activeNote?.id
                ? `Last modified: ${new Date(activeNote.updatedAt || Date.now()).toLocaleString()}`
                : "New unsaved draft"}
            </span>
            <span>{editorContent.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
