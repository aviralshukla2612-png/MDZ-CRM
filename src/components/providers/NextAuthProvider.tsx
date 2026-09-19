"use client";

import { SessionProvider } from "next-auth/react";

if (typeof window !== "undefined") {
  (window as any).__NEXTAUTH = (window as any).__NEXTAUTH || {};
  (window as any).__NEXTAUTH.basePath = "/mdz-crm/api/auth";
}

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/mdz-crm/api/auth">{children}</SessionProvider>;
}

