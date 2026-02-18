'use client';

import { useEffect, useRef, useState } from 'react';
import type { Proposal } from '@/lib/types/proposal';
import ClientSelector from '@/components/ClientSelector';

interface BasicInfoSectionProps {
  proposal: Proposal;
  onUpdate: <K extends keyof Proposal>(field: K, value: Proposal[K]) => void;
}

export default function BasicInfoSection({ proposal, onUpdate }: BasicInfoSectionProps) {
  const [client, setClient] = useState<{ name: string; middleName?: string } | null>(null);
  const lastAutofilledClientIdRef = useRef<string | null>(null);

  // Загружаем данные клиента для автозаполнения обращения
  useEffect(() => {
    if (!proposal.clientId) {
      setClient(null);
      lastAutofilledClientIdRef.current = null;
      return;
    }

    fetch(`/api/clients/${proposal.clientId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setClient(data))
      .catch(() => setClient(null));
  }, [proposal.clientId]);

  // Автозаполнение обращения при выборе клиента
  useEffect(() => {
    if (client && !proposal.recipientName) {
      if (lastAutofilledClientIdRef.current === proposal.clientId) {
        return;
      }
      const greeting = client.middleName
        ? `Уважаемый ${client.name} ${client.middleName}!`
        : `Уважаемый ${client.name}!`;
      onUpdate('recipientName', greeting);
      lastAutofilledClientIdRef.current = proposal.clientId ?? null;
    }
  }, [client, proposal.clientId, proposal.recipientName, onUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Клиент
        </label>
        <ClientSelector
          value={proposal.clientId ?? null}
          onChange={(clientId) => onUpdate('clientId', clientId ?? undefined)}
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Выберите клиента из списка или оставьте пустым
        </p>
      </div>

      <div>
        <label htmlFor="proposal-title" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Название коммерческого предложения
        </label>
        <input
          id="proposal-title"
          type="text"
          value={proposal.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Например: Разработка корпоративного сайта"
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
        />
      </div>

      <div>
        <label htmlFor="recipient-name" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Обращение
        </label>
        <input
          id="recipient-name"
          type="text"
          value={proposal.recipientName || ''}
          onChange={(e) => onUpdate('recipientName', e.target.value)}
          placeholder="Уважаемый Иван Петрович!"
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Заполняется автоматически при выборе клиента
        </p>
      </div>
    </div>
  );
}
