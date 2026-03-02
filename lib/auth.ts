import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isProductAdmin } from "@/lib/admin";
import { consumeMagicLinkToken, normalizeEmail } from "@/lib/auth/magic-link";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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

type WorkspaceAssignableUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  workspaceId?: string | null;
  role?: string | null;
};

function buildWorkspaceName(user: WorkspaceAssignableUser) {
  if (user.name?.trim()) return `${user.name.trim()} — рабочее пространство`;
  if (user.email?.trim()) {
    const emailPrefix = user.email.trim().split("@")[0] ?? "workspace";
    return `${emailPrefix} — рабочее пространство`;
  }
  return "Моё рабочее пространство";
}

async function ensureWorkspaceForUser(user: WorkspaceAssignableUser) {
  if (user.workspaceId) return user.workspaceId;

  const workspace = await prisma.workspace.create({
    data: {
      name: buildWorkspaceName(user),
    },
  });

  // Роль OWNER назначается только администраторам продукта (ADMIN_EMAILS),
  // все остальные получают USER (Prisma default).
  const role = isProductAdmin(user.email) ? "OWNER" : "USER";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      workspaceId: workspace.id,
      role,
    },
  });

  return workspace.id;
}

export const enabledOAuthProviders: Array<{ id: string; name: string }> = [];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  },
  secret: authSecret,
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = typeof credentials?.token === "string" ? credentials.token.trim() : "";
        if (!token) return null;

        const payload = await consumeMagicLinkToken(token);
        if (!payload) return null;

        const email = normalizeEmail(payload.email);
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              role: isProductAdmin(email) ? "OWNER" : "USER",
            },
          });
        }

        if (!user.workspaceId) {
          await ensureWorkspaceForUser(user as WorkspaceAssignableUser);
          user = await prisma.user.findUnique({
            where: { email },
          });
        }

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          workspaceId: user.workspaceId,
        };
      },
    }),
  ],
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
