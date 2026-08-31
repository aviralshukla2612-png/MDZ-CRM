import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MDZ OS database with essential admin data only...");

  // Clean existing records for fresh seed
  await prisma.activityEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.clientUpdate.deleteMany();
  await prisma.clientPortalToken.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.paymentMilestone.deleteMany();

  await prisma.workSession.deleteMany();
  await prisma.employeeStatusEvent.deleteMany();
  await prisma.attendance.deleteMany();
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
  await prisma.employee.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 1. Roles
  const ownerRole = await prisma.role.upsert({
    where: { code: "OWNER" },
    update: {},
    create: { code: "OWNER", name: "Owner / Super Admin", description: "Full operational & financial control" },
  });

  const salesRole = await prisma.role.upsert({
    where: { code: "SALES" },
    update: {},
    create: { code: "SALES", name: "Sales Executive", description: "Lead pipeline & client onboarding" },
  });

  const employeeRole = await prisma.role.upsert({
    where: { code: "EMPLOYEE" },
    update: {},
    create: { code: "EMPLOYEE", name: "Employee / Team Member", description: "Internal workforce" },
  });

  const clientRole = await prisma.role.upsert({
    where: { code: "CLIENT" },
    update: {},
    create: { code: "CLIENT", name: "Client Portal User", description: "External safe portal access" },
  });

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 2. Admin User
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@mdzcompany.com" },
    update: {},
    create: {
      email: "owner@mdzcompany.com",
      passwordHash: defaultPasswordHash,
      name: "Rahul MDZ",
      designation: "Founder & CEO",
      department: "Management",
      activeRole: "OWNER",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });

  // Assign Role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: ownerUser.id, roleId: ownerRole.id } },
    update: {},
    create: {
      userId: ownerUser.id,
      roleId: ownerRole.id,
    },
  });

  // Employee Profile for Admin
  await prisma.employee.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      employeeIdCode: "EMP-OWNER",
      salaryMonthly: 500000,
      skillsJson: JSON.stringify(["Management", "Strategy", "Operations"]),
    },
  });

  console.log("✅ Database seeded successfully with essential data only!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
