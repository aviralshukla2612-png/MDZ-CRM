import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
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
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("NEXTAUTH AUTHORIZE CALLBACK FOR:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("NEXTAUTH: Missing credentials");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() },
            include: { employeeProfile: true },
          });

          console.log("NEXTAUTH FOUND USER:", user ? `${user.email} (Role: ${user.activeRole}, Active: ${user.isActive})` : "null");

          if (!user || !user.isActive) {
            console.log("NEXTAUTH: User not found or inactive for", credentials.email);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isPasswordValid) {
            console.log("NEXTAUTH: Password mismatch for", credentials.email);
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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

