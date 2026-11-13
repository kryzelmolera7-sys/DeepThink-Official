import { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import type { ArtifactItem } from '../types/chat';

interface ArtifactCanvasModalProps {
  artifact: ArtifactItem | null;
  onClose: () => void;
}

export function ArtifactCanvasModal({
  artifact,
  onClose,
}: ArtifactCanvasModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!artifact) return null;

  const isPreviewable =
    artifact.type === 'html' ||
    artifact.type === 'svg' ||
    artifact.language === 'html' ||
    artifact.language === 'svg' ||
    artifact.language === 'xml';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    let ext = 'txt';
    const lang = artifact.language.toLowerCase();
    if (lang === 'html' || artifact.type === 'html') ext = 'html';
    else if (lang === 'svg' || artifact.type === 'svg') ext = 'svg';
    else if (lang.includes('typescript') || lang === 'ts' || lang === 'tsx')
      ext = lang.includes('x') ? 'tsx' : 'ts';
    else if (lang.includes('javascript') || lang === 'js' || lang === 'jsx')
      ext = lang.includes('x') ? 'jsx' : 'js';
    else if (lang === 'python' || lang === 'py') ext = 'py';
    else if (lang === 'sql') ext = 'sql';
    else if (lang === 'json') ext = 'json';
    else if (lang === 'markdown' || lang === 'md') ext = 'md';
    else if (lang === 'css') ext = 'css';

    const blob = new Blob([artifact.content], {
      type:
        ext === 'html'
          ? 'text/html;charset=utf-8'
          : ext === 'svg'
            ? 'image/svg+xml;charset=utf-8'
            : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'deepthink-artifact'}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="artifact-canvas-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none"
    >
      <div
        className={`w-full bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isExpanded
            ? 'h-[96vh] max-w-[98vw]'
            : 'h-[85vh] max-w-4xl'
        }`}
      >
        {/* Header toolbar */}
        <div className="h-14 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 shrink-0">
              {isPreviewable ? (
                <Eye className="w-4 h-4" />
              ) : (
                <Code2 className="w-4 h-4" />
              )}
            </span>
            <div className="min-w-0">
              <h2
                id="artifact-canvas-title"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate"
              >
                {artifact.title}
              </h2>
              <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
                {artifact.language}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isPreviewable && (
              <div
                role="tablist"
                aria-label="Artifact view mode"
                className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60 mr-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'preview'}
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'code'}
                  onClick={() => setActiveTab('code')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                    activeTab === 'code'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Code</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy artifact code"
              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              aria-label="Download artifact file"
              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((e) => !e)}
              aria-label={isExpanded ? 'Shrink modal' : 'Expand modal'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close artifact preview"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
          {isPreviewable && activeTab === 'preview' ? (
            artifact.type === 'svg' || artifact.language === 'svg' ? (
              <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                <div
                  className="max-w-full max-h-full p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: artifact.content }}
                />
              </div>
            ) : (
              <iframe
                title={artifact.title}
                srcDoc={artifact.content}
                sandbox="allow-scripts"
                className="w-full h-full border-0 bg-white"
              />
            )
          ) : (
            <div className="w-full h-full overflow-auto p-4 sm:p-6 font-mono text-[13px] leading-relaxed select-text text-slate-800 dark:text-slate-200">
              <pre className="whitespace-pre">
                <code>{artifact.content}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
