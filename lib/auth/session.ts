export const authSessionMaxAgeSeconds = 60 * 60 * 24 * 30;

export function shouldUseSecureAuthCookies() {
  return process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.NODE_ENV === "production";
}

export function getAuthSessionCookieName() {
  return `${shouldUseSecureAuthCookies() ? "__Secure-" : ""}next-auth.session-token`;
}

export function getAuthSessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: shouldUseSecureAuthCookies(),
    expires,
  };
}
