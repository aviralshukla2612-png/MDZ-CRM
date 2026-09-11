import { PrismaClient } from "@prisma/client";

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

async function runPhase9Tests() {
  console.log("\n=================================================================");
  console.log("  MDZ OS Phase 9 Admin-Controlled Project Compensation Suite");
  console.log("=================================================================\n");

  const bcrypt = require("bcryptjs");
  const passHash = await bcrypt.hash("password123", 10);
  const testPass = "password123";

  // Clean up any existing leftover test fixtures from prior aborted runs
  const existingEmpUser = await prisma.user.findUnique({ where: { email: "karan-p9@test.com" } });
  if (existingEmpUser) {
    const existingProfile = await prisma.employee.findUnique({ where: { userId: existingEmpUser.id } });
    if (existingProfile) {
      await prisma.projectMembership.deleteMany({ where: { employeeId: existingProfile.id } });
    }
  }
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner-p9@test.com" },
    update: { passwordHash: passHash, activeRole: "OWNER", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "owner-p9@test.com",
      passwordHash: passHash,
      name: "Owner Admin",
      designation: "Managing Director",
      department: "Management",
      activeRole: "OWNER",
      termsAcceptedVersion: "v1.0",
    },
  });

  const empUser = await prisma.user.upsert({
    where: { email: "karan-p9@test.com" },
    update: { passwordHash: passHash, activeRole: "EMPLOYEE", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "karan-p9@test.com",
      passwordHash: passHash,
      name: "Karan Shukla",
      designation: "Frontend Developer",
      department: "Engineering",
      activeRole: "EMPLOYEE",
      termsAcceptedVersion: "v1.0",
    },
  });

  const empProfile = await prisma.employee.upsert({
    where: { userId: empUser.id },
    update: { salaryMonthly: 45000 },
    create: {
      userId: empUser.id,
      employeeIdCode: `EMP-P9-${Date.now()}`,
      salaryMonthly: 45000,
      status: "ACTIVE",
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: "sales-p9@test.com" },
    update: { passwordHash: passHash, activeRole: "SALES", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "sales-p9@test.com",
      passwordHash: passHash,
      name: "Sales Rep",
      designation: "Sales Executive",
      department: "Sales",
      activeRole: "SALES",
      termsAcceptedVersion: "v1.0",
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client-p9@test.com" },
    update: { passwordHash: passHash, activeRole: "CLIENT", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "client-p9@test.com",
      passwordHash: passHash,
      name: "Client Representative",
      designation: "Client Director",
      department: "Client",
      activeRole: "CLIENT",
      termsAcceptedVersion: "v1.0",
    },
  });

  const clientCompany = await prisma.client.create({
    data: {
      clientNumber: `CLI-P9-${Date.now()}`,
      companyName: "Acme Enterprises",
      phone: "+91 99999 00000",
      email: "acme@test.com",
      createdById: ownerUser.id,
    },
  });

  // Create Projects A, B, C
  const projA = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P9-A-${Date.now()}`,
      name: "MANDAP Website",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
    },
  });

  const projB = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P9-B-${Date.now()}`,
      name: "CRM Development",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
    },
  });

  const projC = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P9-C-${Date.now()}`,
      name: "Portfolio Website",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
    },
  });

  const projUnassigned = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P9-U-${Date.now()}`,
      name: "Unassigned Secret Project",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
    },
  });

  // Assign Karan to Proj A, B, C
  const memA = await prisma.projectMembership.create({
    data: {
      projectId: projA.id,
      employeeId: empProfile.id,
      roleInProject: "Frontend Developer",
      assignedById: ownerUser.id,
      isActive: true,
    },
  });

  const memB = await prisma.projectMembership.create({
    data: {
      projectId: projB.id,
      employeeId: empProfile.id,
      roleInProject: "Full Stack Developer",
      assignedById: ownerUser.id,
      isActive: true,
    },
  });

  const memC = await prisma.projectMembership.create({
    data: {
      projectId: projC.id,
      employeeId: empProfile.id,
      roleInProject: "Frontend Developer",
      assignedById: ownerUser.id,
      isActive: true,
    },
  });

  // Logins
  const ownerJar = new TestCookieJar();
  await loginUser(ownerUser.email, testPass, ownerJar);

  const empJar = new TestCookieJar();
  await loginUser(empUser.email, testPass, empJar);

  const salesJar = new TestCookieJar();
  await loginUser(salesUser.email, testPass, salesJar);

  const clientJar = new TestCookieJar();
  await loginUser(clientUser.email, testPass, clientJar);

  // -------------------------------------------------------------------
  // TEST 1: OWNER GET Assigned Projects & Compensation API
  // -------------------------------------------------------------------
  console.log("\n--- Test 1: OWNER Fetch Assigned Projects & Compensation ---");
  let res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects`, {
    headers: { cookie: ownerJar.getCookieString() },
  });
  let json = await res.json();
  console.log("DEBUG TEST 1 JSON:", JSON.stringify(json, null, 2));
  assert(res.ok && json.success, "OWNER fetched employee project compensation successfully (200 OK)");
  assert(json.projects.length === 3, "Employee has 3 active assigned projects");
  assert(json.totalAssignedCompensation === 0, "Initial configured compensation total is 0");

  // -------------------------------------------------------------------
  // TEST 2: OWNER Adds Compensation to Projects A, B, C
  // -------------------------------------------------------------------
  console.log("\n--- Test 2: OWNER Adds Custom Project Compensation ---");

  // MANDAP Website -> ₹15,000
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projA.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: ownerJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 15000 }),
  });
  json = await res.json();
  assert(res.ok && json.success, "OWNER set MANDAP Website compensation to ₹15,000 (200 OK)");
  assert(json.data.compensationAmount === 15000, "Compensation amount saved as 15000");

  // CRM Development -> ₹10,000
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projB.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: ownerJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 10000 }),
  });
  json = await res.json();
  assert(res.ok && json.success, "OWNER set CRM Development compensation to ₹10,000 (200 OK)");

  // Portfolio Website -> ₹7,500
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projC.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: ownerJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 7500 }),
  });
  json = await res.json();
  assert(res.ok && json.success, "OWNER set Portfolio Website compensation to ₹7,500 (200 OK)");

  // Verify Total Assigned Compensation
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects`, {
    headers: { cookie: ownerJar.getCookieString() },
  });
  json = await res.json();
  assert(json.totalAssignedCompensation === 32500, "Total Assigned Project Compensation equals ₹32,500");

  // -------------------------------------------------------------------
  // TEST 3: OWNER Updates Compensation (₹15,000 -> ₹18,000)
  // -------------------------------------------------------------------
  console.log("\n--- Test 3: OWNER Updates Project Compensation ---");
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projA.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: ownerJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 18000 }),
  });
  json = await res.json();
  assert(res.ok && json.success, "OWNER updated MANDAP Website compensation to ₹18,000 (200 OK)");

  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects`, {
    headers: { cookie: ownerJar.getCookieString() },
  });
  json = await res.json();
  assert(json.totalAssignedCompensation === 35500, "Updated Total Assigned Project Compensation equals ₹35,500");

  // -------------------------------------------------------------------
  // TEST 4: OWNER Resets Compensation to "Not Set" (amount = null)
  // -------------------------------------------------------------------
  console.log("\n--- Test 4: OWNER Clears Compensation (null -> Not Set) ---");
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projC.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: ownerJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: null }),
  });
  json = await res.json();
  assert(res.ok && json.success && json.data.compensationAmount === null, "OWNER cleared compensation for Portfolio Website (null)");

  // -------------------------------------------------------------------
  // TEST 5: Single Active Assignment & Unassigned Project Rejection
  // -------------------------------------------------------------------
  console.log("\n--- Test 5: Project Assignment Security Boundary ---");
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projUnassigned.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: ownerJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 20000 }),
  });
  assert(res.status === 403, "OWNER cannot add compensation for unassigned project (403 Forbidden)");

  // -------------------------------------------------------------------
  // TEST 6: Amount Validation Rules
  // -------------------------------------------------------------------
  console.log("\n--- Test 6: Monetary Amount Validation ---");
  // Negative amount
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projA.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: ownerJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: -5000 }),
  });
  assert(res.status === 400, "Negative amount -5000 rejected (400 Bad Request)");

  // Invalid String
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projA.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: ownerJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: "invalid-amount" }),
  });
  assert(res.status === 400, "String 'invalid-amount' rejected (400 Bad Request)");

  // -------------------------------------------------------------------
  // TEST 7: RBAC & IDOR Security Boundaries
  // -------------------------------------------------------------------
  console.log("\n--- Test 7: RBAC & IDOR Enforcement ---");
  // EMPLOYEE attempt
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projA.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: empJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 99999 }),
  });
  assert(res.status === 403, "EMPLOYEE attempt to modify compensation returns 403 Forbidden");

  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects`, {
    headers: { cookie: empJar.getCookieString() },
  });
  assert(res.status === 403, "EMPLOYEE attempt to view admin projects API returns 403 Forbidden");

  // SALES attempt
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projA.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: salesJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 99999 }),
  });
  assert(res.status === 403, "SALES attempt to modify compensation returns 403 Forbidden");

  // CLIENT attempt
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projA.id}/compensation`, {
    method: "PATCH",
    headers: { cookie: clientJar.getCookieString(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 99999 }),
  });
  assert(res.status === 403, "CLIENT attempt to modify compensation returns 403 Forbidden");

  // ANONYMOUS attempt
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects/${projA.id}/compensation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 99999 }),
  });
  assert(res.status === 401, "ANONYMOUS attempt returns 401 Unauthorized");

  // -------------------------------------------------------------------
  // TEST 8: Client API Data Projection Isolation
  // -------------------------------------------------------------------
  console.log("\n--- Test 8: Client API Data Isolation ---");
  res = await fetch(`${BASE_URL}/api/client/projects/${projA.id}`, {
    headers: { cookie: ownerJar.getCookieString() },
  });
  json = await res.json();
  assert(json.success, "Client project details fetched");
  assert(
    json.project.teamMembers.every(
      (m: any) =>
        m.compensationAmount === undefined &&
        m.salary === undefined &&
        m.cost === undefined
    ),
    "Client API projection explicitly omits all compensation/salary fields"
  );

  // -------------------------------------------------------------------
  // TEST 9: Employee Legacy Salary Field Coexistence
  // -------------------------------------------------------------------
  console.log("\n--- Test 9: Employee Legacy Salary Coexistence ---");
  const checkEmp = await prisma.employee.findUnique({
    where: { id: empProfile.id },
  });
  assert(checkEmp?.salaryMonthly === 45000, "Employee.salaryMonthly legacy field remains intact at 45000");

  // -------------------------------------------------------------------
  // TEST 10: Historical Data Preservation on Membership Inactivation
  // -------------------------------------------------------------------
  console.log("\n--- Test 10: Historical Compensation Data Preservation ---");
  // Deactivate Membership A
  await prisma.projectMembership.update({
    where: { id: memA.id },
    data: { isActive: false, removedAt: new Date() },
  });

  const checkMemA = await prisma.projectMembership.findUnique({
    where: { id: memA.id },
  });
  assert(checkMemA?.isActive === false, "Project membership deactivated");
  assert(checkMemA?.compensationAmount === 18000, "Historical compensationAmount (18000) preserved on inactive membership record");

  // OWNER GET should now only return active memberships (Projs B, C)
  res = await fetch(`${BASE_URL}/api/admin/employees/${empProfile.id}/projects`, {
    headers: { cookie: ownerJar.getCookieString() },
  });
  json = await res.json();
  assert(json.projects.length === 2, "Active projects endpoint returns only 2 active memberships");

  // -------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------
  console.log("\n--- Cleaning up Test Fixtures ---");
  await prisma.activityEvent.deleteMany({ where: { actorId: ownerUser.id } });
  await prisma.projectMembership.deleteMany({ where: { employeeId: empProfile.id } });
  await prisma.project.deleteMany({
    where: { id: { in: [projA.id, projB.id, projC.id, projUnassigned.id] } },
  });
  await prisma.client.delete({ where: { id: clientCompany.id } });
  await prisma.employee.delete({ where: { id: empProfile.id } });
  console.log("Cleanup complete.\n");

  console.log("🟢 PHASE 9 — PROJECT COMPENSATION INTEGRATION SUITE PASSED 🟢\n");
}

runPhase9Tests().catch((e) => {
  console.error("Phase 9 Test execution error:", e);
  process.exit(1);
});
