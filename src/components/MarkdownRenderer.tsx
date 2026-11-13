import { useState, type ReactNode } from 'react';
import { marked, type Token, type Tokens } from 'marked';
import { Check, Copy, Download, Eye } from 'lucide-react';
import type { ArtifactItem } from '../types/chat';

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact?: (artifact: ArtifactItem) => void;
}

function CodeBlock({
  lang,
  code,
  onOpenArtifact,
}: {
  lang?: string;
  code: string;
  onOpenArtifact?: (artifact: ArtifactItem) => void;
}) {
  const [copied, setCopied] = useState(false);
  const cleanLang = (lang || 'code').trim().toLowerCase();

  const isPreviewable =
    cleanLang === 'html' ||
    cleanLang === 'svg' ||
    code.trim().startsWith('<svg') ||
    code.trim().startsWith('<!DOCTYPE html>') ||
    code.trim().startsWith('<html');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  const handleDownload = () => {
    let ext = 'txt';
    if (cleanLang === 'html') ext = 'html';
    else if (cleanLang === 'svg') ext = 'svg';
    else if (cleanLang === 'ts' || cleanLang === 'typescript') ext = 'ts';
    else if (cleanLang === 'tsx') ext = 'tsx';
    else if (cleanLang === 'js' || cleanLang === 'javascript') ext = 'js';
    else if (cleanLang === 'jsx') ext = 'jsx';
    else if (cleanLang === 'py' || cleanLang === 'python') ext = 'py';
    else if (cleanLang === 'sql') ext = 'sql';
    else if (cleanLang === 'json') ext = 'json';
    else if (cleanLang === 'css') ext = 'css';

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deepthink-code-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    if (!onOpenArtifact) return;
    const type = cleanLang === 'svg' || code.trim().startsWith('<svg') ? 'svg' : 'html';
    onOpenArtifact({
      id: `art-${Date.now()}`,
      title: `${cleanLang.toUpperCase()} Artifact`,
      language: cleanLang,
      content: code,
      type,
    });
  };

  return (
    <div className="my-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/90 bg-slate-900/95 text-xs text-slate-400">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-300">
          {cleanLang}
        </span>
        <div className="flex items-center gap-1.5">
          {isPreviewable && onOpenArtifact && (
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/80 transition-colors py-1 px-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap shrink-0"
              aria-label="Preview artifact in canvas"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors py-1 px-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap shrink-0"
            aria-label="Download code snippet"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors py-1 px-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap shrink-0"
            aria-label="Copy code block"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineTokens(tokens: Token[] | undefined, keyPrefix: string): ReactNode[] {
  if (!tokens) return [];

  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (token.type) {
      case 'text': {
        const t = token as Tokens.Text;
        if (t.tokens) {
          return <span key={key}>{renderInlineTokens(t.tokens, key)}</span>;
        }
        return <span key={key}>{t.text}</span>;
      }
      case 'escape':
        return <span key={key}>{(token as Tokens.Escape).text}</span>;
      case 'strong':
        return (
          <strong key={key} className="font-semibold text-slate-900 dark:text-slate-50">
            {renderInlineTokens((token as Tokens.Strong).tokens, key)}
          </strong>
        );
      case 'em':
        return (
          <em key={key} className="italic">
            {renderInlineTokens((token as Tokens.Em).tokens, key)}
          </em>
        );
      case 'del':
        return (
          <del key={key} className="line-through opacity-75">
            {renderInlineTokens((token as Tokens.Del).tokens, key)}
          </del>
        );
      case 'codespan':
        return (
          <code
            key={key}
            className="font-mono text-[0.875em] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80"
          >
            {(token as Tokens.Codespan).text}
          </code>
        );
      case 'link': {
        const link = token as Tokens.Link;
        return (
          <a
            key={key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 dark:text-blue-400 underline decoration-blue-700/30 dark:decoration-blue-400/30 underline-offset-2 hover:decoration-blue-700 dark:hover:decoration-blue-400 transition-colors"
          >
            {renderInlineTokens(link.tokens, key)}
          </a>
        );
      }
      case 'br':
        return <br key={key} />;
      default:
        return <span key={key}>{'raw' in token ? String(token.raw) : ''}</span>;
    }
  });
}

function renderBlockTokens(
  tokens: Token[],
  keyPrefix: string,
  onOpenArtifact?: (artifact: ArtifactItem) => void
): ReactNode[] {
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-b-${idx}`;
    switch (token.type) {
      case 'space':
        return null;
      case 'heading': {
        const h = token as Tokens.Heading;
        const children = renderInlineTokens(h.tokens, key);
        if (h.depth === 1) {
          return (
            <h1
              key={key}
              className="font-display text-xl font-semibold text-slate-900 dark:text-slate-50 mt-6 mb-3 tracking-tight"
            >
              {children}
            </h1>
          );
        }
        if (h.depth === 2) {
          return (
            <h2
              key={key}
              className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50 mt-5 mb-2.5 tracking-tight"
            >
              {children}
            </h2>
          );
        }
        return (
          <h3
            key={key}
            className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2"
          >
            {children}
          </h3>
        );
      }
      case 'paragraph': {
        const p = token as Tokens.Paragraph;
        return (
          <p
            key={key}
            className="my-2.5 text-[15px] leading-[1.65] text-slate-800 dark:text-slate-200"
          >
            {renderInlineTokens(p.tokens, key)}
          </p>
        );
      }
      case 'code': {
        const c = token as Tokens.Code;
        return (
          <CodeBlock
            key={key}
            lang={c.lang}
            code={c.text}
            onOpenArtifact={onOpenArtifact}
          />
        );
      }
      case 'blockquote': {
        const bq = token as Tokens.Blockquote;
        return (
          <blockquote
            key={key}
            className="my-3.5 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
          >
            {renderBlockTokens(bq.tokens, key, onOpenArtifact)}
          </blockquote>
        );
      }
      case 'list': {
        const list = token as Tokens.List;
        const Tag = list.ordered ? 'ol' : 'ul';
        return (
          <Tag
            key={key}
            className={`my-3 pl-6 space-y-1.5 text-[15px] leading-[1.6] text-slate-800 dark:text-slate-200 ${
              list.ordered ? 'list-decimal' : 'list-disc'
            }`}
          >
            {list.items.map((item, itemIdx) => (
              <li key={`${key}-li-${itemIdx}`} className="pl-1">
                {renderBlockTokens(item.tokens, `${key}-li-${itemIdx}`, onOpenArtifact)}
              </li>
            ))}
          </Tag>
        );
      }
      case 'table': {
        const table = token as Tokens.Table;
        return (
          <div
            key={key}
            className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <table className="w-full border-collapse text-left text-sm tabular-nums">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {table.header.map((cell, cIdx) => (
                    <th
                      key={`${key}-th-${cIdx}`}
                      className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap"
                    >
                      {renderInlineTokens(cell.tokens, `${key}-th-${cIdx}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {table.rows.map((row, rIdx) => (
                  <tr
                    key={`${key}-tr-${rIdx}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={`${key}-td-${rIdx}-${cIdx}`}
                        className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300"
                      >
                        {renderInlineTokens(cell.tokens, `${key}-td-${rIdx}-${cIdx}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'hr':
        return (
          <hr
            key={key}
            className="my-5 border-t border-slate-200 dark:border-slate-800"
          />
        );
      case 'text': {
        const t = token as Tokens.Text;
        if (t.tokens) {
          return (
            <span key={key} className="leading-[1.6]">
              {renderInlineTokens(t.tokens, key)}
            </span>
          );
        }
        return <span key={key}>{t.text}</span>;
      }
      default:
        return (
          <p key={key} className="my-2 text-[15px] leading-[1.65]">
            {'raw' in token ? String(token.raw) : ''}
          </p>
        );
    }
  });
}

export function MarkdownRenderer({ content, onOpenArtifact }: MarkdownRendererProps) {
  const tokens = marked.lexer(content, { gfm: true, breaks: false });
  return (
    <div className="max-w-none break-words">
      {renderBlockTokens(tokens, 'md', onOpenArtifact)}
    </div>
  );
}
