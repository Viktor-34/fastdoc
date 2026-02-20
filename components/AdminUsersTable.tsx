"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  workspaceName: string | null;
  proposalsCount: number;
  clientsCount: number;
  createdAt: string;
}

interface AdminUsersTableProps {
  initialUsers: AdminUserItem[];
  currentUserId: string;
}

const TABLE_BORDER_COLOR = "hsl(30deg 3.3% 11.8% / 15%)";
const TABLE_HEADER_BG = "rgb(243, 242, 240)";
const TABLE_TEXT_PRIMARY = "#3d3d3a";
const TABLE_TEXT_MUTED = "#73726c";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Владелец",
  USER: "Пользователь",
};

export default function AdminUsersTable({ initialUsers, currentUserId }: AdminUsersTableProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return users;

    return users.filter((user) =>
      [user.email, user.name ?? "", user.workspaceName ?? ""].some((field) =>
        field.toLowerCase().includes(lower),
      ),
    );
  }, [users, query]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handleDelete = async (user: AdminUserItem) => {
    if (user.id === currentUserId) {
      alert("Нельзя удалить текущего пользователя");
      return;
    }

    if (!confirm(`Удалить пользователя ${user.email}?`)) {
      return;
    }

    setDeletingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!response.ok) {
        let message = "Не удалось удалить пользователя";
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Ignore invalid json and show default message.
        }
        throw new Error(message);
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error("Failed to delete user", error);
      alert(error instanceof Error ? error.message : "Не удалось удалить пользователя");
    } finally {
      setDeletingId(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-8 text-center text-sm text-neutral-500">
        Пользователей пока нет.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск по email или имени"
        className="w-full max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: TABLE_BORDER_COLOR }}>
        <div className="overflow-x-auto">
          <div className="min-w-[1120px] w-full">
            <div
              className="flex h-10 items-center gap-4 border-b"
              style={{ borderColor: TABLE_BORDER_COLOR, backgroundColor: TABLE_HEADER_BG }}
            >
              <div className="min-w-[220px] flex-1 px-[10px] pl-[26px]">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>
                  Email
                </span>
              </div>
              <div className="w-[160px] shrink-0 px-2">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>
                  Имя
                </span>
              </div>
              <div className="w-[130px] shrink-0 px-2">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>
                  Роль
                </span>
              </div>
              <div className="w-[220px] shrink-0 px-2">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>
                  Рабочее пространство
                </span>
              </div>
              <div className="w-[60px] shrink-0 px-2 text-center">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>
                  КП
                </span>
              </div>
              <div className="w-[80px] shrink-0 px-2 text-center">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>
                  Клиенты
                </span>
              </div>
              <div className="w-[140px] shrink-0 px-2">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>
                  Регистрация
                </span>
              </div>
              <div
                className="sticky right-0 z-10 flex w-[84px] shrink-0 justify-center border-l px-2 py-2 pr-[26px]"
                style={{ borderColor: TABLE_BORDER_COLOR, backgroundColor: TABLE_HEADER_BG }}
              >
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>
                  Действия
                </span>
              </div>
            </div>

            <div className="bg-white">
              {paginatedUsers.map((user) => {
                const isDeleting = deletingId === user.id;
                const isCurrent = user.id === currentUserId;

                return (
                  <div
                    key={user.id}
                    className="group flex items-center gap-4 border-b transition-colors hover:bg-neutral-50"
                    style={{ borderColor: TABLE_BORDER_COLOR }}
                  >
                    <div className="min-w-[220px] flex-1 px-[10px] py-2 pl-[26px]">
                      <span
                        className="block truncate text-[14px] font-medium tracking-tight"
                        style={{ color: TABLE_TEXT_PRIMARY }}
                        title={user.email}
                      >
                        {user.email}
                      </span>
                    </div>

                    <div className="w-[160px] shrink-0 px-2 py-2">
                      <span
                        className="block truncate text-sm"
                        style={{ color: TABLE_TEXT_MUTED }}
                        title={user.name ?? ""}
                      >
                        {user.name ?? "—"}
                      </span>
                    </div>

                    <div className="flex w-[130px] shrink-0 items-center px-2 py-2">
                      <Badge
                        variant="outline"
                        className={
                          user.role === "OWNER"
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-neutral-200 bg-neutral-50 text-neutral-600"
                        }
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </div>

                    <div className="w-[220px] shrink-0 px-2 py-2">
                      <span
                        className="block truncate text-sm"
                        style={{ color: TABLE_TEXT_MUTED }}
                        title={user.workspaceName ?? ""}
                      >
                        {user.workspaceName ?? "—"}
                      </span>
                    </div>

                    <div className="w-[60px] shrink-0 px-2 py-2 text-center text-sm" style={{ color: TABLE_TEXT_PRIMARY }}>
                      {user.proposalsCount}
                    </div>

                    <div className="w-[80px] shrink-0 px-2 py-2 text-center text-sm" style={{ color: TABLE_TEXT_PRIMARY }}>
                      {user.clientsCount}
                    </div>

                    <div className="w-[140px] shrink-0 px-2 py-2">
                      <span className="whitespace-nowrap text-[12px] font-medium" style={{ color: TABLE_TEXT_MUTED }}>
                        {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div
                      className="sticky right-0 z-[1] flex w-[84px] shrink-0 justify-center border-l bg-white px-2 py-2 pr-[26px] group-hover:bg-neutral-50"
                      style={{ borderColor: TABLE_BORDER_COLOR }}
                    >
                      <button
                        type="button"
                        disabled={isDeleting || isCurrent}
                        onClick={() => handleDelete(user)}
                        className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-neutral-100 hover:text-red-500 disabled:opacity-50"
                        style={{ color: isCurrent ? "#b0afa9" : TABLE_TEXT_MUTED }}
                        title={isCurrent ? "Нельзя удалить текущего пользователя" : "Удалить"}
                      >
                        {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="bg-white px-6 py-10 text-center text-sm text-neutral-500">
            Ничего не найдено. Попробуйте изменить запрос.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-[var(--field-border)] bg-white px-[13px] py-[9px] text-xs shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
              style={{ color: TABLE_TEXT_PRIMARY }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-8 text-sm" style={{ color: TABLE_TEXT_MUTED }}>
              {startIndex + 1}-{Math.min(endIndex, filtered.length)} из {filtered.length}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex size-8 items-center justify-center rounded-lg border bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: TABLE_BORDER_COLOR, color: TABLE_TEXT_MUTED }}
              title="Предыдущая страница"
            >
              <ChevronLeft className="size-4" />
            </button>

            {Array.from({ length: Math.min(6, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 6) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex size-8 items-center justify-center rounded-lg text-sm transition-colors ${
                    currentPage === pageNum ? "bg-[#C6613F] text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex size-8 items-center justify-center rounded-lg border bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: TABLE_BORDER_COLOR, color: TABLE_TEXT_MUTED }}
              title="Следующая страница"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
