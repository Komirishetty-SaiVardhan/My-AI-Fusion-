/**
 * Export Document and PDF Generation Utility for My AI
 * Developed by Komirishetty Sai Vardhan
 */

export interface ExportPdfOptions {
  title?: string;
  content: string;
  author?: string;
  date?: string;
}

/**
 * Strips markdown symbols for plain text extraction
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Converts Markdown content into clean, semantic HTML for printing & Word export
 */
export function markdownToStyledHtml(markdown: string, title?: string, author?: string, date?: string): string {
  const docTitle = title || "Document Report";
  const docAuthor = author || "My AI (Komirishetty Sai Vardhan)";
  const docDate = date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Simple and clean conversion
  let html = markdown
    // Images
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="doc-image-container"><img src="$2" alt="$1" class="doc-image" /><div class="doc-image-caption">$1</div></div>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Headings
    .replace(/^### (.*$)/gim, '<h3 class="doc-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="doc-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="doc-h1">$1</h1>')
    // Bold & Italics
    .replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote class="doc-blockquote">$1</blockquote>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="doc-pre"><code>$2</code></pre>')
    .replace(/`([^`]+)`/gim, '<code class="doc-inline-code">$1</code>')
    // Horizontal Rule
    .replace(/^---$/gim, '<hr class="doc-hr" />')
    // Unordered list items
    .replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="doc-li">$1</li>')
    // Paragraphs
    .replace(/\n\n+/g, "</p><p class=\"doc-p\">")
    .replace(/\n/g, "<br />");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    @page {
      size: A4;
      margin: 20mm 18mm 22mm 18mm;
      @bottom-right {
        content: "Page " counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
      @bottom-left {
        content: "Prepared by My AI — Komirishetty Sai Vardhan";
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.65;
      font-size: 11pt;
      margin: 0;
      padding: 30px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    .doc-header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 14px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .doc-header-left h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }

    .doc-header-meta {
      font-size: 9pt;
      color: #64748b;
    }

    .doc-badge {
      display: inline-block;
      padding: 3px 8px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .doc-h1 {
      font-size: 16pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      page-break-after: avoid;
    }

    .doc-h2 {
      font-size: 13pt;
      font-weight: 600;
      color: #0369a1;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    .doc-h3 {
      font-size: 11.5pt;
      font-weight: 600;
      color: #334155;
      margin-top: 16px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    .doc-p {
      margin: 0 0 12px 0;
      color: #334155;
    }

    .doc-blockquote {
      margin: 16px 0;
      padding: 10px 16px;
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      color: #475569;
      font-style: italic;
      border-radius: 0 6px 6px 0;
    }

    .doc-pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 14px 16px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      overflow-x: auto;
      margin: 14px 0;
      line-height: 1.5;
    }

    .doc-inline-code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5pt;
      border: 1px solid #e2e8f0;
    }

    .doc-hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }

    .doc-li {
      margin-bottom: 6px;
      color: #334155;
    }

    .doc-image-container {
      margin: 20px 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .doc-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .doc-image-caption {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 6px;
      font-style: italic;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .doc-footer {
      margin-top: 40px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #94a3b8;
    }

    @media print {
      body {
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-header-left">
      <div class="doc-badge">DOCUMENT EXPORT</div>
      <h1>${docTitle}</h1>
      <div class="doc-header-meta">Author: ${docAuthor} &bull; Date: ${docDate}</div>
    </div>
  </div>

  <div class="doc-content">
    <p class="doc-p">${html}</p>
  </div>

  <div class="doc-footer">
    <span>My AI &bull; Created by Komirishetty Sai Vardhan</span>
    <span>Generated: ${new Date().toLocaleString()}</span>
  </div>
</body>
</html>`;
}

/**
 * Triggers clean PDF generation using high-quality browser print rendering
 */
export function exportToPdf(options: ExportPdfOptions): void {
  const title = options.title || "My AI Document Report";
  const html = markdownToStyledHtml(options.content, title, options.author, options.date);

  // Open dedicated print window
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    alert("Please allow popups to export the PDF document.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Trigger print once resources/images are loaded
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };
}

/**
 * Downloads content as Markdown file (.md)
 */
export function downloadAsMarkdown(title: string, content: string): void {
  const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() || "document"}.md`;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  triggerFileDownload(blob, filename);
}

/**
 * Downloads content as plain text file (.txt)
 */
export function downloadAsTxt(title: string, content: string): void {
  const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() || "document"}.txt`;
  const plainText = markdownToPlainText(content);
  const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
  triggerFileDownload(blob, filename);
}

/**
 * Downloads content as a Word-compatible HTML document (.doc)
 */
export function downloadAsDoc(title: string, content: string, author?: string): void {
  const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() || "document"}.doc`;
  const html = markdownToStyledHtml(content, title, author);
  const blob = new Blob(["\ufeff" + html], { type: "application/msword;charset=utf-8" });
  triggerFileDownload(blob, filename);
}

/**
 * Helper to trigger browser file download from Blob
 */
function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
