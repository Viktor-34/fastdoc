"use client";

import {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_COOKIE,
  WORKSPACE_HEADER,
} from "./workspace-constants";

// Преобразуем строку куки в объект ключ-значение.
function parseCookies(source: string) {
  return source.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.split("=");
    if (!rawKey) return acc;
    const key = rawKey.trim();
    if (!key) return acc;
    const value = rawValue.join("=").trim();
    try {
      acc[key] = decodeURIComponent(value);
    } catch {
      acc[key] = value;
    }
    return acc;
  }, {});
}

// Получаем workspaceId из клиентских cookies.
export function getClientWorkspaceId(cookieString?: string) {
  if (typeof document === "undefined" && !cookieString) return null;
  const source = cookieString ?? document.cookie ?? "";
  const cookies = parseCookies(source);
  const value = cookies[WORKSPACE_COOKIE]?.trim();
  return value && value.length > 0 ? value : null;
}

// Сохраняем workspaceId в куку с безопасными атрибутами.
export function setClientWorkspaceId(workspaceId: string, options?: { maxAgeSeconds?: number }) {
  if (typeof document === "undefined") return;
  const sanitized = workspaceId.trim() || DEFAULT_WORKSPACE_ID;
  const attributes = ["path=/", "SameSite=Lax"];
  if (options?.maxAgeSeconds) {
    attributes.push(`Max-Age=${options.maxAgeSeconds}`);
  }
  document.cookie = `${WORKSPACE_COOKIE}=${encodeURIComponent(sanitized)}; ${attributes.join("; ")}`;
}

// Добавляем заголовок workspaceId ко всем fetch-запросам с клиента.
export function withWorkspaceHeader(init?: RequestInit) {
  const workspaceId = getClientWorkspaceId() ?? DEFAULT_WORKSPACE_ID;
  const headers = new Headers(init?.headers ?? {});
  headers.set(WORKSPACE_HEADER, workspaceId);
  return { ...(init ?? {}), headers } as RequestInit;
}
