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

async function runChangeRequestTests() {
  console.log("\n=================================================================");
  console.log("  MDZ OS Phase 10 System C: Change Requests & Budget Control Suite");
  console.log("=================================================================\n");

  const bcrypt = require("bcryptjs");
  const passHash = await bcrypt.hash("password123", 10);
  const testPass = "password123";

  // Clean up any existing leftover test fixtures
  const existingClientUser = await prisma.user.findUnique({ where: { email: "client-p10-cr@test.com" } });
  if (existingClientUser) {
    const existingClients = await prisma.client.findMany({ where: { email: existingClientUser.email } });
    for (const c of existingClients) {
      const projIds = (await prisma.project.findMany({ where: { clientId: c.id }, select: { id: true } })).map(p => p.id);
      await prisma.changeRequestItem.deleteMany({ where: { changeRequest: { projectId: { in: projIds } } } });
      await prisma.changeRequest.deleteMany({ where: { projectId: { in: projIds } } });
      await prisma.project.deleteMany({ where: { clientId: c.id } });
      await prisma.client.delete({ where: { id: c.id } });
    }
  }

  // Setup Test Data
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner-p10-cr@test.com" },
    update: { passwordHash: passHash, activeRole: "OWNER", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "owner-p10-cr@test.com",
      passwordHash: passHash,
      name: "Owner Admin",
      designation: "MD",
      department: "Management",
      activeRole: "OWNER",
      termsAcceptedVersion: "v1.0",
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client-p10-cr@test.com" },
    update: { passwordHash: passHash, activeRole: "CLIENT", isActive: true, termsAcceptedVersion: "v1.0" },
    create: {
      email: "client-p10-cr@test.com",
      passwordHash: passHash,
      name: "Acme Client",
      designation: "CEO",
      department: "Client",
      activeRole: "CLIENT",
      termsAcceptedVersion: "v1.0",
    },
  });

  const clientCompany = await prisma.client.create({
    data: {
      clientNumber: `CLI-P10-CR-${Date.now()}`,
      companyName: "Acme Industries",
      phone: "+91 99999 88888",
      email: clientUser.email,
      createdById: ownerUser.id,
    },
  });

  const initialContractValue = 100000;
  const project = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P10-CR-${Date.now()}`,
      name: "Acme ERP System",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
      contractValue: initialContractValue,
    },
  });

  // Ensure system setting for additional fee is set
  await prisma.systemSetting.upsert({
    where: { key: "additionalChangeRequestFee" },
    update: { value: "5000" },
    create: {
      key: "additionalChangeRequestFee",
      value: "5000",
    },
  });

  const ownerJar = new TestCookieJar();
  await loginUser(ownerUser.email, testPass, ownerJar);

  const clientJar = new TestCookieJar();
  await loginUser(clientUser.email, testPass, clientJar);

  // -------------------------------------------------------------------
  // TEST 1: Submit Requests 1, 2, 3 (Quota Included)
  // -------------------------------------------------------------------
  console.log("\n--- Test 1: Included Quota Change Requests (Requests #1..#3) ---");
  for (let i = 1; i <= 3; i++) {
    const res = await fetch(`${BASE_URL}/api/client/projects/${project.id}/change-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: clientJar.getCookieString(),
      },
      body: JSON.stringify({
        title: `Change Request #${i}`,
        description: `Description for request ${i}`,
        items: [
          { title: `Item ${i}.A`, description: "Sub-task A" },
          { title: `Item ${i}.B`, description: "Sub-task B" },
        ],
      }),
    });

    const json = await res.json();
    assert(res.ok && json.success, `Submitted Request #${i} successfully`);
    assert(json.changeRequest.requestSeqInt === i, `Server derived sequence number #${i}`);
    assert(json.changeRequest.isQuotaIncluded === true, `Request #${i} has isQuotaIncluded = true`);
    assert(json.changeRequest.budgetIncreaseRequired === false, `Request #${i} has budgetIncreaseRequired = false`);
    assert(json.changeRequest.status === "SUBMITTED", `Request #${i} status is SUBMITTED`);
    assert(json.changeRequest.items.length === 2, `Request #${i} contains 2 ChangeRequestItems`);
  }

  // -------------------------------------------------------------------
  // TEST 2: Submit Request #4 (Quota Exceeded -> Pending Budget Approval)
  // -------------------------------------------------------------------
  console.log("\n--- Test 2: Fourth Request Beyond Quota (Request #4) ---");
  const resReq4 = await fetch(`${BASE_URL}/api/client/projects/${project.id}/change-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: clientJar.getCookieString(),
    },
    body: JSON.stringify({
      title: "Request #4 - Extra Analytics",
      description: "Additional module beyond quota",
      // Client attempts malicious client override
      requestSeqInt: 1,
      isQuotaIncluded: true,
      budgetIncreaseRequired: false,
      costImpactAmount: 0,
      items: [{ title: "Analytics Engine", description: "Build custom charts" }],
    }),
  });

  const jsonReq4 = await resReq4.json();
  assert(resReq4.ok && jsonReq4.success, "Request #4 submitted successfully");
  assert(jsonReq4.changeRequest.requestSeqInt === 4, "Server forced sequence number to 4 (ignored client payload)");
  assert(jsonReq4.changeRequest.isQuotaIncluded === false, "Server set isQuotaIncluded = false");
  assert(jsonReq4.changeRequest.budgetIncreaseRequired === true, "Server set budgetIncreaseRequired = true");
  assert(jsonReq4.changeRequest.costImpactAmount === 5000, "Server computed fee of ₹5,000 from SystemSetting");
  assert(jsonReq4.changeRequest.status === "PENDING_BUDGET_APPROVAL", "Status set to PENDING_BUDGET_APPROVAL");

  const req4Id = jsonReq4.changeRequest.id;

  // -------------------------------------------------------------------
  // TEST 3: OWNER Budget Approval (Transactional Budget Increase)
  // -------------------------------------------------------------------
  console.log("\n--- Test 3: OWNER Transactional Budget Approval ---");
  const resApprove = await fetch(`${BASE_URL}/api/admin/projects/${project.id}/change-requests/${req4Id}/approve-budget`, {
    method: "POST",
    headers: { cookie: ownerJar.getCookieString() },
  });

  const jsonApprove = await resApprove.json();
  assert(resApprove.ok && jsonApprove.success, "OWNER approved budget increase for Request #4");
  assert(jsonApprove.contractValue === 105000, "Project contractValue increased from ₹100,000 to ₹105,000");

  const updatedProjDb = await prisma.project.findUnique({ where: { id: project.id } });
  assert(updatedProjDb?.contractValue === 105000, "Database verified: contractValue is ₹105,000");

  const req4Db = await prisma.changeRequest.findUnique({ where: { id: req4Id } });
  assert(req4Db?.status === "APPROVED", "Database verified: ChangeRequest status is APPROVED");

  // -------------------------------------------------------------------
  // TEST 4: Approval Idempotency Test
  // -------------------------------------------------------------------
  console.log("\n--- Test 4: Idempotency of Budget Approval ---");
  const resApproveRepeat = await fetch(`${BASE_URL}/api/admin/projects/${project.id}/change-requests/${req4Id}/approve-budget`, {
    method: "POST",
    headers: { cookie: ownerJar.getCookieString() },
  });

  const jsonApproveRepeat = await resApproveRepeat.json();
  assert(resApproveRepeat.ok, "Repeated approval call returns 200 OK");
  assert(jsonApproveRepeat.alreadyApproved === true, "Response signals request was already approved");

  const recheckProjDb = await prisma.project.findUnique({ where: { id: project.id } });
  assert(recheckProjDb?.contractValue === 105000, "Contract value strictly maintained at ₹105,000 (NOT ₹110,000)");

  // -------------------------------------------------------------------
  // TEST 5: Security & Authorization (Non-Owner cannot approve)
  // -------------------------------------------------------------------
  console.log("\n--- Test 5: Authorization Security Boundary ---");
  const resClientApprove = await fetch(`${BASE_URL}/api/admin/projects/${project.id}/change-requests/${req4Id}/approve-budget`, {
    method: "POST",
    headers: { cookie: clientJar.getCookieString() },
  });
  assert(resClientApprove.status === 403, "CLIENT role approval attempt returns 403 Forbidden");

  // -------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------
  console.log("\n--- Cleaning up Test Fixtures ---");
  await prisma.activityEvent.deleteMany({ where: { actorId: ownerUser.id } });
  await prisma.changeRequestItem.deleteMany({ where: { changeRequest: { projectId: project.id } } });
  await prisma.changeRequest.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });
  await prisma.client.delete({ where: { id: clientCompany.id } });
  for (const uId of [ownerUser.id, clientUser.id]) {
    await prisma.user.delete({ where: { id: uId } }).catch(() => {});
  }
  console.log("Cleanup complete.\n");

  console.log("🟢 SYSTEM C: CHANGE REQUESTS & BUDGET CONTROL SUITE PASSED 🟢\n");
}

runChangeRequestTests().catch((e) => {
  console.error("Change Request Test execution error:", e);
  process.exit(1);
});
