const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const body = {
    name: "aviral",
    email: "aviralm@mdz.com",
    password: "123",
    designation: "aaa",
    role: "EMPLOYEE"
  };

  try {
    const count = await prisma.employee.count();
    const code = `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: body.email,
          passwordHash: hashedPassword,
          name: body.name,
          designation: body.designation || "Team Member",
          department: body.department || "General",
          activeRole: body.role === "SALES" ? "SALES" : "EMPLOYEE",
          avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + count * 100}?w=150`,
        },
      });

      const referenceEmployee = await tx.employee.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { sickLeaveTotal: true, casualLeaveTotal: true, paidLeaveTotal: true }
      });

      const newEmployee = await tx.employee.create({
        data: {
          userId: newUser.id,
          employeeIdCode: code,
          salaryMonthly: body.salaryMonthly || 0,
          skillsJson: JSON.stringify(body.skills || []),
          sickLeaveTotal: referenceEmployee?.sickLeaveTotal ?? 10,
          casualLeaveTotal: referenceEmployee?.casualLeaveTotal ?? 15,
          paidLeaveTotal: referenceEmployee?.paidLeaveTotal ?? 15,
        },
      });

      return { user: newUser, employee: newEmployee };
    });
    console.log("SUCCESS:", result);
  } catch (error) {
    console.error("ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
