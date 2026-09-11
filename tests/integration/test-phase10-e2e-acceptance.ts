import { PrismaClient } from "@prisma/client";
import { getEmployeeProjectDeliveryStatus } from "../../src/lib/deliveryEngine";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3020/mdz-crm";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

class TestCookieJar {
  private cookies: Map<string, string> = new Map();

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

  getCookieString(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
}

async function getCsrfToken(jar: TestCookieJar) {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`, {
    headers: { cookie: jar.getCookieString() },
  });
  jar.setCookieHeader(res.headers.getSetCookie());
  const data = await res.json();
  return data.csrfToken;
}

async function loginUser(email: string, pass: string, jar: TestCookieJar) {
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
  assert(res.ok, `Logged in as ${email}`);
  return res;
}

async function runMasterE2EAcceptance() {
  console.log("\n=================================================================");
  console.log("  MDZ OS Phase 10 Master E2E End-to-End Acceptance Test Suite");
  console.log("=================================================================\n");

  const bcrypt = require("bcryptjs");
  const passHash = await bcrypt.hash("password123", 10);
  const testPass = "password123";

  // Clean up any leftover test data
  const testEmails = [
    "owner-p10-e2e@test.com",
    "emp1-p10-e2e@test.com",
    "emp2-p10-e2e@test.com",
    "client-p10-e2e@test.com",
    "sales-p10-e2e@test.com",
  ];

  for (const email of testEmails) {
    const existingU = await prisma.user.findUnique({ where: { email } });
    if (existingU) {
      const emp = await prisma.employee.findUnique({ where: { userId: existingU.id } });
      if (emp) {
        await prisma.projectMembership.deleteMany({ where: { employeeId: emp.id } });
      }
      const client = await prisma.client.findFirst({ where: { email } });
      if (client) {
        const projIds = (await prisma.project.findMany({ where: { clientId: client.id }, select: { id: true } })).map((p) => p.id);
        await prisma.changeRequestItem.deleteMany({ where: { changeRequest: { projectId: { in: projIds } } } });
        await prisma.changeRequest.deleteMany({ where: { projectId: { in: projIds } } });
        await prisma.task.deleteMany({ where: { projectId: { in: projIds } } });
        await prisma.projectMembership.deleteMany({ where: { projectId: { in: projIds } } });
        await prisma.project.deleteMany({ where: { clientId: client.id } });
        await prisma.client.delete({ where: { id: client.id } });
      }
    }
  }

  // Setup Users
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner-p10-e2e@test.com" },
    update: { passwordHash: passHash, activeRole: "OWNER", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "owner-p10-e2e@test.com",
      passwordHash: passHash,
      name: "Owner Admin",
      designation: "Managing Director",
      department: "Management",
      activeRole: "OWNER",
      termsAcceptedVersion: "v1.0",
    },
  });

  const emp1User = await prisma.user.upsert({
    where: { email: "emp1-p10-e2e@test.com" },
    update: { passwordHash: passHash, activeRole: "EMPLOYEE", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "emp1-p10-e2e@test.com",
      passwordHash: passHash,
      name: "Aarav Sharma",
      designation: "Senior Dev",
      department: "Eng",
      activeRole: "EMPLOYEE",
      termsAcceptedVersion: "v1.0",
    },
  });

  const emp1Profile = await prisma.employee.upsert({
    where: { userId: emp1User.id },
    update: { salaryMonthly: 60000 },
    create: {
      userId: emp1User.id,
      employeeIdCode: `EMP-E2E-1-${Date.now()}`,
      salaryMonthly: 60000,
      status: "ACTIVE",
    },
  });

  const emp2User = await prisma.user.upsert({
    where: { email: "emp2-p10-e2e@test.com" },
    update: { passwordHash: passHash, activeRole: "EMPLOYEE", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "emp2-p10-e2e@test.com",
      passwordHash: passHash,
      name: "Priya Patel",
      designation: "UI/UX Designer",
      department: "Design",
      activeRole: "EMPLOYEE",
      termsAcceptedVersion: "v1.0",
    },
  });

  const emp2Profile = await prisma.employee.upsert({
    where: { userId: emp2User.id },
    update: { salaryMonthly: 45000 },
    create: {
      userId: emp2User.id,
      employeeIdCode: `EMP-E2E-2-${Date.now()}`,
      salaryMonthly: 45000,
      status: "ACTIVE",
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client-p10-e2e@test.com" },
    update: { passwordHash: passHash, activeRole: "CLIENT", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "client-p10-e2e@test.com",
      passwordHash: passHash,
      name: "Titan Global",
      designation: "Director",
      department: "Client",
      activeRole: "CLIENT",
      termsAcceptedVersion: "v1.0",
    },
  });

  const clientCompany = await prisma.client.create({
    data: {
      clientNumber: `CLI-P10-E2E-${Date.now()}`,
      companyName: "Titan Industries",
      phone: "+91 97777 66666",
      email: clientUser.email,
      createdById: ownerUser.id,
    },
  });

  await prisma.clientContact.create({
    data: {
      clientId: clientCompany.id,
      name: "Titan Director",
      email: clientUser.email,
      phone: "+91 97777 66666",
      designation: "Director",
      isPrimary: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: "v1.0",
    },
  });

  // Setup Projects
  const proj1 = await prisma.project.create({
    data: {
      projectNumber: `PRJ-E2E-1-${Date.now()}`,
      name: "Titan Mandap Platform",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
      contractValue: 150000,
      targetDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      projectNumber: `PRJ-E2E-2-${Date.now()}`,
      name: "Titan Mobile Portal",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
      contractValue: 80000,
      targetDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Project overdue
    },
  });

  // Assign Project Compensation
  await prisma.projectMembership.create({
    data: {
      projectId: proj1.id,
      employeeId: emp1Profile.id,
      roleInProject: "Backend Lead",
      assignedById: ownerUser.id,
      compensationAmount: 25000,
      isActive: true,
    },
  });

  await prisma.projectMembership.create({
    data: {
      projectId: proj2.id,
      employeeId: emp1Profile.id,
      roleInProject: "Consultant",
      assignedById: ownerUser.id,
      compensationAmount: 10000,
      isActive: true,
    },
  });

  await prisma.projectMembership.create({
    data: {
      projectId: proj1.id,
      employeeId: emp2Profile.id,
      roleInProject: "Lead Designer",
      assignedById: ownerUser.id,
      compensationAmount: 18000,
      isActive: true,
    },
  });

  // Tasks for Employee 1 (Emp 1 is ON_TRACK on proj1, but has an overdue task on proj2)
  await prisma.task.create({
    data: {
      projectId: proj1.id,
      title: "API Architecture",
      createdById: ownerUser.id,
      assignedToId: emp1User.id,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Deadline in future
    },
  });

  await prisma.task.create({
    data: {
      projectId: proj2.id,
      title: "Legacy Synchronization",
      createdById: ownerUser.id,
      assignedToId: emp1User.id,
      status: "IN_PROGRESS",
      deadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Overdue by 4 days
    },
  });

  // Cookies & Logins
  const ownerJar = new TestCookieJar();
  await loginUser(ownerUser.email, testPass, ownerJar);

  const emp1Jar = new TestCookieJar();
  await loginUser(emp1User.email, testPass, emp1Jar);

  const clientJar = new TestCookieJar();
  await loginUser(clientUser.email, testPass, clientJar);

  // -------------------------------------------------------------------
  // SYSTEM A VERIFICATION: Employee Self-Service Finance
  // -------------------------------------------------------------------
  console.log("\n--- PHASE 10 SYSTEM A VERIFICATION ---");
  const finRes = await fetch(`${BASE_URL}/api/employee/finance`, {
    headers: { cookie: emp1Jar.getCookieString() },
  });
  const finJson = await finRes.json();
  assert(finRes.ok && finJson.success, "EMPLOYEE 1 accessed finance page data");
  assert(finJson.summary.totalAssignedCompensation === 35000, "Employee 1 total assigned compensation = ₹35,000 (25k + 10k)");
  assert(finJson.salaryMonthly === undefined, "Confidential legacy salary hidden from API");

  // -------------------------------------------------------------------
  // SYSTEM B VERIFICATION: Employee Delivery Performance Engine
  // -------------------------------------------------------------------
  console.log("\n--- PHASE 10 SYSTEM B VERIFICATION ---");
  const delProj1 = await getEmployeeProjectDeliveryStatus(proj1.id, emp1User.id);
  assert(delProj1.status === "COMPLETED_EARLY" || delProj1.status === "ON_TRACK", `Emp 1 on Proj 1 is ON TRACK (${delProj1.label})`);
  assert(delProj1.color === "green", "Emp 1 delivery on Proj 1 is GREEN");

  const delProj2 = await getEmployeeProjectDeliveryStatus(proj2.id, emp1User.id);
  assert(delProj2.status === "DELAYED", `Emp 1 on Proj 2 is DELAYED due to task overdue (${delProj2.label})`);
  assert(delProj2.color === "red", "Emp 1 delivery on Proj 2 is RED");

  const delEmp2Proj1 = await getEmployeeProjectDeliveryStatus(proj1.id, emp2User.id);
  assert(delEmp2Proj1.status === "ON_TRACK", "Emp 2 (no tasks assigned) falls back to Proj 1 deadline (ON_TRACK)");
  assert(delEmp2Proj1.color === "green", "Emp 2 delivery color is GREEN");

  // -------------------------------------------------------------------
  // SYSTEM C VERIFICATION: Change Requests & Idempotent Budget Approval
  // -------------------------------------------------------------------
  console.log("\n--- PHASE 10 SYSTEM C VERIFICATION ---");
  for (let i = 1; i <= 3; i++) {
    const crRes = await fetch(`${BASE_URL}/api/client/projects/${proj1.id}/change-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: clientJar.getCookieString() },
      body: JSON.stringify({
        title: `CR #${i} Feature`,
        description: `Change description ${i}`,
        items: [{ title: `Item ${i}` }],
      }),
    });
    const crJson = await crRes.json();
    assert(crRes.ok && crJson.success, `Submitted CR #${i} response OK: ${JSON.stringify(crJson)}`);
    assert(crJson.changeRequest.requestSeqInt === i, `CR #${i} sequence verified`);
    assert(crJson.changeRequest.isQuotaIncluded === true, `CR #${i} included in quota`);
  }

  // Request #4: Beyond Quota -> Budget Increase Required
  const cr4Res = await fetch(`${BASE_URL}/api/client/projects/${proj1.id}/change-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: clientJar.getCookieString() },
    body: JSON.stringify({
      title: "CR #4 Major Expansion",
      description: "Additional module requiring budget approval",
      items: [{ title: "Expansion Module A" }, { title: "Expansion Module B" }],
    }),
  });
  const cr4Json = await cr4Res.json();
  assert(cr4Json.changeRequest.requestSeqInt === 4, "CR #4 sequence derived as 4");
  assert(cr4Json.changeRequest.isQuotaIncluded === false, "CR #4 isQuotaIncluded = false");
  assert(cr4Json.changeRequest.budgetIncreaseRequired === true, "CR #4 budgetIncreaseRequired = true");
  assert(cr4Json.changeRequest.status === "PENDING_BUDGET_APPROVAL", "CR #4 status PENDING_BUDGET_APPROVAL");

  const cr4Id = cr4Json.changeRequest.id;

  // OWNER Approves Budget
  const appRes = await fetch(`${BASE_URL}/api/admin/projects/${proj1.id}/change-requests/${cr4Id}/approve-budget`, {
    method: "POST",
    headers: { cookie: ownerJar.getCookieString() },
  });
  const appJson = await appRes.json();
  assert(appRes.ok && appJson.success, "OWNER approved CR #4 budget increase");
  assert(appJson.contractValue === 155000, "Project contractValue increased from ₹150,000 to ₹155,000");

  // Idempotency check: Repeated click
  const repeatAppRes = await fetch(`${BASE_URL}/api/admin/projects/${proj1.id}/change-requests/${cr4Id}/approve-budget`, {
    method: "POST",
    headers: { cookie: ownerJar.getCookieString() },
  });
  const repeatAppJson = await repeatAppRes.json();
  assert(repeatAppJson.alreadyApproved === true, "Repeated approval correctly returns alreadyApproved = true");
  assert(repeatAppJson.contractValue === 155000, "Contract value strictly kept at ₹155,000 (no double-counting)");

  // -------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------
  console.log("\n--- Cleaning up Test Fixtures ---");
  await prisma.activityEvent.deleteMany({ where: { actorId: ownerUser.id } });
  await prisma.changeRequestItem.deleteMany({ where: { changeRequest: { projectId: { in: [proj1.id, proj2.id] } } } });
  await prisma.changeRequest.deleteMany({ where: { projectId: { in: [proj1.id, proj2.id] } } });
  await prisma.task.deleteMany({ where: { projectId: { in: [proj1.id, proj2.id] } } });
  await prisma.projectMembership.deleteMany({ where: { projectId: { in: [proj1.id, proj2.id] } } });
  await prisma.project.deleteMany({ where: { id: { in: [proj1.id, proj2.id] } } });
  await prisma.clientContact.deleteMany({ where: { clientId: clientCompany.id } });
  await prisma.client.delete({ where: { id: clientCompany.id } });
  await prisma.employee.deleteMany({ where: { id: { in: [emp1Profile.id, emp2Profile.id] } } });
  for (const uId of [ownerUser.id, emp1User.id, emp2User.id, clientUser.id]) {
    await prisma.user.delete({ where: { id: uId } }).catch(() => {});
  }
  console.log("Cleanup complete.\n");

  console.log("=================================================================");
  console.log("  🟢 MASTER E2E ACCEPTANCE TEST SUITE PASSED 100% 🟢");
  console.log("=================================================================\n");
}

runMasterE2EAcceptance().catch((e) => {
  console.error("Master E2E Acceptance Test execution error:", e);
  process.exit(1);
});
