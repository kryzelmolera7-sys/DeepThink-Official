import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FileAudio,
  FileText,
  GitFork,
  RefreshCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ArtifactItem, ChatMessage } from '../types/chat';
import { formatDurationMs } from '../utils/streamParser';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onRegenerate: () => void;
  onRetryLast: () => void;
  onForkThread?: (upToMessageId: string) => void;
  onOpenArtifact?: (artifact: ArtifactItem) => void;
}

function ThinkingTrace({
  thoughts,
  isThinkingActive,
  thinkingMs,
}: {
  thoughts: string;
  isThinkingActive: boolean;
  thinkingMs?: number;
}) {
  const [expanded, setExpanded] = useState(isThinkingActive);
  const userToggledRef = useRef(false);

  useEffect(() => {
    if (userToggledRef.current) return;
    setExpanded(isThinkingActive);
  }, [isThinkingActive]);

  if (!thoughts && !isThinkingActive) return null;

  const isSwarm = thoughts.includes('🐝') || thoughts.includes('Swarm Node');
  const isSecuritySwarm = thoughts.includes('🛡️') || thoughts.includes('Security Swarm');

  const label = isThinkingActive
    ? isSecuritySwarm
      ? '🛡️ Security Swarm vulnerability audit in progress...'
      : isSwarm
        ? '🐝 Swarm multi-agent consensus in progress...'
        : 'Reasoning in progress'
    : isSecuritySwarm
      ? `🛡️ Security Swarm Audit Trace ${thinkingMs !== undefined ? `(${formatDurationMs(thinkingMs)})` : ''}`
      : isSwarm
        ? `🐝 Swarm Multi-Agent Deliberation ${thinkingMs !== undefined ? `(${formatDurationMs(thinkingMs)})` : ''}`
        : thinkingMs !== undefined
          ? `Thought for ${formatDurationMs(thinkingMs)}`
          : 'Reasoning trace';

  const containerClasses = isSecuritySwarm
    ? 'border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20'
    : isSwarm
      ? 'border-amber-300/80 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20'
      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60';

  return (
    <div className={`mb-3 rounded-lg border overflow-hidden ${containerClasses}`}>
      <button
        type="button"
        onClick={() => {
          userToggledRef.current = true;
          setExpanded((v) => !v);
        }}
        aria-expanded={expanded}
        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <span className="truncate">{label}</span>
        </span>
        {thoughts && (
          <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
            {thoughts.length.toLocaleString()} chars
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-3.5 pb-3 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 max-h-64 overflow-y-auto text-xs text-slate-600 dark:text-slate-400 [&_p]:text-xs [&_p]:leading-relaxed [&_p]:my-1.5 [&_li]:text-xs [&_h1]:text-xs [&_h2]:text-xs [&_h3]:text-xs">
          {thoughts ? (
            <MarkdownRenderer content={thoughts} />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Decomposing problem constraints...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AssistantMessage({
  message,
  isLast,
  isStreamingThis,
  onRegenerate,
  onRetryLast,
  onForkThread,
  onOpenArtifact,
}: {
  message: ChatMessage;
  isLast: boolean;
  isStreamingThis: boolean;
  onRegenerate: () => void;
  onRetryLast: () => void;
  onForkThread?: (upToMessageId: string) => void;
  onOpenArtifact?: (artifact: ArtifactItem) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isThinkingActive =
    isStreamingThis && message.content.length === 0 && !message.error;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const toggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const plainText = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_~[\]]/g, '')
      .trim();

    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <article
      aria-label="DeepThink v1.5 response"
      className="py-5 border-b border-slate-200/70 dark:border-slate-800/70 last:border-b-0"
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs font-semibold text-slate-900 dark:text-slate-100">
            DeepThink v1.5
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
            v1.5
          </span>
        </div>
        {message.metrics && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {message.metrics.engineLabel && (
              <>
                <span>{message.metrics.engineLabel}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{formatDurationMs(message.metrics.elapsedMs)}</span>
            {typeof message.metrics.outputTokens === 'number' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{message.metrics.outputTokens.toLocaleString()} out tok</span>
              </>
            )}
          </div>
        )}
      </div>

      {(message.thoughts || isThinkingActive) && (
        <ThinkingTrace
          thoughts={message.thoughts ?? ''}
          isThinkingActive={isThinkingActive}
          thinkingMs={message.metrics?.thinkingMs}
        />
      )}

      {message.error ? (
        <div
          role="alert"
          className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50/80 dark:bg-red-950/30 text-sm text-red-800 dark:text-red-200 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{message.error}</span>
          </div>
          {isLast && (
            <button
              type="button"
              onClick={onRetryLast}
              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          {message.content ? (
            <MarkdownRenderer
              content={message.content}
              onOpenArtifact={onOpenArtifact}
            />
          ) : isStreamingThis ? (
            <div className="py-2 text-sm text-slate-500 dark:text-slate-400">
              Synthesizing response...
            </div>
          ) : null}

          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Grounded Sources
              </div>
              <ol className="space-y-1">
                {message.sources.map((src, idx) => (
                  <li key={src.uri} className="text-xs">
                    <a
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400 hover:underline max-w-full"
                    >
                      <span className="font-mono tabular-nums text-slate-400 shrink-0">
                        [{idx + 1}]
                      </span>
                      <span className="truncate">{src.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!isStreamingThis && message.content && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70 inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleSpeak}
                aria-label={isSpeaking ? 'Stop listening' : 'Read response aloud'}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap ${
                  isSpeaking
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </>
                )}
              </button>

              {onForkThread && (
                <button
                  type="button"
                  onClick={() => onForkThread(message.id)}
                  title="Branch thread from this turn"
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70 inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Branch</span>
                </button>
              )}

              {isLast && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70 inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

export function MessageList({
  messages,
  isStreaming,
  onRegenerate,
  onRetryLast,
  onForkThread,
  onOpenArtifact,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, messages[messages.length - 1]?.content, messages[messages.length - 1]?.thoughts]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          if (msg.role === 'user') {
            return (
              <article
                key={msg.id}
                aria-label="User prompt"
                className="py-5 border-b border-slate-200/70 dark:border-slate-800/70"
              >
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-2.5 flex flex-wrap gap-2">
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 max-w-[240px]"
                          >
                            {att.kind === 'image' && att.previewUrl ? (
                              <img
                                src={att.previewUrl}
                                alt={att.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded object-cover shrink-0"
                              />
                            ) : att.kind === 'audio' ? (
                              <FileAudio className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className="truncate">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                </div>
              </article>
            );
          }

          return (
            <AssistantMessage
              key={msg.id}
              message={msg}
              isLast={isLast}
              isStreamingThis={isStreaming && isLast}
              onRegenerate={onRegenerate}
              onRetryLast={onRetryLast}
              onForkThread={onForkThread}
              onOpenArtifact={onOpenArtifact}
            />
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
