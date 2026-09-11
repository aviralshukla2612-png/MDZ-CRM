import { prisma } from "@/lib/prisma";

export interface ResolvedClientContext {
  client: {
    id: string;
    clientNumber: string;
    companyName: string;
    email: string;
    gstNumber: string | null;
  };
  contact: {
    id: string;
    name: string;
    email: string | null;
    designation: string;
    termsAccepted: boolean;
    termsAcceptedAt: Date | null;
    termsVersion: string | null;
  } | null;
}

/**
 * Server-side resolution of a Client account and ClientContact record from an authenticated User email.
 * Never accepts a client-provided clientId from the browser.
 */
export async function getClientAccountForUser(userEmail: string): Promise<ResolvedClientContext | null> {
  if (!userEmail) return null;

  // Primary lookup: Find ClientContact by email
  const contact = await prisma.clientContact.findFirst({
    where: { email: userEmail },
    include: { client: true },
  });

  if (contact?.client) {
    return {
      client: {
        id: contact.client.id,
        clientNumber: contact.client.clientNumber,
        companyName: contact.client.companyName,
        email: contact.client.email,
        gstNumber: contact.client.gstNumber,
      },
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        designation: contact.designation,
        termsAccepted: contact.termsAccepted,
        termsAcceptedAt: contact.termsAcceptedAt,
        termsVersion: contact.termsVersion,
      },
    };
  }

  // Fallback lookup: Find Client by email
  const client = await prisma.client.findFirst({
    where: { email: userEmail },
    include: { contacts: true },
  });

  if (client) {
    const primaryContact = client.contacts.find((c) => c.isPrimary) || client.contacts[0] || null;
    return {
      client: {
        id: client.id,
        clientNumber: client.clientNumber,
        companyName: client.companyName,
        email: client.email,
        gstNumber: client.gstNumber,
      },
      contact: primaryContact
        ? {
            id: primaryContact.id,
            name: primaryContact.name,
            email: primaryContact.email,
            designation: primaryContact.designation,
            termsAccepted: primaryContact.termsAccepted,
            termsAcceptedAt: primaryContact.termsAcceptedAt,
            termsVersion: primaryContact.termsVersion,
          }
        : null,
    };
  }

  return null;
}

/**
 * IDOR Verification Helper: Ensures that a project belongs strictly to the authenticated Client account.
 */
export async function verifyClientProjectAccess(userEmail: string, projectId: string): Promise<boolean> {
  const clientCtx = await getClientAccountForUser(userEmail);
  if (!clientCtx) return false;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true },
  });

  return Boolean(project && project.clientId === clientCtx.client.id);
}

/**
 * Authoritative RBAC check for posting daily progress updates:
 * - OWNER: Authorized for any project.
 * - EMPLOYEE: Authorized ONLY if active member of ProjectMembership for that project.
 * - SALES / CLIENT / ANONYMOUS: Denied.
 */
export async function canUserCreateDailyUpdate(
  userId: string,
  userRole: string,
  projectId: string
): Promise<boolean> {
  if (!userId || !projectId) return false;

  if (userRole === "OWNER") {
    return true;
  }

  if (userRole === "EMPLOYEE") {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employee) return false;

    const membership = await prisma.projectMembership.findFirst({
      where: {
        projectId,
        employeeId: employee.id,
        isActive: true,
      },
    });

    return Boolean(membership);
  }

  return false;
}
