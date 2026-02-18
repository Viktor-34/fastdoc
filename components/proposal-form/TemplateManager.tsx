'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Star, Trash2 } from 'lucide-react';
import type { Proposal } from '@/lib/types/proposal';
import type { ProposalTemplate } from '@/lib/types/proposal-template';
import { buildTemplateFromProposal } from '@/lib/proposal-templates/mapping';

interface TemplateManagerProps {
  isOpen: boolean;
  proposal: Proposal;
  visibleSections: string[];
  onClose: () => void;
  onTemplatesChanged?: () => void;
}

const getErrorMessage = async (response: Response): Promise<string> => {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw) as { error?: string; message?: string };
    return parsed.message || parsed.error || raw || `HTTP ${response.status}`;
  } catch {
    return raw || `HTTP ${response.status}`;
  }
};

export default function TemplateManager({
  isOpen,
  proposal,
  visibleSections,
  onClose,
  onTemplatesChanged,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionTemplateId, setActionTemplateId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const hasTemplates = templates.length > 0;

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/proposal-templates');
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }
      const data = (await response.json()) as ProposalTemplate[];
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      alert('Не удалось загрузить шаблоны');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadTemplates();
  }, [isOpen, loadTemplates]);

  const sortedTemplates = useMemo(
    () =>
      [...templates].sort((a, b) => {
        if (a.isDefault === b.isDefault) return 0;
        return a.isDefault ? -1 : 1;
      }),
    [templates],
  );

  const handleCreate = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      alert('Введите название шаблона');
      return;
    }

    setIsSubmitting(true);
    try {
      const { defaults, sections } = buildTemplateFromProposal(proposal, visibleSections);
      const response = await fetch('/api/proposal-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedName,
          description: description.trim() || null,
          category: 'custom',
          defaults,
          sections,
          isDefault,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setName('');
      setDescription('');
      setIsDefault(false);
      await loadTemplates();
      onTemplatesChanged?.();
      alert('Шаблон сохранён');
    } catch (error) {
      console.error('Failed to create template:', error);
      alert(`Не удалось сохранить шаблон: ${error instanceof Error ? error.message : 'Ошибка'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const patchTemplate = async (id: string, payload: Record<string, unknown>) => {
    setActionTemplateId(id);
    try {
      const response = await fetch('/api/proposal-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }
      await loadTemplates();
      onTemplatesChanged?.();
    } finally {
      setActionTemplateId(null);
    }
  };

  const handleRename = async (template: ProposalTemplate) => {
    const rawName = window.prompt('Новое название шаблона', template.name);
    if (rawName === null) return;
    const nextName = rawName.trim();
    if (!nextName) {
      alert('Название не может быть пустым');
      return;
    }

    try {
      await patchTemplate(template.id, { name: nextName });
    } catch (error) {
      console.error('Failed to rename template:', error);
      alert(`Не удалось переименовать шаблон: ${error instanceof Error ? error.message : 'Ошибка'}`);
    }
  };

  const handleEditDescription = async (template: ProposalTemplate) => {
    const nextDescription = window.prompt(
      'Описание шаблона (можно оставить пустым)',
      template.description ?? '',
    );
    if (nextDescription === null) return;

    try {
      await patchTemplate(template.id, { description: nextDescription });
    } catch (error) {
      console.error('Failed to update description:', error);
      alert(`Не удалось обновить описание: ${error instanceof Error ? error.message : 'Ошибка'}`);
    }
  };

  const handleSetDefault = async (template: ProposalTemplate) => {
    if (template.isDefault) return;
    try {
      await patchTemplate(template.id, { isDefault: true });
    } catch (error) {
      console.error('Failed to set default template:', error);
      alert(`Не удалось обновить шаблон по умолчанию: ${error instanceof Error ? error.message : 'Ошибка'}`);
    }
  };

  const handleDelete = async (template: ProposalTemplate) => {
    const confirmed = window.confirm(`Удалить шаблон «${template.name}»?`);
    if (!confirmed) return;

    setActionTemplateId(template.id);
    try {
      const response = await fetch('/api/proposal-templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: template.id }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }
      await loadTemplates();
      onTemplatesChanged?.();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert(`Не удалось удалить шаблон: ${error instanceof Error ? error.message : 'Ошибка'}`);
    } finally {
      setActionTemplateId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Шаблоны</h2>
          <p className="mt-1 text-sm text-slate-600">
            Сохраняйте текущее КП как шаблон и управляйте шаблонами команды
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-xl border border-[var(--field-border)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Новый шаблон из текущего КП</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="template-name" className="mb-1 block text-xs font-medium text-slate-600">
                  Название
                </label>
                <input
                  id="template-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Например: Продажа услуг / Базовый"
                  className="w-full rounded-lg border border-[var(--field-border)] px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              <div>
                <label htmlFor="template-description" className="mb-1 block text-xs font-medium text-slate-600">
                  Описание
                </label>
                <textarea
                  id="template-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Кратко: для какого сценария используется"
                  className="w-full rounded-lg border border-[var(--field-border)] px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(event) => setIsDefault(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--field-border)] accent-[#C6613F]"
                />
                Сделать шаблоном по умолчанию
              </label>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreate}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#C6613F] px-4 text-sm font-medium text-white transition hover:bg-[#A04F33] disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Сохранить как шаблон
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--field-border)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Мои шаблоны</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#C6613F]" />
              </div>
            ) : !hasTemplates ? (
              <p className="text-sm text-slate-500">Пока нет пользовательских шаблонов</p>
            ) : (
              <div className="space-y-2">
                {sortedTemplates.map((template) => {
                  const isBusy = actionTemplateId === template.id;
                  return (
                    <div
                      key={template.id}
                      className={`rounded-lg border p-3 ${
                        template.isDefault ? 'border-[#D8A18E] bg-[#FAEFEB]' : 'border-[var(--field-border)] bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                          {template.description ? (
                            <p className="mt-0.5 text-xs text-slate-500">{template.description}</p>
                          ) : null}
                        </div>
                        {template.isDefault ? (
                          <span className="rounded-full bg-[#C6613F] px-2 py-0.5 text-[10px] font-medium text-white">
                            По умолчанию
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRename(template)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--field-border)] px-2 text-xs text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Переименовать
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleEditDescription(template)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--field-border)] px-2 text-xs text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Описание
                        </button>

                        <button
                          type="button"
                          disabled={isBusy || template.isDefault}
                          onClick={() => handleSetDefault(template)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--field-border)] px-2 text-xs text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Star className="h-3.5 w-3.5" />
                          По умолчанию
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete(template)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 px-2 text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Удалить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
