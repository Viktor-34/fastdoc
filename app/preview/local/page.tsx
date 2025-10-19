'use client';

import { useEffect, useRef, useState } from 'react';
import { readPreviewPayload, type PreviewPayload } from '@/lib/preview/storage';

// Локальная страница предпросмотра, считывает HTML из localStorage и показывает его в iframe.
export default function LocalPreviewPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Забираем сохранённые данные предпросмотра (HTML, стили, шрифт).
    const stored = readPreviewPayload();
    setPayload(stored);
    const html = stored?.html ?? null;
    const fontFamily = stored?.fontFamily ?? null;
    const fontStyles = stored?.fontStyles ?? null;

    const iframe = iframeRef.current;
    if (!iframe) {
      setReady(true);
      return;
    }
    const doc = iframe.contentDocument;
    if (!doc) {
      setReady(true);
      return;
    }

    const cleanup = (() => {
      if (!html) {
        return undefined;
      }
      // Вписываем HTML в документ iframe и подключаем стили шрифта.
      doc.open();
      doc.write(html);
      doc.close();

      if (fontStyles) {
        const style = doc.createElement('style');
        style.setAttribute('data-offerdoc-font', 'true');
        style.innerHTML = fontStyles;
        doc.head.prepend(style);
      }

      if (fontFamily) {
        doc.documentElement.style.fontFamily = fontFamily;
        doc.body.style.fontFamily = fontFamily;
      }

      doc.documentElement.style.margin = '0';
      doc.documentElement.style.overflow = 'hidden';
      doc.body.style.margin = '0';
      doc.body.style.overflow = 'hidden';
      const updateHeight = () => {
        if (!iframe || !doc) return;
        // Подгоняем высоту iframe под контент.
        const height = doc.documentElement.scrollHeight;
        iframe.style.height = `${height}px`;
      };

      updateHeight();

      const resizeObserver = iframe.contentWindow?.ResizeObserver
        ? new iframe.contentWindow.ResizeObserver(updateHeight)
        : null;
      const page = doc.querySelector('.page');
      if (resizeObserver && page) resizeObserver.observe(page as Element);

      const interval = window.setInterval(updateHeight, 500);

      return () => {
        resizeObserver?.disconnect();
        window.clearInterval(interval);
      };
    })();

    setReady(true);
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-800">Предпросмотр документа</h1>
        <p className="text-sm text-slate-500">Окно обновляется при повторном нажатии кнопки «Предпросмотр» в редакторе.</p>
      </header>
      <main className="mx-auto flex justify-center px-6 pb-6">
        <div className="flex w-full max-w-[calc(210mm+96px)] flex-col items-center gap-3">
          <iframe
            ref={iframeRef}
            title="preview"
            className="h-full w-full border-0"
            style={{
              display: 'block',
              background: '#F7F7F5',
              borderRadius: '20px',
            }}
          />
          {/* Сообщаем пользователю, если предпросмотр ещё не был сгенерирован. */}
          {ready && !payload?.html && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500 shadow-sm">
              Нечего показать. Откройте предпросмотр из редактора.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
