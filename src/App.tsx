import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArchitectureModal } from './components/ArchitectureModal';
import { Composer } from './components/Composer';
import { MessageList } from './components/MessageList';
import { Sidebar } from './components/Sidebar';
import { SystemPromptModal } from './components/SystemPromptModal';
import { TopBar } from './components/TopBar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { DOMAIN_PROFILES } from './shared/models';
import type {
  Attachment,
  ChatMessage,
  ChatThread,
  DomainProfileId,
  EngineRoute,
  EngineStatus,
  GroundingSource,
  MessageMetrics,
  ReasoningEffort,
  StarterPrompt,
} from './types/chat';
import { formatInferenceError, parseSseBuffer } from './utils/streamParser';
import {
  createThread,
  deriveThreadTitle,
  exportThreadToMarkdown,
} from './utils/threadStorage';

const THREADS_KEY = 'deepthink1.threads.v1';
const ACTIVE_THREAD_KEY = 'deepthink1.activeThread.v1';
const THEME_KEY = 'deepthink1.theme';

function loadInitialThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatThread[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore corrupt localStorage
  }
  return [createThread()];
}

function persistThreads(threads: ChatThread[]) {
  try {
    const lightweight = threads.map((t) => ({
      ...t,
      messages: t.messages.map((m) => ({
        ...m,
        attachments: m.attachments?.map((a) => ({
          ...a,
          dataBase64: undefined,
          previewUrl:
            a.previewUrl && a.previewUrl.length < 40_000
              ? a.previewUrl
              : undefined,
        })),
      })),
    }));
    localStorage.setItem(THREADS_KEY, JSON.stringify(lightweight));
  } catch {
    // Quota exceeded fallback ignored gracefully
  }
}

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>(loadInitialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_THREAD_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return '';
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [engineRoute, setEngineRoute] = useState<EngineRoute>('auto');
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [systemModalOpen, setSystemModalOpen] = useState(false);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      // ignore
    }
    return true;
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    fetch('/api/engine/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EngineStatus | null) => {
        if (data) setEngineStatus(data);
      })
      .catch(() => {
        // Ignore non-fatal status fetch error
      });
  }, []);

  const activeThread = useMemo(() => {
    const found = threads.find((t) => t.id === activeThreadId);
    return found ?? threads[0];
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (activeThread && activeThread.id !== activeThreadId) {
      setActiveThreadId(activeThread.id);
    }
  }, [activeThread, activeThreadId]);

  useEffect(() => {
    persistThreads(threads);
  }, [threads]);

  useEffect(() => {
    if (!activeThreadId) return;
    try {
      localStorage.setItem(ACTIVE_THREAD_KEY, activeThreadId);
    } catch {
      // ignore
    }
  }, [activeThreadId]);

  const updateThread = useCallback(
    (threadId: string, updater: (t: ChatThread) => ChatThread) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? updater(t) : t))
      );
    },
    []
  );

  const handleNewThread = useCallback(() => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    const fresh = createThread();
    setThreads((prev) => [fresh, ...prev]);
    setActiveThreadId(fresh.id);
    setInput('');
    setAttachments([]);
  }, [isStreaming]);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      if (threadId === activeThread?.id && isStreaming) {
        abortControllerRef.current?.abort();
        setIsStreaming(false);
      }
      setThreads((prev) => {
        const remaining = prev.filter((t) => t.id !== threadId);
        if (remaining.length === 0) {
          const replacement = createThread();
          setActiveThreadId(replacement.id);
          return [replacement];
        }
        if (threadId === activeThread?.id) {
          setActiveThreadId(remaining[0].id);
        }
        return remaining;
      });
    },
    [activeThread?.id, isStreaming]
  );

  const handleProfileChange = useCallback(
    (profileId: DomainProfileId) => {
      if (!activeThread) return;
      const preset = DOMAIN_PROFILES[profileId];
      updateThread(activeThread.id, (t) => ({
        ...t,
        profile: profileId,
        effort: preset.defaultEffort,
        useWebSearch: preset.defaultWebSearch,
        updatedAt: Date.now(),
      }));
    },
    [activeThread, updateThread]
  );

  const handleEffortChange = useCallback(
    (effort: ReasoningEffort) => {
      if (!activeThread) return;
      updateThread(activeThread.id, (t) => ({
        ...t,
        effort,
        updatedAt: Date.now(),
      }));
    },
    [activeThread, updateThread]
  );

  const handleToggleWebSearch = useCallback(() => {
    if (!activeThread) return;
    updateThread(activeThread.id, (t) => ({
      ...t,
      useWebSearch: !t.useWebSearch,
      updatedAt: Date.now(),
    }));
  }, [activeThread, updateThread]);

  const runCompletion = useCallback(
    async (
      threadSnapshot: ChatThread,
      messagesToSend: ChatMessage[],
      assistantMsgId: string
    ) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: messagesToSend.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
            profile: threadSnapshot.profile,
            effort: threadSnapshot.effort,
            useWebSearch: threadSnapshot.useWebSearch,
            customSystemPrompt: threadSnapshot.customSystemPrompt,
            engineRoute,
          }),
        });

        if (!response.ok || !response.body) {
          let errMsg = `Request failed (${response.status})`;
          try {
            const data = (await response.json()) as { error?: string };
            if (data.error) errMsg = data.error;
          } catch {
            // ignore
          }
          throw new Error(errMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let carry = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const parsed = parseSseBuffer(chunk, carry);
          carry = parsed.remaining;

          for (const evt of parsed.events) {
            let dataObj: Record<string, unknown> = {};
            try {
              dataObj = JSON.parse(evt.data) as Record<string, unknown>;
            } catch {
              continue;
            }

            if (evt.event === 'thought' && typeof dataObj.delta === 'string') {
              const delta = dataObj.delta;
              updateThread(threadSnapshot.id, (t) => ({
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, thoughts: (m.thoughts ?? '') + delta }
                    : m
                ),
              }));
            } else if (evt.event === 'text' && typeof dataObj.delta === 'string') {
              const delta = dataObj.delta;
              updateThread(threadSnapshot.id, (t) => ({
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + delta }
                    : m
                ),
              }));
            } else if (evt.event === 'sources' && Array.isArray(dataObj.sources)) {
              const sources = dataObj.sources as GroundingSource[];
              updateThread(threadSnapshot.id, (t) => ({
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, sources } : m
                ),
              }));
            } else if (evt.event === 'done' && dataObj.metrics) {
              const metrics = dataObj.metrics as MessageMetrics;
              updateThread(threadSnapshot.id, (t) => ({
                ...t,
                updatedAt: Date.now(),
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, metrics } : m
                ),
              }));
            } else if (evt.event === 'error' && typeof dataObj.message === 'string') {
              const message = formatInferenceError(dataObj.message);
              updateThread(threadSnapshot.id, (t) => ({
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, error: message } : m
                ),
              }));
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const message = formatInferenceError(err);
          updateThread(threadSnapshot.id, (t) => ({
            ...t,
            messages: t.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, error: message } : m
            ),
          }));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [engineRoute, updateThread]
  );

  const sendPrompt = useCallback(
    async (
      promptText: string,
      overrideSettings?: {
        profile: DomainProfileId;
        effort: ReasoningEffort;
        useWebSearch: boolean;
      }
    ) => {
      if (!activeThread || isStreaming) return;
      const trimmed = promptText.trim();
      if (!trimmed && attachments.length === 0) return;

      const now = Date.now();
      const userMsg: ChatMessage = {
        id: `msg-u-${now}`,
        role: 'user',
        content: trimmed,
        attachments: attachments.length > 0 ? attachments : undefined,
        createdAt: now,
      };
      const assistantMsg: ChatMessage = {
        id: `msg-a-${now + 1}`,
        role: 'assistant',
        content: '',
        thoughts: '',
        createdAt: now + 1,
      };

      const isFirstMessage = activeThread.messages.length === 0;
      const updatedTitle = isFirstMessage
        ? deriveThreadTitle(trimmed || attachments[0]?.name || 'Multimodal Analysis')
        : activeThread.title;

      const nextThread: ChatThread = {
        ...activeThread,
        title: updatedTitle,
        profile: overrideSettings?.profile ?? activeThread.profile,
        effort: overrideSettings?.effort ?? activeThread.effort,
        useWebSearch:
          overrideSettings?.useWebSearch ?? activeThread.useWebSearch,
        messages: [...activeThread.messages, userMsg, assistantMsg],
        updatedAt: now,
      };

      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? nextThread : t))
      );
      setInput('');
      setAttachments([]);

      await runCompletion(
        nextThread,
        [...activeThread.messages, userMsg],
        assistantMsg.id
      );
    },
    [activeThread, attachments, isStreaming, runCompletion]
  );

  const handleSelectStarter = useCallback(
    (starter: StarterPrompt) => {
      void sendPrompt(starter.prompt, {
        profile: starter.profile,
        effort: starter.effort,
        useWebSearch: starter.useWebSearch,
      });
    },
    [sendPrompt]
  );

  const handleRegenerateOrRetry = useCallback(async () => {
    if (!activeThread || isStreaming || activeThread.messages.length === 0) return;

    const msgs = [...activeThread.messages];
    const last = msgs[msgs.length - 1];
    const historyWithoutLastAssistant =
      last.role === 'assistant' ? msgs.slice(0, -1) : msgs;

    if (historyWithoutLastAssistant.length === 0) return;

    const now = Date.now();
    const freshAssistant: ChatMessage = {
      id: `msg-a-${now}`,
      role: 'assistant',
      content: '',
      thoughts: '',
      createdAt: now,
    };

    const nextThread: ChatThread = {
      ...activeThread,
      messages: [...historyWithoutLastAssistant, freshAssistant],
      updatedAt: now,
    };

    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? nextThread : t))
    );

    await runCompletion(
      nextThread,
      historyWithoutLastAssistant,
      freshAssistant.id
    );
  }, [activeThread, isStreaming, runCompletion]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const handleExportMarkdown = useCallback(() => {
    if (!activeThread || activeThread.messages.length === 0) return;
    const md = exportThreadToMarkdown(activeThread);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const slug = activeThread.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.download = `${slug || 'deepthink-1-thread'}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [activeThread]);

  if (!activeThread) return null;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        threads={threads}
        activeThreadId={activeThread.id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectThread={(id) => {
          if (isStreaming) handleStop();
          setActiveThreadId(id);
        }}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onOpenArchitecture={() => setArchitectureModalOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
      />

      <main className="flex-1 min-w-0 flex flex-col h-full bg-white dark:bg-[#090D16]">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          threadTitle={activeThread.title}
          hasCustomSystemPrompt={Boolean(activeThread.customSystemPrompt.trim())}
          onOpenSystemPrompt={() => setSystemModalOpen(true)}
          onExportMarkdown={handleExportMarkdown}
          canExport={activeThread.messages.length > 0}
        />

        {activeThread.messages.length === 0 ? (
          <WelcomeScreen onSelectStarter={handleSelectStarter} />
        ) : (
          <MessageList
            messages={activeThread.messages}
            isStreaming={isStreaming}
            onRegenerate={handleRegenerateOrRetry}
            onRetryLast={handleRegenerateOrRetry}
          />
        )}

        <Composer
          input={input}
          onInputChange={setInput}
          attachments={attachments}
          onAddAttachments={(files) =>
            setAttachments((prev) => [...prev, ...files])
          }
          onRemoveAttachment={(id) =>
            setAttachments((prev) => prev.filter((a) => a.id !== id))
          }
          profile={activeThread.profile}
          onProfileChange={handleProfileChange}
          effort={activeThread.effort}
          onEffortChange={handleEffortChange}
          useWebSearch={activeThread.useWebSearch}
          onToggleWebSearch={handleToggleWebSearch}
          engineRoute={engineRoute}
          onEngineRouteChange={setEngineRoute}
          engineStatus={engineStatus}
          isStreaming={isStreaming}
          onSend={() => void sendPrompt(input)}
          onStop={handleStop}
        />
      </main>

      <SystemPromptModal
        isOpen={systemModalOpen}
        onClose={() => setSystemModalOpen(false)}
        profile={activeThread.profile}
        customSystemPrompt={activeThread.customSystemPrompt}
        onSave={(prompt) =>
          updateThread(activeThread.id, (t) => ({
            ...t,
            customSystemPrompt: prompt,
            updatedAt: Date.now(),
          }))
        }
      />

      <ArchitectureModal
        isOpen={architectureModalOpen}
        onClose={() => setArchitectureModalOpen(false)}
        engineStatus={engineStatus}
      />
    </div>
  );
}
