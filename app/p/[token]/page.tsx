import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';

export default async function PublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await prisma.shareLink.findUnique({ where: { token }, include: { document: true } });
  if (!share || (share.expiresAt && share.expiresAt < new Date())) return notFound();

  return (
    <div className="public-preview">
      <div className="page" dangerouslySetInnerHTML={{ __html: share.document.html }} />
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <button type="button" id="downloadPdf" className="download-button">
          Скачать PDF
        </button>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          const uid = (localStorage.uid ||= Math.random().toString(36).slice(2));
          const token = ${JSON.stringify(token)};
          const ping = (event, meta={}) =>
            fetch('/api/track', { method:'POST', headers:{'content-type':'application/json'},
              body: JSON.stringify({ token, event, uid, meta, ref: document.referrer })});
          ping('opened');
          let h; const start = () => h = setInterval(()=> ping('time', { seconds: 15 }), 15000);
          const stop = () => h && clearInterval(h);
          document.addEventListener('visibilitychange', () => document.visibilityState==='visible'?start():stop());
          start();
          const downloadBtn = document.getElementById('downloadPdf');
          if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
              ping('download');
              window.open('/p/' + token + '/pdf', '_blank', 'noopener,noreferrer');
            });
          }
        })();
      ` }} />
    </div>
  );
}
