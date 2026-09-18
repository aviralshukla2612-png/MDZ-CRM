import React from "react";
import { ShieldCheck, CheckCircle2, ExternalLink, Calendar, FolderKanban, Clock, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ClientPortalPage({ params }: { params: { token: string } }) {
  const { token } = params;

  // Verify the token exists in the ClientPortalToken model or demo/preview modes
  const portalToken = await prisma.clientPortalToken.findUnique({
    where: { token },
    include: {
      client: true,
      project: {
        include: {
          clientUpdates: { orderBy: { createdAt: "desc" } },
          tasks: true,
          stages: { include: { tasks: true } },
        },
      },
    },
  });

  let clientRecord: any = portalToken?.client;
  let activeProject: any = portalToken?.project;

  if (!portalToken) {
    if (token === "demo-token-abc" || token.startsWith("preview-")) {
      const projectId = token.startsWith("preview-") ? token.replace("preview-", "") : undefined;
      const demoProject = projectId
        ? await prisma.project.findFirst({
            where: { OR: [{ id: projectId }, { projectNumber: projectId }] },
            include: {
              client: true,
              clientUpdates: { orderBy: { createdAt: "desc" } },
              tasks: true,
              stages: { include: { tasks: true } },
            },
          })
        : await prisma.project.findFirst({
            include: {
              client: true,
              clientUpdates: { orderBy: { createdAt: "desc" } },
              tasks: true,
              stages: { include: { tasks: true } },
            },
            orderBy: { createdAt: "desc" },
          });
      clientRecord = demoProject?.client || ({ companyName: "Apex Global Enterprises" } as any);
      activeProject = demoProject || null;
    } else {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090E18] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Portal Access Link Invalid</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This tokenized access link could not be verified. Please request an updated link or log in to your account.
            </p>
            <a
              href="/mdz-crm/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
            >
              Sign In to Client Portal
            </a>
          </div>
        </div>
      );
    }
  } else if (!portalToken.isActive || portalToken.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090E18] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Portal Access Token Expired</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This token has expired. Please contact your account manager for a new access token.
          </p>
          <a
            href="/mdz-crm/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
          >
            Sign In to Client Portal
          </a>
        </div>
      </div>
    );
  }

  const activeTasks = (activeProject?.tasks || []).filter((t: any) => t.status !== "ARCHIVED");
  const completedTasks = activeTasks.filter((t: any) => t.status === "COMPLETED" || t.status === "DONE").length;
  const computedProgress =
    activeTasks.length > 0
      ? Math.round((completedTasks / activeTasks.length) * 100)
      : activeProject?.progressPercentage || 0;

  const rawPreviewUrl = activeProject?.stagingUrl || activeProject?.liveUrl || null;
  const formattedPreviewUrl = rawPreviewUrl
    ? rawPreviewUrl.startsWith("http://") || rawPreviewUrl.startsWith("https://")
      ? rawPreviewUrl
      : `https://${rawPreviewUrl}`
    : null;

  const latestUpdate = activeProject?.clientUpdates?.[0] || null;

  const dynamicMilestones = activeProject?.stages && activeProject.stages.length > 0
    ? activeProject.stages.map((s: any) => ({
        name: s.name,
        status: s.status === "COMPLETED" ? "Completed" : s.status === "IN_PROGRESS" ? "In Progress" : "Pending",
        progress: s.progressPercentage || (s.status === "COMPLETED" ? 100 : 0),
      }))
    : [
        { name: "1. Requirements & Scope Signoff", status: computedProgress > 15 ? "Completed" : "In Progress", progress: Math.min(100, Math.round(computedProgress * 2.5)) },
        { name: "2. UI/UX Design & Architecture", status: computedProgress > 50 ? "Completed" : computedProgress > 15 ? "In Progress" : "Pending", progress: Math.min(100, Math.round(computedProgress * 1.5)) },
        { name: "3. Core Development & Deliverables", status: computedProgress >= 100 ? "Completed" : computedProgress > 0 ? "Under Active Development" : "Pending", progress: computedProgress },
      ];

  const project = {
    clientCompany: clientRecord?.companyName || "Client Account",
    projectName: activeProject ? activeProject.name : "Project Workspace",
    launchDate: activeProject?.targetDeadline ? new Date(activeProject.targetDeadline).toLocaleDateString() : "TBD",
    progress: computedProgress,
    milestones: dynamicMilestones,
    latestUpdate: latestUpdate
      ? {
          title: latestUpdate.title,
          date: new Date(latestUpdate.createdAt).toLocaleDateString(),
          content: latestUpdate.content,
        }
      : {
          title: activeProject ? `Project Status: ${activeProject.status.replace(/_/g, " ")}` : "Project In Preparation",
          date: "Latest",
          content: activeProject ? `Work is actively progressing for ${activeProject.name}. Check back regularly for verified milestone updates.` : "Your project workspace is being prepared by the engineering team.",
        },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090E18] text-slate-900 dark:text-slate-100 p-4 sm:p-8 space-y-6 max-w-6xl mx-auto font-sans transition-colors">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-black text-xl flex items-center justify-center font-mono shadow-xs">
            E
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-amber-600 dark:text-amber-400">MILLIONAIRE DIZITAL CLIENT PORTAL</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">Millionaire Dizital CRM • Verified Safe Token Session</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>SECURE CLIENT ACCESS</span>
        </span>
      </div>

      {/* Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase font-mono tracking-wider">{project.clientCompany}</span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{project.projectName}</h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target Launch Date: <strong className="text-slate-800 dark:text-slate-200">{project.launchDate}</strong></div>
          </div>

          {formattedPreviewUrl ? (
            <a
              href={formattedPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors touch-target"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Staging Preview</span>
            </a>
          ) : (
            <div
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 select-none shadow-2xs"
              title="Staging preview URL has not been configured yet for this project."
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Preview Pending Deployment</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">Overall Project Completion</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{project.progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Grid: Milestones & Latest Update */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Milestone Statuses</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {project.milestones.map((m: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.status}</div>
                </div>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{m.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Latest Published Updates</span>
          </h3>

          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-indigo-950 dark:text-indigo-300">
              <span>{project.latestUpdate.title}</span>
              <span className="text-slate-400 font-mono text-[11px]">{project.latestUpdate.date}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{project.latestUpdate.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
