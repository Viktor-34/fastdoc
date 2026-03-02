import crypto from "node:crypto";

import { isProductAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";
import { authSessionMaxAgeSeconds } from "@/lib/auth/session";
import { ensureWorkspaceForUser } from "@/lib/auth/workspace";

const emailFrom = process.env.EMAIL_FROM ?? "no-reply@offerdoc.app";
const emailHost = process.env.EMAIL_SERVER_HOST;
const emailPort = process.env.EMAIL_SERVER_PORT
  ? Number(process.env.EMAIL_SERVER_PORT)
  : undefined;
const emailUser = process.env.EMAIL_SERVER_USER;
const emailPassword = process.env.EMAIL_SERVER_PASSWORD;
const unisenderGoApiKey = process.env.UNISENDER_GO_API_KEY?.trim();
const unisenderGoApiUrl = (
  process.env.UNISENDER_GO_API_URL ??
  "https://goapi.unisender.ru/ru/transactional/api/v1"
).replace(/\/+$/, "");
const emailConfigured =
  Boolean(emailHost) &&
  Boolean(emailPort) &&
  Boolean(emailUser) &&
  Boolean(emailPassword);
const magicLinkMaxAgeMs = 15 * 60 * 1000;

let emailTransportPromise: Promise<{
  sendMail: (options: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown>;
}> | null = null;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashMagicLinkToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildMagicLinkUrl(token: string, origin: string): string {
  const url = new URL("/auth/verify", origin);
  url.searchParams.set("token", token);
  return url.toString();
}

async function getEmailTransport() {
  if (!emailTransportPromise) {
    emailTransportPromise = import("nodemailer").then(({ default: nodemailer }) =>
      emailConfigured
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
          }),
    );
  }

  return emailTransportPromise;
}

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
            Нажмите кнопку ниже, чтобы подтвердить вход. Ссылка действует 15 минут.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="background-color:#3d3d3a;border-radius:8px;padding:12px 32px">
            <a href="${url}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">Подтвердить вход</a>
          </td></tr></table>
          <p style="margin:0;color:#a0a09c;font-size:13px;line-height:1.4">
            Если вы не запрашивали вход, просто проигнорируйте это письмо.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function buildMagicLinkText(url: string): string {
  return `Здравствуйте!\n\nПерейдите по ссылке, чтобы подтвердить вход:\n${url}\n\nСсылка действует 15 минут.\n\nЕсли вы не запрашивали вход — просто проигнорируйте это письмо.`;
}

function parseFromAddress(from: string): { email: string; name?: string } {
  const match = from.match(/^\s*([^<>]+?)\s*<\s*([^<>@\s]+@[^<>@\s]+)\s*>\s*$/);
  if (match) {
    return {
      name: match[1]?.trim(),
      email: match[2].trim(),
    };
  }

  return { email: from.trim() };
}

async function sendMagicLinkViaUnisenderApi({
  identifier,
  subject,
  text,
  html,
}: {
  identifier: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!unisenderGoApiKey) {
    throw new Error("[auth] Unisender API key is not configured");
  }

  const { email, name } = parseFromAddress(emailFrom);
  const payload = {
    message: {
      recipients: [{ email: identifier }],
      body: {
        html,
        plaintext: text,
      },
      subject,
      from_email: email,
      track_links: 0,
      track_read: 0,
      ...(name ? { from_name: name } : {}),
    },
  };

  const response = await fetch(`${unisenderGoApiUrl}/email/send.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-KEY": unisenderGoApiKey,
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(
      `[auth] Unisender API error ${response.status}: ${rawBody || response.statusText}`,
    );
  }

  if (rawBody) {
    try {
      const parsed = JSON.parse(rawBody) as { status?: string; message?: string };
      if (parsed?.status === "error") {
        throw new Error(
          `[auth] Unisender API error: ${parsed.message ?? "unknown error"}`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("[auth] Unisender API")) {
        throw error;
      }
    }
  }
}

export async function sendMagicLinkEmail({
  email,
  verifyUrl,
}: {
  email: string;
  verifyUrl: string;
}) {
  const subject = "Ваш вход в Offerdoc";
  const text = buildMagicLinkText(verifyUrl);
  const html = buildMagicLinkHtml(verifyUrl);

  if (unisenderGoApiKey) {
    await sendMagicLinkViaUnisenderApi({
      identifier: email,
      subject,
      text,
      html,
    });
    return;
  }

  const emailTransport = await getEmailTransport();

  await emailTransport.sendMail({
    to: email,
    from: emailFrom,
    subject,
    text,
    html,
  });

  if (!emailConfigured) {
    console.info("[auth] Отправлена custom magic-link (эмуляция почты):", {
      emailDomain: email.split("@")[1] ?? "unknown",
    });
  }
}

export async function createMagicLinkToken(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashMagicLinkToken(rawToken);
  const expiresAt = new Date(Date.now() + magicLinkMaxAgeMs);

  await prisma.$transaction([
    prisma.magicLinkToken.deleteMany({
      where: {
        email: normalizedEmail,
      },
    }),
    prisma.magicLinkToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  return rawToken;
}

export async function consumeMagicLinkToken(token: string): Promise<{ email: string } | null> {
  const tokenHash = hashMagicLinkToken(token);
  const record = await prisma.magicLinkToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() <= Date.now()) return null;

  const usedAt = new Date();
  const result = await prisma.magicLinkToken.updateMany({
    where: {
      id: record.id,
      usedAt: null,
      expiresAt: {
        gt: usedAt,
      },
    },
    data: {
      usedAt,
    },
  });

  if (result.count !== 1) return null;

  return { email: record.email };
}

export async function findOrCreateMagicLinkUser(email: string) {
  const normalizedEmail = normalizeEmail(email);
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        role: isProductAdmin(normalizedEmail) ? "OWNER" : "USER",
      },
    });
  }

  if (!user.workspaceId) {
    await ensureWorkspaceForUser(user);
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  return user;
}

export async function createDatabaseSession(userId: string) {
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + authSessionMaxAgeSeconds * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expires,
    },
  });

  return session;
}
