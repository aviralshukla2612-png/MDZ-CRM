const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting database cleanup: wiping all dummy data, keeping only Super Admin...");

  // 1. Delete all transactional, project, client, task, lead, and notification data
  await prisma.userPushToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.clientUpdate.deleteMany();
  await prisma.clientPortalToken.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.paymentMilestone.deleteMany();

  await prisma.workSession.deleteMany();
  await prisma.employeeStatusEvent.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.changeRequestItem.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.clientDiscussion.deleteMany();
  await prisma.projectNote.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectChecklist.deleteMany();
  await prisma.projectStage.deleteMany();
  await prisma.projectMembership.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projectType.deleteMany();
  await prisma.clientContact.deleteMany();
  await prisma.client.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.leadFollowup.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.termsAcceptanceLog.deleteMany();

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
  const deletedEmployees = await prisma.employee.deleteMany({
    where: { userId: { not: ownerUser.id } },
  });

  const deletedUserRoles = await prisma.userRole.deleteMany({
    where: { userId: { not: ownerUser.id } },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { not: ownerUser.id } },
  });

  console.log(`✓ Deleted ${deletedUsers.count} non-admin user(s) and ${deletedEmployees.count} employee profile(s).`);
  console.log("\n==========================================");
  console.log("✨ CLEANUP COMPLETE: Database is clean!");
  console.log(`Super Admin Email: ${ownerUser.email}`);
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
