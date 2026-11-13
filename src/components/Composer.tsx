import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  AlertCircle,
  ArrowUp,
  FileAudio,
  FileText,
  Globe,
  Paperclip,
  Square,
  X,
} from 'lucide-react';
import { DOMAIN_PROFILE_LIST, REASONING_EFFORTS } from '../shared/models';
import type {
  Attachment,
  DomainProfileId,
  EngineRoute,
  EngineStatus,
  ReasoningEffort,
} from '../types/chat';
import { classifyAttachmentFile } from '../utils/threadStorage';

interface ComposerProps {
  input: string;
  onInputChange: (val: string) => void;
  attachments: Attachment[];
  onAddAttachments: (files: Attachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  profile: DomainProfileId;
  onProfileChange: (p: DomainProfileId) => void;
  effort: ReasoningEffort;
  onEffortChange: (e: ReasoningEffort) => void;
  useWebSearch: boolean;
  onToggleWebSearch: () => void;
  engineRoute: EngineRoute;
  onEngineRouteChange: (route: EngineRoute) => void;
  engineStatus: EngineStatus | null;
  isStreaming: boolean;
  onSend: () => void;
  onStop: () => void;
}

const EFFORT_LEVEL_INDEX: Record<ReasoningEffort, number> = {
  low: 1,
  medium: 2,
  high: 3,
  xhigh: 4,
};

function EffortDepthBars({ effort }: { effort: ReasoningEffort }) {
  const activeBars = EFFORT_LEVEL_INDEX[effort];
  const barHeights = [6, 9, 12, 15];

  return (
    <span
      aria-hidden="true"
      className="inline-flex items-end gap-[2px] h-4 px-1.5"
    >
      {barHeights.map((height, idx) => {
        const active = idx < activeBars;
        return (
          <span
            key={height}
            style={{
              height: `${height}px`,
              transform: `scaleY(${active ? 1 : 0.42})`,
              transformOrigin: 'bottom',
            }}
            className={`w-[2.5px] rounded-xs transition-[transform,opacity,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              effort === 'xhigh' && active
                ? 'bg-blue-500 dark:bg-blue-400 opacity-100'
                : active
                  ? 'bg-slate-700 dark:bg-slate-200 opacity-100'
                  : 'bg-slate-400 dark:bg-slate-600 opacity-35'
            }`}
          />
        );
      })}
    </span>
  );
}

export function Composer({
  input,
  onInputChange,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  profile,
  onProfileChange,
  effort,
  onEffortChange,
  useWebSearch,
  onToggleWebSearch,
  engineRoute,
  onEngineRouteChange,
  engineStatus,
  isStreaming,
  onSend,
  onStop,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [effortFeedback, setEffortFeedback] = useState<string | null>(null);
  const [isEffortPulsing, setIsEffortPulsing] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const canSend =
    !isStreaming && (input.trim().length > 0 || attachments.length > 0);

  const handleSelectEffort = (next: ReasoningEffort) => {
    onEffortChange(next);
    const meta = REASONING_EFFORTS.find((r) => r.id === next);
    setIsEffortPulsing(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setIsEffortPulsing(false), 260);

    if (meta) {
      setEffortFeedback(`${meta.label} · ${meta.hint}`);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        setEffortFeedback(null);
      }, 2400);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setAttachError(null);

    const parsed: Attachment[] = [];
    for (const file of Array.from(fileList)) {
      const check = classifyAttachmentFile(file.name, file.type, file.size);
      if (!check.ok) {
        setAttachError(check.error);
        continue;
      }

      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (check.kind === 'text') {
        const textContent = await file.text();
        parsed.push({
          id,
          name: file.name,
          mimeType: file.type || 'text/plain',
          size: file.size,
          kind: 'text',
          textContent,
        });
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Failed to read file.'));
          reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(',')[1] ?? '';
        parsed.push({
          id,
          name: file.name,
          mimeType:
            file.type ||
            (check.kind === 'document' ? 'application/pdf' : 'application/octet-stream'),
          size: file.size,
          kind: check.kind,
          dataBase64: base64,
          previewUrl: check.kind === 'image' ? dataUrl : undefined,
        });
      }
    }

    if (parsed.length > 0) {
      onAddAttachments(parsed);
    }
    e.target.value = '';
  };

  return (
    <div className="shrink-0 px-4 md:px-8 pb-5 pt-2 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-[#090D16] dark:via-[#090D16]/95">
      <div className="max-w-3xl mx-auto">
        {attachError && (
          <div
            role="alert"
            className="mb-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2"
          >
            <span className="inline-flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{attachError}</span>
            </span>
            <button
              type="button"
              onClick={() => setAttachError(null)}
              aria-label="Dismiss attachment error"
              className="p-0.5 hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Effort selection feedback caption */}
        <div className="h-5 mb-1 flex items-center justify-end px-1 overflow-hidden">
          <span
            aria-live="polite"
            className={`text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              effortFeedback
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-1 pointer-events-none'
            }`}
          >
            {effortFeedback || ''}
          </span>
        </div>

        <div
          className={`rounded-xl bg-white dark:bg-[#111827] border shadow-sm dark:shadow-[0_16px_36px_-14px_rgba(0,0,0,0.7)] transition-[border-color,transform,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-blue-600/80 dark:focus-within:border-blue-500/80 ${
            isEffortPulsing
              ? 'scale-[0.996] border-blue-500/70 dark:border-blue-400/70'
              : effort === 'xhigh'
                ? 'border-blue-600/40 dark:border-blue-500/40'
                : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="px-3.5 pt-3 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 max-w-[220px]"
                >
                  {att.kind === 'image' && att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded object-cover shrink-0"
                    />
                  ) : att.kind === 'audio' ? (
                    <FileAudio className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.id)}
                    aria-label={`Remove attachment ${att.name}`}
                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Prompt textarea */}
          <div className="px-4 pt-3.5 pb-2">
            <label htmlFor="deepthink-prompt" className="sr-only">
              Ask DeepThink 1 anything
            </label>
            <textarea
              id="deepthink-prompt"
              rows={2}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask DeepThink 1 anything — reason, write code, analyze images/PDFs, or research the web..."
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none max-h-48"
            />
          </div>

          {/* Controls row */}
          <div className="px-3 pb-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
              {/* Attach file */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,audio/*,application/pdf,text/*,.ts,.tsx,.js,.jsx,.py,.rs,.go,.sql,.md,.json,.csv,.yaml,.yml"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image, audio, PDF, or code file"
                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Attach</span>
              </button>

              {/* Domain Profile select */}
              <label htmlFor="domain-profile-select" className="sr-only">
                Domain profile
              </label>
              <select
                id="domain-profile-select"
                value={profile}
                onChange={(e) => onProfileChange(e.target.value as DomainProfileId)}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DOMAIN_PROFILE_LIST.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.shortLabel}
                  </option>
                ))}
              </select>

              {/* Reasoning Effort segmented control with animated depth bars & tactile transition */}
              <div
                role="group"
                aria-label="Reasoning effort"
                className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
              >
                <EffortDepthBars effort={effort} />
                {REASONING_EFFORTS.map((item) => {
                  const active = effort === item.id;
                  const isMaxActive = active && item.id === 'xhigh';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectEffort(item.id)}
                      title={item.hint}
                      aria-pressed={active}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isMaxActive
                          ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs'
                          : active
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Web Search grounding toggle */}
              <button
                type="button"
                onClick={onToggleWebSearch}
                aria-pressed={useWebSearch}
                className={`min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  useWebSearch
                    ? 'border-blue-600/50 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90'
                }`}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>Search</span>
              </button>

              {/* Inference engine selector */}
              <label htmlFor="engine-route-select" className="sr-only">
                Inference engine
              </label>
              <select
                id="engine-route-select"
                aria-label="Inference engine"
                value={engineRoute}
                onChange={(e) => onEngineRouteChange(e.target.value as EngineRoute)}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto</option>
                <option value="deep-verify">2-Pass Verify</option>
                <option value="fast-lite">Lite</option>
                {engineStatus?.openWeightsConfigured && (
                  <option value="open-weights">
                    {engineStatus.openWeightsModel || 'Open-Weights'}
                  </option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label="Stop generating"
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!canSend}
                  aria-label="Send message"
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span>Send</span>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
