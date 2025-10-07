ниже — расширенная план-документация для **Next.js + React + Tiptap** сервиса коммерческих предложений: архитектура, схема БД (Prisma/Postgres), набор расширений Tiptap (включая кастомные «Отступ» и «Таблица цен»), предпросмотр → PDF, публичные ссылки с UTM и трекингом, шаблоны, каталог товаров, базовый workflow и e-signature-интеграция. Этого хватит, чтобы «скормить в Cursor» и начать писать код по шагам.

---

# 1) Архитектура (высокоуровнево)

- Frontend: **Next.js (App Router) + React**  
    Редактор (Tiptap) + правая палитра блоков + предпросмотр (iframe). Страницы публичного просмотра `/p/:token` и `/p/:token/pdf`.
    
- Editor: **Tiptap (MIT)**  
    Расширения: `StarterKit`, `Image`, кастомные `Spacer`, `PriceTable`, опционально `Link`, `TextAlign`, `Underline`. Реал-тайм (опция): **Yjs + Hocuspocus**.
    
- Сервер: **Node runtime** роуты  
    `/api/doc` (создание/обновление), `/api/pdf` (HTML→PDF), `/api/track` (события аналитики), `/api/upload` (изображения), `/api/templates`.
    
- Хранилище: **Postgres + Prisma**  
    Таблицы: `users`, `workspaces`, `documents`, `document_versions`, `templates`, `products`, `price_items`, `share_links`, `events`.
    
- Файлы: изображения в **S3/MinIO**.
    
- Аутентификация: **Auth.js (NextAuth)** с JWT + RBAC ролями (owner/admin/editor/viewer).
    
- PDF: **Playwright** (или `puppeteer-core + @sparticuz/chromium` для серверлесс).
    
- Аналитика: собственный `/api/track` + опционально **Umami/Plausible** в публичной странице.
    

---

# 2) Стек и пакеты

```bash
# базовые
npm i next react react-dom zod clsx axios
# auth + db
npm i next-auth @prisma/client
npm i -D prisma
# editor
npm i @tiptap/react @tiptap/core @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-text-align @tiptap/html
# pdf
npm i -D playwright
# загрузка в s3 (пример)
npm i @aws-sdk/client-s3
# real-time (опция)
npm i yjs @hocuspocus/provider
```

---

# 3) Структура проекта (App Router)

```
app/
  editor/page.tsx                // редактор + палитра + предпросмотр
  p/[token]/page.tsx             // публичный просмотр HTML
  p/[token]/pdf/route.ts         // PDF по прямой ссылке
  api/
    doc/route.ts                 // create/update документа
    pdf/route.ts                 // HTML -> PDF
    track/route.ts               // события аналитики
    upload/route.ts              // загрузки изображений
    templates/route.ts           // CRUD шаблонов
lib/
  tiptap/
    spacer.ts                    // кастомный «Отступ»
    priceTable/                  // «Таблица цен»: node + React NodeView
      node.ts
      view.tsx
  pdf/
    htmlShell.ts                 // общий HTML-шаблон для PDF/preview
  db/
    prisma.ts
  analytics.ts                   // трекинг-хелперы
  share.ts                       // генерация/валидация токенов
styles/
  preview.css                    // печать/предпросмотр (A4)
prisma/
  schema.prisma
```

---

# 4) Схема БД (Prisma, Postgres)

