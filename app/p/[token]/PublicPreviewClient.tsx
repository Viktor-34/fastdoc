'use client';

import { useEffect, useRef, useState } from 'react';

export interface PublicVariantPreviewTab {
  id: string;
  name: string;
  isRecommended?: boolean;
  html: string;
}

interface PublicPreviewClientProps {
  token: string;
  proposalHtml: string;
  variantPreviewTabs?: PublicVariantPreviewTab[];
}

export default function PublicPreviewClient({
  token,
  proposalHtml,
  variantPreviewTabs,
}: PublicPreviewClientProps) {
  const [iframeHeight, setIframeHeight] = useState('100vh');
  const [variantTabsAnchorTop, setVariantTabsAnchorTop] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variantPreviewTabs && variantPreviewTabs.length > 0 ? variantPreviewTabs[0].id : null,
  );
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const restoreScrollFrameRef = useRef<number | null>(null);
  const pendingTabScrollRestoreRef = useRef<{ x: number; y: number } | null>(null);
  const scrollHistoryRef = useRef<Array<{ at: number; x: number; y: number }>>([]);
  const clearPendingTabScrollTimeoutRef = useRef<number | null>(null);
  const extraScrollRestoreTimeoutsRef = useRef<number[]>([]);
  const hasOuterVariantTabs = Array.isArray(variantPreviewTabs) && variantPreviewTabs.length > 1;
  const activeVariantPreview =
    hasOuterVariantTabs
      ? variantPreviewTabs.find((tab) => tab.id === selectedVariantId) ?? variantPreviewTabs[0]
      : null;
  const iframeSrcDoc = activeVariantPreview?.html ?? proposalHtml;

  useEffect(() => {
    if (!hasOuterVariantTabs) {
      if (selectedVariantId !== null) {
        setSelectedVariantId(null);
      }
      return;
    }

    const firstId = variantPreviewTabs[0]?.id ?? null;
    const exists = variantPreviewTabs.some((tab) => tab.id === selectedVariantId);
    if (!exists && firstId) {
      setSelectedVariantId(firstId);
    }
  }, [hasOuterVariantTabs, selectedVariantId, variantPreviewTabs]);

  useEffect(() => {
    const rememberScrollPosition = () => {
      const now = Date.now();
      const next = [...scrollHistoryRef.current, { at: now, x: window.scrollX, y: window.scrollY }];
      scrollHistoryRef.current = next.slice(-12);
    };

    const scheduleScrollRestore = (position: { x: number; y: number }) => {
      extraScrollRestoreTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      extraScrollRestoreTimeoutsRef.current = [];

      if (restoreScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreScrollFrameRef.current);
      }
      restoreScrollFrameRef.current = window.requestAnimationFrame(() => {
        restoreScrollFrameRef.current = window.requestAnimationFrame(() => {
          window.scrollTo(position.x, position.y);
          restoreScrollFrameRef.current = null;
        });
      });

      // Safari/Chrome могут выполнить "поздний" нативный скролл после первого фокуса iframe.
      // Повторяем восстановление несколько раз короткими таймаутами.
      [40, 120, 260].forEach((delay) => {
        const id = window.setTimeout(() => {
          window.scrollTo(position.x, position.y);
          extraScrollRestoreTimeoutsRef.current = extraScrollRestoreTimeoutsRef.current.filter((x) => x !== id);
        }, delay);
        extraScrollRestoreTimeoutsRef.current.push(id);
      });
    };

    const captureStableScroll = () => {
      const now = Date.now();
      const history = scrollHistoryRef.current;
      let snapshot = history[history.length - 1];
      for (let i = history.length - 1; i >= 0; i -= 1) {
        const entry = history[i];
        if (!entry) continue;
        if (now - entry.at > 20) {
          snapshot = entry;
          break;
        }
      }
      if (!snapshot) {
        snapshot = { at: now, x: window.scrollX, y: window.scrollY };
      }
      pendingTabScrollRestoreRef.current = { x: snapshot.x, y: snapshot.y };
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'variant-tab-interaction-start') {
        captureStableScroll();
        iframeRef.current?.blur();
        return;
      }

      if (event.data?.type === 'variant-tab-activated') {
        const pending = pendingTabScrollRestoreRef.current;
        if (pending) {
          scheduleScrollRestore(pending);
          if (clearPendingTabScrollTimeoutRef.current !== null) {
            window.clearTimeout(clearPendingTabScrollTimeoutRef.current);
          }
          clearPendingTabScrollTimeoutRef.current = window.setTimeout(() => {
            pendingTabScrollRestoreRef.current = null;
            clearPendingTabScrollTimeoutRef.current = null;
          }, 400);
        }
        return;
      }

      if (event.data?.type === 'public-preview-variant-tabs-anchor') {
        const top = event.data?.top;
        if (typeof top === 'number' && Number.isFinite(top)) {
          setVariantTabsAnchorTop(Math.max(0, Math.round(top)));
        }
        return;
      }

      if (event.data?.type !== 'resize') {
        return;
      }

      const rawHeight = event.data.height;
      if (typeof rawHeight !== 'number' || !Number.isFinite(rawHeight)) {
        return;
      }

      // Avoid feedback loops: child iframe can emit a resize event when parent changes iframe height.
      // Do not add a persistent offset on every message, otherwise height can grow indefinitely.
      const nextHeight = Math.max(320, Math.ceil(rawHeight));
      const scrollPositionBeforeResize =
        pendingTabScrollRestoreRef.current ?? { x: window.scrollX, y: window.scrollY };
      setIframeHeight((prevHeight) => {
        const prev = Number.parseInt(prevHeight, 10);
        if (Number.isFinite(prev) && Math.abs(prev - nextHeight) <= 1) {
          return prevHeight;
        }

        scheduleScrollRestore(scrollPositionBeforeResize);

        return `${nextHeight}px`;
      });

      pendingTabScrollRestoreRef.current = null;
      if (clearPendingTabScrollTimeoutRef.current !== null) {
        window.clearTimeout(clearPendingTabScrollTimeoutRef.current);
        clearPendingTabScrollTimeoutRef.current = null;
      }
    };

    rememberScrollPosition();
    window.addEventListener('scroll', rememberScrollPosition, { passive: true });
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('scroll', rememberScrollPosition);
      window.removeEventListener('message', handleMessage);
      if (restoreScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreScrollFrameRef.current);
      }
      extraScrollRestoreTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      extraScrollRestoreTimeoutsRef.current = [];
      if (clearPendingTabScrollTimeoutRef.current !== null) {
        window.clearTimeout(clearPendingTabScrollTimeoutRef.current);
      }
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

  useEffect(() => {
    if (!hasOuterVariantTabs) {
      if (variantTabsAnchorTop !== null) {
        setVariantTabsAnchorTop(null);
      }
      return;
    }
    // Keep previous anchor during iframe swap to avoid flicker; next iframe will send a fresh value.
  }, [hasOuterVariantTabs, selectedVariantId, variantTabsAnchorTop]);

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

  const requestIframeMeasurements = () => {
    const frameWindow = iframeRef.current?.contentWindow as
      | (Window & {
          sendHeight?: () => void;
          sendPublicPreviewVariantTabsAnchor?: () => void;
        })
      | null
      | undefined;
    if (!frameWindow) return;

    try {
      frameWindow.sendHeight?.();
      frameWindow.sendPublicPreviewVariantTabsAnchor?.();
    } catch {
      // Ignore transient srcDoc access timing issues; next retry usually succeeds.
    }
  };

  useEffect(() => {
    const retryIds = [
      window.setTimeout(requestIframeMeasurements, 0),
      window.setTimeout(requestIframeMeasurements, 80),
      window.setTimeout(requestIframeMeasurements, 220),
      window.setTimeout(requestIframeMeasurements, 480),
    ];

    return () => {
      retryIds.forEach((id) => window.clearTimeout(id));
    };
  }, [iframeSrcDoc]);

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
          position: 'relative',
        }}
      >
        <iframe
          key={activeVariantPreview?.id ?? 'default-preview'}
          ref={iframeRef}
          tabIndex={-1}
          srcDoc={iframeSrcDoc}
          onLoad={() => {
            requestIframeMeasurements();
            window.setTimeout(requestIframeMeasurements, 60);
            window.setTimeout(requestIframeMeasurements, 180);
          }}
          style={{
            width: '100%',
            height: iframeHeight,
            border: 'none',
            display: 'block',
            position: 'relative',
            zIndex: 1,
          }}
          title="Коммерческое предложение"
        />
        {hasOuterVariantTabs && variantTabsAnchorTop !== null ? (
          <div
            style={{
              position: 'absolute',
              left: '40px',
              right: '40px',
              top: `${variantTabsAnchorTop}px`,
              zIndex: 3,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              pointerEvents: 'auto',
            }}
          >
            {variantPreviewTabs.map((tab) => {
              const isActive = tab.id === activeVariantPreview?.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(tab.id);
                    setIframeHeight((prev) => prev);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '9999px',
                    border: `1px solid ${isActive ? '#3d3d3a' : '#d9d7d2'}`,
                    background: isActive ? '#3d3d3a' : '#ffffff',
                    color: isActive ? '#ffffff' : '#3d3d3a',
                    fontSize: '15px',
                    fontWeight: 400,
                    cursor: 'pointer',
                  }}
                >
                  <span>{tab.name}</span>
                  {tab.isRecommended ? (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: isActive ? 'rgba(255,255,255,0.16)' : 'rgba(60,179,113,0.16)',
                        color: isActive ? '#ffffff' : '#1d6b44',
                      }}
                    >
                      Рекомендуем
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <button type="button" id="downloadPdf" className="download-button" onClick={handleDownload}>
          Скачать PDF
        </button>
      </div>
    </div>
  );
}
