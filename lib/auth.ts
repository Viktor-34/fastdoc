import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import nodemailer from "nodemailer";
import type { SendVerificationRequestParams } from "next-auth/providers/email";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";

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

const emailFrom = process.env.EMAIL_FROM ?? "no-reply@offerdoc.app";
const emailHost = process.env.EMAIL_SERVER_HOST;
const emailPort = process.env.EMAIL_SERVER_PORT
  ? Number(process.env.EMAIL_SERVER_PORT)
  : undefined;
const emailUser = process.env.EMAIL_SERVER_USER;
const emailPassword = process.env.EMAIL_SERVER_PASSWORD;

const emailConfigured =
  Boolean(emailHost) &&
  Boolean(emailPort) &&
  Boolean(emailUser) &&
  Boolean(emailPassword);

const emailTransport = emailConfigured
  ? nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    })
  : nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: "unix",
    });

async function sendVerificationRequest({
  identifier,
  url,
}: SendVerificationRequestParams) {
  await emailTransport.sendMail({
    to: identifier,
    from: emailFrom,
    subject: "Ваш вход в Offerdoc",
    text: `Здравствуйте!\n\nПерейдите по ссылке, чтобы войти:\n${url}\n\nСсылка действует 15 минут.`,
    html: `<p>Здравствуйте!</p><p>Перейдите по ссылке, чтобы войти:</p><p><a href="${url}">Войти в Offerdoc</a></p><p>Ссылка действует 15 минут.</p>`,
  });

  if (!emailConfigured) {
    console.info("[auth] Отправлена magic-link (эмуляция почты):", {
      email: identifier,
      url,
    });
  }
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

  await prisma.user.update({
    where: { id: user.id },
    data: {
      workspaceId: workspace.id,
      role: "OWNER",
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
    EmailProvider({
      sendVerificationRequest,
      maxAge: 15 * 60, // 15 минут
      from: emailFrom,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role as Role;
        session.user.workspaceId = user.workspaceId;
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
