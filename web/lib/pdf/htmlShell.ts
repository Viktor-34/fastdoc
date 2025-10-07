export function htmlShell(content: string, baseUrl = ''): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<link rel="stylesheet" href="${baseUrl}/styles/preview.css"/></head>
<body><div class="page">${content}</div></body></html>`;
}


