import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isProductAdmin } from "@/lib/admin";
import { authSessionMaxAgeSeconds } from "@/lib/auth/session";
import { ensureWorkspaceForUser, type WorkspaceAssignableUser } from "@/lib/auth/workspace";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "dev-secret" : undefined);
const usingDevSecretFallback =
  !process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "development";

if (!authSecret) {
  throw new Error("NEXTAUTH_SECRET must be set");
}
if (usingDevSecretFallback) {
  console.warn(
    "[auth] NEXTAUTH_SECRET is not set. Using insecure development fallback secret.",
  );
}

export const enabledOAuthProviders: Array<{ id: string; name: string }> = [];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "database",
    maxAge: authSessionMaxAgeSeconds,
  },
  secret: authSecret,
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  providers: [],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role as Role;
        session.user.workspaceId = user.workspaceId;
        session.user.isAdmin = isProductAdmin(session.user.email);
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await ensureWorkspaceForUser(user as WorkspaceAssignableUser);
    },
    async signIn({ user }) {
      await ensureWorkspaceForUser(user as WorkspaceAssignableUser);
    },
  },
  debug: process.env.NODE_ENV === "development" && process.env.NEXTAUTH_DEBUG === "true",
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
