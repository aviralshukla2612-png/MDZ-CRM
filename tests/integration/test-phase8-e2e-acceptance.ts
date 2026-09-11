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

async function runPhase8E2E() {
  console.log("=================================================================");
  console.log("  MDZ OS Phase 8 End-to-End Browser & API Manual Acceptance Test");
  console.log("=================================================================\n");

  let failedTests = 0;
  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${detail ? "(" + detail + ")" : ""}`);
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? "(" + detail + ")" : ""}`);
      failedTests++;
    }
  };

  try {
    const ownerUser = await prisma.user.findUnique({ where: { email: "owner@mdzcompany.com" } });
    if (!ownerUser) {
      console.error("Test setup error: OWNER user not found");
      process.exit(1);
    }

    const bcrypt = require("bcryptjs");
    const passHash = await bcrypt.hash("password123", 10);

    // Setup Test Employee and Client Project
    const empUser = await prisma.user.create({
      data: {
        email: `emp-p8-e2e-${Date.now()}@mdz.com`,
        name: "Rahul Dev P8",
        passwordHash: passHash,
        designation: "Software Engineer",
        department: "Engineering",
        activeRole: "EMPLOYEE",
        termsAcceptedVersion: "v1.0",
        employeeProfile: { create: { employeeIdCode: `EMP-P8-${Date.now()}` } },
      },
      include: { employeeProfile: true },
    });

    const clientObj = await prisma.client.create({
      data: {
        clientNumber: `CLT-P8E2E-${Date.now()}`,
        companyName: "MANDAP Solutions",
        phone: "+91 98765 11111",
        email: `mandap-p8-${Date.now()}@client.com`,
        createdById: ownerUser.id,
      },
    });

    const projectObj = await prisma.project.create({
      data: {
        projectNumber: `PRJ-P8E2E-${Date.now()}`,
        name: "MANDAP Portal App",
        clientId: clientObj.id,
        createdById: ownerUser.id,
      },
    });

    await prisma.projectMembership.create({
      data: {
        projectId: projectObj.id,
        employeeId: empUser.employeeProfile!.id,
        assignedById: ownerUser.id,
        roleInProject: "TM",
        isActive: true,
      },
    });

    // 1. Log in OWNER & Employee sessions
    const ownerJar = new CookieJar();
    await loginUser("owner@mdzcompany.com", "password123", ownerJar);

    const empJar = new CookieJar();
    await loginUser(empUser.email, "password123", empJar);

    // Ensure Employee Terms v1.0 is current so no gate blocks API calls
    await prisma.user.update({
      where: { id: empUser.id },
      data: { termsAcceptedVersion: "v1.0", termsAcceptedAt: new Date() },
    });

    // -------------------------------------------------------------------
    // STEP 1: OWNER marks Task A as Most Important
    // -------------------------------------------------------------------
    console.log("--- Step 1: OWNER Marks Task A as Most Important ---");

    const taskA = await prisma.task.create({
      data: {
        projectId: projectObj.id,
        title: "Task A - DB Migration",
        createdById: ownerUser.id,
        assignedToId: empUser.id,
        status: "TODO",
      },
    });

    const taskB = await prisma.task.create({
      data: {
        projectId: projectObj.id,
        title: "Task B - API Gateway",
        createdById: ownerUser.id,
        assignedToId: empUser.id,
        status: "TODO",
      },
    });

    let patchRes = await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks/${taskA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: ownerJar.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });
    let patchJson = await patchRes.json();
    assert(patchRes.status === 200 && patchJson.task.isMostImportant === true, "OWNER sets Task A as Most Important -> 200 OK");

    // Verify Employee sees Task A as Most Important
    let empPrjRes = await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks`, {
      headers: { cookie: empJar.getCookieString() },
    });
    let empPrjJson = await empPrjRes.json();
    const mostImpTask1 = empPrjJson.tasks.find((t: any) => t.isMostImportant);
    assert(
      mostImpTask1?.id === taskA.id && mostImpTask1?.title === "Task A - DB Migration",
      "Employee sees Task A as ⭐ MOST IMPORTANT TASK"
    );

    // -------------------------------------------------------------------
    // STEP 2: OWNER selects Task B -> Priority switches, Task A becomes false
    // -------------------------------------------------------------------
    console.log("\n--- Step 2: OWNER Selects Task B -> Priority Switches ---");

    patchRes = await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks/${taskB.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: ownerJar.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });
    patchJson = await patchRes.json();
    assert(patchRes.status === 200 && patchJson.task.isMostImportant === true, "OWNER sets Task B as Most Important -> 200 OK");

    const checkTaskA = await prisma.task.findUnique({ where: { id: taskA.id } });
    const checkTaskB = await prisma.task.findUnique({ where: { id: taskB.id } });
    assert(
      checkTaskA?.isMostImportant === false && checkTaskB?.isMostImportant === true,
      "Task A automatically cleared (false), Task B is now ⭐ Most Important (true)"
    );

    // -------------------------------------------------------------------
    // STEP 3: Employee Priority Modification Security (403 Forbidden)
    // -------------------------------------------------------------------
    console.log("\n--- Step 3: Employee Priority Modification Security ---");

    let empAttemptRes = await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks/${taskA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });
    assert(empAttemptRes.status === 403, "Employee attempt to set isMostImportant via API -> 403 Forbidden");

    // -------------------------------------------------------------------
    // STEP 4: Employee Completes Task B -> Priority Auto-Removed
    // -------------------------------------------------------------------
    console.log("\n--- Step 4: Employee Completes Task B -> Priority Auto-Removed ---");

    await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks/${taskB.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    const completedTaskB = await prisma.task.findUnique({ where: { id: taskB.id } });
    assert(
      completedTaskB?.status === "COMPLETED" && completedTaskB?.isMostImportant === false,
      "Completing Task B automatically resets isMostImportant = false"
    );

    empPrjRes = await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks`, {
      headers: { cookie: empJar.getCookieString() },
    });
    empPrjJson = await empPrjRes.json();
    const activeMostImp = empPrjJson.tasks.filter((t: any) => t.isMostImportant);
    assert(activeMostImp.length === 0, "Employee priority card displays 'No most important task assigned.'");

    // -------------------------------------------------------------------
    // STEP 5: Client Portal Verification
    // -------------------------------------------------------------------
    console.log("\n--- Step 5: Client Portal Verification ---");

    let clientRes = await fetch(`${BASE_URL}/api/client/projects/${projectObj.id}`, {
      headers: { cookie: ownerJar.getCookieString() },
    });
    let clientJson = await clientRes.json();

    assert(clientJson.success, "Client project detail fetched");
    assert(clientJson.project.teamMembers.every((m: any) => !m.currentTask || m.currentTask.isMostImportant === undefined), "Client API projection explicitly omits internal isMostImportant flag");

    // -------------------------------------------------------------------
    // STEP 6: Progress Neutrality
    // -------------------------------------------------------------------
    console.log("\n--- Step 6: Progress Engine Neutrality Verification ---");

    // Create 8 more tasks for total 10 active tasks (1 completed Task B, 9 TODO)
    for (let i = 1; i <= 8; i++) {
      await prisma.task.create({
        data: {
          projectId: projectObj.id,
          title: `Task Stack ${i}`,
          createdById: ownerUser.id,
          assignedToId: empUser.id,
          status: "TODO",
        },
      });
    }

    // Complete Task A (2 completed out of 10 = 20%)
    await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks/${taskA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    let progRes = await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks`, {
      headers: { cookie: empJar.getCookieString() },
    });
    let progJson = await progRes.json();
    assert(progJson.progress.progressPercentage === 20, "2 / 10 Tasks Completed -> 20%");

    // OWNER marks a task Most Important -> Progress MUST remain 20%
    const remainingTasks = progJson.tasks.filter((t: any) => t.status === "TODO");
    await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks/${remainingTasks[0].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: ownerJar.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });

    progRes = await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks`, {
      headers: { cookie: empJar.getCookieString() },
    });
    progJson = await progRes.json();
    assert(progJson.progress.progressPercentage === 20, "Marking task Most Important does NOT alter progress percentage (remains 20%)");

    // Complete Most Important task -> 3 / 10 = 30%
    await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks/${remainingTasks[0].id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJar.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    progRes = await fetch(`${BASE_URL}/api/projects/${projectObj.id}/tasks`, {
      headers: { cookie: empJar.getCookieString() },
    });
    progJson = await progRes.json();
    assert(progJson.progress.progressPercentage === 30, "Completing task updates progress engine to 30%");

    // -------------------------------------------------------------------
    // Cleanup Test Data
    // -------------------------------------------------------------------
    console.log("\n--- Cleaning up E2E Test Fixtures ---");
    await prisma.task.deleteMany({ where: { projectId: projectObj.id } });
    await prisma.projectMembership.deleteMany({ where: { projectId: projectObj.id } });
    await prisma.project.delete({ where: { id: projectObj.id } });
    await prisma.client.delete({ where: { id: clientObj.id } });
    await prisma.user.delete({ where: { id: empUser.id } });

    console.log("Cleanup complete.");

    if (failedTests === 0) {
      console.log("\n🟢 PHASE 8 — MANUAL ACCEPTANCE PASSED SUCCESSFULLY! 🟢");
    } else {
      console.error(`\n❌ ${failedTests} TEST(S) FAILED.`);
    }
  } catch (e) {
    console.error("Phase 8 E2E Test execution error:", e);
    failedTests++;
  } finally {
    await prisma.$disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runPhase8E2E();
