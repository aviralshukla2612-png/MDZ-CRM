import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3020/mdz-crm";

class CookieJar {
  cookies: Map<string, string> = new Map();

  setCookieHeader(cookies: string[] | string | null) {
    if (!cookies) return;
    const cookieArray = Array.isArray(cookies) ? cookies : cookies.split(/,(?=\s*[a-zA-Z0-9_-]+\=)/);
    for (const part of cookieArray) {
      const match = part.match(/([a-zA-Z0-9_.-]+)=([^;]+)/);
      if (match) {
        this.cookies.set(match[1], match[2]);
      }
    }
  }

  getCookieString() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
}

async function getCsrfToken(jar: CookieJar) {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`, {
    headers: { cookie: jar.getCookieString() },
  });
  jar.setCookieHeader(res.headers.getSetCookie());
  const data = await res.json();
  return data.csrfToken;
}

async function loginUser(email: string, pass: string, jar: CookieJar) {
  const csrfToken = await getCsrfToken(jar);
  const formData = new URLSearchParams();
  formData.append("email", email);
  formData.append("password", pass);
  formData.append("csrfToken", csrfToken);
  formData.append("callbackUrl", `${BASE_URL}/login`);
  formData.append("json", "true");

  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: jar.getCookieString(),
    },
    body: formData.toString(),
  });
  jar.setCookieHeader(res.headers.getSetCookie());
  return res;
}

async function runE2EAcceptance() {
  console.log("==========================================================");
  console.log("  MDZ OS Phase 7 Full User Flow End-to-End Verification");
  console.log("==========================================================\n");

  let failedCount = 0;
  const assert = (cond: boolean, name: string, detail?: string) => {
    if (cond) {
      console.log(`✅ PASS: ${name} ${detail ? "(" + detail + ")" : ""}`);
    } else {
      console.error(`❌ FAIL: ${name} ${detail ? "(" + detail + ")" : ""}`);
      failedCount++;
    }
  };

  try {
    // -------------------------------------------------------------------
    // Step A & D: OWNER Login & Terms Administration
    // -------------------------------------------------------------------
    console.log("--- Step 1: OWNER Login & Terms Administration ---");
    const ownerJar = new CookieJar();
    let loginRes = await loginUser("owner@mdzcompany.com", "password123", ownerJar);
    assert(loginRes.ok, "OWNER authentication successful");

    // Fetch Admin Terms (OWNER Only)
    let adminTermsRes = await fetch(`${BASE_URL}/api/admin/terms`, {
      headers: { cookie: ownerJar.getCookieString() },
    });
    assert(adminTermsRes.status === 200, "OWNER access to /api/admin/terms allowed (200)");

    // OWNER publishes Employee Terms v1.1
    let publishRes = await fetch(`${BASE_URL}/api/admin/terms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: ownerJar.getCookieString(),
      },
      body: JSON.stringify({
        targetAudience: "EMPLOYEE",
        action: "publish",
        version: "v1.1",
        title: "Employee Terms and Conditions v1.1",
        content: "Updated operational terms v1.1 for MDZ OS employees.",
      }),
    });
    let publishJson = await publishRes.json();
    assert(publishRes.status === 200 && publishJson.success, "OWNER publishes Employee Terms v1.1 successfully");

    // -------------------------------------------------------------------
    // Step B & E: Employee Terms Gate & Task Workflow
    // -------------------------------------------------------------------
    console.log("\n--- Step 2: Employee Terms Gate & Protected Route Verification ---");

    // Setup Test Employee and Project in DB
    const ownerUser = await prisma.user.findUnique({ where: { email: "owner@mdzcompany.com" } });
    const bcrypt = require("bcryptjs");
    const empHash = await bcrypt.hash("password123", 10);
    const empUser = await prisma.user.create({
      data: {
        email: `emp-e2e-${Date.now()}@mdzcompany.com`,
        name: "Karan E2E Dev",
        passwordHash: empHash,
        designation: "Frontend Dev",
        department: "Engineering",
        activeRole: "EMPLOYEE",
        termsAcceptedVersion: "v1.0", // Outdated version v1.0 (Current is v1.1!)
        employeeProfile: {
          create: { employeeIdCode: `EMP-E2E-${Date.now()}` },
        },
      },
      include: { employeeProfile: true },
    });

    const e2eClient = await prisma.client.create({
      data: {
        clientNumber: `CLT-E2E-${Date.now()}`,
        companyName: "MANDAP Tech Services",
        phone: "+91 98765 00000",
        email: `mandap-e2e-${Date.now()}@client.com`,
        createdById: ownerUser!.id,
      },
    });

    const e2eProject = await prisma.project.create({
      data: {
        projectNumber: `PRJ-MANDAP-${Date.now()}`,
        name: "MANDAP Website",
        clientId: e2eClient.id,
        createdById: ownerUser!.id,
      },
    });

    await prisma.projectMembership.create({
      data: {
        projectId: e2eProject.id,
        employeeId: empUser.employeeProfile!.id,
        assignedById: ownerUser!.id,
        roleInProject: "TM",
        isActive: true,
      },
    });

    // Employee Login
    const empJar = new CookieJar();
    await loginUser(empUser.email, "password123", empJar);

    // Protected Route Access Check: User accepted v1.0, current is v1.1 -> MUST BE BLOCKED
    let protectedApiRes = await fetch(`${BASE_URL}/api/terms/employee`, {
      headers: { cookie: empJar.getCookieString() },
    });
    let termsJson = await protectedApiRes.json();
    assert(
      termsJson.userStatus?.needsAcceptance === true && termsJson.userStatus?.currentVersion === "v1.1",
      "Server terms check detects employee has outdated accepted version (v1.0 vs v1.1)"
    );

    // Employee Accepts v1.1
    let acceptRes = await fetch(`${BASE_URL}/api/terms/employee/accept`, {
      method: "POST",
      headers: { cookie: empJar.getCookieString() },
    });
    let acceptJson = await acceptRes.json();
    assert(acceptRes.status === 200 && acceptJson.success, "Employee accepts v1.1 successfully");

    // Re-query protected endpoint -> Access now granted
    protectedApiRes = await fetch(`${BASE_URL}/api/terms/employee`, {
      headers: { cookie: empJar.getCookieString() },
    });
    termsJson = await protectedApiRes.json();
    assert(termsJson.userStatus?.needsAcceptance === false, "Access restored after accepting v1.1");

    // -------------------------------------------------------------------
    // Step B: Task Stack & Single Source of Truth Progress Engine
    // -------------------------------------------------------------------
    console.log("\n--- Step 3: Task Stack & Progress Engine Workflow ---");

    // Create 10 tasks for MANDAP Website project
    const taskTitles = [
      "UI Design",
      "Header Development",
      "Landing Page UI",
      "Login UI",
      "Registration UI",
      "Backend API",
      "Database Integration",
      "Frontend ↔ Backend Connection",
      "Testing",
      "Deployment",
    ];

    const createdTasks: any[] = [];
    for (let i = 0; i < taskTitles.length; i++) {
      let taskRes = await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: empJar.getCookieString(),
        },
        body: JSON.stringify({
          title: taskTitles[i],
          priority: "HIGH",
          assignedToId: empUser.id,
        }),
      });
      let taskJson = await taskRes.json();
      createdTasks.push(taskJson.task);
    }
    assert(createdTasks.length === 10, "Employee created 10 tasks for MANDAP Website project");

    // Verify initial progress is 0%
    let prjRes = await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks`, {
      headers: { cookie: empJar.getCookieString() },
    });
    let prjJson = await prjRes.json();
    assert(prjJson.progress.progressPercentage === 0 && prjJson.progress.completedTasks === 0, "0 / 10 Tasks Completed -> 0%");

    // Complete 2 tasks (UI Design & Header Development) -> 2 / 10 = 20%
    await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks/${createdTasks[0].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks/${createdTasks[1].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    prjRes = await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks`, {
      headers: { cookie: empJar.getCookieString() },
    });
    prjJson = await prjRes.json();
    assert(prjJson.progress.progressPercentage === 20 && prjJson.progress.completedTasks === 2, "2 / 10 Tasks Completed -> 20%");

    // Complete 3 more tasks (Landing Page, Login, Registration) -> 5 / 10 = 50%
    // Set Landing Page UI to IN_PROGRESS for developer active work test
    await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks/${createdTasks[2].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks/${createdTasks[3].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks/${createdTasks[4].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks/${createdTasks[5].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    prjRes = await fetch(`${BASE_URL}/api/projects/${e2eProject.id}/tasks`, {
      headers: { cookie: empJar.getCookieString() },
    });
    prjJson = await prjRes.json();
    assert(prjJson.progress.progressPercentage === 50 && prjJson.progress.completedTasks === 5, "5 / 10 Tasks Completed -> 50%");

    // -------------------------------------------------------------------
    // Step C: Client Portal Synchronization Verification
    // -------------------------------------------------------------------
    console.log("\n--- Step 4: Client Portal Synchronization Verification ---");

    // Query project details from owner/employee perspective (Client uses same progress engine)
    const clientPrjRes = await fetch(`${BASE_URL}/api/client/projects/${e2eProject.id}`, {
      headers: { cookie: ownerJar.getCookieString() },
    });
    const clientPrjJson = await clientPrjRes.json();

    assert(clientPrjJson.success, "Client project detail fetched successfully");
    assert(clientPrjJson.project.progressPercentage === 50, "Client side reflects identical 50% project progress");
    assert(clientPrjJson.project.completedTasks === 5 && clientPrjJson.project.totalTasks === 10, "Client side displays 5 / 10 tasks completed");

    const devMember = clientPrjJson.project.teamMembers.find((m: any) => m.name === empUser.name);
    assert(Boolean(devMember), "Client sees assigned developer team member");
    assert(
      devMember?.currentTask?.title === "Landing Page UI" && devMember?.currentTask?.status === "IN_PROGRESS",
      "Client sees developer currently working on active IN_PROGRESS task ('Landing Page UI')"
    );

    // -------------------------------------------------------------------
    // Cleanup Test Data
    // -------------------------------------------------------------------
    console.log("\n--- Cleaning up E2E Test Fixtures ---");
    await prisma.task.deleteMany({ where: { projectId: e2eProject.id } });
    await prisma.projectMembership.deleteMany({ where: { projectId: e2eProject.id } });
    await prisma.project.delete({ where: { id: e2eProject.id } });
    await prisma.client.delete({ where: { id: e2eClient.id } });
    await prisma.termsAcceptanceLog.deleteMany({ where: { userId: empUser.id } });
    await prisma.user.delete({ where: { id: empUser.id } });

    console.log("Cleanup complete.");

    if (failedCount === 0) {
      console.log("\n🎉 ALL E2E ACCEPTANCE TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS! 🎉");
    } else {
      console.error(`\n❌ ${failedCount} E2E TEST(S) FAILED.`);
    }
  } catch (e) {
    console.error("E2E Test execution error:", e);
    failedCount++;
  } finally {
    await prisma.$disconnect();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runE2EAcceptance();
