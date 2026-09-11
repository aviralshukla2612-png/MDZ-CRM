import React from "react";
import "@/app/globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = {
  title: "Millionaire Digital CRM — Master Business Operating System",
  description: "Centralized Operating System for Millionaire Digital CRM",
};

import { PrototypeStoreProvider } from "@/lib/prototypeStore";
import { WorkClockProvider } from "@/lib/workClockContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body>
        <ToastProvider>
          <NextAuthProvider>
            <PrototypeStoreProvider>
              <WorkClockProvider>
                <AppShell>{children}</AppShell>
              </WorkClockProvider>
            </PrototypeStoreProvider>
          </NextAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
