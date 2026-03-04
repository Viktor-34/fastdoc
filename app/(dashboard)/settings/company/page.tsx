import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

import { CompanySettingsForm } from "../components/settings-forms";

export default async function CompanySettingsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const workspace = session.user.workspaceId
    ? await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
        select: {
          name: true,
          logoUrl: true,
          signatureUrl: true,
          stampUrl: true,
          companyName: true,
          inn: true,
          ogrn: true,
          legalAddress: true,
          bankName: true,
          bik: true,
          accountNumber: true,
          signatoryRole: true,
          signatoryName: true,
          vatDefault: true,
          vatRate: true,
        },
      })
    : null;

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white shadow-sm">
      <SiteHeader
        label="Настройки"
        title="Настройки компании"
        description="Брендирование, реквизиты и параметры документов."
      />
      <main className="mx-auto flex w-full flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        <CompanySettingsForm workspaceData={workspace} />
      </main>
    </div>
  );
}
