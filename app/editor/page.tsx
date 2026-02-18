'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Save, FileDown, Eye, EyeOff } from 'lucide-react';
import { useProposalForm } from './hooks/useProposalForm';
import { renderProposalToHtml } from '@/lib/pdf/renderProposal';
import BasicInfoSection from '@/components/proposal-form/BasicInfoSection';
import ContextSection from '@/components/proposal-form/ContextSection';
import AdvantagesSection from '@/components/proposal-form/AdvantagesSection';
import ProductsSection from '@/components/proposal-form/ProductsSection';
import TermsSection from '@/components/proposal-form/TermsSection';
import GallerySection from '@/components/proposal-form/GallerySection';
import ContactsSection from '@/components/proposal-form/ContactsSection';

type SectionId = 'basic' | 'context' | 'advantages' | 'products' | 'terms' | 'gallery' | 'contacts';

type PreviewWorkspace = {
  logoUrl?: string | null;
  signatureUrl?: string | null;
  stampUrl?: string | null;
  companyName?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  legalAddress?: string | null;
  bankName?: string | null;
  bik?: string | null;
  accountNumber?: string | null;
};

const SECTIONS = [
  { id: 'basic' as const, title: 'Основное', icon: '📄' },
  { id: 'context' as const, title: 'Контекст', icon: '💡' },
  { id: 'advantages' as const, title: 'Преимущества', icon: '✨' },
  { id: 'products' as const, title: 'Продукты', icon: '📦' },
  { id: 'terms' as const, title: 'Условия', icon: '📋' },
  { id: 'gallery' as const, title: 'Галерея', icon: '🖼️' },
  { id: 'contacts' as const, title: 'Контакты', icon: '📞' },
];

const DEFAULT_VISIBLE_SECTIONS: SectionId[] = [
  'basic',
  'context',
  'advantages',
  'products',
  'terms',
  'gallery',
  'contacts',
];

const PREVIEW_A4_WIDTH_PX = 794;
const PREVIEW_A4_HEIGHT_PX = 1123;
const UI_BORDER_COLOR = 'var(--field-border)';
const UI_TEXT_PRIMARY = '#3d3d3a';
const UI_TEXT_MUTED = '#73726c';

