'use client';
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, MouseEvent } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import { createClientExtensions } from '@/lib/tiptap/extensions';
import { useEditorCommands } from '@/app/editor/hooks/useEditorCommands';
import { useImageUpload } from '@/app/editor/hooks/useImageUpload';
import { reorderBlock } from '@/lib/tiptap/utils/reorder';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Heading,
  Text,
  List,
  ListOrdered,
  Columns2,
  Image as ImageIcon,
  Code,
  Minus,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

type ViewDesc = {
  node?: { nodeSize: number };
  posBefore?: number;
  posAtStart?: number;
};

type BlockRange = {
  from: number;
  to: number;
  type: string;
};

function getBlockRangeFromElement(editor: ReturnType<typeof useEditor>, element: HTMLElement | null): BlockRange | null {
  if (!editor || !element) return null;

  const withDesc = element as HTMLElement & { pmViewDesc?: ViewDesc };
  const viewDesc = withDesc.pmViewDesc;
  if (viewDesc?.node) {
    const from = viewDesc.posBefore ?? viewDesc.posAtStart;
    const to = from + viewDesc.node.nodeSize;
    if (from != null && to != null) {
      const node = editor.state.doc.nodeAt(from);
      if (!node) return null;
      return { from, to, type: node.type.name };
    }
  }

  try {
    const pos = editor.view.posAtDOM(element, 0);
    const state = editor.view.state;
    const resolved = state.doc.resolve(pos);
    let depth = resolved.depth;
    while (depth > 0 && !resolved.node(depth).isBlock) {
      depth -= 1;
    }
    if (depth === 0) return null;
    const from = resolved.before(depth);
    const to = resolved.after(depth);
    if (from == null || to == null) return null;
    const node = state.doc.nodeAt(from);
    if (!node) return null;
    return { from, to, type: node.type.name };
  } catch {
    return null;
  }
}

