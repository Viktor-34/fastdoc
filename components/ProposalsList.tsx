"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Link2, Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

// Описание одного документа в списке.
export type DocumentItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
};

interface ProposalsListProps {
  initialDocuments: DocumentItem[];
  query?: string;
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

// Список предложений: фильтрация по запросу, копирование ссылок и удаление.
export default function ProposalsList({ initialDocuments, query = "" }: ProposalsListProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Удаляем документ и обновляем локальный список.
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/doc/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Failed to delete document", error);
      alert("Не удалось удалить документ");
    } finally {
      setDeletingId(null);
    }
  };

  // Запрашиваем временную ссылку и копируем её в буфер обмена.
  const handleCopyLink = async (id: string) => {
    try {
      setCopyingId(id);
      const response = await fetch(`/api/doc/${id}/share`, { method: "POST" });
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

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return documents;
    return documents.filter((doc) =>
      [doc.title, doc.updatedBy ?? ""].some((field) => field.toLowerCase().includes(value)),
    );
  }, [documents, query]);

  // Если документов совсем нет, показываем заглушку с кнопкой создания.
  if (documents.length === 0) {
    return (
      <Card className="border border-dashed p-0">
        <CardContent className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-neutral-900">
              Пока нет документов
            </CardTitle>
            <p className="text-sm text-neutral-500">
              Создайте новое предложение, чтобы начать работу.
            </p>
          </div>
          <Button asChild size="sm" className="self-start">
            <Link href="/editor">Создать документ</Link>
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
      {filtered.map((doc) => {
        const isDeleting = deletingId === doc.id;
        const isCopying = copyingId === doc.id;
        const isCopied = copiedId === doc.id;

        return (
          <Card
            key={doc.id}
            className="h-full transition-all duration-150 hover:shadow-md p-0"
          >
            <CardContent className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-base font-semibold text-neutral-900">
                  {/* Заголовок ведёт в редактор с выбранным документом. */}
                  <Link
                    href={`/editor?documentId=${doc.id}`}
                    className="transition-colors hover:text-neutral-700"
                  >
                    {doc.title || "Без названия"}
                  </Link>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span>
                    Обновлено: {new Date(doc.updatedAt).toLocaleDateString("ru-RU")}
                  </span>
                  {/* Показываем клиента, если он указан. */}
                  <Badge variant="outline" className="bg-neutral-100/70">
                    {doc.updatedBy ? `Клиент: ${doc.updatedBy}` : "Клиент: —"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Кнопка копирования публичной ссылки: меняет текст в зависимости от состояния. */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCopying}
                  onClick={() => handleCopyLink(doc.id)}
                  className="gap-2"
                >
                  {isCopying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                  <span className="truncate">
                    {isCopied ? "Скопировано" : isCopying ? "Копируем…" : "Скопировать ссылку"}
                  </span>
                </Button>
                {/* Кнопка удаления документа с анимацией загрузки. */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isDeleting}
                  onClick={() => handleDelete(doc.id)}
                  className="text-neutral-500 hover:text-red-500"
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  <span className="sr-only">Удалить</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
