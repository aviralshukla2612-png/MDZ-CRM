"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkloadPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projects?view=kanban");
  }, [router]);

  return (
    <div className="p-16 text-center text-slate-400 text-sm animate-pulse space-y-2">
      <div className="text-base font-bold text-slate-600 dark:text-slate-300">
        Redirecting to Project Kanban...
      </div>
      <p className="text-xs">Opening unified developer workload & project workspace.</p>
    </div>
  );
}
