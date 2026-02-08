import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import ClientForm from "@/components/ClientForm";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const metadata = {
  title: "Редактировать клиента",
};

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/");
  }

  // Получаем пользователя и его workspace
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    redirect("/");
  }

  // Получаем клиента
  const client = await prisma.client.findFirst({
    where: {
      id,
      workspaceId: user.workspaceId,
    },
    select: {
      id: true,
      name: true,
      company: true,
      contactPerson: true,
      email: true,
      phone: true,
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white shadow-sm">
      <SiteHeader
        title="Редактирование клиента"
        actions={
          <Button asChild variant="ghost" size="sm" className="text-sm text-neutral-500 hover:text-neutral-900">
            <Link href="/clients">Назад</Link>
          </Button>
        }
      />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        <ClientForm
          mode="edit"
          clientId={client.id}
          initialData={{
            name: client.name,
            company: client.company ?? "",
            contactPerson: client.contactPerson ?? "",
            email: client.email,
            phone: client.phone ?? "",
          }}
        />
      </main>
    </div>
  );
}
