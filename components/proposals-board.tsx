"use client";

import { useState } from "react";
import Link from "next/link";

import ProposalsList, { DocumentItem } from "@/components/ProposalsList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProposalsBoardProps {
  initialDocuments: DocumentItem[];
}

// Доска предложений: поиск по документам и кнопка создания нового.
export function ProposalsBoard({ initialDocuments }: ProposalsBoardProps) {
  // Храним текст поискового запроса, чтобы фильтровать список.
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Поле поиска фильтрует список по названию документа или клиенту. */}
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию или клиенту"
          className="w-full max-w-sm rounded-xl border-neutral-200 bg-white text-sm"
        />
        {/* Кнопка для перехода в редактор и создания нового предложения. */}
        <Button asChild className="h-9 rounded-xl px-4 text-sm font-medium">
          <Link href="/editor">+ Новое предложение</Link>
        </Button>
      </div>

      {/* Передаём введённый запрос в список для фильтрации данных. */}
      <ProposalsList initialDocuments={initialDocuments} query={query} />
    </div>
  );
}
