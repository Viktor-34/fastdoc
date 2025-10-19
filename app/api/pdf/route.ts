import { NextRequest } from 'next/server';
import { htmlShell } from '@/lib/pdf/htmlShell';
import { getActiveWorkspaceId } from '@/lib/workspace';
import { WORKSPACE_COOKIE, WORKSPACE_HEADER } from '@/lib/workspace-constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // HTML превращаем в PDF, проверяя, что известен workspace.
  const { html } = await req.json();
  if (!html) return new Response('No HTML', { status: 400 });

  const headerWorkspace = req.headers.get(WORKSPACE_HEADER)?.trim();
  const cookieWorkspace = req.cookies.get(WORKSPACE_COOKIE)?.value?.trim();
  if (!headerWorkspace && !cookieWorkspace) {
    return new Response('Workspace required', { status: 403 });
  }

  const workspaceId = await getActiveWorkspaceId(headerWorkspace ?? cookieWorkspace ?? null);

  // Используем Playwright Chromium для рендеринга PDF на сервере.
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlShell(html), { waitUntil: 'networkidle' });
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top:'20mm', right:'15mm', bottom:'20mm', left:'15mm' },
    printBackground: true,
  });
  await browser.close();

  const body = new Uint8Array(pdf);
  return new Response(body, {
    headers: {
      'content-type':'application/pdf',
      'content-disposition':'attachment; filename="proposal.pdf"',
      // Возвращаем workspaceId в заголовке, чтобы клиент мог синхронизироваться.
      [WORKSPACE_HEADER]: workspaceId,
    }
  });
}
