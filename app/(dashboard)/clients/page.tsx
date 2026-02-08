import { redirect } from "next/navigation";
import { Clock, Mail, TrendingUp, Users } from "lucide-react";

import ClientsTable, { type ClientItem } from "@/components/ClientsTable";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const metadata = {
  title: "Клиенты",
};

export default async function ClientsPage() {
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

  // Получаем всех клиентов workspace
  const clients = await prisma.client.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      company: true,
      contactPerson: true,
      middleName: true,
      position: true,
      email: true,
      phone: true,
      updatedAt: true,
    },
  });

  const clientItems: ClientItem[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    company: client.company,
    contactPerson: client.contactPerson,
    middleName: client.middleName,
    position: client.position,
    email: client.email,
    phone: client.phone,
    updatedAt: client.updatedAt.toISOString(),
  }));

  // Рассчитываем статистику для карточек
  const now = Date.now();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const updatedLast7Days = clientItems.filter(
    (client) => now - new Date(client.updatedAt).getTime() <= 7 * MS_PER_DAY,
  ).length;
  const companiesCount = new Set(
    clientItems.map((client) => client.company).filter((c): c is string => Boolean(c)),
  ).size;
  const withContactPerson = clientItems.filter((client) => client.contactPerson).length;
  const latestClient = clientItems[0];
  const latestUpdatedAt = latestClient ? new Date(latestClient.updatedAt) : null;

  const statsCards = [
    {
      title: "Всего клиентов",
      value: clientItems.length.toString(),
      badge:
        updatedLast7Days > 0
          ? { label: `+${updatedLast7Days} за 7 дней`, icon: TrendingUp }
          : undefined,
    },
    {
      title: "Компаний",
      value: companiesCount.toString(),
      badge: companiesCount > 0 ? { label: "Уникальных компаний", icon: Users } : undefined,
    },
    {
      title: "С контактным лицом",
      value: withContactPerson.toString(),
      badge: withContactPerson > 0 ? { label: "Указано контактное лицо", icon: Mail } : undefined,
    },
    {
      title: "Последнее обновление",
      value: latestUpdatedAt
        ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(latestUpdatedAt)
        : "—",
      badge: latestUpdatedAt
        ? {
            label: new Intl.DateTimeFormat("ru-RU", { timeStyle: "short" }).format(latestUpdatedAt),
            icon: Clock,
          }
        : undefined,
    },
  ];

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white shadow-sm">
      <SiteHeader title="База клиентов" />
      <main className="mx-auto flex w-full flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        {/* Карточки со статистикой */}
        <div className="rounded-[12px] bg-[#F3F2F0] p-[12px]">
          <SectionCards cards={statsCards} className="gap-4" />
        </div>
        {/* Таблица клиентов с поиском */}
        <ClientsTable initialClients={clientItems} />
      </main>
    </div>
  );
}
