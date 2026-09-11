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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('mdz-theme');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else if (saved === 'system') {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.classList.remove('light');
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.classList.add('light');
                    }
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
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
