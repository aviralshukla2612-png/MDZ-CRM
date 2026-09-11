import { PrismaClient } from "@prisma/client";
import { getEmployeeProjectDeliveryStatus } from "../../src/lib/deliveryEngine";

const prisma = new PrismaClient();

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runDeliveryPerformanceTests() {
  console.log("\n=================================================================");
  console.log("  MDZ OS Phase 10 System B: Delivery Performance Suite");
  console.log("=================================================================\n");

  const bcrypt = require("bcryptjs");
  const passHash = await bcrypt.hash("password123", 10);

  // Setup Test Users
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner-p10-del@test.com" },
    update: { activeRole: "OWNER" },
    create: {
      email: "owner-p10-del@test.com",
      passwordHash: passHash,
      name: "Owner Admin",
      designation: "MD",
      department: "Management",
      activeRole: "OWNER",
    },
  });

  const empAUser = await prisma.user.upsert({
    where: { email: "empA-p10-del@test.com" },
    update: { activeRole: "EMPLOYEE" },
    create: {
      email: "empA-p10-del@test.com",
      passwordHash: passHash,
      name: "Employee A (On Time)",
      designation: "Developer",
      department: "Eng",
      activeRole: "EMPLOYEE",
    },
  });

  const empBUser = await prisma.user.upsert({
    where: { email: "empB-p10-del@test.com" },
    update: { activeRole: "EMPLOYEE" },
    create: {
      email: "empB-p10-del@test.com",
      passwordHash: passHash,
      name: "Employee B (Delayed)",
      designation: "Developer",
      department: "Eng",
      activeRole: "EMPLOYEE",
    },
  });

  const clientCompany = await prisma.client.create({
    data: {
      clientNumber: `CLI-P10-DEL-${Date.now()}`,
      companyName: "Nexus Systems",
      phone: "+91 98989 11111",
      email: "nexus@test.com",
      createdById: ownerUser.id,
    },
  });

  const project = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P10-DEL-${Date.now()}`,
      name: "Delta Platform",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
      targetDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
    },
  });

  // Task for Employee A: Completed on time
  const taskA = await prisma.task.create({
    data: {
      projectId: project.id,
      title: "UI Design Module",
      createdById: ownerUser.id,
      assignedToId: empAUser.id,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Task for Employee B: Overdue active task
  const taskB = await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Backend API Auth",
      createdById: ownerUser.id,
      assignedToId: empBUser.id,
      status: "IN_PROGRESS",
      deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago overdue
    },
  });

  // -------------------------------------------------------------------
  // TEST 1: Task-First Employee Isolation (Emp A ON_TRACK, Emp B DELAYED)
  // -------------------------------------------------------------------
  console.log("\n--- Test 1: Task-First Employee Isolation ---");
  const resA = await getEmployeeProjectDeliveryStatus(project.id, empAUser.id);
  assert(resA.status === "COMPLETED_EARLY" || resA.status === "ON_TRACK", `Employee A status is '${resA.status}' (${resA.label})`);
  assert(resA.color === "green", "Employee A delivery color is GREEN");

  const resB = await getEmployeeProjectDeliveryStatus(project.id, empBUser.id);
  assert(resB.status === "DELAYED", `Employee B status is 'DELAYED' (${resB.label})`);
  assert(resB.color === "red", "Employee B delivery color is RED");
  assert(resB.daysOverdue! >= 3, `Employee B days overdue calculated as ${resB.daysOverdue} days (expected >= 3)`);

  // -------------------------------------------------------------------
  // TEST 2: Fallback to Project Deadline when Employee has no tasks
  // -------------------------------------------------------------------
  console.log("\n--- Test 2: Fallback to Project Target Deadline ---");
  const empCUser = await prisma.user.create({
    data: {
      email: `empC-p10-del-${Date.now()}@test.com`,
      passwordHash: passHash,
      name: "Employee C (No Tasks)",
      designation: "QA",
      department: "QA",
      activeRole: "EMPLOYEE",
    },
  });

  const resC = await getEmployeeProjectDeliveryStatus(project.id, empCUser.id);
  assert(resC.status === "ON_TRACK", `Employee C (no assigned tasks) falls back to project target deadline: ${resC.status}`);
  assert(resC.color === "green", "Employee C delivery color is GREEN");

  // -------------------------------------------------------------------
  // TEST 3: No Deadline Fallback
  // -------------------------------------------------------------------
  console.log("\n--- Test 3: No Deadline Handling ---");
  const projNoDeadline = await prisma.project.create({
    data: {
      projectNumber: `PRJ-P10-NODEL-${Date.now()}`,
      name: "No Deadline Project",
      clientId: clientCompany.id,
      createdById: ownerUser.id,
      status: "IN_PROGRESS",
      targetDeadline: null,
    },
  });

  const resNoDel = await getEmployeeProjectDeliveryStatus(projNoDeadline.id, empCUser.id);
  assert(resNoDel.status === "NO_DEADLINE", "Project without deadlines returns 'NO_DEADLINE'");
  assert(resNoDel.label === "Deadline not set", "Label displays 'Deadline not set'");

  // -------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------
  console.log("\n--- Cleaning up Test Fixtures ---");
  await prisma.task.deleteMany({ where: { projectId: { in: [project.id, projNoDeadline.id] } } });
  await prisma.project.deleteMany({ where: { id: { in: [project.id, projNoDeadline.id] } } });
  await prisma.client.delete({ where: { id: clientCompany.id } });
  await prisma.activityEvent.deleteMany({ where: { actorId: ownerUser.id } });
  for (const uId of [ownerUser.id, empAUser.id, empBUser.id, empCUser.id]) {
    await prisma.user.delete({ where: { id: uId } }).catch(() => {});
  }
  console.log("Cleanup complete.\n");

  console.log("🟢 SYSTEM B: DELIVERY PERFORMANCE SUITE PASSED 🟢\n");
}

runDeliveryPerformanceTests().catch((e) => {
  console.error("Delivery Performance Test execution error:", e);
  process.exit(1);
});
