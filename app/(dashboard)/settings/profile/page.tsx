import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

import { ProfileForm } from "./profile-form";

export default async function ProfileSettingsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const [user, workspace] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        role: true,
      },
    }),
    session.user.workspaceId
      ? prisma.workspace.findUnique({
          where: { id: session.user.workspaceId },
          select: { name: true },
        })
      : null,
  ]);

  if (!user) {
    redirect("/auth/signin");
  }

  const canEditWorkspace = user.role === "OWNER" || user.role === "ADMIN";

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white shadow-sm">
      <SiteHeader title="Профиль и рабочая область" />
      <main className="mx-auto flex w-full flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        <ProfileForm
          initialName={user.name ?? ""}
          email={user.email}
          workspaceName={workspace?.name}
          canEditWorkspace={canEditWorkspace}
        />
      </main>
    </div>
  );
}
