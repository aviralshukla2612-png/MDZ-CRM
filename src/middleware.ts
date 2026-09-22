import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  console.log("MIDDLEWARE HIT:", pathname);
  
  // Exclude static files, API routes, login, client registration, inquiry, terms, and portal
  const isPublicRoute = 
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname === "/login" ||
    pathname.endsWith("/login") ||
    pathname === "/client-register" ||
    pathname.endsWith("/client-register") ||
    pathname.startsWith("/client-register") ||
    pathname === "/inquiry" ||
    pathname.endsWith("/inquiry") ||
    pathname.startsWith("/inquiry") ||
    pathname.includes("/inquiry") ||
    pathname === "/terms-and-conditions" ||
    pathname.endsWith("/terms-and-conditions") ||
    pathname.startsWith("/terms-and-conditions") ||
    pathname.startsWith("/portal") ||
    pathname.includes("/portal") ||
    pathname.includes(".");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookiePrefix = useSecureCookies ? "__Secure-" : "";
  const cookieName = `${cookiePrefix}mdz-crm.session-token`;

  const token = await getToken({ req, cookieName });
  console.log("MIDDLEWARE TOKEN ROLE:", token?.role, "FOR PATH:", pathname);

  if (!token) {
    return NextResponse.redirect(new URL("/mdz-crm/login", req.url));
  }

  const role = token?.role;
  const relPath = pathname.replace(/^\/mdz-crm/, "") || "/";

  // OWNER & ADMIN only routes
  const ownerOnlyRoutes = ["/finance"];
  if (ownerOnlyRoutes.some(r => relPath.startsWith(r)) && role !== "OWNER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/mdz-crm/login", req.url));
  }

  // Management routes: OWNER, ADMIN, SUB_ADMIN
  const managementRoutes = ["/owner", "/audit", "/attendance-requests", "/employees", "/leave-requests"];
  if (managementRoutes.some(r => relPath.startsWith(r)) && role !== "OWNER" && role !== "ADMIN" && role !== "SUB_ADMIN") {
    return NextResponse.redirect(new URL("/mdz-crm/login", req.url));
  }

  // Sales routes: OWNER, ADMIN, SUB_ADMIN, SALES
  const salesRoutes = ["/leads", "/sales", "/quotes"];
  if (salesRoutes.some(r => relPath.startsWith(r)) && role !== "OWNER" && role !== "ADMIN" && role !== "SUB_ADMIN" && role !== "SALES") {
    return NextResponse.redirect(new URL("/mdz-crm/login", req.url));
  }

  // Clients routes: OWNER, ADMIN, SUB_ADMIN, SALES
  const clientsRoutes = ["/clients"];
  if (clientsRoutes.some(r => relPath.startsWith(r)) && role !== "OWNER" && role !== "ADMIN" && role !== "SUB_ADMIN" && role !== "SALES") {
    return NextResponse.redirect(new URL("/mdz-crm/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
