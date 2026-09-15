const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function safeDelete(fn, label) {
  try {
    await fn();
  } catch (err) {
    // If table does not exist or has cascade constraint, log and continue
    if (err.code === "P2021") {
      // Table does not exist in DB yet
      return;
    }
    console.warn(`Note: safeDelete for ${label} skipped:`, err.message || err);
  }
}

async function main() {
  console.log("🧹 Starting database cleanup: wiping all dummy data, keeping only Super Admin...");

  // 1. Delete all transactional, project, client, task, lead, and notification data safely
  await safeDelete(() => prisma.userPushToken.deleteMany(), "userPushToken");
  await safeDelete(() => prisma.notification.deleteMany(), "notification");
  await safeDelete(() => prisma.activityEvent.deleteMany(), "activityEvent");
  await safeDelete(() => prisma.clientUpdate.deleteMany(), "clientUpdate");
  await safeDelete(() => prisma.clientPortalToken.deleteMany(), "clientPortalToken");
  await safeDelete(() => prisma.invoice.deleteMany(), "invoice");
  await safeDelete(() => prisma.paymentMilestone.deleteMany(), "paymentMilestone");

  await safeDelete(() => prisma.workSession.deleteMany(), "workSession");
  await safeDelete(() => prisma.employeeStatusEvent.deleteMany(), "employeeStatusEvent");
  await safeDelete(() => prisma.attendance.deleteMany(), "attendance");
  await safeDelete(() => prisma.leaveRequest.deleteMany(), "leaveRequest");
  await safeDelete(() => prisma.changeRequestItem.deleteMany(), "changeRequestItem");
  await safeDelete(() => prisma.changeRequest.deleteMany(), "changeRequest");
  await safeDelete(() => prisma.clientDiscussion.deleteMany(), "clientDiscussion");
  await safeDelete(() => prisma.projectNote.deleteMany(), "projectNote");
  await safeDelete(() => prisma.documentVersion.deleteMany(), "documentVersion");
  await safeDelete(() => prisma.projectDocument.deleteMany(), "projectDocument");
  await safeDelete(() => prisma.task.deleteMany(), "task");
  await safeDelete(() => prisma.projectChecklist.deleteMany(), "projectChecklist");
  await safeDelete(() => prisma.projectStage.deleteMany(), "projectStage");
  await safeDelete(() => prisma.projectMembership.deleteMany(), "projectMembership");
  await safeDelete(() => prisma.project.deleteMany(), "project");
  await safeDelete(() => prisma.projectType.deleteMany(), "projectType");
  await safeDelete(() => prisma.clientContact.deleteMany(), "clientContact");
  await safeDelete(() => prisma.client.deleteMany(), "client");
  await safeDelete(() => prisma.leadActivity.deleteMany(), "leadActivity");
  await safeDelete(() => prisma.leadFollowup.deleteMany(), "leadFollowup");
  await safeDelete(() => prisma.lead.deleteMany(), "lead");
  await safeDelete(() => prisma.termsAcceptanceLog.deleteMany(), "termsAcceptanceLog");

  console.log("✓ Wiped all projects, leads, clients, invoices, attendance, and notifications.");

  // 2. Ensure base roles exist
  const ownerRole = await prisma.role.upsert({
    where: { code: "OWNER" },
    update: {},
    create: { code: "OWNER", name: "Owner / Super Admin", description: "Full operational & financial control" },
  });

  await prisma.role.upsert({
    where: { code: "SALES" },
    update: {},
    create: { code: "SALES", name: "Sales Executive", description: "Lead pipeline & client onboarding" },
  });

  await prisma.role.upsert({
    where: { code: "EMPLOYEE" },
    update: {},
    create: { code: "EMPLOYEE", name: "Employee / Team Member", description: "Internal workforce" },
  });

  await prisma.role.upsert({
    where: { code: "CLIENT" },
    update: {},
    create: { code: "CLIENT", name: "Client Portal User", description: "External safe portal access" },
  });

  // 3. Find existing Super Admin / Owner or create if not present
  let ownerUser = await prisma.user.findFirst({
    where: {
      OR: [
        { activeRole: "OWNER" },
        { userRoles: { some: { role: { code: "OWNER" } } } },
      ],
    },
  });

  if (!ownerUser) {
    const passwordHash = "$2b$10$EoO5aZQrGc/nb4Kf81H3sO.h1JWRV91bCWa2goOqG/XABwe53DEe2"; // password123
    ownerUser = await prisma.user.create({
      data: {
        email: "owner@mdzcompany.com",
        passwordHash,
        name: "Super Admin",
        designation: "Founder & CEO",
        department: "Management",
        activeRole: "OWNER",
      },
    });
    console.log("✓ Created Super Admin user: owner@mdzcompany.com (password: password123)");
  } else {
    console.log(`✓ Preserved existing Super Admin: ${ownerUser.name} (${ownerUser.email})`);
  }

  // Ensure Owner user has the OWNER role assigned
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: ownerUser.id, roleId: ownerRole.id } },
    update: {},
    create: { userId: ownerUser.id, roleId: ownerRole.id },
  });

  // Ensure Owner has employee record for profile compatibility
  await prisma.employee.upsert({
    where: { userId: ownerUser.id },
    update: { status: "ACTIVE" },
    create: {
      userId: ownerUser.id,
      employeeIdCode: "EMP-OWNER",
      salaryMonthly: 500000,
      skillsJson: JSON.stringify(["Management", "Strategy", "Operations"]),
      status: "ACTIVE",
    },
  });

  // 4. Delete all other users and employees
  await safeDelete(
    () => prisma.employee.deleteMany({ where: { userId: { not: ownerUser.id } } }),
    "other employees"
  );

  await safeDelete(
    () => prisma.userRole.deleteMany({ where: { userId: { not: ownerUser.id } } }),
    "other userRoles"
  );

  await safeDelete(
    () => prisma.user.deleteMany({ where: { id: { not: ownerUser.id } } }),
    "other users"
  );

  console.log("\n==========================================");
  console.log("✨ CLEANUP COMPLETE: Database is clean!");
  console.log(`Super Admin: ${ownerUser.name} (${ownerUser.email})`);
  console.log("==========================================\n");
}

main()
  .catch((err) => {
    console.error("Cleanup error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
