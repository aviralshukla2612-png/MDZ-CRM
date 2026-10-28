import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const useSecureCookies =
  process.env.NODE_ENV === "production" &&
  (process.env.NEXTAUTH_URL?.startsWith("https://") ?? false);
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const authOptions: NextAuthOptions = {
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}mdz-crm.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}mdz-crm.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${cookiePrefix}mdz-crm.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email, Phone, or Employee ID", type: "text", placeholder: "you@example.com or phone" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("NEXTAUTH AUTHORIZE CALLBACK FOR:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("NEXTAUTH: Missing credentials");
          return null;
        }

        try {
          const rawIdentifier = credentials.email.trim();
          const lowerIdentifier = rawIdentifier.toLowerCase();
          const digitsOnly = rawIdentifier.replace(/\D/g, "");

          // 1. Try finding by email (case-insensitive)
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: lowerIdentifier },
                { email: rawIdentifier },
              ],
            },
            include: { employeeProfile: true },
          });

          // 2. Try finding by Employee ID Code (e.g. EMP-1234 or EMP-OWNER)
          if (!user && (lowerIdentifier.startsWith("emp") || lowerIdentifier.includes("emp"))) {
            const emp = await prisma.employee.findFirst({
              where: {
                OR: [
                  { employeeIdCode: rawIdentifier },
                  { employeeIdCode: lowerIdentifier.toUpperCase() },
                  { employeeIdCode: lowerIdentifier },
                ],
              },
              include: { user: { include: { employeeProfile: true } } },
            });
            if (emp?.user) {
              user = emp.user;
            }
          }

          // 3. Try finding by Phone Number (User, Employee, Client, or ClientContact)
          if (!user && (digitsOnly.length >= 7 || rawIdentifier.startsWith("+"))) {
            const last10 = digitsOnly.slice(-10);

            // A. Check user.phone directly
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { phone: rawIdentifier },
                  { phone: digitsOnly },
                  ...(digitsOnly.length >= 10 ? [{ phone: { contains: last10 } }] : []),
                ],
              },
              include: { employeeProfile: true },
            });

            // B. Check employee.phone
            if (!user) {
              const emp = await prisma.employee.findFirst({
                where: {
                  OR: [
                    { phone: rawIdentifier },
                    { phone: digitsOnly },
                    ...(digitsOnly.length >= 10 ? [{ phone: { contains: last10 } }] : []),
                  ],
                },
                include: { user: { include: { employeeProfile: true } } },
              });
              if (emp?.user) {
                user = emp.user;
              }
            }

            // C. Check client.phone
            if (!user) {
              const clients = await prisma.client.findMany({
                where: { phone: { not: "" } },
                select: { email: true, phone: true },
              });
              const matchedClient = clients.find((c) => {
                const cDigits = (c.phone || "").replace(/\D/g, "");
                return cDigits.endsWith(last10) || cDigits === digitsOnly;
              });
              if (matchedClient?.email) {
                user = await prisma.user.findFirst({
                  where: { email: matchedClient.email.trim().toLowerCase() },
                  include: { employeeProfile: true },
                });
              }
            }

            // D. Check clientContact.phone
            if (!user) {
              const contacts = await prisma.clientContact.findMany({
                where: { phone: { not: "" } },
                select: { email: true, phone: true },
              });
              const matchedContact = contacts.find((c) => {
                const cDigits = (c.phone || "").replace(/\D/g, "");
                return cDigits.endsWith(last10) || cDigits === digitsOnly;
              });
              if (matchedContact?.email) {
                user = await prisma.user.findFirst({
                  where: { email: matchedContact.email.trim().toLowerCase() },
                  include: { employeeProfile: true },
                });
              }
            }

            // E. Flexible in-memory phone check across users and employees if phone has formatting
            if (!user && digitsOnly.length >= 10) {
              const allUsersWithPhone = await prisma.user.findMany({
                where: { phone: { not: "" } },
                include: { employeeProfile: true },
              });
              const matchedUser = allUsersWithPhone.find((u) => {
                const uDigits = (u.phone || "").replace(/\D/g, "");
                return uDigits.endsWith(last10) || uDigits === digitsOnly;
              });
              if (matchedUser) {
                user = matchedUser;
              }
            }
          }

          console.log("NEXTAUTH FOUND USER:", user ? `${user.email} (Role: ${user.activeRole}, Active: ${user.isActive})` : "null");

          if (!user || !user.isActive) {
            console.log("NEXTAUTH: User not found or inactive for identifier", rawIdentifier);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isPasswordValid) {
            console.log("NEXTAUTH: Password mismatch for", rawIdentifier);
            return null;
          }

          // Strip large base64 strings from JWT to prevent Cookie Too Large / 400 Bad Request errors
          const safeAvatarUrl =
            user.avatarUrl && !user.avatarUrl.startsWith("data:") && user.avatarUrl.length < 500
              ? user.avatarUrl
              : null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.activeRole,
            designation: user.designation,
            employeeId: user.employeeProfile?.id || undefined,
            avatarUrl: safeAvatarUrl,
          };
        } catch (error: any) {
          console.error("NEXTAUTH AUTHORIZE EXCEPTION:", error?.message || error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.designation = (user as any).designation;
        token.employeeId = user.employeeId;
        const avatar = (user as any).avatarUrl;
        token.avatarUrl = avatar && !avatar.startsWith("data:") && avatar.length < 500 ? avatar : null;
      }
      if (trigger === "update" && session) {
        if (session.avatarUrl !== undefined) {
          token.avatarUrl =
            session.avatarUrl && !session.avatarUrl.startsWith("data:") && session.avatarUrl.length < 500
              ? session.avatarUrl
              : null;
        }
        if (session.name !== undefined) token.name = session.name;
        if (session.designation !== undefined) token.designation = session.designation;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as any).designation = token.designation as string | undefined;
        session.user.employeeId = token.employeeId as string | undefined;
        (session.user as any).avatarUrl = token.avatarUrl as string | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow cross-origin redirects to the production domain
      if (url.startsWith("https://www.millionairedizital.com")) {
        return url;
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
};

