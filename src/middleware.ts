import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  console.log("MIDDLEWARE HIT:", pathname);
  
  // Exclude static files, API routes, login, client registration, terms, and portal
  const isPublicRoute = 
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname === "/login" ||
    pathname.endsWith("/login") ||
    pathname === "/client-register" ||
    pathname.endsWith("/client-register") ||
    pathname.startsWith("/client-register") ||
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

  // OWNER only routes
  const ownerOnlyRoutes = ["/owner", "/finance", "/audit", "/attendance-requests", "/employees"];
  if (ownerOnlyRoutes.some(r => pathname.startsWith(r)) && token?.role !== "OWNER") {
    return NextResponse.redirect(new URL("/mdz-crm/login", req.url));
  }

  // SALES or OWNER routes
  const salesRoutes = ["/leads", "/clients", "/sales", "/quotes"];
  if (salesRoutes.some(r => pathname.startsWith(r)) && token?.role !== "OWNER" && token?.role !== "SALES") {
    return NextResponse.redirect(new URL("/mdz-crm/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
