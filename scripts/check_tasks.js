const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== MDZ-CRM DATABASE INSPECTOR ===');
  
  const totalProjects = await prisma.project.count();
  const byStatus = await prisma.project.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log(`\nTotal Projects: ${totalProjects}`);
  console.log('Projects by status:', byStatus);

  const totalTasks = await prisma.task.count();
  const tasksByStatus = await prisma.task.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log(`\nTotal Tasks in DB: ${totalTasks}`);
  console.log('Tasks by status:', tasksByStatus);

  const totalUpdates = await prisma.clientUpdate.count();
  console.log(`\nTotal Client/Daily Updates: ${totalUpdates}`);

  const recentProjects = await prisma.project.findMany({
    take: 20,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      targetDeadline: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          tasks: true,
          clientUpdates: true,
          memberships: true,
        }
      }
    }
  });

  console.log('\n--- 20 Most Recently Updated Projects ---');
  recentProjects.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.status}] "${p.name}" | Due: ${p.targetDeadline ? p.targetDeadline.toISOString().slice(0, 10) : 'None'} | Tasks: ${p._count.tasks} | Updates: ${p._count.clientUpdates} | UpdatedAt: ${p.updatedAt.toISOString()}`);
  });

  const recentTasks = await prisma.task.findMany({
    take: 15,
    orderBy: { updatedAt: 'desc' },
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } }
    }
  });

  console.log('\n--- 15 Most Recent Tasks ---');
  if (recentTasks.length === 0) {
    console.log('No tasks found in Task table.');
  } else {
    recentTasks.forEach((t, idx) => {
      console.log(`${idx + 1}. [${t.status}] "${t.title}" | Project: "${t.project?.name}" | Assignee: "${t.assignedTo?.name || 'Unassigned'}" | CompletedAt: ${t.completedAt || 'N/A'}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
