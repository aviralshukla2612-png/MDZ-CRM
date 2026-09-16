import { prisma } from "../src/lib/prisma";
import { canUploadMedia, canReadMedia, canDeleteMedia } from "../src/lib/media-auth";
import { CurrentUserSession } from "../src/lib/auth";

async function main() {
  console.log("==================================================");
  console.log("   AUTOMATED MEDIA RBAC & IDOR VERIFICATION       ");
  console.log("==================================================\n");

  // 1. Setup Test Users
  let owner = await prisma.user.findFirst({ where: { activeRole: "OWNER" } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: "test_media_owner@example.com",
        passwordHash: "dummy",
        name: "Media Owner",
        designation: "SuperAdmin",
        department: "Executive",
        activeRole: "OWNER",
      },
    });
  }

  // Client User A
  const clientAEmail = `media_contact_a_${Date.now()}@acme.example.com`;
  const clientRecordA = await prisma.client.create({
    data: {
      clientNumber: `TEST-CLI-A-${Date.now()}`,
      companyName: "Acme Corp (Media Test A)",
      email: clientAEmail,
      phone: "9100000001",
      createdById: owner.id,
      contacts: {
        create: {
          name: "Contact A",
          designation: "Lead",
          email: clientAEmail,
          isPrimary: true,
          termsAccepted: true,
        },
      },
    },
    include: { contacts: true },
  });

  // Client User B
  const clientBEmail = `media_contact_b_${Date.now()}@stark.example.com`;
  const clientRecordB = await prisma.client.create({
    data: {
      clientNumber: `TEST-CLI-B-${Date.now()}`,
      companyName: "Stark Industries (Media Test B)",
      email: clientBEmail,
      phone: "9100000002",
      createdById: owner.id,
      contacts: {
        create: {
          name: "Contact B",
          designation: "Lead",
          email: clientBEmail,
          isPrimary: true,
          termsAccepted: true,
        },
      },
    },
    include: { contacts: true },
  });

  // Project A belonging to Client A
  const projectA = await prisma.project.create({
    data: {
      projectNumber: `PRJ-MEDIA-A-${Date.now()}`,
      name: "Acme Drive Project",
      clientId: clientRecordA.id,
      createdById: owner.id,
    },
  });

  // Project B belonging to Client B
  const projectB = await prisma.project.create({
    data: {
      projectNumber: `PRJ-MEDIA-B-${Date.now()}`,
      name: "Stark Drive Project",
      clientId: clientRecordB.id,
      createdById: owner.id,
    },
  });

  const sessionOwner: CurrentUserSession = {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    designation: owner.designation,
    department: owner.department,
    activeRole: "OWNER",
    avatarUrl: null,
  };

  const sessionClientA: CurrentUserSession = {
    id: "dummy-client-a-id",
    name: "Contact A",
    email: clientAEmail,
    designation: "Lead",
    department: "Client",
    activeRole: "CLIENT",
    avatarUrl: null,
  };

  const sessionClientB: CurrentUserSession = {
    id: "dummy-client-b-id",
    name: "Contact B",
    email: clientBEmail,
    designation: "Lead",
    department: "Client",
    activeRole: "CLIENT",
    avatarUrl: null,
  };

  try {
    console.log("⏳ [1/4] Testing Upload Authorization & IDOR Isolation...");
    const ownerCanUpload = await canUploadMedia(sessionOwner, "PROJECT", projectA.id);
    const clientACanUploadOwn = await canUploadMedia(sessionClientA, "PROJECT", projectA.id);
    const clientACanUploadOther = await canUploadMedia(sessionClientA, "PROJECT", projectB.id);

    console.log(`- OWNER upload to Project A: ${ownerCanUpload} (EXPECTED: true)`);
    console.log(`- CLIENT A upload to Project A (Own Project): ${clientACanUploadOwn} (EXPECTED: true)`);
    console.log(`- CLIENT A upload to Project B (Cross-Tenant IDOR Attack): ${clientACanUploadOther} (EXPECTED: false)`);

    if (!ownerCanUpload || !clientACanUploadOwn || clientACanUploadOther) {
      throw new Error("Upload authorization / IDOR validation failed!");
    }
    console.log("✅ Upload RBAC & Multi-Tenant IDOR Guard PASSED!\n");

    console.log("⏳ [2/4] Testing Read/Download Authorization & Confidentiality...");
    const internalDocMeta = {
      entityType: "PROJECT",
      entityId: projectA.id,
      category: "INTERNAL",
      uploadedById: owner.id,
    };
    const clientDeliverableMeta = {
      entityType: "PROJECT",
      entityId: projectA.id,
      category: "ASSET",
      uploadedById: owner.id,
    };
    const projectBDocMeta = {
      entityType: "PROJECT",
      entityId: projectB.id,
      category: "ASSET",
      uploadedById: owner.id,
    };

    const ownerCanReadInternal = await canReadMedia(sessionOwner, internalDocMeta);
    const clientCanReadInternal = await canReadMedia(sessionClientA, internalDocMeta);
    const clientCanReadDeliverable = await canReadMedia(sessionClientA, clientDeliverableMeta);
    const clientACanReadProjectBDoc = await canReadMedia(sessionClientA, projectBDocMeta);

    console.log(`- OWNER read internal project doc: ${ownerCanReadInternal} (EXPECTED: true)`);
    console.log(`- CLIENT A read INTERNAL category doc: ${clientCanReadInternal} (EXPECTED: false)`);
    console.log(`- CLIENT A read ASSET category doc: ${clientCanReadDeliverable} (EXPECTED: true)`);
    console.log(`- CLIENT A read Client B's doc (Cross-Tenant Leak Check): ${clientACanReadProjectBDoc} (EXPECTED: false)`);

    if (!ownerCanReadInternal || clientCanReadInternal || !clientCanReadDeliverable || clientACanReadProjectBDoc) {
      throw new Error("Read authorization / category privacy check failed!");
    }
    console.log("✅ Read RBAC & Document Confidentiality PASSED!\n");

    console.log("⏳ [3/4] Testing Delete Authority...");
    const ownerCanDelete = await canDeleteMedia(sessionOwner, clientDeliverableMeta);
    const clientACanDeleteStaffDoc = await canDeleteMedia(sessionClientA, clientDeliverableMeta);

    console.log(`- OWNER delete authority: ${ownerCanDelete} (EXPECTED: true)`);
    console.log(`- CLIENT delete staff doc: ${clientACanDeleteStaffDoc} (EXPECTED: false)`);

    if (!ownerCanDelete || clientACanDeleteStaffDoc) {
      throw new Error("Delete authorization check failed!");
    }
    console.log("✅ Delete Authority Guard PASSED!\n");

    console.log("⏳ [4/4] Verifying MediaFile Schema Persistence...");
    const sampleRecord = await prisma.mediaFile.create({
      data: {
        driveFileId: `mock-drive-id-${Date.now()}`,
        storageProvider: "GOOGLE_DRIVE",
        fileName: "test-deliverable.pdf",
        originalName: "Project Brief.pdf",
        mimeType: "application/pdf",
        fileSize: 1048576, // 1MB
        category: "SPECIFICATION",
        entityType: "PROJECT",
        entityId: projectA.id,
        uploadedById: owner.id,
      },
    });
    console.log(`✅ MediaFile record created in SQLite DB (ID: ${sampleRecord.id}, Size: ${sampleRecord.fileSize} bytes)`);

    // Clean up sample record
    await prisma.mediaFile.delete({ where: { id: sampleRecord.id } });
    console.log("✅ MediaFile record deleted from SQLite DB cleanly.");

    console.log("\n==================================================");
    console.log("🎉 ALL MEDIA RBAC & IDOR SECURITY TESTS PASSED!");
    console.log("==================================================");
  } finally {
    // Cleanup test database artifacts
    await prisma.project.deleteMany({ where: { id: { in: [projectA.id, projectB.id] } } });
    await prisma.clientContact.deleteMany({ where: { clientId: { in: [clientRecordA.id, clientRecordB.id] } } });
    await prisma.client.deleteMany({ where: { id: { in: [clientRecordA.id, clientRecordB.id] } } });
  }
}

main()
  .catch((e) => {
    console.error("Test failure:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
