'use client';

import React from 'react';

interface FormattedDocumentRendererProps {
  content: string;
  skipTitleAndSubtitle?: boolean;
  className?: string;
}

const SAFE_URL_PATTERN = /^https?:\/\//i;

const isSafeUrl = (url: string) => SAFE_URL_PATTERN.test(url.trim());

/**
 * Parses inline Markdown: links, **bold**, *italic*, `code`, and <u>underline</u>.
 */
function renderInline(text: string): React.ReactNode[] {
  const regex = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|<u>[^<]+<\/u>)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const markdownLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i);
    if (markdownLink && isSafeUrl(markdownLink[2])) {
      return (
        <a key={index} href={markdownLink[2]} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900 break-words">
          {markdownLink[1]}
        </a>
      );
    }
    if (isSafeUrl(part)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900 break-all">
          {part}
        </a>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-extrabold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 font-mono text-xs font-semibold border border-sky-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length > 7) {
      return (
        <u key={index} className="underline underline-offset-2">
          {part.slice(3, -4)}
        </u>
      );
    }
    return part;
  });
}

/**
 * Checks if a line looks like a markdown table row (starts or ends with |, contains |)
 */
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') || (trimmed.includes('|') && trimmed.endsWith('|'));
}

/**
 * Checks if a line is a markdown table separator (e.g. | :--- | ---: | :---: |)
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!isTableRow(trimmed)) return false;
  const cleaned = trimmed.replace(/[|:\s-]/g, '');
  return cleaned === '';
}

/**
 * Splits a markdown table line into cell contents
 */
function parseCells(line: string): string[] {
  const trimmed = line.trim();
  let parts = trimmed.split('|');
  if (parts.length > 0 && parts[0].trim() === '') parts.shift();
  if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop();
  return parts.map((p) => p.trim());
}

function parseStandaloneLink(line: string): { label: string; url: string } | null {
  const trimmed = line.trim();
  const markdownLink = trimmed.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i);
  if (markdownLink && isSafeUrl(markdownLink[2])) {
    return { label: markdownLink[1].trim(), url: markdownLink[2].trim() };
  }
  if (isSafeUrl(trimmed)) {
    return { label: trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, ''), url: trimmed };
  }
  return null;
}

