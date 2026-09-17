import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const targetEmployeeId = searchParams.get("employeeId");

    let userId = authRes.id;
    if (targetUserId || targetEmployeeId) {
      if (
        authRes.activeRole !== "OWNER" &&
        authRes.activeRole !== "ADMIN" &&
        authRes.activeRole !== "SUB_ADMIN" &&
        targetUserId !== authRes.id
      ) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      if (targetEmployeeId) {
        const emp = await prisma.employee.findFirst({
          where: { OR: [{ id: targetEmployeeId }, { employeeIdCode: targetEmployeeId }] },
          select: { userId: true },
        });
        if (emp) userId = emp.userId;
      } else if (targetUserId) {
        userId = targetUserId;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true, activeRole: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Error fetching avatar:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch avatar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { avatarUrl, targetUserId, targetEmployeeId } = body;

    if (!avatarUrl || typeof avatarUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "avatarUrl is required as a valid image URL or base64 data string" },
        { status: 400 }
      );
    }

    // Size check: limit base64 to ~6MB max
    if (avatarUrl.length > 8 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image is too large. Please select an image under 5MB." },
        { status: 400 }
      );
    }

    let resolvedUserId = authRes.id;

    if (targetUserId || targetEmployeeId) {
      const isPrivileged =
        authRes.activeRole === "OWNER" ||
        authRes.activeRole === "ADMIN" ||
        authRes.activeRole === "SUB_ADMIN";

      if (!isPrivileged && targetUserId !== authRes.id) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot change another user's photo" },
          { status: 403 }
        );
      }

      if (targetEmployeeId) {
        const emp = await prisma.employee.findFirst({
          where: {
            OR: [
              { id: targetEmployeeId },
              { employeeIdCode: targetEmployeeId },
              { userId: targetEmployeeId },
            ],
          },
          select: { userId: true },
        });
        if (emp) {
          resolvedUserId = emp.userId;
        } else {
          // If not in employee table, check if targetEmployeeId is actually a user ID
          const u = await prisma.user.findUnique({ where: { id: targetEmployeeId } });
          if (u) resolvedUserId = u.id;
        }
      } else if (targetUserId) {
        resolvedUserId = targetUserId;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedUserId },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, avatarUrl: true, activeRole: true },
    });

    return NextResponse.json({
      success: true,
      message: "Photo updated successfully",
      avatarUrl: updatedUser.avatarUrl,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating avatar:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const targetEmployeeId = searchParams.get("employeeId");

    let resolvedUserId = authRes.id;

    if (targetUserId || targetEmployeeId) {
      const isPrivileged =
        authRes.activeRole === "OWNER" ||
        authRes.activeRole === "ADMIN" ||
        authRes.activeRole === "SUB_ADMIN";

      if (!isPrivileged && targetUserId !== authRes.id) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      if (targetEmployeeId) {
        const emp = await prisma.employee.findFirst({
          where: { OR: [{ id: targetEmployeeId }, { employeeIdCode: targetEmployeeId }] },
          select: { userId: true },
        });
        if (emp) resolvedUserId = emp.userId;
      } else if (targetUserId) {
        resolvedUserId = targetUserId;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedUserId },
      data: { avatarUrl: null },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    return NextResponse.json({
      success: true,
      message: "Photo removed successfully",
      avatarUrl: null,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error deleting avatar:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove photo" },
      { status: 500 }
    );
  }
}
