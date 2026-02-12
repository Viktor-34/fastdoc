import { NextRequest } from "next/server";
import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

// Строгий лимит на POST (отправка magic-link): 5 запросов за 15 минут.
const checkSigninRate = createRateLimiter("auth-signin", {
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

async function rateLimitedPOST(req: NextRequest, ctx: unknown) {
  const blocked = checkSigninRate(req);
  if (blocked) return blocked;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handler as any)(req, ctx);
}

export { handler as GET, rateLimitedPOST as POST };
