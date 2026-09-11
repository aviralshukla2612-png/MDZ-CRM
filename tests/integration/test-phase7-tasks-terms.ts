import { PrismaClient } from "@prisma/client";
import { recalculateProjectProgress } from "../../src/lib/progressEngine";
import { getPublishedTerms, checkUserTermsStatus } from "../../src/lib/termsEngine";

const prisma = new PrismaClient();

async function runPhase7Tests() {
  console.log("=================================================");
  console.log("   MDZ OS Phase 7 Integration & Security Tests");
  console.log("=================================================\n");

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
    // Setup Test Data
    const ownerUser = await prisma.user.findFirst({ where: { activeRole: "OWNER" } });
    if (!ownerUser) {
      console.error("Test setup error: OWNER user not found in DB");
      process.exit(1);
    }

    // Create Test Client
    const testClient = await prisma.client.create({
      data: {
        clientNumber: `CLT-TST-${Date.now()}`,
        companyName: "Phase 7 Test Corp",
        phone: "+91 99999 88888",
        email: `phase7-client-${Date.now()}@test.com`,
        createdById: ownerUser.id,
      },
    });

    // Create Test Project A
    const testProjectA = await prisma.project.create({
      data: {
        projectNumber: `PRJ-TST-A-${Date.now()}`,
        name: "Phase 7 MANDAP Web App",
        clientId: testClient.id,
        createdById: ownerUser.id,
      },
    });

    // Create Test Employees
    const empUserA = await prisma.user.create({
      data: {
        email: `emp-a-${Date.now()}@test.com`,
        name: "Employee A",
        passwordHash: "hash",
        designation: "Frontend Dev",
        department: "Engineering",
        activeRole: "EMPLOYEE",
        employeeProfile: {
          create: {
            employeeIdCode: `EMP-A-${Date.now()}`,
          },
        },
      },
      include: { employeeProfile: true },
    });

    const empUserB = await prisma.user.create({
      data: {
        email: `emp-b-${Date.now()}@test.com`,
        name: "Employee B",
        passwordHash: "hash",
        designation: "Backend Dev",
        department: "Engineering",
        activeRole: "EMPLOYEE",
        employeeProfile: {
          create: {
            employeeIdCode: `EMP-B-${Date.now()}`,
          },
        },
      },
      include: { employeeProfile: true },
    });

    // Assign Employee A to Project A
    await prisma.projectMembership.create({
      data: {
        projectId: testProjectA.id,
        employeeId: empUserA.employeeProfile!.id,
        assignedById: ownerUser.id,
        roleInProject: "MEMBER",
        isActive: true,
      },
    });

    // -------------------------------------------------------------------
    // TEST GROUP 1: Single Source of Truth Progress Engine Calculations
    // -------------------------------------------------------------------
    console.log("--- 1. Progress Engine Calculations ---");

    // Case 1.1: 0 Tasks -> 0% Progress + Zero Task Message
    let progRes = await recalculateProjectProgress(testProjectA.id);
    assert(progRes.progressPercentage === 0, "0 Tasks -> 0% Progress");
    assert(
      progRes.zeroTaskMessage === "No tasks have been added to this project yet.",
      "0 Tasks -> Zero task message returned"
    );

    // Create 10 tasks for Project A
    const taskIds: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const t = await prisma.task.create({
        data: {
          projectId: testProjectA.id,
          title: `Project A Task ${i}`,
          createdById: ownerUser.id,
          assignedToId: empUserA.id,
          status: "TODO",
          orderInt: i,
        },
      });
      taskIds.push(t.id);
    }

    progRes = await recalculateProjectProgress(testProjectA.id);
    assert(progRes.totalTasks === 10 && progRes.completedTasks === 0 && progRes.progressPercentage === 0, "10 TODO Tasks -> 0% Progress");

    // Complete Task 1 (1 / 10 -> 10%)
    await prisma.task.update({ where: { id: taskIds[0] }, data: { status: "COMPLETED" } });
    progRes = await recalculateProjectProgress(testProjectA.id);
    assert(progRes.progressPercentage === 10, "1 / 10 Tasks Completed -> 10% Progress");

    // Complete Task 2 (2 / 10 -> 20%)
    await prisma.task.update({ where: { id: taskIds[1] }, data: { status: "COMPLETED" } });
    progRes = await recalculateProjectProgress(testProjectA.id);
    assert(progRes.progressPercentage === 20, "2 / 10 Tasks Completed -> 20% Progress");

    // Complete 3 more tasks (5 / 10 -> 50%)
    await prisma.task.update({ where: { id: taskIds[2] }, data: { status: "COMPLETED" } });
    await prisma.task.update({ where: { id: taskIds[3] }, data: { status: "COMPLETED" } });
    await prisma.task.update({ where: { id: taskIds[4] }, data: { status: "COMPLETED" } });
    progRes = await recalculateProjectProgress(testProjectA.id);
    assert(progRes.progressPercentage === 50, "5 / 10 Tasks Completed -> 50% Progress");

    // Archive 2 tasks (Active total: 8, Completed: 5 -> 5/8 = 63%)
    await prisma.task.update({ where: { id: taskIds[8] }, data: { status: "ARCHIVED" } });
    await prisma.task.update({ where: { id: taskIds[9] }, data: { status: "ARCHIVED" } });
    progRes = await recalculateProjectProgress(testProjectA.id);
    assert(progRes.totalTasks === 8 && progRes.completedTasks === 5, "Archived tasks excluded from active denominator (8 active tasks remaining)");
    assert(progRes.progressPercentage === 63, "5 / 8 Active Tasks Completed -> 63% Progress");

    // -------------------------------------------------------------------
    // TEST GROUP 2: Terms Engine Versioning & Re-Acceptance Gate
    // -------------------------------------------------------------------
    console.log("\n--- 2. Terms Engine & Version Gate ---");

    // Case 2.1: Published Default Employee Terms v1.0
    const empTermsV1 = await getPublishedTerms("EMPLOYEE");
    assert(empTermsV1.version === "v1.0" && empTermsV1.isCurrent, "Default Employee Terms v1.0 published and current");

    // Case 2.2: New Employee User check
    let empStatusA = await checkUserTermsStatus({
      id: empUserA.id,
      name: empUserA.name,
      email: empUserA.email,
      designation: empUserA.designation,
      department: empUserA.department,
      activeRole: "EMPLOYEE",
      avatarUrl: null,
      employeeId: empUserA.employeeProfile!.id,
    });
    assert(empStatusA.needsAcceptance === true, "New employee requires v1.0 acceptance");

    // Case 2.3: Employee accepts v1.0
    await prisma.user.update({
      where: { id: empUserA.id },
      data: { termsAcceptedVersion: "v1.0", termsAcceptedAt: new Date() },
    });
    await prisma.termsAcceptanceLog.create({
      data: {
        termsId: empTermsV1.id,
        userId: empUserA.id,
        targetAudience: "EMPLOYEE",
        termsVersion: "v1.0",
      },
    });

    empStatusA = await checkUserTermsStatus({
      id: empUserA.id,
      name: empUserA.name,
      email: empUserA.email,
      designation: empUserA.designation,
      department: empUserA.department,
      activeRole: "EMPLOYEE",
      avatarUrl: null,
      employeeId: empUserA.employeeProfile!.id,
    });
    assert(empStatusA.needsAcceptance === false, "Employee accepted v1.0 -> No terms gate");

    // Case 2.4: OWNER publishes Employee Terms v1.1
    await prisma.terms.updateMany({
      where: { targetAudience: "EMPLOYEE", isCurrent: true },
      data: { isCurrent: false },
    });
    const empTermsV11 = await prisma.terms.create({
      data: {
        targetAudience: "EMPLOYEE",
        version: "v1.1",
        title: "Employee Terms v1.1 Updated",
        content: "Updated terms content v1.1",
        isCurrent: true,
        isDraft: false,
        publishedAt: new Date(),
        publishedById: ownerUser.id,
      },
    });

    empStatusA = await checkUserTermsStatus({
      id: empUserA.id,
      name: empUserA.name,
      email: empUserA.email,
      designation: empUserA.designation,
      department: empUserA.department,
      activeRole: "EMPLOYEE",
      avatarUrl: null,
      employeeId: empUserA.employeeProfile!.id,
    });
    assert(
      empStatusA.needsAcceptance === true && empStatusA.currentVersion === "v1.1",
      "OWNER publishes v1.1 -> Employee with v1.0 is gated server-side for re-acceptance"
    );

    // -------------------------------------------------------------------
    // Clean up Test Fixtures
    // -------------------------------------------------------------------
    console.log("\n--- Cleaning up Test Fixtures ---");
    await prisma.task.deleteMany({ where: { projectId: testProjectA.id } });
    await prisma.projectMembership.deleteMany({ where: { projectId: testProjectA.id } });
    await prisma.project.delete({ where: { id: testProjectA.id } });
    await prisma.client.delete({ where: { id: testClient.id } });
    await prisma.termsAcceptanceLog.deleteMany({ where: { userId: empUserA.id } });
    await prisma.user.delete({ where: { id: empUserA.id } });
    await prisma.user.delete({ where: { id: empUserB.id } });
    await prisma.terms.deleteMany({ where: { id: empTermsV11.id } });

    console.log("Cleanup complete.");

    if (failedTests === 0) {
      console.log("\n✨ ALL PHASE 7 INTEGRATION & SECURITY TESTS PASSED SUCCESSFULLY! ✨");
    } else {
      console.error(`\n❌ ${failedTests} TEST(S) FAILED.`);
    }
  } catch (e) {
    console.error("Test execution error:", e);
    failedTests++;
  } finally {
    await prisma.$disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runPhase7Tests();
