'use client';

import type { Proposal } from '@/lib/types/proposal';
import { PAYMENT_TERMS_OPTIONS } from '@/lib/types/proposal';

interface TermsSectionProps {
  proposal: Proposal;
  onUpdate: <K extends keyof Proposal>(field: K, value: Proposal[K]) => void;
}

export default function TermsSection({ proposal, onUpdate }: TermsSectionProps) {
  const showCustomPaymentField = proposal.paymentTerms === 'custom';

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Сроки выполнения
        </label>
        <input
          id="deadline"
          type="text"
          value={proposal.deadline || ''}
          onChange={(e) => onUpdate('deadline', e.target.value)}
          placeholder="Например: 2 недели, до 31.12.2024"
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Укажите примерный срок выполнения работ
        </p>
      </div>

      <div>
        <label htmlFor="payment-terms" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Условия оплаты
        </label>
        <select
          id="payment-terms"
          value={proposal.paymentTerms || 'prepaid'}
          onChange={(e) => onUpdate('paymentTerms', e.target.value)}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
        >
          {PAYMENT_TERMS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {showCustomPaymentField && (
        <div>
          <label htmlFor="payment-custom" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
            Свои условия оплаты
          </label>
          <textarea
            id="payment-custom"
            value={proposal.paymentCustom || ''}
            onChange={(e) => onUpdate('paymentCustom', e.target.value)}
            placeholder="Опишите свои условия оплаты..."
            rows={3}
            className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
          />
        </div>
      )}

      <div>
        <label htmlFor="valid-until" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Срок действия КП
        </label>
        <input
          id="valid-until"
          type="date"
          value={
            proposal.validUntil
              ? new Date(proposal.validUntil).toISOString().split('T')[0]
              : ''
          }
          onChange={(e) => onUpdate('validUntil', e.target.value ? new Date(e.target.value) : undefined)}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          По умолчанию +30 дней от даты создания
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-[#FAFAFA] p-4">
        <input
          id="include-vat"
          type="checkbox"
          checked={proposal.includeVat}
          onChange={(e) => onUpdate('includeVat', e.target.checked)}
          className="h-4 w-4 rounded border-[var(--field-border)] text-[var(--field-focus)] focus:ring-[3px] focus:ring-[var(--field-ring)]"
        />
        <label htmlFor="include-vat" className="flex-1 text-sm font-medium" style={{ color: '#3d3d3a' }}>
          Включить НДС
        </label>
        {proposal.includeVat && (
          <div className="flex items-center gap-2">
            <label htmlFor="vat-rate" className="text-sm" style={{ color: '#3d3d3a' }}>
              Ставка:
            </label>
            <input
              id="vat-rate"
              type="number"
              min="0"
              max="100"
              step="1"
              value={proposal.vatRate}
              onChange={(e) => onUpdate('vatRate', parseInt(e.target.value) || 0)}
              className="w-16 rounded-lg border border-[var(--field-border)] bg-white px-2 py-1 text-sm text-slate-900 transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
            />
            <span className="text-sm" style={{ color: '#3d3d3a' }}>%</span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Примечания
        </label>
        <textarea
          id="notes"
          value={proposal.notes || ''}
          onChange={(e) => onUpdate('notes', e.target.value)}
          placeholder="Дополнительные условия, примечания..."
          rows={3}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Необязательное поле для дополнительных примечаний
        </p>
      </div>
    </div>
  );
}
