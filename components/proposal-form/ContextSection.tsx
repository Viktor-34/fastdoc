'use client';

import type { Proposal } from '@/lib/types/proposal';

interface ContextSectionProps {
  proposal: Proposal;
  onUpdate: <K extends keyof Proposal>(field: K, value: Proposal[K]) => void;
}

export default function ContextSection({ proposal, onUpdate }: ContextSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="problem-desc" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Описание ситуации клиента (Point A)
        </label>
        <textarea
          id="problem-desc"
          value={proposal.problemDesc || ''}
          onChange={(e) => onUpdate('problemDesc', e.target.value)}
          placeholder="Опишите текущую ситуацию клиента, его проблемы или потребности..."
          rows={4}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Покажите, что вы понимаете проблему клиента
        </p>
      </div>

      <div>
        <label htmlFor="solution-desc" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Предлагаемое решение (Point B)
        </label>
        <textarea
          id="solution-desc"
          value={proposal.solutionDesc || ''}
          onChange={(e) => onUpdate('solutionDesc', e.target.value)}
          placeholder="Опишите, как ваше предложение решит проблему клиента..."
          rows={4}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Объясните выгоды и результаты для клиента
        </p>
      </div>

      <div>
        <label htmlFor="additional-desc" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Дополнительное описание
        </label>
        <textarea
          id="additional-desc"
          value={proposal.additionalDesc || ''}
          onChange={(e) => onUpdate('additionalDesc', e.target.value)}
          placeholder="Дополнительная информация, преимущества, гарантии..."
          rows={3}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Необязательное поле для дополнительной информации
        </p>
      </div>
    </div>
  );
}