```prisma
// prisma/schema.prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  workspaceId String?
  workspace Workspace? @relation(fields: [workspaceId], references: [id])
  role      Role     @default(EDITOR) // WORKSPACE role
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Workspace {
  id        String     @id @default(cuid())
  name      String
  users     User[]
  documents Document[]
  templates Template[]
  products  Product[]
  createdAt DateTime   @default(now())
}

enum Role { OWNER ADMIN EDITOR VIEWER }

model Document {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  title       String
  json        Json      // текущее состояние (Tiptap JSON)
  html        String    // материализованный HTML (для preview/pdf)
  version     Int       @default(1)
  createdBy   String
  updatedBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  versions    DocumentVersion[]
  shares      ShareLink[]
}

model DocumentVersion {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id])
  version     Int
  json        Json
  html        String
  createdAt   DateTime @default(now())
}

model Template {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  name        String
  json        Json
  createdAt   DateTime  @default(now())
}

model ShareLink {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id])
  token       String   @unique
  expiresAt   DateTime?
  allowPdf    Boolean  @default(true)
  utmSource   String?
  createdAt   DateTime @default(now())
}

model Product {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  name        String
  sku         String?  @unique
  description String?
  currency    String   @default("RUB")
  basePrice   Decimal  @db.Decimal(12,2)
  priceItems  PriceItem[]
}

model PriceItem {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  label      String
  qty        Int      @default(1)
  unitPrice  Decimal  @db.Decimal(12,2)
  discount   Decimal  @db.Decimal(5,2)? // %
}
```

---

# 5) Расширения Tiptap (блоки)

## 5.1 «Отступ» (Spacer) — простой пример

```ts
// lib/tiptap/spacer.ts
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacer: {
      insertSpacer: (size?: number) => ReturnType;
      setSpacerSize: (size: number) => ReturnType;
    }
  }
}

export const Spacer = Node.create({
  name: 'spacer',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() { return { size: { default: 24 } }; },
  parseHTML() { return [{ tag: 'div[data-spacer]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-spacer': '', style: `height:${HTMLAttributes.size}px` })];
  },
  addCommands() {
    return {
      insertSpacer: (size = 24) => ({ chain }) =>
        chain().insertContent({ type: this.name, attrs: { size } }).run(),
      setSpacerSize: (size: number) => ({ commands }) =>
        commands.updateAttributes(this.name, { size }),
    };
  },
});
```

## 5.2 «Таблица цен» (PriceTable) — Node + React NodeView (скелет)

_Идея:_ нода хранит массив позиций `{name, qty, price, discount}`, считает итог; NodeView рисует мини-таблицу с инпутами. На экспорт — аккуратный HTML.

```ts
// lib/tiptap/priceTable/node.ts
import { Node } from '@tiptap/core';

export const PriceTableNode = Node.create({
  name: 'priceTable',
  group: 'block',
  atom: true,
  addAttributes() {
    return { currency: { default: 'RUB' }, rows: { default: [] as any[] } };
  },
  parseHTML() { return [{ tag: 'div[data-price-table]' }]; },
  renderHTML({ HTMLAttributes }) {
    // на экспорт — чистый HTML (без React-инпутов)
    const rows = (HTMLAttributes as any).rows || [];
    const toNum = (x: any) => Number(x ?? 0);
    const sum = rows.reduce((a: number, r: any) => a + toNum(r.qty)*toNum(r.price)*(1 - toNum(r.discount)/100), 0);
    return ['div', { 'data-price-table': '', 'data-currency': HTMLAttributes.currency },
      ['table', {},
        ['thead', {}, ['tr', {}, ['th', {}, 'Позиция'], ['th', {}, 'Кол-во'], ['th', {}, 'Цена'], ['th', {}, 'Скидка'], ['th', {}, 'Сумма']]],
        ['tbody', {}, ...rows.map((r: any) => ['tr', {},
          ['td', {}, r.name || ''],
          ['td', {}, String(r.qty || 0)],
          ['td', {}, String(r.price || 0)],
          ['td', {}, `${r.discount||0}%`],
          ['td', {}, String(toNum(r.qty)*toNum(r.price)*(1 - toNum(r.discount)/100))],
        ])],
        ['tfoot', {}, ['tr', {}, ['td', { colSpan: 4 }, 'Итого'], ['td', {}, String(sum)]]]
      ]
    ];
  },
});
```

