import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for empty auto-generated registration projects...");
  const autoProjects = await prisma.project.findMany({
    where: {
      name: { contains: "Brand Production & Operations" },
      tasks: { none: {} },
    },
    include: {
      client: true,
    },
  });

  console.log(`Found ${autoProjects.length} empty auto-generated project(s).`);
  for (const proj of autoProjects) {
    console.log(`Removing empty auto-project: [${proj.projectNumber}] ${proj.name} (Client: ${proj.client.companyName})`);
    await prisma.clientPortalToken.deleteMany({ where: { projectId: proj.id } });
    await prisma.project.delete({ where: { id: proj.id } });
  }

  console.log("✓ Cleanup completed successfully.");
}

main()
  .catch((err) => {
    console.error("Cleanup error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
