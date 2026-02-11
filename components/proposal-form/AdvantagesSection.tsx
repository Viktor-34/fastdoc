'use client';

import Image from 'next/image';
import { useCallback, useMemo, type ChangeEvent } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';

import type { AdvantageItem, Proposal } from '@/lib/types/proposal';

interface AdvantagesSectionProps {
  proposal: Proposal;
  onUpdate: <K extends keyof Proposal>(field: K, value: Proposal[K]) => void;
}

const MAX_ADVANTAGES = 3;
const FIELD_BORDER_COLOR = 'var(--field-border)';
const TEXT_PRIMARY = '#3d3d3a';
const TEXT_MUTED = '#73726c';

const createAdvantage = (): AdvantageItem => ({
  id: `adv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  description: '',
});

export default function AdvantagesSection({ proposal, onUpdate }: AdvantagesSectionProps) {
  const advantages = useMemo(() => proposal.advantages ?? [], [proposal.advantages]);
  const columns = proposal.advantagesColumns ?? 3;

  const updateAdvantages = useCallback(
    (next: AdvantageItem[]) => {
      onUpdate('advantages', next);
    },
    [onUpdate],
  );

  const handleAdd = useCallback(() => {
    if (advantages.length >= MAX_ADVANTAGES) return;
    const next = [...advantages, createAdvantage()];

    // Для 3 карточек держим 3 колонки, чтобы весь блок был в один ряд.
    // Обновляем колонки ДО advantages, чтобы оба поля ушли в один цикл автосохранения.
    if (next.length === 3 && columns < 3) {
      onUpdate('advantagesColumns', 3);
    }
    updateAdvantages(next);
  }, [advantages, columns, onUpdate, updateAdvantages]);

  const handleRemove = useCallback(
    (index: number) => {
      updateAdvantages(advantages.filter((_, current) => current !== index));
    },
    [advantages, updateAdvantages],
  );

  const handleFieldChange = useCallback(
    (index: number, patch: Partial<AdvantageItem>) => {
      const next = advantages.map((item, current) => (current === index ? { ...item, ...patch } : item));
      updateAdvantages(next);
    },
    [advantages, updateAdvantages],
  );

  const handleIconUpload = useCallback(
    async (index: number, file: File | null) => {
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = (await response.json()) as { url: string };
        handleFieldChange(index, { iconUrl: data.url });
      } catch (error) {
        console.error('Failed to upload advantage icon:', error);
        alert('Не удалось загрузить иконку');
      }
    },
    [handleFieldChange],
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 block text-sm font-medium" style={{ color: '#3d3d3a' }}>
          Преимущества
        </h3>
        <p className="text-xs" style={{ color: '#73726c' }}>
          Добавьте до {MAX_ADVANTAGES} карточек: иконка, заголовок и описание.
        </p>
      </div>

      <div>
        <label htmlFor="advantages-columns" className="mb-2 block text-sm font-medium" style={{ color: '#3d3d3a' }}>
          Колонки в блоке
        </label>
        <select
          id="advantages-columns"
          value={columns}
          onChange={(event) => onUpdate('advantagesColumns', Number(event.target.value) as 1 | 2 | 3)}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-[#3d3d3a] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
        >
          <option value={1}>1 колонка</option>
          <option value={2}>2 колонки</option>
          <option value={3}>3 колонки</option>
        </select>
      </div>

      <div className="space-y-4">
        {advantages.map((item, index) => (
          <div
            key={item.id ?? index}
            className="space-y-4 rounded-lg border bg-[#FAFAFA] p-4"
            style={{ borderColor: FIELD_BORDER_COLOR }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Карточка {index + 1}</p>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded-md p-2 text-[#73726c] transition-colors hover:bg-[#f4f2ec] hover:text-red-600"
                aria-label="Удалить карточку"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label
                className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed bg-white"
                style={{ borderColor: FIELD_BORDER_COLOR }}
              >
                {item.iconUrl ? (
                  <Image
                    src={item.iconUrl}
                    alt="Иконка преимущества"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-5 w-5" style={{ color: '#a5a29b' }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    void handleIconUpload(index, event.target.files?.[0] ?? null);
                  }}
                />
              </label>
              <p className="text-xs" style={{ color: TEXT_MUTED }}>Иконка (PNG/JPG)</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: '#3d3d3a' }}>
                Заголовок
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(event) => handleFieldChange(index, { title: event.target.value })}
                placeholder="Например: Прозрачная смета"
                className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-[#3d3d3a] placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: '#3d3d3a' }}>
                Описание
              </label>
              <textarea
                value={item.description}
                onChange={(event) => handleFieldChange(index, { description: event.target.value })}
                placeholder="Короткое описание преимущества"
                rows={3}
                className="w-full resize-y rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-[#3d3d3a] placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
              />
            </div>
          </div>
        ))}
      </div>

      {advantages.length < MAX_ADVANTAGES && (
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-[#3d3d3a] transition-colors hover:bg-[#f4f2ec]"
          style={{ borderColor: FIELD_BORDER_COLOR }}
        >
          <Plus className="h-4 w-4" />
          Добавить карточку
        </button>
      )}
    </div>
  );
}
