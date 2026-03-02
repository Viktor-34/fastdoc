import { prisma } from "@/lib/db/prisma";
import { isProductAdmin } from "@/lib/admin";

export type WorkspaceAssignableUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  workspaceId?: string | null;
  role?: string | null;
};

function buildWorkspaceName(user: WorkspaceAssignableUser) {
  if (user.name?.trim()) return `${user.name.trim()} — рабочее пространство`;
  if (user.email?.trim()) {
    const emailPrefix = user.email.trim().split("@")[0] ?? "workspace";
    return `${emailPrefix} — рабочее пространство`;
  }
  return "Моё рабочее пространство";
}

export async function ensureWorkspaceForUser(user: WorkspaceAssignableUser) {
  if (user.workspaceId) return user.workspaceId;

  const workspace = await prisma.workspace.create({
    data: {
      name: buildWorkspaceName(user),
    },
  });

  const role = isProductAdmin(user.email) ? "OWNER" : "USER";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      workspaceId: workspace.id,
      role,
    },
  });

  return workspace.id;
}
