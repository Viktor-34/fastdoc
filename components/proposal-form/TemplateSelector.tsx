'use client';

import { useState, useEffect } from 'react';
import { FileText, Sparkles, Image, FileStack, Plus } from 'lucide-react';
import type { ProposalTemplate } from '@/lib/types/proposal-template';

interface TemplateSelectorProps {
  onSelect: (template: ProposalTemplate | null) => void;
  onClose: () => void;
}

// Предустановленные шаблоны (локальные, не из БД)
const PRESET_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'preset-minimal',
    name: 'Минимальный',
    description: 'Только основное: товары и условия',
    category: 'minimal',
    defaults: {},
    sections: ['basic', 'products', 'terms'],
    isDefault: false,
  },
  {
    id: 'preset-standard',
    name: 'Стандартный',
    description: 'С описанием проблемы и решения',
    category: 'standard',
    defaults: {},
    sections: ['basic', 'context', 'advantages', 'products', 'terms', 'contacts'],
    isDefault: true,
  },
  {
    id: 'preset-portfolio',
    name: 'С портфолио',
    description: 'Включает галерею работ',
    category: 'with-gallery',
    defaults: {},
    sections: ['basic', 'context', 'advantages', 'products', 'terms', 'gallery', 'contacts'],
    isDefault: false,
  },
];

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  minimal: FileText,
  standard: Sparkles,
  'with-gallery': Image,
  custom: FileStack,
};

export default function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [userTemplates, setUserTemplates] = useState<ProposalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/proposal-templates');
        if (response.ok) {
          const data = await response.json();
          setUserTemplates(data);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const hasWorkspaceDefault = userTemplates.some((template) => template.isDefault);
  const presetTemplates = PRESET_TEMPLATES.map((template) => ({
    ...template,
    isDefault: hasWorkspaceDefault ? false : template.isDefault,
  }));
  const allTemplates = [...presetTemplates, ...userTemplates];

  const handleSelect = (template: ProposalTemplate | null) => {
    onSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Выберите шаблон</h2>
          <p className="mt-1 text-sm text-slate-600">
            Начните с готового шаблона или создайте КП с нуля
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C6613F] border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Кнопка "Пустой шаблон" */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--field-border)] p-6 text-center transition-all hover:border-[#C6613F] hover:bg-[#FAEFEB]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#F3DFD8] group-hover:text-[var(--field-focus)]">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-900">Пустой</h3>
              <p className="mt-1 text-xs text-slate-500">Начать с нуля</p>
            </button>

            {/* Шаблоны */}
            {allTemplates.map((template) => {
              const Icon = CATEGORY_ICONS[template.category || 'custom'] || FileStack;
              const isPreset = template.id.startsWith('preset-');

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSelect(template)}
                  className={`group flex flex-col items-center rounded-xl border-2 p-6 text-center transition-all hover:border-[#C6613F] hover:bg-[#FAEFEB] ${
                    template.isDefault
                      ? 'border-[#D8A18E] bg-[#FAEFEB]'
                      : 'border-[var(--field-border)] bg-white'
                  }`}
                >
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                    template.isDefault
                      ? 'bg-[#F3DFD8] text-[var(--field-focus)]'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-[#F3DFD8] group-hover:text-[var(--field-focus)]'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{template.name}</h3>
                  {template.description && (
                    <p className="mt-1 text-xs text-slate-500">{template.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {template.sections.slice(0, 4).map((section) => (
                      <span
                        key={section}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {section === 'basic' && 'Основное'}
                        {section === 'context' && 'Контекст'}
                        {section === 'advantages' && 'Преимущества'}
                        {section === 'products' && 'Товары'}
                        {section === 'terms' && 'Условия'}
                        {section === 'gallery' && 'Галерея'}
                        {section === 'contacts' && 'Контакты'}
                      </span>
                    ))}
                    {template.sections.length > 4 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        +{template.sections.length - 4}
                      </span>
                    )}
                  </div>
                  {template.isDefault && (
                    <span className="mt-2 rounded-full bg-[#C6613F] px-2 py-0.5 text-[10px] font-medium text-white">
                      По умолчанию
                    </span>
                  )}
                  {!isPreset && !template.isDefault && (
                    <span className="mt-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      Пользовательский
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}


