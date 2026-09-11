"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";
import { RoleContext } from "@/lib/auth";
import { TimeReminders } from "@/components/ui/TimeReminders";
import { NotificationListener } from "@/components/ui/NotificationListener";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [needsTermsAcceptance, setNeedsTermsAcceptance] = useState(false);

  const currentRole = (session?.user?.role || "EMPLOYEE") as RoleContext;

  React.useEffect(() => {
    if (session?.user && currentRole === "EMPLOYEE") {
      fetch("/mdz-crm/api/terms/employee")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.userStatus?.needsAcceptance) {
            setNeedsTermsAcceptance(true);
          } else {
            setNeedsTermsAcceptance(false);
          }
        })
        .catch(() => {});
    } else {
      setNeedsTermsAcceptance(false);
    }
  }, [session, pathname, currentRole]);

  // If on login page, render full viewport without app shell
  if (pathname === "/login") {
    return <main className="min-h-screen">{children}</main>;
  }

  // If terms acceptance is required and user is not on terms page, redirect/show terms gate
  const isTermsPage = pathname === "/employee/terms" || pathname === "/terms-and-conditions";
  const shouldGate = currentRole === "EMPLOYEE" && needsTermsAcceptance && !isTermsPage;

  return (
    <div className="bg-slate-50 dark:bg-[#090E18] text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex flex-col font-sans transition-colors relative">
      <TimeReminders />
      <NotificationListener />
      <TopLoadingBar />
      {/* Header */}
      <Header
        currentUser={{
          email: session?.user?.email || "",
          name: session?.user?.name || "User",
          role: currentRole,
          designation: "Employee",
          employeeId: session?.user?.employeeId || undefined,
          icon: null,
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLogout={() => signOut({ callbackUrl: "/mdz-crm/login" })}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Sidebar (Rendered outside to fix stacking context issues) */}
      {isMobileMenuOpen && (
        <Sidebar
          role={currentRole}
          isMobileOpen={true}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Body Layout: Desktop Fixed Sidebar + Main Scrollable Workspace */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        <Sidebar
          role={currentRole}
          isMobileOpen={false}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-8">
          {shouldGate ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-lg space-y-4 text-center max-w-xl mx-auto my-12">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <span className="text-xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Employee Terms Acceptance Required
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The Terms & Conditions of Service have been updated. You must review and accept the latest version before continuing to your workspace.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => signOut({ callbackUrl: "/mdz-crm/login" })}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Logout
                </button>
                <a
                  href="/mdz-crm/employee/terms"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Review & Accept Terms
                </a>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

    </div>
  );
}
