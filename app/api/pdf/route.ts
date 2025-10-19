import { NextRequest } from 'next/server';
import { htmlShell } from '@/lib/pdf/htmlShell';
import { launchPdfBrowser } from '@/lib/pdf/launchBrowser';
import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';
import { WORKSPACE_COOKIE, WORKSPACE_HEADER } from '@/lib/workspace-constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  // HTML превращаем в PDF, проверяя, что известен workspace.
  const { html } = await req.json();
  if (!html) return new Response('No HTML', { status: 400 });

  const headerWorkspace = req.headers.get(WORKSPACE_HEADER)?.trim();
  const cookieWorkspace = req.cookies.get(WORKSPACE_COOKIE)?.value?.trim();
  const workspaceId = await getActiveWorkspaceId(
    headerWorkspace ?? cookieWorkspace ?? session.user.workspaceId ?? null,
  );

  try {
    const browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlShell(html), { waitUntil: 'networkidle0' });
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
  } catch (error) {
    console.error('PDF generation failed', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
