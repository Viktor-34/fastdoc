"use client";

import { useState } from "react";
import Link from "next/link";

import ProposalsList, { DocumentItem, ProposalStatus } from "@/components/ProposalsList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'draft', label: 'Черновик' },
  { value: 'sent', label: 'Отправлено' },
  { value: 'accepted', label: 'Принято' },
  { value: 'rejected', label: 'Отклонено' },
] as const;

interface ProposalsBoardProps {
  initialDocuments: DocumentItem[];
}

// Доска предложений: поиск по документам и кнопка создания нового.
export function ProposalsBoard({ initialDocuments }: ProposalsBoardProps) {
  // Храним текст поискового запроса, чтобы фильтровать список.
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | ProposalStatus>('all');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {/* Поле поиска фильтрует список по названию документа или клиенту. */}
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию или клиенту"
            className="w-full max-w-sm"
          />
          {/* Фильтр по статусу */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as 'all' | ProposalStatus)}
          >
            <SelectTrigger
              className="h-9 w-[200px] rounded-[12px] border border-[#E2E8F0] bg-white px-4 text-sm font-medium tracking-[-0.42px] text-[#0F172B] shadow-[0_1px_2px_rgba(10,10,10,0.06)]"
            >
              <SelectValue>
                {STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label || 'Все статусы'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Кнопка для перехода в редактор и создания нового предложения. */}
        <Button
          asChild
          className="h-9 rounded-xl bg-[#C6613F] px-4 text-sm font-medium text-[#FAFAFA] shadow-[0px_1px_2px_0px_rgba(10,10,10,0.06)] hover:bg-[#A04F33]"
        >
          <Link href="/editor">Создать предложение</Link>
        </Button>
      </div>

      {/* Передаём введённый запрос и фильтр статуса в список для фильтрации данных. */}
      <ProposalsList initialDocuments={initialDocuments} query={query} statusFilter={statusFilter} />
    </div>
  );
}
