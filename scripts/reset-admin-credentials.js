const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = process.argv[2] || "password123";
  const email = process.argv[3] || "owner@mdzcompany.com";

  console.log(`Resetting/Creating account for ${email} with password: ${password}...`);
  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert OWNER role
  const ownerRole = await prisma.role.upsert({
    where: { code: "OWNER" },
    update: {},
    create: { code: "OWNER", name: "Agency Owner", description: "Full root administrative control" },
  });

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      passwordHash,
      isActive: true,
      activeRole: "OWNER",
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      name: "Rahul MDZ",
      designation: "Founder & CEO",
      department: "Management",
      activeRole: "OWNER",
      isActive: true,
      phone: "+91 98765 43210",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: ownerRole.id } },
    update: {},
    create: {
      userId: user.id,
      roleId: ownerRole.id,
    },
  });

  console.log(`✓ SUCCESS: ${email} is active and ready to log in with password "${password}".`);
}

main()
  .catch((e) => {
    console.error("Error resetting credentials:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