export default function EditorPage() {
  const clientExtensions = useMemo(() => createClientExtensions(), []);
  const editor = useEditor({
    extensions: clientExtensions,
    content: '<p>Начните с текста…</p>',
    immediatelyRender: false,
  });

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const selectedBlockElementRef = useRef<HTMLElement | null>(null);
  const [hoverBlock, setHoverBlock] = useState<{
    top: number;
    left: number;
    height: number;
    from: number;
    to: number;
  } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const { appendBlock, exportPdf, openPreview } = useEditorCommands(editor);
  const { isUploading: isUploadingImage, insertImageFromFile, replaceImageFromFile } = useImageUpload(editor, appendBlock);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDocumentId = searchParams.get('documentId') ?? undefined;
  const [loadingDocument, setLoadingDocument] = useState(false);

  useEffect(() => {
    if (!editor || !initialDocumentId) return;
    setLoadingDocument(true);
    fetch(`/api/doc/${initialDocumentId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Не удалось загрузить документ (${res.status})`);
        return res.json();
      })
      .then((data: { id: string; title: string; json: JSONContent }) => {
        setDocumentId(data.id);
        setTitle(data.title);
        editor.commands.setContent(data.json as JSONContent, false);
      })
      .catch((error) => {
        console.error(error);
        alert('Не удалось загрузить документ');
      })
      .finally(() => setLoadingDocument(false));
  }, [editor, initialDocumentId]);

  const pillButtonClass =
    'flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-[#F6F6F7] hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50';

  const primaryButtonClass =
    'flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[#177767] bg-[#177767] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:border-[#095145] hover:bg-[#095145] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#177767] disabled:cursor-not-allowed disabled:opacity-50';

  const blockButtonClass =
    'flex h-8 w-full cursor-pointer items-center rounded-[6px] bg-white px-3 text-left text-[13px] font-medium leading-none text-slate-700 transition hover:bg-[rgba(88,85,92,0.05)] hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50';

  const blockToolbarButtonClass =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 shadow-sm transition hover:border-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40';

  const [title, setTitle] = useState('Новое предложение');
  const [saving, setSaving] = useState(false);
  const [documentId, setDocumentId] = useState<string | undefined>(undefined);
  const [copyingLink, setCopyingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockRange | null>(null);
  const [activeTab, setActiveTab] = useState<'elements' | 'settings'>('elements');

  const colorOptions = [
    { label: 'Насыщенный', value: '#0f172a' },
    { label: 'Фирменный', value: '#4c1d95' },
    { label: 'Успех', value: '#047857' },
    { label: 'Предупреждение', value: '#b45309' },
    { label: 'Акцент', value: '#dc2626' },
  ];

  const fontSizeOptions = ['14px', '16px', '18px', '20px', '24px'];

  const applyColor = (value: string | null) => {
    if (!editor) return;
    if (!value) {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(value).run();
    }
  };

  const applyFontSize = (value: string) => {
    if (!editor) return;
    if (!value) {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(value).run();
    }
  };

  const updateBlockAttributes = useCallback((attrs: Record<string, unknown>) => {
    if (!editor || !selectedBlock) return;
    const selection = editor.state.selection;
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedBlock.from)
      .updateAttributes(selectedBlock.type, attrs)
      .run();
    if ('from' in selection && 'to' in selection) {
      editor.commands.setTextSelection({ from: selection.from, to: selection.to });
    }
  }, [editor, selectedBlock]);

  const setPaddingValue = useCallback(
    (key: 'paddingTop' | 'paddingBottom', value: number) => {
      if (!editor || !selectedBlock) return;
      const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
      const { state, view } = editor;
      const node = state.doc.nodeAt(selectedBlock.from);
      if (!node) return;
      const currentValue = typeof node.attrs?.[key] === 'number' ? node.attrs[key] : Number(node.attrs?.[key]);
      if (Number.isFinite(currentValue) && currentValue === safeValue) return;
      const attrs = { ...node.attrs, [key]: safeValue } as Record<string, unknown>;
      const tr = state.tr.setNodeMarkup(selectedBlock.from, undefined, attrs);
      view.dispatch(tr);
      setSelectedBlock((prev) => (prev ? { ...prev } : prev));
    },
    [editor, selectedBlock],
  );

  const runOnSelectedBlock = useCallback((operation: (chain: any) => any) => {
    if (!editor || !selectedBlock) return;
    const docSize = editor.state.doc.content.size;
    const start = Math.min(selectedBlock.from + 1, docSize);
    const end = Math.max(start, Math.min(selectedBlock.to - 1, docSize));
    let chain = editor.chain().focus();
    chain = chain.setTextSelection({ from: start, to: end });
    operation(chain).run();
    setSelectedBlock((prev) => (prev ? { ...prev } : prev));
  }, [editor, selectedBlock, setSelectedBlock]);

  const findFirstMarkAttribute = useCallback((markName: string, attribute: string): string | null => {
    if (!editor || !selectedBlock) return null;
    const node = editor.state.doc.nodeAt(selectedBlock.from);
    if (!node) return null;
    let value: string | null = null;
    node.descendants((child: any) => {
      if (!child.marks) return true;
      for (const mark of child.marks) {
        if (mark.type.name === markName && mark.attrs && mark.attrs[attribute]) {
          value = mark.attrs[attribute];
          return false;
        }
      }
      return true;
    });
    return value;
  }, [editor, selectedBlock]);

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!editor || !editorContainerRef.current) return;
      const target = event.target as HTMLElement;
      if (target.closest('.editor-block-toolbar')) return;
      if (target.closest('.editor-block-delete')) return;
      const block = target.closest<HTMLElement>('.ProseMirror > *');
      if (!block) {
        if (hoverBlock) setHoverBlock(null);
        return;
      }

      const canUseViewDesc = (block as HTMLElement & { pmViewDesc?: ViewDesc }).pmViewDesc;
      if (canUseViewDesc?.node) {
        const viewDesc = canUseViewDesc;
        const from = viewDesc.posBefore ?? viewDesc.posAtStart;
        const to = from + viewDesc.node.nodeSize;
        if (from == null || to == null) {
          if (hoverBlock) setHoverBlock(null);
          return;
        }

        if (hoverBlock && hoverBlock.from === from && hoverBlock.to === to) return;

        const container = editorContainerRef.current;
        const blockRect = block.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const top = blockRect.top - containerRect.top + container.scrollTop;
        const left = blockRect.left - containerRect.left + container.scrollLeft + blockRect.width;

        setHoverBlock({ top, left, height: blockRect.height, from, to });
        return;
      }

      let pos: number;
      try {
        pos = editor.view.posAtDOM(block, 0);
      } catch {
        if (hoverBlock) setHoverBlock(null);
        return;
      }
      const state = editor.view.state;
      const resolved = state.doc.resolve(pos);

      let depth = resolved.depth;
      while (depth > 0 && !resolved.node(depth).isBlock) {
        depth -= 1;
      }

      if (depth === 0) {
        if (hoverBlock) setHoverBlock(null);
        return;
      }

      const from = resolved.before(depth);
      const to = resolved.after(depth);
      if (from == null || to == null) {
        if (hoverBlock) setHoverBlock(null);
        return;
      }

      if (hoverBlock && hoverBlock.from === from && hoverBlock.to === to) return;

      const container = editorContainerRef.current;
      const blockRect = block.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const top = blockRect.top - containerRect.top + container.scrollTop;
      const left = blockRect.left - containerRect.left + container.scrollLeft + blockRect.width;

      setHoverBlock({ top, left, height: blockRect.height, from, to });
    },
    [editor, hoverBlock],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverBlock(null);
  }, []);

  const handleScroll = useCallback(() => {
    setHoverBlock(null);
  }, []);

  const deleteBlock = useCallback(() => {
    if (!editor || !hoverBlock) return;
    editor.chain().focus().deleteRange({ from: hoverBlock.from, to: hoverBlock.to }).run();
    setHoverBlock(null);
  }, [editor, hoverBlock]);

  const moveBlock = (direction: 'up' | 'down') => {
    if (!editor || !hoverBlock) return;
    const { state, view } = editor;
    const tr = reorderBlock({
      tr: state.tr,
      from: hoverBlock.from,
      to: hoverBlock.to,
      direction,
    });
    if (!tr) return;
    view.dispatch(tr);
    window.requestAnimationFrame(() => {
      const dom = view.nodeDOM(hoverBlock.from) as HTMLElement | null;
      if (dom) {
        dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    setHoverBlock(null);
  };

  const blockPlacement = useMemo(() => {
    if (!editor || !hoverBlock) return null;
    const positions: number[] = [];
    editor.state.doc.forEach((_node, offset) => positions.push(offset));
    const index = positions.indexOf(hoverBlock.from);
    if (index === -1) return null;
    return { index, count: positions.length };
  }, [editor, hoverBlock]);

  const handleFileInputChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await insertImageFromFile(files[0]);
    event.target.value = '';
  }, [insertImageFromFile]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    try {
      setSaving(true);
      const response = await fetch('/api/doc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: documentId,
          title: title.trim() || 'Без названия',
          json: editor.getJSON(),
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setDocumentId(data.id);
      const params = new URLSearchParams(window.location.search);
      params.set('documentId', data.id);
      const search = params.toString();
      router.replace(`${window.location.pathname}${search ? `?${search}` : ''}`, { scroll: false });
      alert('Сохранено');
    } catch (error) {
      console.error(error);
      alert('Не удалось сохранить документ');
    } finally {
      setSaving(false);
    }
  }, [documentId, editor, router, title]);

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleCopyLink = useCallback(async () => {
    if (!documentId) {
      alert('Сохраните документ, чтобы получить ссылку.');
      return;
    }

    try {
      setCopyingLink(true);
      const response = await fetch(`/api/doc/${documentId}/share`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as { token: string };
      const shareUrl = `${window.location.origin}/p/${data.token}`;

      const copyWithFallback = () => {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          if (typeof document.hasFocus === 'function' && !document.hasFocus()) {
            window.focus?.();
          }
          await navigator.clipboard.writeText(shareUrl);
        } catch (clipboardError) {
          console.warn('Clipboard API unavailable, using fallback', clipboardError);
          copyWithFallback();
        }
      } else {
        copyWithFallback();
      }

      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy share link', error);
      alert('Не удалось скопировать ссылку');
    } finally {
      setCopyingLink(false);
    }
  }, [documentId]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer) return;
    const hasFiles = Array.from(event.dataTransfer.items || []).some((item) => item.kind === 'file');
    if (!hasFiles) return;
    event.preventDefault();
    setIsDraggingFile(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer) return;
      const files = Array.from(event.dataTransfer.files || []);
      if (!files.length) return;
      event.preventDefault();
      setIsDraggingFile(false);
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          await insertImageFromFile(file);
        }
      }
    },
    [insertImageFromFile],
  );

  const handleEditorClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!editor) return;
      const blockElement = (event.target as HTMLElement)?.closest<HTMLElement>('.ProseMirror > *');
      if (!blockElement) {
        setSelectedBlock(null);
        setActiveTab('elements');
        if (selectedBlockElementRef.current) {
          selectedBlockElementRef.current.classList.remove('editor-block-selected');
          selectedBlockElementRef.current = null;
        }
        return;
      }
      const range = getBlockRangeFromElement(editor, blockElement);
      if (!range) return;
      setSelectedBlock(range);
      setActiveTab('settings');
      const domSelection = typeof window !== 'undefined' ? window.getSelection() : null;
      const preserveTextSelection = !!domSelection && !domSelection.isCollapsed;

      if (!preserveTextSelection) {
        const coords = { left: event.clientX, top: event.clientY };
        const posInfo = editor.view.posAtCoords(coords);
        const clickedPos = posInfo?.pos ?? null;
        const docSize = editor.state.doc.content.size;
        const caretFromEnd = Math.min(Math.max(range.to - 1, range.from), docSize);
        const targetCaret = clickedPos != null
          ? Math.min(Math.max(clickedPos, range.from), range.to)
          : caretFromEnd;

        editor
          .chain()
          .focus()
          .setNodeSelection(range.from)
          .setTextSelection(targetCaret)
          .run();
      }
      if (selectedBlockElementRef.current && selectedBlockElementRef.current !== blockElement) {
        selectedBlockElementRef.current.classList.remove('editor-block-selected');
      }
      blockElement.classList.add('editor-block-selected');
      selectedBlockElementRef.current = blockElement;
    },
    [editor],
  );

  useEffect(() => {
    if (!editor || !selectedBlock) return;
    const node = editor.state.doc.nodeAt(selectedBlock.from);
    if (!node) {
      setSelectedBlock(null);
      return;
    }
    if (node.type.name !== selectedBlock.type) {
      setSelectedBlock({ ...selectedBlock, type: node.type.name });
    }
  }, [editor, selectedBlock]);

  useEffect(() => {
    if (!selectedBlock && activeTab === 'settings') {
      setActiveTab('elements');
    }
  }, [selectedBlock, activeTab]);

  const selectedNode = useMemo(() => {
    if (!editor || !selectedBlock) return null;
    return editor.state.doc.nodeAt(selectedBlock.from);
  }, [editor, selectedBlock]);

  const getPaddingDefaults = useCallback((nodeName?: string | null) => {
    switch (nodeName) {
      case 'paragraph':
      case 'heading':
      case 'bulletList':
      case 'orderedList':
      case 'codeBlock':
        return { top: 8, bottom: 8 };
      case 'twoColumns':
        return { top: 20, bottom: 20 };
      case 'twoColumn':
      case 'image':
      case 'spacer':
        return { top: 0, bottom: 0 };
      case 'priceTable':
        return { top: 12, bottom: 12 };
      default:
        return { top: 0, bottom: 0 };
    }
  }, []);

  const paddingDefaults = useMemo(
    () => getPaddingDefaults(selectedNode?.type?.name),
    [getPaddingDefaults, selectedNode?.type?.name],
  );

  const paddingTopValue = useMemo(() => {
    const value = selectedNode?.attrs?.paddingTop;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : paddingDefaults.top;
  }, [selectedNode, paddingDefaults.top]);

  const paddingBottomValue = useMemo(() => {
    const value = selectedNode?.attrs?.paddingBottom;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : paddingDefaults.bottom;
  }, [selectedNode, paddingDefaults.bottom]);

  const currentColorMark = useMemo(() => findFirstMarkAttribute('textStyle', 'color'), [findFirstMarkAttribute]);
  const currentFontSizeMark = useMemo(() => findFirstMarkAttribute('textStyle', 'fontSize'), [findFirstMarkAttribute]);
  const currentTextAlign = useMemo(() => {
    if (!selectedNode) return 'left';
    if (selectedNode.attrs?.textAlign) return selectedNode.attrs.textAlign as string;
    let align = 'left';
    selectedNode.descendants((child: any) => {
      if (child.attrs?.textAlign) {
        align = child.attrs.textAlign;
        return false;
      }
      return true;
    });
    return align;
  }, [selectedNode]);

  const handleClearSelection = useCallback(() => {
    setSelectedBlock(null);
    setActiveTab('elements');
    editor?.commands.focus('end');
    if (selectedBlockElementRef.current) {
      selectedBlockElementRef.current.classList.remove('editor-block-selected');
      selectedBlockElementRef.current = null;
    }
  }, [editor]);

  const handleDeleteSelectedBlock = useCallback(() => {
    if (!editor || !selectedBlock) return;
    editor.chain().focus().deleteRange({ from: selectedBlock.from, to: selectedBlock.to }).run();
    setSelectedBlock(null);
    setActiveTab('elements');
    if (selectedBlockElementRef.current) {
      selectedBlockElementRef.current.classList.remove('editor-block-selected');
      selectedBlockElementRef.current = null;
    }
  }, [editor, selectedBlock]);

  const handleSpacerSizeChange = useCallback(
    (value: number) => {
      updateBlockAttributes({ size: value });
    },
    [updateBlockAttributes],
  );

  useEffect(() => {
    if (!editor) return;

    if (!selectedBlock) {
      if (selectedBlockElementRef.current) {
        selectedBlockElementRef.current.classList.remove('editor-block-selected');
        selectedBlockElementRef.current = null;
      }
      return;
    }

    let target = editor.view.nodeDOM(selectedBlock.from) as HTMLElement | null;
    if (!target) {
      try {
        const resolved = editor.view.domAtPos(selectedBlock.from);
        const node = resolved.node as Node;
        const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement | null);
        target = element?.closest('.ProseMirror > *') as HTMLElement | null;
      } catch {
        target = null;
      }
    }

    if (target && selectedBlockElementRef.current !== target) {
      selectedBlockElementRef.current?.classList.remove('editor-block-selected');
      target.classList.add('editor-block-selected');
      selectedBlockElementRef.current = target;
    }

    if (!target && selectedBlockElementRef.current) {
      selectedBlockElementRef.current.classList.remove('editor-block-selected');
      selectedBlockElementRef.current = null;
    }
  }, [editor, selectedBlock]);

  return (
    <div className="min-h-screen w-full bg-[#F7F7F5] py-6 text-slate-900">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className={pillButtonClass}>
            <span aria-hidden="true">←</span>
            Список предложений
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={pillButtonClass}
              onClick={handleCopyLink}
              disabled={!documentId || copyingLink}
            >
              {linkCopied ? 'Ссылка скопирована' : copyingLink ? 'Копирование…' : 'Ссылка'}
            </button>
            <button className={pillButtonClass} onClick={exportPdf} disabled={!editor}>
              Экспорт в PDF
            </button>
            <button className={pillButtonClass} onClick={openPreview} disabled={!editor}>
              Предпросмотр
            </button>
            <button
              className={primaryButtonClass}
              onClick={handleSave}
              disabled={!editor || saving}
            >
              {saving ? 'Сохранение…' : documentId ? 'Сохранить изменения' : 'Сохранить'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-start gap-[26px]">
          <div className="flex-1">
            <div className="rounded-[8px] bg-white p-6">
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Новое предложение"
                className="w-full rounded-none border-0 bg-transparent text-lg font-semibold text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-0"
              />
              <div
                ref={editorContainerRef}
                className="relative mt-6 min-h-[600px] rounded-[8px] bg-white"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onScroll={handleScroll}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleEditorClick}
              >
                {loadingDocument && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 text-sm text-slate-500">
                    Загрузка документа…
                  </div>
                )}
              {isDraggingFile && (
                <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-[8px] border-2 border-dashed border-slate-300 bg-slate-50/80 text-slate-600">
                  Перетащите изображение сюда для загрузки
                </div>
              )}
                <EditorContent editor={editor} className="editor-content" />
                {hoverBlock && (
                  <div
                    className="editor-block-toolbar absolute flex -translate-y-1/2 translate-x-[-100px] items-center gap-2"
                    style={{ top: hoverBlock.top + hoverBlock.height / 2, left: hoverBlock.left }}
                  >
                    <button
                      type="button"
                      className={blockToolbarButtonClass}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.preventDefault();
                        moveBlock('up');
                      }}
                      disabled={!blockPlacement || blockPlacement.index === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m7 15 5-6 5 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`${blockToolbarButtonClass} text-rose-500 hover:border-rose-400 hover:text-rose-600`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.preventDefault();
                        deleteBlock();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4.5A2.5 2.5 0 0 1 10.5 2h3a2.5 2.5 0 0 1 2.5 2.5V6m1 0v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Zm-8 4v6m4-6v6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={blockToolbarButtonClass}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.preventDefault();
                        moveBlock('down');
                      }}
                      disabled={!blockPlacement || blockPlacement.index === blockPlacement.count - 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m17 9-5 6-5-6" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="sticky top-6 flex h-full w-full max-w-[320px] flex-col gap-6 rounded-[8px] bg-white px-6 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-500">
                <button
                  type="button"
                  className={`flex-1 rounded-md px-3 py-2 transition ${activeTab === 'elements' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-700'}`}
                  onClick={() => {
                    setActiveTab('elements');
                    setSelectedBlock(null);
                  }}
                >
                  Элементы
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md px-3 py-2 transition ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : selectedBlock ? 'hover:text-slate-700' : 'opacity-50'}`}
                  onClick={() => selectedBlock && setActiveTab('settings')}
                  disabled={!selectedBlock}
                >
                  Настройки
                </button>
              </div>

              {activeTab === 'elements' ? (
                <>
                  <h2 className="text-lg font-semibold">Выберите элемент</h2>
                  <p className="text-sm text-slate-500">
                    Используйте готовые элементы, чтобы ускорить сборку предложения.
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Настройки блока</h2>
                    <p className="text-sm text-slate-500">Параметры выбранного элемента.</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
                    onClick={handleClearSelection}
                  >
                    Сбросить
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'elements' ? (
              <>
            <div className="flex flex-col gap-1">
                  <button
                className={blockButtonClass}
                onClick={() =>
                  appendBlock({
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: 'Заголовок раздела' }],
                  })
                }
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <Heading className="h-4 w-4" />
                </span>
                Заголовок раздела
              </button>

              <button
                className={blockButtonClass}
                onClick={() =>
                  appendBlock({
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Введите текст…' }],
                  })
                }
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <Text className="h-4 w-4" />
                </span>
                Текстовый блок
              </button>

              <button
                className={blockButtonClass}
                onClick={() =>
                  appendBlock({
                    type: 'twoColumns',
                    content: [
                      {
                        type: 'twoColumn',
                        attrs: { index: 0 },
                        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Введите текст…' }] }],
                      },
                      {
                        type: 'twoColumn',
                        attrs: { index: 1 },
                        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Введите текст…' }] }],
                      },
                    ],
                  })
                }
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <Columns2 className="h-4 w-4" />
                </span>
                Две колонки
              </button>

              <button
                className={blockButtonClass}
                onClick={() => appendBlock({ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Пункт списка' }] }] }] })}
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <List className="h-4 w-4" />
                </span>
                Маркированный список
              </button>

              <button
                className={blockButtonClass}
                onClick={() => appendBlock({ type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Пункт списка' }] }] }] })}
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <ListOrdered className="h-4 w-4" />
                </span>
                Нумерованный список
              </button>

              <button
                className={blockButtonClass}
                onClick={() => appendBlock({ type: 'codeBlock', attrs: { language: 'plaintext' }, content: [{ type: 'text', text: '// Ваш код здесь' }] })}
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <Code className="h-4 w-4" />
                </span>
                Блок кода
              </button>

              <button
                className={blockButtonClass}
                onClick={handleImageButtonClick}
                disabled={!editor || isUploadingImage}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <ImageIcon className="h-4 w-4" />
                </span>
                {isUploadingImage ? 'Загрузка…' : 'Изображение'}
              </button>

              <input
                ref={imageInputRef}
                type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  <button
                    className={blockButtonClass}
                onClick={() => appendBlock({ type: 'spacer', attrs: { size: 24, variant: 'empty' } })}
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <Minus className="h-4 w-4" />
                </span>
                Отступ
              </button>

              <button
                className={blockButtonClass}
                onClick={() => appendBlock({ type: 'spacer', attrs: { size: 24, variant: 'divider-solid' } })}
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <Minus className="h-4 w-4" />
                </span>
                Разделитель
              </button>

              <button
                className={blockButtonClass}
                onClick={() => appendBlock({ type: 'priceTable', attrs: { rows: [] } })}
                disabled={!editor}
              >
                <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-[#F7F7F5] text-[#020817]">
                  <Table className="h-4 w-4" />
                </span>
                Таблица цен
              </button>
                </div>
              </>
            ) : (
              <div className="flex-1 space-y-4">
                {selectedNode ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Тип блока</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            {selectedNode.type.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-medium text-rose-500 transition hover:text-rose-600"
                          onClick={handleDeleteSelectedBlock}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Внутренние отступы</p>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-xs font-medium text-slate-600">
                          Сверху
                          <input
                            type="number"
                            min={0}
                            value={Number.isFinite(paddingTopValue) ? paddingTopValue : 0}
                            onChange={(event) =>
                              setPaddingValue('paddingTop', Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-medium text-slate-600">
                          Снизу
                          <input
                            type="number"
                            min={0}
                            value={Number.isFinite(paddingBottomValue) ? paddingBottomValue : 0}
                            onChange={(event) =>
                              setPaddingValue('paddingBottom', Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                      </div>
                    </div>

                    {selectedNode.type.name === 'heading' && (
                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="heading-level">
                          Уровень заголовка
                        </label>
                        <select
                          id="heading-level"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          defaultValue={selectedNode.attrs.level ?? 2}
                          onChange={(event) => {
                            updateBlockAttributes({ level: Number(event.target.value) });
                            setTimeout(() => editor?.commands.focus(), 0);
                          }}
                        >
                          {[1, 2, 3, 4].map((level) => (
                            <option key={level} value={level}>H{level}</option>
                          ))}
                        </select>

                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Цвет</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {colorOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`h-8 w-8 rounded-full border ${currentColorMark === option.value ? 'border-[#3C323E] ring-2 ring-[#3C323E]/40' : 'border-slate-200'} transition hover:scale-105`}
                                style={{ backgroundColor: option.value }}
                                onClick={() => runOnSelectedBlock((chain) => chain.setColor(option.value))}
                              >
                                <span className="sr-only">{option.label}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
                              onClick={() => runOnSelectedBlock((chain) => chain.unsetColor())}
                            >
                              Сброс
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                    {['paragraph', 'bulletList', 'orderedList'].includes(selectedNode.type.name) && (
                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="paragraph-font-size">
                          Размер шрифта
                        </label>
                        <select
                          id="paragraph-font-size"
                          value={currentFontSizeMark ?? ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (!value) {
                              runOnSelectedBlock((chain) => chain.unsetFontSize());
                            } else {
                              runOnSelectedBlock((chain) => chain.setFontSize(value));
                            }
                          }}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                          <option value="">По умолчанию</option>
                          {fontSizeOptions.map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>

                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Выравнивание</span>
                          <div className="mt-2 flex gap-2">
                            {[
                              { value: 'left', Icon: AlignLeft },
                              { value: 'center', Icon: AlignCenter },
                              { value: 'right', Icon: AlignRight },
                              { value: 'justify', Icon: AlignJustify },
                            ].map(({ value, Icon }) => (
                              <button
                                key={value}
                                type="button"
                                className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${currentTextAlign === value ? 'border-[#3C323E] bg-[#3C323E]/10 text-[#3C323E]' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}
                                onClick={() => runOnSelectedBlock((chain) => chain.setTextAlign(value as 'left' | 'center' | 'right' | 'justify'))}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Цвет</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {colorOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`h-8 w-8 rounded-full border ${currentColorMark === option.value ? 'border-[#3C323E] ring-2 ring-[#3C323E]/40' : 'border-slate-200'} transition hover:scale-105`}
                                style={{ backgroundColor: option.value }}
                                onClick={() => runOnSelectedBlock((chain) => chain.setColor(option.value))}
                              >
                                <span className="sr-only">{option.label}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
                              onClick={() => runOnSelectedBlock((chain) => chain.unsetColor())}
                            >
                              Сброс
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedNode.type.name === 'image' && (
                      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="image-src">
                            URL изображения
                          </label>
                          <input
                            id="image-src"
                            type="text"
                            defaultValue={selectedNode.attrs.src ?? ''}
                            onBlur={(event) => {
                              const value = event.target.value.trim();
                              if (value) {
                                updateBlockAttributes({ src: value });
                              }
                            }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-[#F6F6F7]"
                            onClick={() => replaceImageInputRef.current?.click()}
                            disabled={isUploadingImage || !selectedBlock}
                          >
                            {isUploadingImage ? 'Загрузка…' : 'Заменить файл'}
                          </button>
                          <input
                            ref={replaceImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = '';
                              if (file && selectedBlock) {
                                replaceImageFromFile({ from: selectedBlock.from, to: selectedBlock.to }, file);
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="image-opacity">
                            Прозрачность
                          </label>
                          <input
                            id="image-opacity"
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(((selectedNode.attrs.opacity ?? 1) as number) * 100)}
                            onChange={(event) => updateBlockAttributes({ opacity: Number(event.target.value) / 100 })}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="image-link">
                            Ссылка
                          </label>
                          <input
                            id="image-link"
                            type="text"
                            defaultValue={selectedNode.attrs.href ?? ''}
                            onBlur={(event) => {
                              const value = event.target.value.trim();
                              updateBlockAttributes({ href: value || null });
                            }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    )}

                    {selectedNode.type.name === 'spacer' && (
                      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="spacer-size-range">
                            Размер отступа
                          </label>
                          <input
                            id="spacer-size-range"
                            type="range"
                            min={0}
                            max={240}
                            value={selectedNode.attrs.size ?? 24}
                            onChange={(event) => handleSpacerSizeChange(Number(event.target.value))}
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={0}
                              max={240}
                              value={selectedNode.attrs.size ?? 24}
                              onChange={(event) => handleSpacerSizeChange(Number(event.target.value) || 0)}
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                            <span className="text-xs text-slate-500">px</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="spacer-variant">
                            Тип отступа
                          </label>
                          <select
                            id="spacer-variant"
                            value={(selectedNode.attrs.variant as string) ?? 'empty'}
                            onChange={(event) => updateBlockAttributes({ variant: event.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            <option value="empty">Пустой</option>
                            <option value="divider-solid">Делитель (сплошной)</option>
                            <option value="divider-dashed">Делитель (пунктир)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Выберите блок в документе, чтобы настроить его параметры.
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