function useDebouncedValue<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export default function EditorPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('proposalId') ?? undefined;

  const workspaceId = session?.user?.workspaceId ?? '';
  const userId = session?.user?.id ?? '';

  const {
    proposal,
    updateField,
    save,
    exportPdf,
    isLoading,
    isSaving,
    isDirty,
    lastSaved,
  } = useProposalForm({ proposalId, workspaceId, userId });

  const [activeSection, setActiveSection] = useState<SectionId>('basic');
  const [visibleSections, setVisibleSections] = useState<SectionId[]>(DEFAULT_VISIBLE_SECTIONS);
  const [previewWorkspace, setPreviewWorkspace] = useState<PreviewWorkspace | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const debouncedProposal = useDebouncedValue(proposal, 500);

  useEffect(() => {
    if (proposal.visibleSections && proposal.visibleSections.length > 0) {
      setVisibleSections(proposal.visibleSections as SectionId[]);
      return;
    }
    setVisibleSections(DEFAULT_VISIBLE_SECTIONS);
  }, [proposal.visibleSections]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let isActive = true;

    fetch('/api/workspace/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isActive || !data) return;
        setPreviewWorkspace(data);
      })
      .catch(() => {
        if (!isActive) return;
      });

    return () => {
      isActive = false;
    };
  }, [status]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event?.data || event.data.type !== 'resize') return;
      if (typeof event.data.height !== 'number') return;
      setPreviewHeight(event.data.height);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const width = container.clientWidth;
      if (!width) return;
      const nextScale = Math.min(1, width / PREVIEW_A4_WIDTH_PX);
      setPreviewScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const previewProposal = useMemo(() => {
    const isVisible = (sectionId: SectionId) => visibleSections.includes(sectionId);
    const keepBasic = isVisible('basic');
    const keepContext = isVisible('context');
    const keepAdvantages = isVisible('advantages');
    const keepProducts = isVisible('products');
    const keepTerms = isVisible('terms');
    const keepGallery = isVisible('gallery');
    const keepContacts = isVisible('contacts');

    return {
      ...debouncedProposal,
      title: keepBasic ? debouncedProposal.title : '',
      recipientName: keepBasic ? debouncedProposal.recipientName : undefined,
      problemDesc: keepContext ? debouncedProposal.problemDesc : undefined,
      solutionDesc: keepContext ? debouncedProposal.solutionDesc : undefined,
      additionalDesc: keepContext ? debouncedProposal.additionalDesc : undefined,
      advantages: keepAdvantages ? debouncedProposal.advantages : [],
      advantagesColumns: keepAdvantages ? debouncedProposal.advantagesColumns : undefined,
      items: keepProducts ? debouncedProposal.items : [],
      pricingMode: keepProducts ? debouncedProposal.pricingMode : 'single',
      productVariants: keepProducts ? debouncedProposal.productVariants : [],
      activeVariantId: keepProducts ? debouncedProposal.activeVariantId : undefined,
      productsView: keepProducts ? debouncedProposal.productsView : undefined,
      deadline: keepTerms ? debouncedProposal.deadline : undefined,
      paymentTerms: keepTerms ? debouncedProposal.paymentTerms : undefined,
      paymentCustom: keepTerms ? debouncedProposal.paymentCustom : undefined,
      validUntil: keepTerms ? debouncedProposal.validUntil : undefined,
      notes: keepTerms ? debouncedProposal.notes : undefined,
      galleryImages: keepGallery ? debouncedProposal.galleryImages : [],
      ctaText: keepContacts ? debouncedProposal.ctaText : undefined,
      ctaPhone: keepContacts ? debouncedProposal.ctaPhone : undefined,
      ctaEmail: keepContacts ? debouncedProposal.ctaEmail : undefined,
    };
  }, [debouncedProposal, visibleSections]);

  const previewHtml = useMemo(() => {
    try {
      return renderProposalToHtml({
        proposal: previewProposal,
        workspace: previewWorkspace ?? undefined,
      });
    } catch (error) {
      console.error('Failed to render preview html:', error);
      return '<!doctype html><html><body style="font-family: sans-serif; padding: 24px;">Не удалось собрать превью.</body></html>';
    }
  }, [previewProposal, previewWorkspace]);

  const previewBaseHeight = Math.max(previewHeight ?? 0, PREVIEW_A4_HEIGHT_PX);
  const scaledPreviewHeight = previewBaseHeight * previewScale;
  const scaledPreviewWidth = PREVIEW_A4_WIDTH_PX * previewScale;

  const toggleSectionVisibility = (sectionId: SectionId) => {
    setVisibleSections((prev) => {
      const isVisible = prev.includes(sectionId);
      const next = isVisible ? prev.filter((id) => id !== sectionId) : [...prev, sectionId];
      if (next.length === 0) return prev;
      updateField('visibleSections', next as typeof proposal.visibleSections);
      return next;
    });
  };

  useEffect(() => {
    if (visibleSections.includes(activeSection)) return;
    const fallback = visibleSections[0] ?? 'basic';
    setActiveSection(fallback);
  }, [activeSection, visibleSections]);

  const isProductsSection = activeSection === 'products';

  useEffect(() => {
    setIsPreviewCollapsed(isProductsSection);
  }, [isProductsSection]);

  const handlePreview = async () => {
    if (!proposal.id) {
      alert('Сохраните КП перед предпросмотром');
      return;
    }
    
    try {
      // Создаём временную share link для предпросмотра
      const response = await fetch(`/api/proposals/${proposal.id}/share`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Не удалось создать ссылку для предпросмотра');
      }
      
      const { token } = await response.json();
      window.open(`/p/${token}`, '_blank');
    } catch (error) {
      console.error('Preview error:', error);
      alert('Не удалось открыть предпросмотр');
    }
  };

  const pillButtonClass =
    'flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-[#0F172B] tracking-[-0.42px] transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6613F] disabled:cursor-not-allowed disabled:opacity-50';
  
  const pillButtonStyle = {
    '--tw-shadow': '0 1px 1px 0 var(--tw-shadow-color, rgba(0, 0, 0, .06)), 0 0 1px 0 var(--tw-shadow-color, rgba(0, 0, 0, .3))',
    '--tw-shadow-color': 'rgba(0, 0, 0, 0.1)',
    boxShadow: 'var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)',
    borderColor: UI_BORDER_COLOR,
  } as React.CSSProperties;

  const primaryButtonClass =
    'flex cursor-pointer items-center justify-center gap-2 h-9 rounded-xl bg-[#C6613F] px-4 text-sm font-medium text-[#FAFAFA] shadow-[0px_1px_2px_0px_rgba(10,10,10,0.06)] transition hover:bg-[#A04F33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6613F] disabled:cursor-not-allowed disabled:opacity-60';

  const renderSection = useMemo(() => {
    switch (activeSection) {
      case 'basic':
        return <BasicInfoSection proposal={proposal} onUpdate={updateField} />;
      case 'context':
        return <ContextSection proposal={proposal} onUpdate={updateField} />;
      case 'products':
        return <ProductsSection proposal={proposal} onUpdate={updateField} />;
      case 'advantages':
        return <AdvantagesSection proposal={proposal} onUpdate={updateField} />;
      case 'terms':
        return <TermsSection proposal={proposal} onUpdate={updateField} />;
      case 'gallery':
        return <GallerySection proposal={proposal} onUpdate={updateField} />;
      case 'contacts':
        return <ContactsSection proposal={proposal} onUpdate={updateField} />;
      default:
        return null;
    }
  }, [activeSection, proposal, updateField]);

  // Показываем загрузку, пока сессия не загружена
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F2F0]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#C6613F] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">Загрузка сессии...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F2F0]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#C6613F] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">Загрузка коммерческого предложения...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F3F2F0] py-6 text-slate-900">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6">
        {/* Топ-бар */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className={pillButtonClass} style={pillButtonStyle}>
            <ArrowLeft className="h-4 w-4" />
            Вернуться назад
          </Link>

          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-xl font-semibold text-slate-800">
              {proposal.title || 'Новое КП'}
            </h1>
            {isSaving ? (
              <span className="ml-3 flex items-center gap-1.5 rounded-full bg-[#FAEFEB] px-3 py-1 text-xs font-medium text-[#A04F33]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#C6613F]"></span>
                Сохранение...
              </span>
            ) : isDirty ? (
              <span className="ml-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                Не сохранено
              </span>
            ) : lastSaved ? (
              <span className="ml-3 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                Сохранено в {lastSaved.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              className={pillButtonClass}
              style={pillButtonStyle}
              onClick={handlePreview}
              disabled={!proposal.id}
            >
              <Eye className="h-4 w-4" />
              Предпросмотр
            </button>
            <button
              className={pillButtonClass}
              style={pillButtonStyle}
              onClick={exportPdf}
              disabled={!proposal.id}
            >
              <FileDown className="h-4 w-4" />
              PDF
            </button>
            <button
              className={primaryButtonClass}
              onClick={save}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>

        {/* Основной контент */}
        <div className="flex gap-6">
          {/* Навигация */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-6 rounded-[0.75rem] bg-white p-4" style={{ '--tw-shadow': '0 1px 1px 0 var(--tw-shadow-color, rgba(0, 0, 0, .06)), 0 0 1px 0 var(--tw-shadow-color, rgba(0, 0, 0, .3))', '--tw-shadow-color': 'rgba(0, 0, 0, 0.1)', boxShadow: 'var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)' } as React.CSSProperties}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: UI_TEXT_PRIMARY }}>
                Разделы
              </h2>
              <nav className="space-y-1">
                {SECTIONS.map((section) => {
                  const isVisible = visibleSections.includes(section.id);
                  const isActive = activeSection === section.id;

                  return (
                    <div
                      key={section.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (!isVisible) return;
                        setActiveSection(section.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (!isVisible) return;
                          setActiveSection(section.id);
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium tracking-[-0.42px] transition ${
                        isActive
                          ? 'bg-[#FAFAFA] text-[#FF5929]'
                          : 'hover:bg-[#FAFAFA]'
                      } ${isVisible ? 'cursor-pointer' : 'cursor-default'}`}
                      style={!isActive ? { color: isVisible ? '#3d3d3a' : '#a8a39a' } : undefined}
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span className="flex-1">{section.title}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isVisible}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSectionVisibility(section.id);
                        }}
                        className={`relative inline-flex h-[12px] w-[22px] shrink-0 items-center rounded-full border transition ${
                          isVisible
                            ? 'border-[#C6613F] bg-[#C6613F]'
                            : 'border-[var(--field-border)] bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-[10px] w-[10px] transform rounded-full bg-white shadow transition ${
                            isVisible ? 'translate-x-[10px]' : 'translate-x-[1px]'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Форма редактора */}
          <main className="flex-1 min-w-0">
            <div className="rounded-[0.75rem] bg-white p-6" style={{ '--tw-shadow': '0 1px 1px 0 var(--tw-shadow-color, rgba(0, 0, 0, .06)), 0 0 1px 0 var(--tw-shadow-color, rgba(0, 0, 0, .3))', '--tw-shadow-color': 'rgba(0, 0, 0, 0.1)', boxShadow: 'var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)' } as React.CSSProperties}>
              <div className="mb-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold" style={{ color: '#3d3d3a' }}>
                    {SECTIONS.find((s) => s.id === activeSection)?.title}
                  </h2>
                  {isProductsSection ? (
                    <button
                      type="button"
                      onClick={() => setIsPreviewCollapsed((prev) => !prev)}
                      className="hidden xl:inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-xs font-medium tracking-[-0.2px] text-[#3d3d3a] transition hover:bg-[#FAFAFA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6613F]"
                      style={{
                        borderColor: UI_BORDER_COLOR,
                        boxShadow: '0 1px 1px 0 rgba(0,0,0,0.06), 0 0 1px 0 rgba(0,0,0,0.3)',
                      }}
                      title={isPreviewCollapsed ? 'Показать превью' : 'Скрыть превью'}
                      aria-label={isPreviewCollapsed ? 'Показать превью' : 'Скрыть превью'}
                    >
                      {isPreviewCollapsed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {isPreviewCollapsed ? 'Показать превью' : 'Скрыть превью'}
                    </button>
                  ) : null}
                </div>
                <div className="mt-1 h-1 w-12 rounded-full bg-[#C6613F]"></div>
              </div>

              <div className={isProductsSection && isPreviewCollapsed ? 'max-w-none' : 'max-w-3xl'}>
                {renderSection}
              </div>
            </div>
          </main>

          {/* Превью */}
          {(!isProductsSection || !isPreviewCollapsed) ? (
            <aside className="hidden xl:block w-[360px] flex-shrink-0">
              <div className="sticky top-6 rounded-[0.75rem] bg-white p-4" style={{ '--tw-shadow': '0 1px 1px 0 var(--tw-shadow-color, rgba(0, 0, 0, .06)), 0 0 1px 0 var(--tw-shadow-color, rgba(0, 0, 0, .3))', '--tw-shadow-color': 'rgba(0, 0, 0, 0.1)', boxShadow: 'var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)' } as React.CSSProperties}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: UI_TEXT_PRIMARY }}>
                    Превью
                  </h2>
                  <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: UI_TEXT_MUTED }}>
                    Live
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: UI_BORDER_COLOR }}>
                  <div
                    ref={previewContainerRef}
                    className="max-h-[calc(100vh-12rem)] overflow-auto bg-[#f6f5f3]"
                  >
                    <div
                      style={{
                        width: `${scaledPreviewWidth}px`,
                        height: `${scaledPreviewHeight}px`,
                        margin: '0 auto',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: `${PREVIEW_A4_WIDTH_PX}px`,
                          height: `${previewBaseHeight}px`,
                          transform: `scale(${previewScale})`,
                          transformOrigin: 'top left',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        }}
                      >
                        <iframe
                          title="Предпросмотр коммерческого предложения"
                          className="border-0"
                          srcDoc={previewHtml}
                          style={{
                            width: `${PREVIEW_A4_WIDTH_PX}px`,
                            height: `${previewBaseHeight}px`,
                            display: 'block',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
