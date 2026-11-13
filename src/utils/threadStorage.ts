import { Attachment, ChatThread, DomainProfileId, ReasoningEffort } from '../types/chat';

export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'py',
  'rs',
  'go',
  'java',
  'c',
  'cpp',
  'h',
  'css',
  'html',
  'sql',
  'yaml',
  'yml',
  'toml',
  'csv',
  'xml',
  'sh',
]);

export function createThread(params?: {
  id?: string;
  title?: string;
  profile?: DomainProfileId;
  effort?: ReasoningEffort;
  useWebSearch?: boolean;
  customSystemPrompt?: string;
  now?: number;
}): ChatThread {
  const now = params?.now ?? Date.now();
  return {
    id: params?.id ?? `thread-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: params?.title ?? 'New Thread',
    profile: params?.profile ?? 'universal',
    effort: params?.effort ?? 'high',
    useWebSearch: params?.useWebSearch ?? false,
    customSystemPrompt: params?.customSystemPrompt ?? '',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveThreadTitle(promptText: string, maxLength = 48): string {
  const cleaned = promptText.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Untitled Thread';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export function filterThreads(threads: ChatThread[], query: string): ChatThread[] {
  const q = query.trim().toLowerCase();
  if (!q) return threads;
  return threads.filter((t) => {
    if (t.title.toLowerCase().includes(q)) return true;
    return t.messages.some((m) => m.content.toLowerCase().includes(q));
  });
}

export type ThreadTimeBucket = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';

export interface GroupedThreads {
  bucket: ThreadTimeBucket;
  items: ChatThread[];
}

export function groupThreadsByRecency(
  threads: ChatThread[],
  nowMs: number = Date.now()
): GroupedThreads[] {
  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const yesterdayMs = todayMs - 86_400_000;
  const weekMs = todayMs - 7 * 86_400_000;

  const map: Record<ThreadTimeBucket, ChatThread[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  for (const thread of sorted) {
    if (thread.updatedAt >= todayMs) {
      map.Today.push(thread);
    } else if (thread.updatedAt >= yesterdayMs) {
      map.Yesterday.push(thread);
    } else if (thread.updatedAt >= weekMs) {
      map['Previous 7 Days'].push(thread);
    } else {
      map.Older.push(thread);
    }
  }

  const order: ThreadTimeBucket[] = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];
  return order
    .filter((bucket) => map[bucket].length > 0)
    .map((bucket) => ({ bucket, items: map[bucket] }));
}

export function classifyAttachmentFile(
  fileName: string,
  mimeType: string,
  size: number
): { ok: true; kind: Attachment['kind'] } | { ok: false; error: string } {
  if (size > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: `"${fileName}" exceeds the 8 MB attachment limit.`,
    };
  }

  const lowerMime = mimeType.toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (lowerMime.startsWith('image/')) {
    return { ok: true, kind: 'image' };
  }
  if (lowerMime.startsWith('audio/')) {
    return { ok: true, kind: 'audio' };
  }
  if (lowerMime === 'application/pdf' || ext === 'pdf') {
    return { ok: true, kind: 'document' };
  }
  if (
    lowerMime.startsWith('text/') ||
    lowerMime === 'application/json' ||
    ALLOWED_TEXT_EXTENSIONS.has(ext)
  ) {
    return { ok: true, kind: 'text' };
  }

  return {
    ok: false,
    error: `Unsupported file type for "${fileName}". Attach images, audio, PDFs, or text/code files.`,
  };
}

export function exportThreadToMarkdown(thread: ChatThread): string {
  const lines: string[] = [
    `# ${thread.title}`,
    '',
    `- **Profile**: ${thread.profile}`,
    `- **Reasoning Effort**: ${thread.effort}`,
    `- **Exported**: ${new Date().toISOString()}`,
    '',
    '---',
    '',
  ];

  for (const msg of thread.messages) {
    const speaker = msg.role === 'user' ? 'User' : 'DeepThink 1';
    lines.push(`## ${speaker}`);
    lines.push('');
    if (msg.thoughts && msg.thoughts.trim()) {
      lines.push('<details>');
      lines.push('<summary>Reasoning trace</summary>');
      lines.push('');
      lines.push(msg.thoughts.trim());
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
    lines.push(msg.content.trim());
    if (msg.sources && msg.sources.length > 0) {
      lines.push('');
      lines.push('**Sources:**');
      msg.sources.forEach((s, idx) => {
        lines.push(`${idx + 1}. [${s.title}](${s.uri})`);
      });
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
