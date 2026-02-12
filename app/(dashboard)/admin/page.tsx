import { redirect } from "next/navigation";
import { Users, Building2, FileText, Eye } from "lucide-react";

import { getServerAuthSession } from "@/lib/auth";
import { isProductAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";
import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Владелец",
  USER: "Пользователь",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/auth/signin");

  // Только администратор продукта имеет доступ к админ-панели.
  if (!isProductAdmin(session.user.email)) {
    redirect("/");
  }

  // Параллельные запросы для статистики.
  const [
    totalUsers,
    totalWorkspaces,
    totalProposals,
    totalClients,
    totalProducts,
    totalShareLinks,
    totalViews,
    proposalsByStatus,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.proposal.count(),
    prisma.client.count(),
    prisma.product.count(),
    prisma.shareLink.count(),
    prisma.shareLink.aggregate({ _sum: { viewCount: true } }),
    prisma.proposal.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        Workspace: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                Proposal: true,
                Client: true,
                Product: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const views = totalViews._sum.viewCount ?? 0;

  // Статусы КП.
  const statusMap: Record<string, number> = {};
  for (const s of proposalsByStatus) {
    statusMap[s.status] = s._count.id;
  }

  const statsCards = [
    {
      title: "Пользователи",
      value: totalUsers.toString(),
      badge: { label: `${totalWorkspaces} простр.`, icon: Building2 },
    },
    {
      title: "Коммерческие предложения",
      value: totalProposals.toString(),
      badge: {
        label: `${statusMap["draft"] ?? 0} черновиков`,
        icon: FileText,
      },
    },
    {
      title: "Клиенты / Товары",
      value: `${totalClients} / ${totalProducts}`,
    },
    {
      title: "Просмотры по ссылкам",
      value: views.toString(),
      badge: { label: `${totalShareLinks} ссылок`, icon: Eye },
    },
  ];

  return (
    <>
      <SiteHeader title="Админ-панель" />
      <main className="mx-auto w-full max-w-7xl bg-white px-4 py-6 md:px-6">
        {/* Карточки статистики */}
        <div className="rounded-[12px] bg-[#F3F2F0] p-[12px]">
          <SectionCards cards={statsCards} className="gap-4" />
        </div>

        {/* Статусы КП */}
        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { key: "draft", label: "Черновики", color: "bg-gray-100 text-gray-700" },
            { key: "sent", label: "Отправлены", color: "bg-blue-100 text-blue-700" },
            { key: "accepted", label: "Приняты", color: "bg-green-100 text-green-700" },
            { key: "rejected", label: "Отклонены", color: "bg-red-100 text-red-700" },
          ].map(({ key, label, color }) => (
            <span
              key={key}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${color}`}
            >
              {label}: {statusMap[key] ?? 0}
            </span>
          ))}
        </div>

        {/* Таблица пользователей */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-[#3D3D3A]">
            Пользователи ({totalUsers})
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Рабочее пространство</TableHead>
                  <TableHead className="text-center">КП</TableHead>
                  <TableHead className="text-center">Клиенты</TableHead>
                  <TableHead>Регистрация</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.role === "OWNER"
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-neutral-200 bg-neutral-50 text-neutral-600"
                        }
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {u.Workspace?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.Workspace?._count.Proposal ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.Workspace?._count.Client ?? 0}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                      {formatDate(u.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </>
  );
}
