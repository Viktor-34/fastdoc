"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy, Link2, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

// Статусы КП
export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

const STATUS_CHIP_STYLES: Record<
  ProposalStatus,
  { label: string; backgroundColor: string; color: string; borderColor: string }
> = {
  draft: {
    label: "Черновик",
    backgroundColor: "#F3F2F0",
    color: "#73726c",
    borderColor: "hsl(30deg 3.3% 11.8% / 15%)",
  },
  sent: {
    label: "Отправлено",
    backgroundColor: "#FAEFEB",
    color: "#A04F33",
    borderColor: "#E4B5A6",
  },
  accepted: {
    label: "Принято",
    backgroundColor: "#EAF6EE",
    color: "#2F6B45",
    borderColor: "#B9DEC8",
  },
  rejected: {
    label: "Отклонено",
    backgroundColor: "#FDEDED",
    color: "#A53A3A",
    borderColor: "#E9B8B8",
  },
};
const TABLE_BORDER_COLOR = "hsl(30deg 3.3% 11.8% / 15%)";
const TABLE_HEADER_BG = "rgb(243, 242, 240)";
const TABLE_TEXT_PRIMARY = "#3d3d3a";
const TABLE_TEXT_MUTED = "#73726c";

// Описание одного документа в списке.
export type DocumentItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  clientName?: string | null;
  status?: ProposalStatus;
};

interface ProposalsListProps {
  initialDocuments: DocumentItem[];
  query?: string;
  statusFilter?: 'all' | ProposalStatus;
}

// Утилита для копирования ссылки в буфер (с запасным вариантом для старых браузеров).
const copyToClipboard = async (value: string) => {
  const fallback = () => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  if (navigator.clipboard?.writeText) {
    try {
      if (typeof document.hasFocus === "function" && !document.hasFocus()) {
        window.focus?.();
      }
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      console.warn("Clipboard API unavailable, using fallback", error);
    }
  }

  fallback();
};