```tsx
// lib/tiptap/priceTable/view.tsx
'use client';
import React, { useState } from 'react';
import { ReactNodeViewRenderer, NodeViewContent, NodeViewProps } from '@tiptap/react';

export function PriceTableView({ node, updateAttributes, editor }: NodeViewProps) {
  const [rows, setRows] = useState<any[]>(node.attrs.rows || []);
  const save = (next: any[]) => { setRows(next); updateAttributes({ rows: next }); };

  return (
    <div data-price-table style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <b>Таблица цен</b>
        <div>
          <button onClick={() => save([...rows, { name:'Позиция', qty:1, price:0, discount:0 }])}>Добавить</button>
          <button onClick={() => editor.commands.deleteSelection()} style={{ marginLeft:8 }}>Удалить блок</button>
        </div>
      </div>
      <table style={{ width:'100%', fontSize:14 }}>
        <thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена</th><th>Скидка %</th><th>Сумма</th></tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const sum = (Number(r.qty||0) * Number(r.price||0) * (1 - Number(r.discount||0)/100)) || 0;
            return (
              <tr key={i}>
                <td><input value={r.name||''} onChange={e => { const n=[...rows]; n[i].name=e.target.value; save(n); }} /></td>
                <td><input type="number" value={r.qty||0} onChange={e => { const n=[...rows]; n[i].qty=+e.target.value; save(n); }} /></td>
                <td><input type="number" value={r.price||0} onChange={e => { const n=[...rows]; n[i].price=+e.target.value; save(n); }} /></td>
                <td><input type="number" value={r.discount||0} onChange={e => { const n=[...rows]; n[i].discount=+e.target.value; save(n); }} /></td>
                <td>{sum.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const PriceTable = PriceTableNode.extend({
  addNodeView() { return ReactNodeViewRenderer(PriceTableView); },
});
```

---

# 6) Предпросмотр и печать

- Используйте **один и тот же HTML** для предпросмотра и PDF.
    
- Стили под печать — в `styles/preview.css`:
    

```css
/* styles/preview.css */
body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.5; color:#222; }
.page { width:210mm; min-height:297mm; padding:20mm 15mm; margin:0 auto; background:white; box-shadow:0 0 0 1px #eee; }
@media print {
  .page { box-shadow:none; }
  @page { size:A4; margin:20mm 15mm; }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
}
```

- Общий HTML-шаблон для iframe/PDF:
    

```ts
// lib/pdf/htmlShell.ts
export function htmlShell(content: string, baseUrl = '') {
  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<link rel="stylesheet" href="${baseUrl}/styles/preview.css"/></head>
<body><div class="page">${content}</div></body></html>`;
}
```

---

# 7) Экспорт PDF

Роут `/api/pdf` (Node runtime):

```ts
// app/api/pdf/route.ts
import { NextRequest } from 'next/server';
import { htmlShell } from '@/lib/pdf/htmlShell';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { html } = await req.json();
  if (!html) return new Response('No HTML', { status: 400 });

  const { chromium } = await import('playwright'); // dev/Node
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlShell(html), { waitUntil: 'networkidle' });

  const pdf = await page.pdf({
    format: 'A4',
    margin: { top:'20mm', right:'15mm', bottom:'20mm', left:'15mm' },
    printBackground: true,
  });
  await browser.close();

  return new Response(pdf, {
    headers: { 'content-type':'application/pdf', 'content-disposition':'attachment; filename="proposal.pdf"' }
  });
}
```

> Серверлесс: замените на `puppeteer-core + @sparticuz/chromium` и используйте Edge-совместимый бандл.

---

# 8) Публичные ссылки и security

- Создавайте запись в `ShareLink` с `token`, `expiresAt`, `allowPdf`, `utmSource`.
    
- Публичная страница `/p/[token]` рендерит HTML из `Document` **read-only**.
    
- Ограничения:
    
    - **CSP** с `default-src 'self'` и whitelist доменов для изображений.
        
    - Без inline-скриптов внутри контента; sanitization: сохраняйте только Tiptap JSON и генерируйте HTML сами.
        
    - Если `expiresAt < now` → 404.
        
    - Можно включить однократные ссылки (погашение токена после первого открытия).
        

---

# 9) Трекинг и аналитика

## 9.1 Клиент на публичной странице

```html
<script>
  (function(){
    const uid = (localStorage.uid ||= Math.random().toString(36).slice(2));
    const token = "{{token}}";
    const ping = (event, meta={}) =>
      fetch('/api/track', { method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ token, event, uid, meta, ref: document.referrer })});

    ping('opened');
    let h; const start = () => h = setInterval(()=> ping('time', { seconds: 15 }), 15000);
    const stop = () => h && clearInterval(h);
    document.addEventListener('visibilitychange', () => document.visibilityState==='visible'?start():stop());
    start();
    document.getElementById('downloadPdf')?.addEventListener('click', ()=> ping('download'));
  })();
