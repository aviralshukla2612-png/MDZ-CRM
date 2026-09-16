import { prisma } from "./prisma";
import { CurrentUserSession } from "./auth";
import { isOwner, isSubAdmin, isSales, isProjectTM } from "./rbac";
import { getClientAccountForUser, verifyClientProjectAccess } from "./client-auth";

export interface MediaEntityMeta {
  entityType: string;
  entityId: string;
  category?: string;
  uploadedById?: string;
}

/**
 * Validates whether the authenticated user has permission to upload media to the specified entity.
 */
export async function canUploadMedia(
  user: CurrentUserSession,
  entityType: string,
  entityId: string
): Promise<boolean> {
  if (!user || !user.id) return false;

  // Universal admin access
  if (isOwner(user) || isSubAdmin(user)) return true;

  const type = entityType.toUpperCase();

  switch (type) {
    case "PROJECT": {
      if (user.activeRole === "EMPLOYEE") {
        if (!user.employeeId) {
          const emp = await prisma.employee.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });
          if (!emp) return false;
          user.employeeId = emp.id;
        }

        const membership = await prisma.projectMembership.findFirst({
          where: {
            projectId: entityId,
            employeeId: user.employeeId,
            isActive: true,
          },
        });
        return Boolean(membership);
      }

      if (user.activeRole === "CLIENT") {
        return await verifyClientProjectAccess(user.email, entityId);
      }

      if (isSales(user)) {
        return true;
      }
      return false;
    }

    case "CLIENT": {
      if (isSales(user)) return true;
      if (user.activeRole === "CLIENT") {
        const clientCtx = await getClientAccountForUser(user.email);
        return Boolean(clientCtx && clientCtx.client.id === entityId);
      }
      return false;
    }

    case "TASK": {
      if (user.activeRole === "EMPLOYEE") {
        const task = await prisma.task.findUnique({
          where: { id: entityId },
          select: { projectId: true, assignedToId: true },
        });
        if (!task) return false;
        if (task.assignedToId === user.id) return true;

        if (!user.employeeId) {
          const emp = await prisma.employee.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });
          if (!emp) return false;
          user.employeeId = emp.id;
        }

        const membership = await prisma.projectMembership.findFirst({
          where: {
            projectId: task.projectId,
            employeeId: user.employeeId,
            isActive: true,
          },
        });
        return Boolean(membership);
      }
      return false;
    }

    case "USER": {
      // Users can upload their own profile avatar
      return user.id === entityId;
    }

    case "INVOICE": {
      return isSales(user);
    }

    default:
      return false;
  }
}

/**
 * Validates whether the authenticated user has permission to read/stream a media file.
 */
export async function canReadMedia(
  user: CurrentUserSession,
  mediaFile: MediaEntityMeta
): Promise<boolean> {
  if (!user || !user.id) return false;

  // Universal admin access
  if (isOwner(user) || isSubAdmin(user)) return true;

  // Original uploader can always read their own file
  if (mediaFile.uploadedById && mediaFile.uploadedById === user.id) return true;

  const type = mediaFile.entityType.toUpperCase();

  switch (type) {
    case "PROJECT": {
      if (user.activeRole === "CLIENT") {
        // Clients can read project documents only if the project belongs to them AND the document is not internal-only
        if (mediaFile.category === "INTERNAL") return false;
        return await verifyClientProjectAccess(user.email, mediaFile.entityId);
      }

      if (user.activeRole === "EMPLOYEE") {
        if (!user.employeeId) {
          const emp = await prisma.employee.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });
          if (!emp) return false;
          user.employeeId = emp.id;
        }

        const membership = await prisma.projectMembership.findFirst({
          where: {
            projectId: mediaFile.entityId,
            employeeId: user.employeeId,
            isActive: true,
          },
        });
        return Boolean(membership);
      }

      if (isSales(user)) return true;
      return false;
    }

    case "CLIENT": {
      if (user.activeRole === "CLIENT") {
        const clientCtx = await getClientAccountForUser(user.email);
        return Boolean(clientCtx && clientCtx.client.id === mediaFile.entityId);
      }
      // Internal staff can view client records
      return true;
    }

    case "INVOICE": {
      if (user.activeRole === "CLIENT") {
        const invoice = await prisma.invoice.findUnique({
          where: { id: mediaFile.entityId },
          select: { clientId: true },
        });
        if (!invoice) return false;
        const clientCtx = await getClientAccountForUser(user.email);
        return Boolean(clientCtx && clientCtx.client.id === invoice.clientId);
      }
      return true;
    }

    case "USER": {
      // User avatars / public employee media can be read by any logged-in user
      return true;
    }

    case "TASK": {
      if (user.activeRole === "EMPLOYEE") {
        return true;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Validates whether the user can delete a media file.
 */
export async function canDeleteMedia(
  user: CurrentUserSession,
  mediaFile: MediaEntityMeta
): Promise<boolean> {
  if (!user || !user.id) return false;

  // Universal admin deletion authority
  if (isOwner(user) || isSubAdmin(user)) return true;

  // Original uploader can delete their own uploaded files
  if (mediaFile.uploadedById && mediaFile.uploadedById === user.id) return true;

  // Project TM has authority over files in their managed project
  if (mediaFile.entityType.toUpperCase() === "PROJECT") {
    return await isProjectTM(user.id, mediaFile.entityId);
  }

  return false;
}
