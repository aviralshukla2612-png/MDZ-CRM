"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OverviewRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    const role = (session.user as any)?.role || "OWNER";

    switch (role) {
      case "CLIENT":
        router.replace("/client");
        break;
      case "SALES":
        router.replace("/sales");
        break;
      case "EMPLOYEE":
        router.replace("/employee");
        break;
      case "OWNER":
      case "ADMIN":
      case "SUB_ADMIN":
      default:
        router.replace("/owner");
        break;
    }
  }, [session, status, router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-3 font-sans">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-xs text-slate-500 font-semibold font-mono">Redirecting to your dashboard overview...</p>
    </div>
  );
}
