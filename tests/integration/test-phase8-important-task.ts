import { PrismaClient } from "@prisma/client";
import { recalculateProjectProgress } from "../../src/lib/progressEngine";

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

async function runPhase8Tests() {
  console.log("==========================================================");
  console.log("  MDZ OS Phase 8 Important Task Security & Integration Tests");
  console.log("==========================================================\n");

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
      console.error("Test setup error: OWNER user not found in DB");
      process.exit(1);
    }

    const ownerJar = new CookieJar();
    await loginUser("owner@mdzcompany.com", "password123", ownerJar);

    // Setup Test Employees
    const bcrypt = require("bcryptjs");
    const passHash = await bcrypt.hash("password123", 10);

    const empUserX = await prisma.user.create({
      data: {
        email: `emp-x-${Date.now()}@mdz.com`,
        name: "Employee X",
        passwordHash: passHash,
        designation: "Dev",
        department: "Eng",
        activeRole: "EMPLOYEE",
        employeeProfile: { create: { employeeIdCode: `EMP-X-${Date.now()}` } },
      },
      include: { employeeProfile: true },
    });

    const empUserY = await prisma.user.create({
      data: {
        email: `emp-y-${Date.now()}@mdz.com`,
        name: "Employee Y",
        passwordHash: passHash,
        designation: "Dev",
        department: "Eng",
        activeRole: "EMPLOYEE",
        employeeProfile: { create: { employeeIdCode: `EMP-Y-${Date.now()}` } },
      },
      include: { employeeProfile: true },
    });

    // Create Test Project
    const testClient = await prisma.client.create({
      data: {
        clientNumber: `CLT-P8-${Date.now()}`,
        companyName: "Phase 8 Client Corp",
        phone: "+91 99999 77777",
        email: `p8-client-${Date.now()}@test.com`,
        createdById: ownerUser.id,
      },
    });

    const testProject = await prisma.project.create({
      data: {
        projectNumber: `PRJ-P8-${Date.now()}`,
        name: "Phase 8 Test Project",
        clientId: testClient.id,
        createdById: ownerUser.id,
      },
    });

    await prisma.projectMembership.create({
      data: {
        projectId: testProject.id,
        employeeId: empUserX.employeeProfile!.id,
        assignedById: ownerUser.id,
        roleInProject: "MEMBER",
        isActive: true,
      },
    });

    // -------------------------------------------------------------------
    // TEST 1: OWNER Priority Authority & Single Task Per Employee Rule
    // -------------------------------------------------------------------
    console.log("--- 1. OWNER Priority Authority & Single Task Rule ---");

    const taskA = await prisma.task.create({
      data: {
        projectId: testProject.id,
        title: "Task A - Initial",
        createdById: ownerUser.id,
        assignedToId: empUserX.id,
        status: "TODO",
      },
    });

    const taskB = await prisma.task.create({
      data: {
        projectId: testProject.id,
        title: "Task B - Secondary",
        createdById: ownerUser.id,
        assignedToId: empUserX.id,
        status: "TODO",
      },
    });

    // OWNER marks Task A as Most Important
    let patchRes = await fetch(`${BASE_URL}/api/projects/${testProject.id}/tasks/${taskA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: ownerJar.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });
    let patchJson = await patchRes.json();
    assert(patchRes.status === 200 && patchJson.task.isMostImportant === true, "OWNER marks Task A as Most Important -> 200 OK");

    // OWNER marks Task B as Most Important for Employee X
    patchRes = await fetch(`${BASE_URL}/api/projects/${testProject.id}/tasks/${taskB.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: ownerJar.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });
    patchJson = await patchRes.json();
    assert(patchRes.status === 200 && patchJson.task.isMostImportant === true, "OWNER marks Task B as Most Important -> 200 OK");

    // Check Task A in DB: MUST be false now (single active task per employee rule)
    const checkTaskA = await prisma.task.findUnique({ where: { id: taskA.id } });
    assert(checkTaskA?.isMostImportant === false, "Transaction automatically cleared isMostImportant on Task A when Task B was prioritized");

    // -------------------------------------------------------------------
    // TEST 2: EMPLOYEE Security Boundary (403 Forbidden)
    // -------------------------------------------------------------------
    console.log("\n--- 2. EMPLOYEE Security Boundary ---");

    const empJarX = new CookieJar();
    await loginUser(empUserX.email, "password123", empJarX);

    // Employee attempts to mark Task A as Most Important -> MUST BE DENIED
    let empPatchRes = await fetch(`${BASE_URL}/api/projects/${testProject.id}/tasks/${taskA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJarX.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });
    assert(empPatchRes.status === 403, "Employee attempt to set isMostImportant -> 403 Forbidden");

    // -------------------------------------------------------------------
    // TEST 3: Reassignment Reset
    // -------------------------------------------------------------------
    console.log("\n--- 3. Reassignment Priority Reset ---");

    // Task B is currently Most Important for Employee X. Reassign Task B to Employee Y
    patchRes = await fetch(`${BASE_URL}/api/projects/${testProject.id}/tasks/${taskB.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: ownerJar.getCookieString() },
      body: JSON.stringify({ assignedToId: empUserY.id }),
    });
    patchJson = await patchRes.json();
    assert(patchJson.task.isMostImportant === false, "Reassigning task to another employee automatically resets isMostImportant = false");

    // -------------------------------------------------------------------
    // TEST 4: Completion & Archiving Auto-Removal
    // -------------------------------------------------------------------
    console.log("\n--- 4. Completion & Archiving Auto-Removal ---");

    // OWNER prioritizes Task A again for Employee X
    await fetch(`${BASE_URL}/api/projects/${testProject.id}/tasks/${taskA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: ownerJar.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });

    // Employee X completes Task A
    await fetch(`${BASE_URL}/api/projects/${testProject.id}/tasks/${taskA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: empJarX.getCookieString() },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    const completedTaskA = await prisma.task.findUnique({ where: { id: taskA.id } });
    assert(
      completedTaskA?.status === "COMPLETED" && completedTaskA?.isMostImportant === false,
      "Completing Most Important task automatically resets isMostImportant = false"
    );

    // Archive Task B
    await fetch(`${BASE_URL}/api/projects/${testProject.id}/tasks/${taskB.id}`, {
      method: "DELETE",
      headers: { cookie: ownerJar.getCookieString() },
    });
    const archivedTaskB = await prisma.task.findUnique({ where: { id: taskB.id } });
    assert(
      archivedTaskB?.status === "ARCHIVED" && archivedTaskB?.isMostImportant === false,
      "Archiving task automatically resets isMostImportant = false"
    );

    // -------------------------------------------------------------------
    // TEST 5: Progress Engine Neutrality
    // -------------------------------------------------------------------
    console.log("\n--- 5. Progress Engine Immunity ---");

    const taskC = await prisma.task.create({
      data: {
        projectId: testProject.id,
        title: "Task C",
        createdById: ownerUser.id,
        assignedToId: empUserX.id,
        status: "TODO",
      },
    });

    let prog = await recalculateProjectProgress(testProject.id);
    // Active tasks: Task C (Task A is COMPLETED, Task B is ARCHIVED) -> 1 completed / 2 active (Task A & Task C) -> 50%
    const initialProgress = prog.progressPercentage;

    // Mark Task C as Most Important
    await fetch(`${BASE_URL}/api/projects/${testProject.id}/tasks/${taskC.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: ownerJar.getCookieString() },
      body: JSON.stringify({ isMostImportant: true }),
    });

    prog = await recalculateProjectProgress(testProject.id);
    assert(prog.progressPercentage === initialProgress, "Marking task as Most Important does NOT alter project progress calculation");

    // -------------------------------------------------------------------
    // Cleanup Test Data
    // -------------------------------------------------------------------
    console.log("\n--- Cleaning up Phase 8 Test Fixtures ---");
    await prisma.task.deleteMany({ where: { projectId: testProject.id } });
    await prisma.projectMembership.deleteMany({ where: { projectId: testProject.id } });
    await prisma.project.delete({ where: { id: testProject.id } });
    await prisma.client.delete({ where: { id: testClient.id } });
    await prisma.user.delete({ where: { id: empUserX.id } });
    await prisma.user.delete({ where: { id: empUserY.id } });

    console.log("Cleanup complete.");

    if (failedTests === 0) {
      console.log("\n✨ ALL PHASE 8 IMPORTANT TASK INTEGRATION & SECURITY TESTS PASSED! ✨");
    } else {
      console.error(`\n❌ ${failedTests} PHASE 8 TEST(S) FAILED.`);
    }
  } catch (e) {
    console.error("Phase 8 Test execution error:", e);
    failedTests++;
  } finally {
    await prisma.$disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runPhase8Tests();
