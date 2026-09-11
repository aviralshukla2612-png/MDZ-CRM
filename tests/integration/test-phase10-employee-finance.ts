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

async function runEmployeeFinanceTests() {
  console.log("\n=================================================================");
  console.log("  MDZ OS Phase 10 System A: Employee Self-Service Finance Test");
  console.log("=================================================================\n");

  const bcrypt = require("bcryptjs");
  const passHash = await bcrypt.hash("password123", 10);
  const testPass = "password123";

  // Clean up any existing leftover test fixtures
  const existingEmpUser = await prisma.user.findUnique({ where: { email: "emp-p10-fin@test.com" } });
  if (existingEmpUser) {
    const existingProfile = await prisma.employee.findUnique({ where: { userId: existingEmpUser.id } });
    if (existingProfile) {
      await prisma.projectMembership.deleteMany({ where: { employeeId: existingProfile.id } });
    }
  }

  // Setup Test Data
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner-p10-fin@test.com" },
    update: { passwordHash: passHash, activeRole: "OWNER", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "owner-p10-fin@test.com",
      passwordHash: passHash,
      name: "Owner Admin",
      designation: "Managing Director",
      department: "Management",
      activeRole: "OWNER",
      termsAcceptedVersion: "v1.0",
    },
  });

  const empUser = await prisma.user.upsert({
    where: { email: "emp-p10-fin@test.com" },
    update: { passwordHash: passHash, activeRole: "EMPLOYEE", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "emp-p10-fin@test.com",
      passwordHash: passHash,
      name: "Rohan Varma",
      designation: "Frontend Engineer",
      department: "Engineering",
      activeRole: "EMPLOYEE",
      termsAcceptedVersion: "v1.0",
    },
  });

  const empProfile = await prisma.employee.upsert({
    where: { userId: empUser.id },
    update: { salaryMonthly: 55000 },
    create: {
      userId: empUser.id,
      employeeIdCode: `EMP-P10-FIN-${Date.now()}`,
      salaryMonthly: 55000,
      status: "ACTIVE",
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: "sales-p10-fin@test.com" },
    update: { passwordHash: passHash, activeRole: "SALES", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "sales-p10-fin@test.com",
      passwordHash: passHash,
      name: "Sales Executive",
      designation: "Sales Rep",
      department: "Sales",
      activeRole: "SALES",
      termsAcceptedVersion: "v1.0",
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client-p10-fin@test.com" },
    update: { passwordHash: passHash, activeRole: "CLIENT", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "client-p10-fin@test.com",
      passwordHash: passHash,
      name: "Client Account",
      designation: "Director",
      department: "Client",
      activeRole: "CLIENT",
      termsAcceptedVersion: "v1.0",
    },
  });

  const clientCompany = await prisma.client.create({
    data: {
      clientNumber: `CLI-P10-FIN-${Date.now()}`,
      companyName: "Zenith Corp",
      phone: "+91 98989 00000",
      email: "zenith@test.com",
      createdById: ownerUser.id,
    },
  });

  const proj1 = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P10-F1-${Date.now()}`,
      name: "Alpha Portal",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P10-F2-${Date.now()}`,
      name: "Beta Mobile App",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
    },
  });

  const mem1 = await prisma.projectMembership.create({
    data: {
      projectId: proj1.id,
      employeeId: empProfile.id,
      roleInProject: "Lead Frontend",
      assignedById: ownerUser.id,
      compensationAmount: 20000,
      isActive: true,
    },
  });

  const mem2 = await prisma.projectMembership.create({
    data: {
      projectId: proj2.id,
      employeeId: empProfile.id,
      roleInProject: "UI Engineer",
      assignedById: ownerUser.id,
      compensationAmount: 12500,
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
  // TEST 1: EMPLOYEE Views Own Finance (/api/employee/finance)
  // -------------------------------------------------------------------
  console.log("\n--- Test 1: EMPLOYEE Self-Service Finance Endpoint ---");
  let res = await fetch(`${BASE_URL}/api/employee/finance`, {
    headers: { cookie: empJar.getCookieString() },
  });
  let json = await res.json();
  assert(res.ok && json.success, "EMPLOYEE fetched own project finance successfully (200 OK)");
  assert(json.summary.totalAssignedCompensation === 32500, "Total Assigned Project Compensation equals ₹32,500");
  assert(json.projects.length === 2, "Employee sees 2 active assigned projects");
  assert(json.projects[0].compensationAmount === 20000, "First project compensation is 20000");

  // -------------------------------------------------------------------
  // TEST 2: Confidentiality Isolation (No Legacy Salary / Company Finance)
  // -------------------------------------------------------------------
  console.log("\n--- Test 2: Confidentiality & Data Isolation ---");
  assert(json.salaryMonthly === undefined, "Legacy Employee.salaryMonthly is hidden from employee finance API");
  assert(json.companyPayroll === undefined, "Company-wide payroll is hidden from employee finance API");

  // -------------------------------------------------------------------
  // TEST 3: RBAC Security Boundaries
  // -------------------------------------------------------------------
  console.log("\n--- Test 3: RBAC Security Boundaries ---");
  res = await fetch(`${BASE_URL}/api/employee/finance`, {
    headers: { cookie: salesJar.getCookieString() },
  });
  assert(res.status === 403, "SALES role attempt returns 403 Forbidden");

  res = await fetch(`${BASE_URL}/api/employee/finance`, {
    headers: { cookie: clientJar.getCookieString() },
  });
  assert(res.status === 403, "CLIENT role attempt returns 403 Forbidden");

  res = await fetch(`${BASE_URL}/api/employee/finance`);
  assert(res.status === 401, "ANONYMOUS attempt returns 401 Unauthorized");

  // -------------------------------------------------------------------
  // TEST 4: Legacy Salary Field Unmodified
  // -------------------------------------------------------------------
  console.log("\n--- Test 4: Legacy Employee Salary Coexistence ---");
  const dbEmp = await prisma.employee.findUnique({ where: { id: empProfile.id } });
  assert(dbEmp?.salaryMonthly === 55000, "Employee.salaryMonthly remains untouched at 55000");

  // -------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------
  console.log("\n--- Cleaning up Test Fixtures ---");
  await prisma.activityEvent.deleteMany({ where: { actorId: ownerUser.id } });
  await prisma.projectMembership.deleteMany({ where: { employeeId: empProfile.id } });
  await prisma.project.deleteMany({ where: { id: { in: [proj1.id, proj2.id] } } });
  await prisma.client.delete({ where: { id: clientCompany.id } });
  await prisma.employee.delete({ where: { id: empProfile.id } });
  console.log("Cleanup complete.\n");

  console.log("🟢 SYSTEM A: EMPLOYEE SELF-SERVICE FINANCE SUITE PASSED 🟢\n");
}

runEmployeeFinanceTests().catch((e) => {
  console.error("Employee Finance Test execution error:", e);
  process.exit(1);
});
