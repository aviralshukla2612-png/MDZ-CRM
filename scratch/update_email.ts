import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { email: "owner@esscompany.com" },
    data: { email: "owner@mdzcompany.com" },
  });
  console.log(`Updated ${result.count} user(s).`);
}

main().finally(() => prisma.$disconnect());