// Список предложений: фильтрация по запросу и статусу, копирование ссылок и удаление.
export default function ProposalsList({ initialDocuments, query = "", statusFilter = 'all' }: ProposalsListProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Удаляем предложение и обновляем локальный список.
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Failed to delete proposal", error);
      alert("Не удалось удалить предложение");
    } finally {
      setDeletingId(null);
    }
  };

  // Запрашиваем временную ссылку и копируем её в буфер обмена.
  const handleCopyLink = async (id: string) => {
    try {
      setCopyingId(id);
      const response = await fetch(`/api/proposals/${id}/share`, { method: "POST" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as { token: string };
      const shareUrl = `${window.location.origin}/p/${data.token}`;

      await copyToClipboard(shareUrl);

      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch (error) {
      console.error("Failed to copy share link", error);
      alert("Не удалось скопировать ссылку");
    } finally {
      setCopyingId(null);
    }
  };

  // Дублируем предложение
  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const response = await fetch(`/api/proposals/${id}/duplicate`, { method: "POST" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const newProposal = await response.json();
      // Добавляем новое предложение в начало списка
      setDocuments((prev) => [
        {
          id: newProposal.id,
          title: newProposal.title,
          createdAt: newProposal.createdAt,
          updatedAt: newProposal.updatedAt,
          updatedBy: newProposal.updatedBy,
          clientName: null, // Будет загружено при необходимости
        },
        ...prev,
      ]);
      alert("Предложение успешно дублировано");
    } catch (error) {
      console.error("Failed to duplicate proposal", error);
      alert("Не удалось дублировать предложение");
    } finally {
      setDuplicatingId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = documents;

    // Фильтрация по статусу
    if (statusFilter !== 'all') {
      result = result.filter((doc) => doc.status === statusFilter);
    }

    // Фильтрация по текстовому запросу
    const value = query.trim().toLowerCase();
    if (value) {
      result = result.filter((doc) =>
        [doc.title, doc.updatedBy ?? "", doc.clientName ?? ""].some((field) => field.toLowerCase().includes(value)),
      );
    }

    return result;
  }, [documents, query, statusFilter]);

  // Вычисляем пагинацию
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = filtered.slice(startIndex, endIndex);

  // Сбрасываем на первую страницу при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  // Не даём текущей странице выйти за границы после удаления/фильтрации.
  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  // Если предложений совсем нет, показываем заглушку с кнопкой создания.
  if (documents.length === 0) {
    return (
      <Card className="border border-dashed p-0">
        <CardContent className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-neutral-900">
              Пока нет предложений
            </CardTitle>
            <p className="text-sm text-neutral-500">
              Создайте новое предложение, чтобы начать работу.
            </p>
          </div>
          <Button asChild size="sm" className="self-start">
            <Link href="/editor">Создать предложение</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Если список есть, но запрос ничего не нашёл, выводим подсказку.
  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-8 text-center text-sm text-neutral-500">
        Ничего не найдено. Попробуйте изменить запрос.
      </div>
    );
  }

  return (
      <div className="flex flex-col gap-4">
      {/* Таблица */}
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: TABLE_BORDER_COLOR }}>
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            {/* Заголовок таблицы */}
            <div
              className="flex h-10 items-center gap-8 border-b"
              style={{ borderColor: TABLE_BORDER_COLOR, backgroundColor: TABLE_HEADER_BG }}
            >
              <div className="min-w-[220px] flex-1 px-[10px] pl-[26px]">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>Название</span>
              </div>
              <div className="w-[120px] shrink-0 px-2">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>Статус</span>
              </div>
              <div className="w-[180px] shrink-0 px-2">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>Клиент</span>
              </div>
              <div className="w-[220px] shrink-0 px-2 pl-6">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>Обновлено</span>
              </div>
              <div className="shrink-0 px-2" aria-hidden="true">
                <div className="flex items-center gap-2 opacity-0">
                  <span className="inline-block size-4" />
                  <span className="inline-block size-8" />
                  <span className="inline-block size-8" />
                </div>
              </div>
            </div>

            {/* Тело таблицы */}
            <div className="bg-white">
              {paginatedDocuments.map((doc) => {
                const isDeleting = deletingId === doc.id;
                const isCopying = copyingId === doc.id;
                const isCopied = copiedId === doc.id;
                const isDuplicating = duplicatingId === doc.id;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-8 border-b transition-colors hover:bg-neutral-50"
                    style={{ borderColor: TABLE_BORDER_COLOR }}
                  >
                    {/* Название */}
                    <div className="min-w-[220px] flex-1 px-[10px] py-2 pl-[26px]">
                      <Link
                        href={`/editor?proposalId=${doc.id}`}
                        className="block truncate text-[14px] font-medium tracking-tight transition-colors hover:text-neutral-700"
                        style={{ color: TABLE_TEXT_PRIMARY }}
                      >
                        {doc.title || "Без названия"}
                      </Link>
                    </div>

                    {/* Статус */}
                    <div className="flex w-[120px] shrink-0 items-center px-2 py-2">
                      {(() => {
                        const statusStyle = STATUS_CHIP_STYLES[doc.status ?? "draft"];
                        return (
                          <span
                            className="inline-flex h-[22px] items-center rounded-full border px-[10px] text-[12px] font-medium"
                            style={{
                              backgroundColor: statusStyle.backgroundColor,
                              color: statusStyle.color,
                              borderColor: statusStyle.borderColor,
                            }}
                          >
                            {statusStyle.label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Клиент */}
                    <div className="flex w-[180px] shrink-0 items-center px-2 py-2">
                      {doc.clientName ? (
                        <div
                          className="flex h-[22px] items-center justify-center rounded-full border px-[10px]"
                          style={{
                            backgroundColor: "#F3F2F0",
                            borderColor: TABLE_BORDER_COLOR,
                          }}
                        >
                          <span className="max-w-[150px] truncate text-[12px] font-medium" style={{ color: TABLE_TEXT_PRIMARY }}>
                            {doc.clientName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </div>

                    {/* Обновлено */}
                    <div className="flex w-[220px] shrink-0 items-center px-2 py-2 pl-6">
                      <span className="whitespace-nowrap text-[12px] font-medium" style={{ color: "rgb(115, 114, 108)" }}>
                        {new Date(doc.updatedAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}{" "}
                        {new Date(doc.updatedAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    {/* Действия */}
                    <div className="flex shrink-0 items-center gap-2 px-2">
                      <button
                        type="button"
                        disabled={isCopying}
                        onClick={() => handleCopyLink(doc.id)}
                        className="flex items-center gap-2 transition-colors hover:text-neutral-900 disabled:opacity-50"
                        style={{ color: TABLE_TEXT_MUTED }}
                        title={isCopied ? "Скопировано" : "Скопировать ссылку"}
                      >
                        {isCopying ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Link2 className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isDuplicating}
                        onClick={() => handleDuplicate(doc.id)}
                        className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-neutral-100 hover:text-[var(--field-focus)] disabled:opacity-50"
                        style={{ color: TABLE_TEXT_MUTED }}
                        title="Дублировать"
                      >
                        {isDuplicating ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(doc.id)}
                        className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-neutral-100 hover:text-red-500 disabled:opacity-50"
                        style={{ color: TABLE_TEXT_MUTED }}
                        title="Удалить"
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          {/* Левая часть - выбор количества элементов */}
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

          {/* Правая часть - кнопки навигации */}
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

            {/* Номера страниц */}
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
                    currentPage === pageNum
                      ? "bg-[#C6613F] text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
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
