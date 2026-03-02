import { NextRequest, NextResponse } from "next/server";

import {
  consumeMagicLinkToken,
  createDatabaseSession,
  findOrCreateMagicLinkUser,
} from "@/lib/auth/magic-link";
import { getAuthSessionCookieName, getAuthSessionCookieOptions } from "@/lib/auth/session";
import { DEFAULT_WORKSPACE_ID, WORKSPACE_COOKIE } from "@/lib/workspace-constants";

function buildRedirectUrl(req: NextRequest, pathname: string, search?: string) {
  const origin = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const url = new URL(pathname, origin);
  if (search) url.search = search;
  return url;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(buildRedirectUrl(req, "/auth/error", "?error=Verification"));
  }

  const payload = await consumeMagicLinkToken(token);
  if (!payload) {
    return NextResponse.redirect(buildRedirectUrl(req, "/auth/error", "?error=Verification"));
  }

  const user = await findOrCreateMagicLinkUser(payload.email);
  if (!user) {
    return NextResponse.redirect(buildRedirectUrl(req, "/auth/error", "?error=Configuration"));
  }

  const session = await createDatabaseSession(user.id);
  const response = NextResponse.redirect(buildRedirectUrl(req, "/"));
  response.cookies.set(
    getAuthSessionCookieName(),
    session.sessionToken,
    getAuthSessionCookieOptions(session.expires),
  );
  response.cookies.set({
    name: WORKSPACE_COOKIE,
    value: user.workspaceId ?? DEFAULT_WORKSPACE_ID,
    path: "/",
    sameSite: "lax",
    secure: getAuthSessionCookieOptions(session.expires).secure,
    expires: session.expires,
  });

  return response;
}
