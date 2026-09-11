import { prisma } from "../src/lib/prisma";
import {
  getClientAccountForUser,
  verifyClientProjectAccess,
  canUserCreateDailyUpdate,
} from "../src/lib/client-auth";

async function main() {
  console.log("=== PHASE 6 AUTOMATED SECURITY & IDOR AUDIT ===");

  // Find or create owner user
  let ownerUser = await prisma.user.findFirst({ where: { activeRole: "OWNER" } });
  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: {
        email: "test_owner@example.com",
        passwordHash: "dummy",
        name: "Test Owner",
        designation: "Owner",
        department: "Management",
        activeRole: "OWNER",
      },
    });
  }

  // Create Client A & Client B for IDOR testing
  const clientA = await prisma.client.create({
    data: {
      clientNumber: `TEST-CLI-A-${Date.now()}`,
      companyName: "Acme Corp (Client A)",
      email: "contact_a@acme.example.com",
      phone: "9999999991",
      gstNumber: "22AAAAA0000A1Z5",
      createdById: ownerUser.id,
      contacts: {
        create: {
          name: "Contact A",
          designation: "Primary",
          email: "contact_a@acme.example.com",
          isPrimary: true,
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          termsVersion: "v1.0",
        },
      },
    },
    include: { contacts: true },
  });

  const clientB = await prisma.client.create({
    data: {
      clientNumber: `TEST-CLI-B-${Date.now()}`,
      companyName: "Stark Industries (Client B)",
      email: "contact_b@stark.example.com",
      phone: "9999999992",
      gstNumber: "27BBBBB1111B2Z6",
      createdById: ownerUser.id,
      contacts: {
        create: {
          name: "Contact B",
          designation: "Primary",
          email: "contact_b@stark.example.com",
          isPrimary: true,
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          termsVersion: "v1.0",
        },
      },
    },
    include: { contacts: true },
  });

  const projA = await prisma.project.create({
    data: {
      projectNumber: `PRJ-A-${Date.now()}`,
      name: "Project A (Acme Portal)",
      clientId: clientA.id,
      createdById: ownerUser.id,
    },
  });

  const projB = await prisma.project.create({
    data: {
      projectNumber: `PRJ-B-${Date.now()}`,
      name: "Project B (Stark Dashboard)",
      clientId: clientB.id,
      createdById: ownerUser.id,
    },
  });

  try {
    // 1. Verify Client Resolution
    const clientCtxA = await getClientAccountForUser("contact_a@acme.example.com");
    console.log("[1] Client Resolution A:", {
      email: "contact_a@acme.example.com",
      resolvedClientId: clientCtxA?.client.id,
      companyName: clientCtxA?.client.companyName,
      gstNumber: clientCtxA?.client.gstNumber,
      termsAccepted: clientCtxA?.contact?.termsAccepted,
    });

    if (clientCtxA?.client.id === clientA.id && clientCtxA?.contact?.termsAccepted === true) {
      console.log("✅ Client Account & Terms Resolution Verified!");
    } else {
      console.error("❌ Client Account Resolution Failed!");
    }

    // 2. Test IDOR Boundary Security
    const canAccessOwn = await verifyClientProjectAccess("contact_a@acme.example.com", projA.id);
    const canAccessOther = await verifyClientProjectAccess("contact_a@acme.example.com", projB.id);

    console.log("[2] IDOR Test Results:");
    console.log(`- Client A accessing Project A (Own): ${canAccessOwn} (EXPECTED: true)`);
    console.log(`- Client A accessing Project B (Cross-Tenant IDOR Attempt): ${canAccessOther} (EXPECTED: false)`);

    if (canAccessOwn === true && canAccessOther === false) {
      console.log("✅ IDOR Multi-Tenant Security Guard Verified!");
    } else {
      console.error("❌ IDOR Security Test Failed!");
      process.exitCode = 1;
    }

    // 3. Test Daily Update RBAC
    const ownerAllowed = await canUserCreateDailyUpdate(ownerUser.id, "OWNER", projA.id);
    const clientAllowed = await canUserCreateDailyUpdate(ownerUser.id, "CLIENT", projA.id);

    console.log("[3] Daily Update RBAC Matrix:");
    console.log(`- OWNER allowed for any project: ${ownerAllowed} (EXPECTED: true)`);
    console.log(`- CLIENT allowed to post daily update: ${clientAllowed} (EXPECTED: false)`);

    if (ownerAllowed === true && clientAllowed === false) {
      console.log("✅ Daily Update RBAC Matrix Verified!");
    } else {
      console.error("❌ RBAC Matrix Verification Failed!");
      process.exitCode = 1;
    }
  } finally {
    // Cleanup test data
    console.log("Cleaning up test records...");
    await prisma.project.deleteMany({ where: { id: { in: [projA.id, projB.id] } } });
    await prisma.clientContact.deleteMany({ where: { clientId: { in: [clientA.id, clientB.id] } } });
    await prisma.client.deleteMany({ where: { id: { in: [clientA.id, clientB.id] } } });
    console.log("=== PHASE 6 AUDIT COMPLETE ===");
  }
}

main()
  .catch((e) => {
    console.error("Error during security audit:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