export const FormattedDocumentRenderer: React.FC<FormattedDocumentRendererProps> = ({
  content,
  skipTitleAndSubtitle = false,
  className = '',
}) => {
  if (!content || !content.trim()) {
    return <p className="text-slate-400 italic">No document content available.</p>;
  }

  const rawLines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let lineIdx = 0;
  let skippedH1 = false;
  let skippedH2 = false;

  while (lineIdx < rawLines.length) {
    const line = rawLines[lineIdx];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      lineIdx++;
      continue;
    }

    // Skip title if requested
    if (skipTitleAndSubtitle && !skippedH1 && trimmed.startsWith('# ')) {
      skippedH1 = true;
      lineIdx++;
      continue;
    }

    // Skip subtitle if requested
    if (skipTitleAndSubtitle && !skippedH2 && trimmed.startsWith('## ')) {
      skippedH2 = true;
      lineIdx++;
      continue;
    }

    const standaloneLink = parseStandaloneLink(trimmed);
    if (standaloneLink) {
      elements.push(
        <a
          key={`link-${lineIdx}`}
          href={standaloneLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-3 flex min-w-0 items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm shadow-2xs transition-colors hover:border-sky-400 hover:bg-sky-100"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-white text-sky-700">-&gt;</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold text-slate-900">{standaloneLink.label}</span>
            <span className="block truncate text-xs text-sky-700">{standaloneLink.url}</span>
          </span>
        </a>
      );
      lineIdx++;
      continue;
    }

    // 1. Table Detection
    if (
      isTableRow(trimmed) &&
      lineIdx + 1 < rawLines.length &&
      isTableSeparator(rawLines[lineIdx + 1])
    ) {
      const headerCells = parseCells(trimmed);
      lineIdx += 2; // Skip header and separator

      const bodyRows: string[][] = [];
      while (lineIdx < rawLines.length && isTableRow(rawLines[lineIdx])) {
        bodyRows.push(parseCells(rawLines[lineIdx]));
        lineIdx++;
      }

      elements.push(
        <div
          key={`table-${lineIdx}`}
          className="my-5 overflow-x-auto rounded-2xl border-2 border-sky-200/90 shadow-2xs bg-white"
        >
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-sky-50/90 text-sky-950 font-extrabold border-b-2 border-sky-200">
              <tr>
                {headerCells.map((headerText, hIdx) => (
                  <th
                    key={hIdx}
                    className="py-3 px-4 font-extrabold uppercase tracking-wider text-[11px] sm:text-xs text-sky-900 border-r last:border-r-0 border-sky-200"
                  >
                    {renderInline(headerText)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-medium">
              {bodyRows.map((rowCells, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-sky-50/50 transition-colors odd:bg-white even:bg-sky-50/20"
                >
                  {rowCells.map((cellText, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-3 px-4 text-slate-700 leading-relaxed border-r last:border-r-0 border-sky-100"
                    >
                      {renderInline(cellText)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 2. Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${lineIdx}`}
          className="text-2xl sm:text-3xl font-black text-slate-900 mt-6 mb-2 tracking-tight"
        >
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      lineIdx++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${lineIdx}`}
          className="text-lg sm:text-xl font-bold text-sky-950 mt-5 mb-2 tracking-tight"
        >
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      lineIdx++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${lineIdx}`}
          className="text-sm sm:text-base font-bold text-slate-900 mt-4 mb-1.5 flex items-center gap-1.5"
        >
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      lineIdx++;
      continue;
    }

    // 3. Blockquotes / Callout Boxes
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (lineIdx < rawLines.length && rawLines[lineIdx].trim().startsWith('> ')) {
        quoteLines.push(rawLines[lineIdx].trim().replace(/^>\s*/, ''));
        lineIdx++;
      }
      elements.push(
        <div
          key={`quote-${lineIdx}`}
          className="p-4 my-3 rounded-2xl bg-sky-50/80 border-l-4 border-sky-500 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-2xs"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className={qIdx > 0 ? 'mt-1.5' : ''}>
              {renderInline(ql)}
            </p>
          ))}
        </div>
      );
      continue;
    }

    // 4. Code Blocks (``` ... ```)
    if (trimmed.startsWith('```')) {
      lineIdx++;
      const codeLines: string[] = [];
      while (lineIdx < rawLines.length && !rawLines[lineIdx].trim().startsWith('```')) {
        codeLines.push(rawLines[lineIdx]);
        lineIdx++;
      }
      if (lineIdx < rawLines.length) lineIdx++; // Skip closing ```
      elements.push(
        <pre
          key={`code-${lineIdx}`}
          className="p-4 my-3 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto shadow-sm"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // 5. Bullet List (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (
        lineIdx < rawLines.length &&
        (rawLines[lineIdx].trim().startsWith('- ') || rawLines[lineIdx].trim().startsWith('* '))
      ) {
        listItems.push(rawLines[lineIdx].trim().replace(/^[-*]\s+/, ''));
        lineIdx++;
      }
      elements.push(
        <ul
          key={`ul-${lineIdx}`}
          className="space-y-1.5 my-3 list-disc pl-5 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium"
        >
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Numbered List (1. , 2. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (lineIdx < rawLines.length && /^\d+\.\s+/.test(rawLines[lineIdx].trim())) {
        listItems.push(rawLines[lineIdx].trim().replace(/^\d+\.\s+/, ''));
        lineIdx++;
      }
      elements.push(
        <ol
          key={`ol-${lineIdx}`}
          className="space-y-1.5 my-3 list-decimal pl-5 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium"
        >
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular Paragraph Text
    elements.push(
      <p
        key={`p-${lineIdx}`}
        className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal my-2"
      >
        {renderInline(trimmed)}
      </p>
    );
    lineIdx++;
  }

  return <div className={`space-y-1 font-sans ${className}`}>{elements}</div>;
};

export default FormattedDocumentRenderer;
