"use client";

import React, { useState } from "react";
import { Sparkles, Send, Bot, RefreshCw } from "lucide-react";

export function AIOwnerAssistant() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const prompts = [
    "✨ Morning Brief",
    "Why is ABC delayed?",
    "Overdue Payments",
    "Team Workload",
  ];

  const handleAsk = async (userQuery: string) => {
    if (!userQuery.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/mdz-crm/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });
      const data = await res.json();
      setResponse(data.reply || data.answer || "No insights found.");
    } catch {
      setResponse("Could not process query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#161411] rounded-xl border border-amber-200/80 dark:border-amber-900/40 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 dark:border-amber-900/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">MILLIONAIRE DIGITAL AI ASSISTANT</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Natural language intelligence operating over company data.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p);
                handleAsk(p);
              }}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:text-amber-900 dark:hover:text-amber-200 text-amber-800 dark:text-amber-300 transition-colors border border-amber-200/80 dark:border-amber-800/60"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {response && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/90 to-yellow-50/40 dark:from-amber-950/50 dark:to-stone-900/60 border border-amber-200 dark:border-amber-800/60 text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-sans shadow-xs">
            <div className="font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Millionaire Digital AI Executive Brief</span>
            </div>
            {response}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Millionaire Digital AI (e.g. 'What should I focus on today?', 'Who is working on ABC?')"
            className="flex-1 bg-stone-50 dark:bg-stone-900/80 border border-amber-200/80 dark:border-amber-900/40 rounded-lg px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:border-amber-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
