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

  const trimmed = userEmail.trim();
  const lower = trimmed.toLowerCase();

  // 1. Fetch user to check role and id
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: trimmed }, { email: lower }],
    },
  });

  // Internal agency staff (OWNER, ADMIN, SUB_ADMIN, SALES, EMPLOYEE) do NOT have a client account
  if (user && user.activeRole !== "CLIENT") {
    return null;
  }

  // 2. Primary lookup: Find ClientContact by email
  let contact = await prisma.clientContact.findFirst({
    where: {
      OR: [{ email: trimmed }, { email: lower }],
    },
    include: { client: true },
  });

  // 3. Fallback lookup: Find Client by email
  let client = contact?.client || null;
  if (!client) {
    client = await prisma.client.findFirst({
      where: {
        OR: [{ email: trimmed }, { email: lower }],
      },
      include: { contacts: true },
    });
  }

  // 4. Fallback lookup: Find Client created by this user
  if (!client && user) {
    client = await prisma.client.findFirst({
      where: { createdById: user.id },
      include: { contacts: true },
    });
  }

  // 5. Fallback lookup for CLIENT role: match by companyName or phone
  if (!client && user && user.activeRole === "CLIENT") {
    client = await prisma.client.findFirst({
      where: { companyName: user.name },
      include: { contacts: true },
    });

    if (!client && user.phone) {
      client = await prisma.client.findFirst({
        where: { phone: user.phone },
        include: { contacts: true },
      });
    }

    // Provision client if missing for active CLIENT user so they are never unmapped
    if (!client) {
      const clientNumber = `CLI-${Date.now().toString().slice(-6)}`;
      client = await prisma.client.create({
        data: {
          clientNumber,
          companyName: user.name || "Client Brand",
          email: lower,
          phone: user.phone || "",
          createdById: user.id,
          contacts: {
            create: {
              name: user.name || "Primary Contact",
              designation: user.designation || "Primary Contact",
              email: lower,
              isPrimary: true,
              termsAccepted: true,
              termsAcceptedAt: new Date(),
            },
          },
        },
        include: { contacts: true },
      });
    }
  }

  if (client) {
    if (!contact) {
      contact = await prisma.clientContact.findFirst({
        where: { clientId: client.id },
        include: { client: true },
        orderBy: { isPrimary: "desc" },
      });
    }

    return {
      client: {
        id: client.id,
        clientNumber: client.clientNumber,
        companyName: client.companyName,
        email: client.email,
        gstNumber: client.gstNumber,
      },
      contact: contact
        ? {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            designation: contact.designation,
            termsAccepted: contact.termsAccepted,
            termsAcceptedAt: contact.termsAcceptedAt,
            termsVersion: contact.termsVersion,
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

  const project = await prisma.project.findFirst({
    where: { OR: [{ id: projectId }, { projectNumber: projectId }] },
    select: { id: true, clientId: true },
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

  if (userRole === "OWNER" || userRole === "ADMIN" || userRole === "SUB_ADMIN") {
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
