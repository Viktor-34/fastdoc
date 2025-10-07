import Link from "next/link";
import { Clock, TrendingUp, Users } from "lucide-react";

import ProposalsList from "@/components/ProposalsList";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";

export default async function HomePage() {
  const documents = await prisma.document.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const serialized = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    updatedBy: doc.updatedBy,
  }));

  const now = Date.now();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const updatedLast7Days = serialized.filter(
    (doc) => now - new Date(doc.updatedAt).getTime() <= 7 * MS_PER_DAY,
  ).length;
  const createdLast7Days = serialized.filter(
    (doc) => now - new Date(doc.createdAt).getTime() <= 7 * MS_PER_DAY,
  ).length;
  const uniqueClients = new Set(
    serialized
      .map((doc) => doc.updatedBy)
      .filter((value): value is string => Boolean(value)),
  ).size;
  const latestDocument = serialized[0];
  const latestUpdatedAt = latestDocument ? new Date(latestDocument.updatedAt) : null;

  const statsCards = [
    {
      title: "Всего документов",
      value: serialized.length.toString(),
      badge:
        updatedLast7Days > 0
          ? { label: `+${updatedLast7Days} за 7 дней`, icon: TrendingUp }
          : undefined,
    },
    {
      title: "Новых за неделю",
      value: createdLast7Days.toString(),
      badge:
        createdLast7Days > 0
          ? { label: "Добавлены недавно", icon: TrendingUp }
          : undefined,
    },
    {
      title: "Активных клиентов",
      value: uniqueClients.toString(),
      badge:
        uniqueClients > 0
          ? { label: "Обновляли документы", icon: Users }
          : undefined,
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
      <SiteHeader
        label="Обзор"
        title="Коммерческие предложения"
        description="Управляйте документами и делитесь ссылками с клиентами."
        actions={
          <Button asChild size="sm">
            <Link href="/editor">Новое предложение</Link>
          </Button>
        }
      />
      <main className="mx-auto flex w-full flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        <SectionCards cards={statsCards} />
        <ProposalsList initialDocuments={serialized} />
      </main>
    </div>
  );
}
