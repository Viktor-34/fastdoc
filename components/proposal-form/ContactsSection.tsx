'use client';

import type { Proposal } from '@/lib/types/proposal';

interface ContactsSectionProps {
  proposal: Proposal;
  onUpdate: <K extends keyof Proposal>(field: K, value: Proposal[K]) => void;
}

export default function ContactsSection({ proposal, onUpdate }: ContactsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="cta-text" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Призыв к действию (CTA)
        </label>
        <textarea
          id="cta-text"
          value={proposal.ctaText || ''}
          onChange={(e) => onUpdate('ctaText', e.target.value)}
          placeholder="Свяжитесь с нами для уточнения деталей и согласования сроков..."
          rows={3}
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)] resize-y"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Призыв к действию для клиента (например, «Свяжитесь с нами...»)
        </p>
      </div>

      <div>
        <label htmlFor="cta-phone" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Телефон для связи
        </label>
        <input
          id="cta-phone"
          type="tel"
          value={proposal.ctaPhone || ''}
          onChange={(e) => onUpdate('ctaPhone', e.target.value)}
          placeholder="+7 (999) 123-45-67"
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Телефон будет отображаться в конце КП
        </p>
      </div>

      <div>
        <label htmlFor="cta-email" className="block text-sm font-medium mb-2" style={{ color: '#3d3d3a' }}>
          Email для связи
        </label>
        <input
          id="cta-email"
          type="email"
          value={proposal.ctaEmail || ''}
          onChange={(e) => onUpdate('ctaEmail', e.target.value)}
          placeholder="info@company.ru"
          className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
        />
        <p className="mt-1.5 text-xs" style={{ color: '#73726c' }}>
          Email будет отображаться в конце КП
        </p>
      </div>

      <div className="rounded-lg border bg-[#FAEFEB] p-4" style={{ borderColor: 'var(--field-border)' }}>
        <p className="text-sm" style={{ color: '#A04F33' }}>
          💡 <strong>Совет:</strong> Если вы не заполните контакты здесь, они будут автоматически взяты из настроек вашего профиля компании.
        </p>
      </div>
    </div>
  );
}
