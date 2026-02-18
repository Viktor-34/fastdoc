import { redirect } from "next/navigation";
import Link from "next/link";

import ClientForm from "@/components/ClientForm";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { getServerAuthSession } from "@/lib/auth";

export const metadata = {
  title: "Создать клиента",
};

export default async function NewClientPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white shadow-sm">
      <SiteHeader
        title="Новый клиент"
        actions={
          <Button asChild variant="ghost" size="sm" className="text-sm text-neutral-500 hover:text-neutral-900">
            <Link href="/clients">Назад</Link>
          </Button>
        }
      />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        <ClientForm mode="create" />
      </main>
    </div>
  );
}
