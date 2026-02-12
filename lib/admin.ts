/**
 * Проверяет, является ли email администратором продукта.
 * Список задаётся через ADMIN_EMAILS в .env (через запятую).
 */

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export function isProductAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails.has(email.toLowerCase());
}
