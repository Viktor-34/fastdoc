export interface PreviewPayload {
  html: string;
  fontFamily?: string | null;
  fontStyles?: string | null;
  timestamp?: number;
}

const HTML_KEY = 'offerdoc-preview-html';
const FONT_KEY = 'offerdoc-preview-font';
const FONT_STYLE_KEY = 'offerdoc-preview-font-style';
const TS_KEY = 'offerdoc-preview-html-updated';

export function writePreviewPayload(payload: PreviewPayload) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HTML_KEY, payload.html);
  if (payload.fontFamily !== undefined) {
    localStorage.setItem(FONT_KEY, payload.fontFamily ?? '');
  }
  if (payload.fontStyles !== undefined) {
    localStorage.setItem(FONT_STYLE_KEY, payload.fontStyles ?? '');
  }
  localStorage.setItem(TS_KEY, String(payload.timestamp ?? Date.now()));
}

export function readPreviewPayload(): PreviewPayload | null {
  if (typeof window === 'undefined') return null;
  const html = localStorage.getItem(HTML_KEY);
  if (!html) return null;
  const fontFamily = localStorage.getItem(FONT_KEY);
  const fontStyles = localStorage.getItem(FONT_STYLE_KEY);
  const timestampRaw = localStorage.getItem(TS_KEY);
  return {
    html,
    fontFamily,
    fontStyles,
    timestamp: timestampRaw ? Number(timestampRaw) : undefined,
  };
}

export function clearPreviewPayload() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HTML_KEY);
  localStorage.removeItem(FONT_KEY);
  localStorage.removeItem(FONT_STYLE_KEY);
  localStorage.removeItem(TS_KEY);
}
