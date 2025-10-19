import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import { createServerExtensions } from '@/lib/tiptap/extensions';
import { htmlShell } from '@/lib/pdf/htmlShell';
import { injectPreviewShell } from '@/lib/preview/shell';
import { writePreviewPayload } from '@/lib/preview/storage';
import { withWorkspaceHeader } from '@/lib/workspace-client';

// Хук с командами редактора: добавление блоков, экспорт PDF, предпросмотр.
export function useEditorCommands(editor: Editor | null) {
  // Вставляем блок(и) контента в конец документа и скроллим к ним.
  const appendBlock = useCallback((content: JSONContent | JSONContent[]) => {
    if (!editor) return;
    const transaction = editor
      .chain()
      .focus()
      .setTextSelection(editor.state.doc.content.size)
      .insertContent(content);
    transaction.run();
    window.requestAnimationFrame(() => {
      if (!editor) return;
      const docEnd = editor.state.doc.content.size;
      const dom = editor.view.nodeDOM(docEnd) as HTMLElement | null;
      const element = dom ?? (editor.view.dom.querySelector('.ProseMirror > *:last-child') as HTMLElement | null);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [editor]);

  // Формируем HTML и отправляем его на сервер для генерации PDF.
  const exportPdf = useCallback(async () => {
    if (!editor) return;
    const json = editor.getJSON();
    const html = generateHTML(json, createServerExtensions() as unknown as []);
    const res = await fetch(
      '/api/pdf',
      withWorkspaceHeader({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html }),
      }),
    );
    if (!res.ok) {
      console.error('Failed to export PDF');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proposal.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }, [editor]);

  // Сохраняем HTML предпросмотра и открываем окно с локальным preview.
  const openPreview = useCallback(() => {
    if (!editor) return;
    const json = editor.getJSON();
    const html = generateHTML(json, createServerExtensions() as unknown as []);
    const fullHtml = injectPreviewShell(htmlShell(html, ''));

    try {
      const fontFamily = getComputedStyle(document.body).fontFamily;
      const fontStyles = Array.from(document.querySelectorAll('style[data-next-font]'))
        .map((el) => el.innerHTML)
        .join('\n');
      writePreviewPayload({
        html: fullHtml,
        fontFamily,
        fontStyles: fontStyles || undefined,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to store preview HTML', error);
    }

    const url = `/preview/local?ts=${Date.now()}`;
    const preview = window.open(url, '_blank', 'noopener,noreferrer');
    if (!preview) {
      alert('Разрешите всплывающие окна для предпросмотра.');
    }
  }, [editor]);

  return { appendBlock, exportPdf, openPreview };
}
