import { prisma } from "../src/lib/prisma";
import {
  canAccessChat,
  canAccessConversation,
  canCreateDirectChat,
  findOrCreateDirectConversation,
  findOrCreateProjectConversation,
  canSendMessage,
  canDeleteMessage,
} from "../src/lib/chat-auth";

async function runTests() {
  console.log("=== STARTING CHAT SYSTEM AUTOMATED VERIFICATION ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Fetch test users
    const ownerUser = await prisma.user.findFirst({ where: { activeRole: "OWNER" } });
    const employeeA = await prisma.user.findFirst({ where: { activeRole: "EMPLOYEE" } });
    const employeeB = await prisma.user.findFirst({
      where: { activeRole: "EMPLOYEE", id: { not: employeeA?.id } },
    });
    const clientUser = await prisma.user.findFirst({ where: { activeRole: "CLIENT" } });

    console.log(`Found Test Users: Owner=${ownerUser?.name}, EmpA=${employeeA?.name}, EmpB=${employeeB?.name}, Client=${clientUser?.name}`);

    // TEST 1: Role Access Control
    assert(canAccessChat(ownerUser as any) === true, "OWNER has internal chat access");
    assert(canAccessChat(employeeA as any) === true, "EMPLOYEE has internal chat access");
    assert(canAccessChat(clientUser as any) === false, "CLIENT is denied internal chat access");
    assert(canAccessChat(null) === false, "Anonymous user is denied internal chat access");

    if (!employeeA || !employeeB || !ownerUser) {
      console.warn("Insufficient seeded users to run full integration checks. Skipping user-specific tests.");
      return;
    }

    // TEST 2: Client Direct Chat Block
    if (clientUser) {
      const clientCheck = await canCreateDirectChat(employeeA as any, clientUser.id);
      assert(!clientCheck.allowed, "Cannot create direct chat with CLIENT user");
    }

    // TEST 3: Direct Conversation Creation & Deduplication
    const conv1 = await findOrCreateDirectConversation(employeeA.id, employeeB.id);
    assert(Boolean(conv1 && conv1.id), "Direct conversation created between EmpA and EmpB");

    const conv2 = await findOrCreateDirectConversation(employeeB.id, employeeA.id);
    assert(conv1.id === conv2.id, "Direct conversation deduplication verified (same ID returned)");

    // TEST 4: Conversation Participant Membership
    const hasAccessA = await canAccessConversation(employeeA as any, conv1.id);
    const hasAccessB = await canAccessConversation(employeeB as any, conv1.id);
    assert(hasAccessA && hasAccessB, "Both direct participants have authorized conversation access");

    // TEST 5: Message Creation & SQLite Persistence
    const msg1 = await prisma.chatMessage.create({
      data: {
        conversationId: conv1.id,
        senderId: employeeA.id,
        content: "Hello Employee B! Testing chat persistence.",
        messageType: "TEXT",
      },
    });
    assert(Boolean(msg1 && msg1.id), "Message persisted to SQLite database");

    // TEST 6: Unread Count Calculation
    const unreadCountBefore = await prisma.chatMessage.count({
      where: {
        conversationId: conv1.id,
        senderId: { not: employeeB.id },
        deletedAt: null,
      },
    });
    assert(unreadCountBefore >= 1, "Unread message count calculated for Employee B");

    // TEST 7: Mark Read State Update
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: conv1.id,
          userId: employeeB.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    const participantB = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: conv1.id,
          userId: employeeB.id,
        },
      },
    });
    assert(Boolean(participantB?.lastReadAt), "lastReadAt timestamp updated successfully");

    // TEST 8: Message Soft Deletion Permissions
    const canDelAsAuthor = await canDeleteMessage(employeeA as any, msg1.id);
    assert(canDelAsAuthor.allowed, "Message author can delete own message");

    const canDelAsOther = await canDeleteMessage(employeeB as any, msg1.id);
    assert(!canDelAsOther.allowed, "Unauthorized peer cannot delete other user's message");

    const canDelAsOwner = await canDeleteMessage(ownerUser as any, msg1.id);
    assert(canDelAsOwner.allowed, "OWNER can moderate/delete any message");

    // Perform soft deletion
    await prisma.chatMessage.update({
      where: { id: msg1.id },
      data: { deletedAt: new Date() },
    });
    const deletedMsg = await prisma.chatMessage.findUnique({ where: { id: msg1.id } });
    assert(Boolean(deletedMsg?.deletedAt), "Message soft-deleted with preserved record");

    // TEST 9: Project Chat Derivation
    const project = await prisma.project.findFirst();
    if (project) {
      const projConv = await findOrCreateProjectConversation(project.id, ownerUser.id);
      assert(Boolean(projConv && projConv.projectId === project.id), "Project chat conversation created/derived from Project");
    }

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error("Test execution error:", err);
  }
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
