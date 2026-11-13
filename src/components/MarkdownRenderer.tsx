import { useState, type ReactNode } from 'react';
import { marked, type Token, type Tokens } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ lang, code }: { lang?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  return (
    <div className="my-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/90 text-xs text-slate-400">
        <span className="font-mono">{lang?.trim() || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors py-1 px-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap shrink-0"
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

function renderBlockTokens(tokens: Token[], keyPrefix: string): ReactNode[] {
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
        return <CodeBlock key={key} lang={c.lang} code={c.text} />;
      }
      case 'blockquote': {
        const bq = token as Tokens.Blockquote;
        return (
          <blockquote
            key={key}
            className="my-3.5 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
          >
            {renderBlockTokens(bq.tokens, key)}
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
                {renderBlockTokens(item.tokens, `${key}-li-${itemIdx}`)}
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

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const tokens = marked.lexer(content, { gfm: true, breaks: false });
  return <div className="max-w-none break-words">{renderBlockTokens(tokens, 'md')}</div>;
}