</script>
```

## 9.2 API и модель событий

```ts
// app/api/track/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  const { token, event, uid, meta, ref } = await req.json();
  if (!token || !event || !uid) return new Response('Bad', { status: 400 });
  await prisma.events.create({ data: { token, event, uid, meta, ref } as any });
  return new Response('ok');
}
```

```prisma
model Events {
  id      String   @id @default(cuid())
  token   String   // ShareLink.token
  uid     String
  event   String   // opened, time, download
  ref     String?
  meta    Json?
  ts      DateTime @default(now())
}
```

---

# 10) Шаблоны (templates) и версии документов

- Шаблон — Tiptap JSON (и производный HTML).
    
- CRUD шаблонов: `/api/templates` (создание из текущего документа, применение к новому документу).
    
- Версионирование: при каждом «Publish» снимайте `DocumentVersion` (JSON+HTML) и инкрементируйте `Document.version`.
    

---

# 11) Каталог товаров и интеграция с блоком «Таблица цен»

- Таблица `products`, `price_items` (см. Prisma).
    
- В NodeView «Таблица цен» — кнопка «Добавить из каталога» с модальным окном поиска по SKU/названию.
    
- Цена и валюта — подставляются автоматически; итоговые суммы пересчитываются на лету; в HTML — числовые значения, валюту форматируйте CSS/JS при рендере.
    

---

# 12) Воркфлоу и e-signature (минимум)

- Workflow статусы у `Document`: `draft | reviewing | approved | sent | signed`.
    
- Webhooks на `events` → уведомления в Telegram/Email.
    
- E-signature: интеграция REST с **Documenso** или **DocuSeal**: передавайте PDF, получайте ссылку на подпись, храните статус в `ShareLink` или отдельной таблице `sign_requests`.
    

---

# 13) Аутентификация, RBAC, мульти-тенант

- **Auth.js** провайдер email/пароль или OAuth.
    
- В `Workspace` храните пользователей и их `Role`.
    
- Все API проверяют `session.user.workspaceId` и фильтруют по нему.
    
- Роли:
    
    - **OWNER/ADMIN** — полные права, управление пользователями.
        
    - **EDITOR** — редактирование документов/шаблонов.
        
    - **VIEWER** — только просмотр внутри рабочего места (не путать с публичными ссылками).
        

---

# 14) Безопасность и качество

- **Sanitization:** не храните «сырой» HTML от пользователя, генерируйте из Tiptap JSON (вы контролируете схему).
    
- **CSP:** `default-src 'self'; img-src 'self' data: https:;`
    
- **Rate limit** на `/api/pdf` и `/api/track`.
    
- **Загрузка изображений:** проверка типов, переименование, лимит размеров, S3 bucket private + подписанные URLs.
    
- **PDF-шрифты:** подключите фирменные WOFF2 через `@font-face` в `styles/preview.css`.
    

---

# 15) Тестирование

- **Unit:** рендереры JSON→HTML для каждого блока (включая PriceTable).
    
- **E2E (Playwright):**
    
    - создаёт документ → предпросмотр совпадает с PDF (скриншот-дифф).
        
    - публичная страница доступна/истекает по `expiresAt`.
        
    - отправка `download` в `events` при клике «Скачать PDF».
        
- **Contract tests:** Zod-схемы входящих данных для `/api/doc`, `/api/track`, `/api/upload`.
    

---

# 16) Развёртывание и DevOps

- ENV: `DATABASE_URL`, `NEXTAUTH_SECRET`, `S3_*`, `BASE_URL`.
    
- Миграции: `prisma migrate`.
    
- Логи: вывод в stdout + кореляция requestId; храните event-агрегаты в materialized view.
    
- Кэш: первые PDF складывайте в S3; на `/p/:token/pdf` отдавайте уже готовый файл, если существует.
    

---

# 17) План релизов (MVP → v1)

**MVP (1–2 недели):**

- Редактор (Tiptap) с блоками: Заголовок, Текст, Изображение, Отступ, Таблица цен (минимум).
    
- Предпросмотр (iframe) + экспорт PDF (Playwright).
    
- Публичные ссылки (/p/:token) + базовая аналитика (`opened`, `time`, `download`).
    
- Хранилище: Postgres + Prisma.
    
- Шаблоны: сохранить/применить.
    

**v1 (3–6 недель):**

- Каталог товаров + вставка в PriceTable.
    
- RBAC, мульти-тенант, аудиты версий.
    
- Тонкая типографика под печать + фирменные шрифты.
    
- Импорт/экспорт шаблонов.
    
- E-signature интеграция (Documenso/DocuSeal).
    
- Real-time коллаборация (Yjs/Hocuspocus).
    

---

# 18) Ключевые фрагменты кода (ускорители)

## 18.1 Инициализация редактора (страница `app/editor/page.tsx` — идея)

```tsx
'use client';
import { useMemo, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Spacer } from '@/lib/tiptap/spacer';
import { PriceTable } from '@/lib/tiptap/priceTable/view';
import { generateHTML } from '@tiptap/html';
import { htmlShell } from '@/lib/pdf/htmlShell';

