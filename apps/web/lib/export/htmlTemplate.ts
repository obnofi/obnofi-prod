import type { Editor as TiptapEditor } from "@tiptap/core";
import type { Page } from "@obnofi/types";

type BuildHtmlParams = {
  editor: TiptapEditor | null;
  page: Pick<Page, "title" | "icon" | "coverImage" | "type">;
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const PDF_EXTRA_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111110;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard",
      "Noto Sans KR", "Apple SD Gothic Neo", Roboto, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.7;
  }
  .page-shell {
    width: min(1600px, calc(100vw - 32px));
    margin: 0 auto;
    padding: 32px 16px 80px;
  }
  .page-canopy {
    margin: -32px 0 24px;
    width: 100%;
  }
  .page-canopy img {
    width: 100%;
    height: 240px;
    object-fit: cover;
    display: block;
  }
  .page-header {
    max-width: 820px;
    margin: 0 auto 32px;
  }
  .page-icon {
    font-size: 48px;
    line-height: 1;
    margin-bottom: 12px;
  }
  .page-title {
    font-size: 40px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .page-content {
    width: 100%;
    max-width: 100%;
  }
  .page-content h1 { font-size: 30px; font-weight: 700; margin: 32px 0 12px; }
  .page-content h2 { font-size: 24px; font-weight: 700; margin: 28px 0 10px; }
  .page-content h3 { font-size: 20px; font-weight: 600; margin: 24px 0 8px; }
  .page-content p { margin: 8px 0; }
  .page-content ul, .page-content ol { margin: 8px 0; padding-left: 24px; }
  .page-content li { margin: 4px 0; }
  .page-content blockquote {
    margin: 16px 0;
    padding: 8px 16px;
    border-left: 3px solid #d4d4d8;
    color: #52525b;
  }
  .page-content pre {
    background: #f4f4f5;
    border-radius: 6px;
    padding: 12px 16px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .page-content code {
    background: #f4f4f5;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.9em;
  }
  .page-content pre code { background: transparent; padding: 0; }
  .page-content a { color: #2563eb; text-decoration: underline; }
  .page-content img, .page-content svg, .page-content canvas {
    max-width: 100%;
    height: auto;
  }
  .page-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
  }
  .page-content th, .page-content td {
    border: 1px solid #e4e4e7;
    padding: 8px 12px;
    text-align: left;
  }
  .page-content hr { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
  .export-form-value {
    display: block;
    white-space: pre-wrap;
  }
  @media print {
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    body { font-size: 12pt; }
    .page-shell {
      width: 100%;
      max-width: none;
      padding: 0;
    }
    .page-canopy { margin: 0 0 16pt; width: 100%; }
    .page-canopy img { height: 180pt; }
    .page-header {
      max-width: 760pt;
      margin: 0 0 20pt;
    }
    .page-content pre, .page-content code { background: #f4f4f5 !important; }
    a { color: #1d4ed8; }
  }
`;

export const buildPrintableHtml = ({ editor, page }: BuildHtmlParams) => {
  const bodyHtml = editor?.getHTML() ?? "";
  const safeTitle = page.title?.trim() ? page.title : "Untitled";
  const escapedTitle = escapeHtml(safeTitle);
  const iconHtml = page.icon ? escapeHtml(page.icon) : "";
  const coverHtml = page.coverImage
    ? `<div class="page-canopy"><img src="${escapeHtml(page.coverImage)}" alt="" /></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapedTitle}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111110;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard",
      "Noto Sans KR", "Apple SD Gothic Neo", Roboto, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.7;
  }
  .page-shell {
    max-width: 820px;
    margin: 0 auto;
    padding: 48px 56px 96px;
  }
  .page-canopy {
    width: 100%;
    margin: -48px -56px 24px;
    width: calc(100% + 112px);
  }
  .page-canopy img {
    width: 100%;
    height: 240px;
    object-fit: cover;
    display: block;
  }
  .page-header { margin-bottom: 32px; }
  .page-icon {
    font-size: 48px;
    line-height: 1;
    margin-bottom: 12px;
  }
  .page-title {
    font-size: 40px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .page-content h1 { font-size: 30px; font-weight: 700; margin: 32px 0 12px; }
  .page-content h2 { font-size: 24px; font-weight: 700; margin: 28px 0 10px; }
  .page-content h3 { font-size: 20px; font-weight: 600; margin: 24px 0 8px; }
  .page-content p { margin: 8px 0; }
  .page-content ul, .page-content ol { margin: 8px 0; padding-left: 24px; }
  .page-content li { margin: 4px 0; }
  .page-content blockquote {
    margin: 16px 0;
    padding: 8px 16px;
    border-left: 3px solid #d4d4d8;
    color: #52525b;
  }
  .page-content pre {
    background: #f4f4f5;
    border-radius: 6px;
    padding: 12px 16px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.5;
  }
  .page-content code {
    background: #f4f4f5;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.9em;
  }
  .page-content pre code { background: transparent; padding: 0; }
  .page-content a { color: #2563eb; text-decoration: underline; }
  .page-content img { max-width: 100%; height: auto; border-radius: 4px; }
  .page-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
  }
  .page-content th, .page-content td {
    border: 1px solid #e4e4e7;
    padding: 8px 12px;
    text-align: left;
  }
  .page-content hr { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
  @media print {
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    body { font-size: 12pt; }
    .page-shell { max-width: none; padding: 0; }
    .page-canopy { margin: 0 0 16pt; width: 100%; }
    .page-canopy img { height: 180pt; }
    .page-content pre, .page-content code { background: #f4f4f5 !important; }
    a { color: #1d4ed8; }
  }
</style>
</head>
<body>
  <div class="page-shell">
    ${coverHtml}
    <header class="page-header">
      ${iconHtml ? `<div class="page-icon">${iconHtml}</div>` : ""}
      <h1 class="page-title">${escapedTitle}</h1>
    </header>
    <article class="page-content">${bodyHtml}</article>
  </div>
</body>
</html>`;
};
