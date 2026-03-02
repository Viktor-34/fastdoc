import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  buildMagicLinkUrl,
  createMagicLinkToken,
  normalizeEmail,
  sendMagicLinkEmail,
} from "@/lib/auth/magic-link";
import { createKeyedRateLimiter, createRateLimiter } from "@/lib/rate-limit";

const requestSchema = z.object({
  email: z.string().email("Введите корректный email"),
});

const checkMagicLinkIpRate = createRateLimiter("auth-magic-link-ip", {
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

const checkMagicLinkEmailRate = createKeyedRateLimiter("auth-magic-link-email", {
  limit: 3,
  windowMs: 15 * 60 * 1000,
});

export async function POST(req: NextRequest) {
  const blockedByIp = checkMagicLinkIpRate(req);
  if (blockedByIp) return blockedByIp;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Введите корректный email" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const blockedByEmail = checkMagicLinkEmailRate(email);
  if (blockedByEmail) return blockedByEmail;

  try {
    const token = await createMagicLinkToken(email);
    const origin = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
    const verifyUrl = buildMagicLinkUrl(token, origin);

    await sendMagicLinkEmail({
      email,
      verifyUrl,
    });

    console.info("[auth] Custom magic-link sent:", {
      emailDomain: email.split("@")[1] ?? "unknown",
      transport: process.env.UNISENDER_GO_API_KEY
        ? "unisender-go"
        : process.env.EMAIL_SERVER_HOST
          ? "smtp"
          : "emulated",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth] Failed to send custom magic-link:", {
      emailDomain: email.split("@")[1] ?? "unknown",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Не удалось отправить письмо. Попробуйте ещё раз." },
      { status: 500 },
    );
  }
}
