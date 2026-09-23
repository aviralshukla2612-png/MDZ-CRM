const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Updating Admin/Owner name to 'Vikram Lathiya'...");

  const updatedUsers = await prisma.user.updateMany({
    where: {
      OR: [
        { email: "owner@mdzcompany.com" },
        { activeRole: "OWNER" },
        { name: { contains: "Rahul" } },
      ],
    },
    data: {
      name: "Vikram Lathiya",
    },
  });

  console.log(`✓ Updated ${updatedUsers.count} user record(s) to 'Vikram Lathiya'.`);
}

main()
  .catch((e) => {
    console.error("Error updating admin name:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
