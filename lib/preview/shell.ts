// Опции оформления для предпросмотра в iframe.
export interface PreviewShellOptions {
  padding?: string;
  background?: string;
}

// Вставляем стили padding/background в <body> готового HTML.
export function injectPreviewShell(html: string, options: PreviewShellOptions = {}): string {
  const { padding = '24px', background = '#fff' } = options;

  const styleSnippet = `style="padding:${padding}; background:${background}"`;

  if (html.includes('<body ')) {
    return html.replace('<body ', `<body ${styleSnippet} `);
  }

  return html.replace('<body>', `<body ${styleSnippet}>`);
}
