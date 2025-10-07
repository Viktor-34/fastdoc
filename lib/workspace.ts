"use server";

import { cookies, headers } from "next/headers";

import {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_COOKIE,
  WORKSPACE_HEADER,
} from "./workspace-constants";

function normalizeWorkspaceId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function getActiveWorkspaceId(explicit?: string | null) {
  return (
    normalizeWorkspaceId(explicit) ??
    normalizeWorkspaceId(headers().get(WORKSPACE_HEADER)) ??
    normalizeWorkspaceId(cookies().get(WORKSPACE_COOKIE)?.value) ??
    DEFAULT_WORKSPACE_ID
  );
}

export function setActiveWorkspaceCookie(workspaceId: string) {
  const normalized = normalizeWorkspaceId(workspaceId) ?? DEFAULT_WORKSPACE_ID;
  cookies().set({
    name: WORKSPACE_COOKIE,
    value: normalized,
    path: "/",
    sameSite: "lax",
  });
  return normalized;
}

export function clearWorkspaceCookie() {
  cookies().delete(WORKSPACE_COOKIE);
}
