"use server";

import { cookies, headers } from "next/headers";

import {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_COOKIE,
  WORKSPACE_HEADER,
} from "./workspace-constants";

// Приводим строку к нормальному виду: обрезаем пробелы, фильтруем пустые значения.
function normalizeWorkspaceId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

// Определяем активную рабочую область: берём явное значение, заголовок или куку.
export async function getActiveWorkspaceId(explicit?: string | null) {
  const headersList = await headers();
  const cookieStore = await cookies();
  
  return (
    normalizeWorkspaceId(explicit) ??
    normalizeWorkspaceId(headersList.get(WORKSPACE_HEADER)) ??
    normalizeWorkspaceId(cookieStore.get(WORKSPACE_COOKIE)?.value) ??
    DEFAULT_WORKSPACE_ID
  );
}

// Сохраняем рабочую область в cookies, чтобы клиент и сервер были синхронизированы.
export async function setActiveWorkspaceCookie(workspaceId: string) {
  const normalized = normalizeWorkspaceId(workspaceId) ?? DEFAULT_WORKSPACE_ID;
  const cookieStore = await cookies();
  cookieStore.set({
    name: WORKSPACE_COOKIE,
    value: normalized,
    path: "/",
    sameSite: "lax",
  });
  return normalized;
}

// Удаляем куку рабочей области (например, при выходе из аккаунта).
export async function clearWorkspaceCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(WORKSPACE_COOKIE);
}
