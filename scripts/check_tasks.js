const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.task.count();
  const tasks = await prisma.task.findMany({
    take: 10,
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, designation: true } },
    }
  });
  console.log(`Total tasks in DB: ${count}`);
  console.log('Sample tasks:', JSON.stringify(tasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
