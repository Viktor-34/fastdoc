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
          Описание
        </label>
        <textarea
          id="problem-desc"
          value={proposal.problemDesc || ''}
          onChange={(e) => onUpdate('problemDesc', e.target.value)}
          placeholder="Опишите задачу, потребность или текущую ситуацию..."
          rows={4}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Кратко опишите суть задачи или запроса
        </p>
      </div>

      <div>
        <label htmlFor="solution-desc" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Решение
        </label>
        <textarea
          id="solution-desc"
          value={proposal.solutionDesc || ''}
          onChange={(e) => onUpdate('solutionDesc', e.target.value)}
          placeholder="Опишите, как вы решаете задачу и что предлагаете..."
          rows={4}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Опишите подход, результат или ожидаемый эффект
        </p>
      </div>

      <div>
        <label htmlFor="additional-desc" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Дополнительно
        </label>
        <textarea
          id="additional-desc"
          value={proposal.additionalDesc || ''}
          onChange={(e) => onUpdate('additionalDesc', e.target.value)}
          placeholder="Дополнительные детали, условия, комментарии..."
          rows={3}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Необязательное поле
        </p>
      </div>
    </div>
  );
}
