'use client';

import { useEffect, useState } from 'react';

interface PublicPreviewClientProps {
  token: string;
  proposalHtml: string;
}

export default function PublicPreviewClient({ token, proposalHtml }: PublicPreviewClientProps) {
  const [iframeHeight, setIframeHeight] = useState('100vh');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'resize') {
        return;
      }

      const rawHeight = event.data.height;
      if (typeof rawHeight !== 'number' || !Number.isFinite(rawHeight)) {
        return;
      }

      const nextHeight = Math.max(320, Math.round(rawHeight + 40));
      setIframeHeight(`${nextHeight}px`);
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    const uidKey = 'uid';
    let uid = localStorage.getItem(uidKey);
    if (!uid) {
      uid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      localStorage.setItem(uidKey, uid);
    }

    const ping = (event: string, meta: Record<string, unknown> = {}) => {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, event, uid, meta, ref: document.referrer }),
      }).catch(() => {
        // Best-effort analytics, do not block UI.
      });
    };

    ping('opened');

    let intervalId: number | null = null;
    const start = () => {
      if (intervalId !== null) {
        return;
      }
      intervalId = window.setInterval(() => ping('time', { seconds: 15 }), 15000);
    };

    const stop = () => {
      if (intervalId === null) {
        return;
      }
      window.clearInterval(intervalId);
      intervalId = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        start();
      } else {
        stop();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    if (document.visibilityState === 'visible') {
      start();
    }

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token]);

  const handleDownload = () => {
    const uid = localStorage.getItem('uid');
    fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, event: 'download', uid: uid || undefined, ref: document.referrer }),
    }).catch(() => {
      // Best-effort analytics, do not block UI.
    });

    window.open(`/p/${token}/pdf`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="public-preview">
      <div
        style={{
          width: 'min(900px, 100%)',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 24px 48px -32px rgba(15,23,42,0.25)',
          overflow: 'hidden',
        }}
      >
        <iframe
          srcDoc={proposalHtml}
          style={{
            width: '100%',
            height: iframeHeight,
            border: 'none',
            display: 'block',
          }}
          title="Коммерческое предложение"
        />
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <button type="button" id="downloadPdf" className="download-button" onClick={handleDownload}>
          Скачать PDF
        </button>
      </div>
    </div>
  );
}