export default function EditorPage() {
  const extensions = useMemo(() => [
    StarterKit, Image, Link, TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Spacer, PriceTable
  ], []);
  const editor = useEditor({ extensions, content: '<p>Начните с текста…</p>' });

  const [html, setHtml] = useState('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const refreshPreview = useCallback(() => {
    if (!editor) return;
    const json = editor.getJSON();
    const out = generateHTML(json, extensions as any);
    setHtml(out);
    const doc = previewRef.current?.contentDocument;
    if (doc) { doc.open(); doc.write(htmlShell(out, '')); doc.close(); }
  }, [editor, extensions]);

  const exportPdf = useCallback(async () => {
    const res = await fetch('/api/pdf', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ html }) });
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
```

## 18.2 Создание/обновление документа (API)

```ts
// app/api/doc/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Spacer } from '@/lib/tiptap/spacer';
import { PriceTable } from '@/lib/tiptap/priceTable/view';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { id, title, json } = await req.json();
  if (!json || !title) return new Response('Bad', { status: 400 });
  const html = generateHTML(json, [StarterKit, Image, Spacer, PriceTable] as any);
  if (id) {
    const doc = await prisma.document.update({ where:{ id }, data:{ title, json, html } });
    return Response.json({ id: doc.id });
  } else {
    const doc = await prisma.document.create({ data:{ title, json, html, workspaceId:'default', createdBy:'system', updatedBy:'system' }});
    return Response.json({ id: doc.id });
  }
}
```

---

# 19) Гайды по качеству PDF

- Вставляйте фирменные шрифты WOFF2 (`@font-face`) и используйте `printBackground: true`.
    
- На крупные блоки ставьте класс `avoid-break`.
    
- Изображения указывайте с `width/height` (стабильная разбивка страниц).
    
- Для валют форматируйте суммирование однажды (на сервере при генерации HTML) — PDF станет детерминированным.
    

---

# 20) Критерии готовности (Definition of Done)

- Редактор позволяет добавить/удалить все блоки, «Таблица цен» пересчитывает итоги.
    
- Предпросмотр совпадает с PDF по шрифту, отступам и разрывам.
    
- Публичная ссылка с UTM работает, события `opened/time/download` пишутся.
    
- Документы и версии сохраняются в БД; шаблоны применяются.
    
- Сценарий «создал → отправил ссылку → клиент скачал PDF» полностью покрыт e2e-тестом.
    

---

Если хотите, могу сразу выдать «стартовый» репозиторий-каркас (Next App Router + Tiptap + кастомные ноды + Prisma + PDF + публичные ссылки + трекинг), чтобы вы загрузили в Cursor и начали дописывать бизнес-логику.