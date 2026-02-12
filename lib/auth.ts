import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isProductAdmin } from "@/lib/admin";
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

if (!emailConfigured && process.env.NODE_ENV === "production") {
  console.warn(
    "[auth] ⚠️  SMTP не настроен (EMAIL_SERVER_HOST/PORT/USER/PASSWORD). " +
      "Пользователи НЕ смогут войти через magic-link!",
  );
}

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

function buildMagicLinkHtml(url: string): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f5;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;padding:40px;max-width:480px">
        <tr><td>
          <h2 style="margin:0 0 16px;color:#3d3d3a;font-size:20px">Вход в Offerdoc</h2>
          <p style="margin:0 0 24px;color:#6b6b68;font-size:15px;line-height:1.5">
            Нажмите кнопку ниже, чтобы войти в систему. Ссылка действует 15 минут.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background-color:#3d3d3a;border-radius:8px;padding:12px 32px">
            <a href="${url}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">Войти</a>
          </td></tr></table>
          <p style="margin:0;color:#a0a09c;font-size:13px;line-height:1.4">
            Если вы не запрашивали вход — просто проигнорируйте это письмо.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

async function sendVerificationRequest({
  identifier,
  url,
}: SendVerificationRequestParams) {
  await emailTransport.sendMail({
    to: identifier,
    from: emailFrom,
    subject: "Ваш вход в Offerdoc",
    text: `Здравствуйте!\n\nПерейдите по ссылке, чтобы войти:\n${url}\n\nСсылка действует 15 минут.\n\nЕсли вы не запрашивали вход — просто проигнорируйте это письмо.`,
    html: buildMagicLinkHtml(url),
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
