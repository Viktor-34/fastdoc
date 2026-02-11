import { Clock, TrendingUp, Users } from "lucide-react";

import { ProposalsBoard } from "@/components/proposals-board";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/db/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";

// Главная страница: обзор коммерческих предложений и сводная статистика.
export default async function HomePage() {
  const session = await getServerAuthSession();
  const workspaceId = session?.user.workspaceId ?? DEFAULT_WORKSPACE_ID;
  // Получаем предложения из базы, сортируя по дате обновления.
  const proposals = await prisma.proposal.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: {
      Client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Приводим Prisma-модели к сериализуемому формату.
  const serialized = proposals.map((proposal) => ({
    id: proposal.id,
    title: proposal.title,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    updatedBy: proposal.updatedBy,
    clientName: proposal.Client?.name ?? null,
    status: proposal.status as 'draft' | 'sent' | 'accepted' | 'rejected',
  }));

  // Считаем метрики для карточек: динамику, клиентов и т.д.
  const now = Date.now();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const updatedLast7Days = serialized.filter(
    (proposal) => now - new Date(proposal.updatedAt).getTime() <= 7 * MS_PER_DAY,
  ).length;
  const createdLast7Days = serialized.filter(
    (proposal) => now - new Date(proposal.createdAt).getTime() <= 7 * MS_PER_DAY,
  ).length;
  const uniqueClients = new Set(
    serialized
      .map((proposal) => proposal.updatedBy)
      .filter((value): value is string => Boolean(value)),
  ).size;
  const latestProposal = serialized[0];
  const latestUpdatedAt = latestProposal ? new Date(latestProposal.updatedAt) : null;

  const statsCards = [
    {
      title: "Всего предложений",
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
          ? { label: "Обновляли предложения", icon: Users }
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
    <div className="flex min-h-svh flex-1 flex-col">
      <SiteHeader title="Коммерческие предложения" />
      <main className="mx-auto flex w-full flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        {/* Карточки с основными показателями по предложениям. */}
        <div className="rounded-[12px] bg-[#F3F2F0] p-[12px]">
          <SectionCards cards={statsCards} className="gap-4" />
        </div>
        {/* Список предложений с поиском и кнопкой создания. */}
        <ProposalsBoard initialDocuments={serialized} />
      </main>
    </div>
  );
}
