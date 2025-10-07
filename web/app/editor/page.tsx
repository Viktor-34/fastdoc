'use client';
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { generateHTML } from '@tiptap/html';
import { htmlShell } from '@/lib/pdf/htmlShell';
import { createClientExtensions, createServerExtensions } from '@/lib/tiptap/extensions';
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace-constants';
import { getClientWorkspaceId, setClientWorkspaceId, withWorkspaceHeader } from '@/lib/workspace-client';

export default function EditorPage() {
  const clientExtensions = useMemo(() => createClientExtensions(), []);
  const editor = useEditor({ extensions: clientExtensions, content: '<p>Начните с текста…</p>' });

  const [html, setHtml] = useState('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!getClientWorkspaceId()) {
      setClientWorkspaceId(DEFAULT_WORKSPACE_ID);
    }
  }, []);

  const refreshPreview = useCallback(() => {
    if (!editor) return;
    const json = editor.getJSON();
    const out = generateHTML(json, createServerExtensions() as unknown as []);
    setHtml(out);
    const doc = previewRef.current?.contentDocument;
    if (doc) { doc.open(); doc.write(htmlShell(out, '')); doc.close(); }
  }, [editor]);

  const exportPdf = useCallback(async () => {
    const res = await fetch('/api/pdf', withWorkspaceHeader({
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({ html }),
    }));
    const blob = await res.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'proposal.pdf'; a.click(); URL.revokeObjectURL(url);
  }, [html]);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', height:'100vh' }}>
      <div style={{ padding:16, display:'grid', gridTemplateRows:'auto 1fr auto', gap:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={refreshPreview}>Предпросмотр</button>
          <button onClick={exportPdf}>Экспорт в PDF</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, minHeight:0 }}>
          <div style={{ border:'1px solid #ddd', borderRadius:8, padding:12, overflow:'auto' }}>
            <EditorContent editor={editor} />
          </div>
          <div style={{ border:'1px solid #eee', borderRadius:8, overflow:'hidden' }}>
            <iframe ref={previewRef} title="preview" style={{ width:'100%', height:'100%', border:0 }} />
          </div>
        </div>
      </div>
      <aside style={{ borderLeft:'1px solid #eee', padding:16, display:'flex', flexDirection:'column', gap:8 }}>
        <b>Блоки</b>
        <button onClick={() => editor?.chain().focus().insertContent({ type:'heading', attrs:{ level:2 }, content:[{ type:'text', text:'Заголовок' }] }).run()}>Заголовок</button>
        <button onClick={() => editor?.chain().focus().insertContent('Новый текст').run()}>Текст</button>
        <button onClick={() => { const url = prompt('URL изображения'); if (url) editor?.chain().focus().setImage({ src:url }).run(); }}>Изображение</button>
        <button onClick={() => editor?.chain().focus().insertSpacer(24).run()}>Отступ</button>
        <button onClick={() => editor?.chain().focus().insertContent({ type:'priceTable', attrs:{ rows:[] } }).run()}>Таблица цен</button>
      </aside>
    </div>
  );
}
