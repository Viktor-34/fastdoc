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

function applyNoStoreHeaders(response: Response): Response {
  response.headers.set("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

async function noStoreGET(req: NextRequest, ctx: unknown): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (handler as any)(req, ctx);
  return applyNoStoreHeaders(response as Response);
}

async function rateLimitedPOST(req: NextRequest, ctx: unknown): Promise<Response> {
  const blocked = checkSigninRate(req);
  if (blocked) return applyNoStoreHeaders(blocked);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (handler as any)(req, ctx);
  return applyNoStoreHeaders(response as Response);
}

export { noStoreGET as GET, rateLimitedPOST as POST };
