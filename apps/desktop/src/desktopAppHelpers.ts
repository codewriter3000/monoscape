export function isUntitledTitle(title: string) {
  return /^untitled\b/i.test(title);
}

export function sanitizeFileName(title: string, fallback: string) {
  const sanitized = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || fallback;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function readPlainTextFromHtml(html: string) {
  if (typeof document !== "undefined") {
    const container = document.createElement("div");
    container.innerHTML = html;
    return container.textContent?.replace(/\u00a0/g, " ") ?? "";
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wrapPdfTextLines(text: string, maxLineLength = 88) {
  const lines: string[] = [];

  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    const normalized = paragraph.replace(/\s+/g, " ").trim();
    if (!normalized) {
      lines.push("");
      continue;
    }

    let currentLine = "";
    for (const word of normalized.split(" ")) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      if (nextLine.length <= maxLineLength) {
        currentLine = nextLine;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      currentLine = word;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [""];
}

export function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7e]/g, "?");
}

export function buildPdfBytes(title: string, editorHtml: string) {
  const encoder = new TextEncoder();
  const text = readPlainTextFromHtml(editorHtml).trim() || title || "Untitled document";
  const lines = wrapPdfTextLines(text);
  const linesPerPage = 42;
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / linesPerPage)) }, (_, index) =>
    lines.slice(index * linesPerPage, index * linesPerPage + linesPerPage)
  );
  const pageObjectIds = pages.map((_, index) => 3 + index * 2);
  const contentObjectIds = pages.map((_, index) => 4 + index * 2);
  const fontObjectId = 3 + pages.length * 2;
  const objects = new Map<number, string>();

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(
    2,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`
  );

  pages.forEach((pageLines, index) => {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = contentObjectIds[index];
    const streamLines = pageLines.length > 0 ? pageLines : [""];
    const commands = streamLines.map((line, lineIndex) => {
      const payload = `(${escapePdfText(line || " ")}) Tj`;
      return lineIndex === 0 ? payload : `T* ${payload}`;
    });
    const stream = `BT\n/F1 12 Tf\n56 742 Td\n16 TL\n${commands.join("\n")}\nET`;
    const streamBytes = encoder.encode(stream).length;

    objects.set(
      pageObjectId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    objects.set(contentObjectId, `<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream`);
  });

  objects.set(fontObjectId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let objectId = 1; objectId <= fontObjectId; objectId += 1) {
    offsets[objectId] = encoder.encode(pdf).length;
    pdf += `${objectId} 0 obj\n${objects.get(objectId)}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${fontObjectId + 1}\n0000000000 65535 f \n`;
  for (let objectId = 1; objectId <= fontObjectId; objectId += 1) {
    pdf += `${offsets[objectId].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${fontObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

export function buildPrintDocumentMarkup(title: string, editorHtml: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        padding: 48px;
        background: #f4f6fa;
        color: #172033;
        font-family: "Liberation Serif", Georgia, serif;
      }

      main {
        max-width: 816px;
        margin: 0 auto;
        padding: 56px 64px;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      }

      h1,
      h2,
      h3,
      p,
      li {
        line-height: 1.6;
      }

      @media print {
        body {
          padding: 0;
          background: #ffffff;
        }

        main {
          max-width: none;
          padding: 0;
          border-radius: 0;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <main>${editorHtml || `<p>${escapeHtml(title)}</p>`}</main>
  </body>
</html>`;
}

export function deriveDocumentTitle(editorHtml: string, fallbackTitle: string) {
  const firstLine = readPlainTextFromHtml(editorHtml)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return fallbackTitle;
  }

  return firstLine.slice(0, 72);
}

export function readErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallbackMessage;
}
