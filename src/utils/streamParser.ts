export interface ThinkTagParserState {
  inThink: boolean;
  buffer: string;
}

export interface ParsedChunkResult {
  thoughtDelta: string;
  textDelta: string;
  nextState: ThinkTagParserState;
}

const OPEN_TAG = '<think>';
const CLOSE_TAG = '</think>';

export function createThinkTagParserState(): ThinkTagParserState {
  return { inThink: false, buffer: '' };
}

/**
 * Incrementally separates `<think>...</think>` blocks (used by open-weights
 * reasoning models like DeepSeek-R1 and Qwen 3) from visible answer tokens,
 * even when tag boundaries are split across stream chunks.
 */
export function parseThinkTagChunk(
  chunk: string,
  state: ThinkTagParserState,
  flush = false
): ParsedChunkResult {
  let buffer = state.buffer + chunk;
  let inThink = state.inThink;
  let thoughtDelta = '';
  let textDelta = '';

  while (buffer.length > 0) {
    if (!inThink) {
      const openIdx = buffer.indexOf(OPEN_TAG);
      if (openIdx !== -1) {
        textDelta += buffer.slice(0, openIdx);
        buffer = buffer.slice(openIdx + OPEN_TAG.length);
        inThink = true;
        continue;
      }

      if (!flush) {
        const partialLen = trailingPrefixLength(buffer, OPEN_TAG);
        if (partialLen > 0) {
          textDelta += buffer.slice(0, buffer.length - partialLen);
          buffer = buffer.slice(buffer.length - partialLen);
          break;
        }
      }

      textDelta += buffer;
      buffer = '';
    } else {
      const closeIdx = buffer.indexOf(CLOSE_TAG);
      if (closeIdx !== -1) {
        thoughtDelta += buffer.slice(0, closeIdx);
        buffer = buffer.slice(closeIdx + CLOSE_TAG.length);
        inThink = false;
        continue;
      }

      if (!flush) {
        const partialLen = trailingPrefixLength(buffer, CLOSE_TAG);
        if (partialLen > 0) {
          thoughtDelta += buffer.slice(0, buffer.length - partialLen);
          buffer = buffer.slice(buffer.length - partialLen);
          break;
        }
      }

      thoughtDelta += buffer;
      buffer = '';
    }
  }

  return {
    thoughtDelta,
    textDelta,
    nextState: { inThink, buffer },
  };
}

function trailingPrefixLength(text: string, tag: string): number {
  const maxCheck = Math.min(text.length, tag.length - 1);
  for (let len = maxCheck; len > 0; len--) {
    if (text.endsWith(tag.slice(0, len))) {
      return len;
    }
  }
  return 0;
}

export interface SseEvent {
  event: string;
  data: string;
}

export function parseSseBuffer(
  incoming: string,
  carry: string
): { events: SseEvent[]; remaining: string } {
  const combined = carry + incoming;
  const blocks = combined.split(/\r?\n\r?\n/);
  const remaining = blocks.pop() ?? '';
  const events: SseEvent[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventName = 'message';
    const dataLines: string[] = [];

    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length > 0) {
      events.push({ event: eventName, data: dataLines.join('\n') });
    }
  }

  return { events, remaining };
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  return `${mins}m ${rem}s`;
}

export function isQuotaOrRateLimitError(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err ?? '');
  return (
    text.includes('429') ||
    text.includes('RESOURCE_EXHAUSTED') ||
    text.toLowerCase().includes('quota') ||
    text.toLowerCase().includes('too many requests') ||
    text.toLowerCase().includes('rate limit')
  );
}

export function formatInferenceError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'Unexpected inference error.');

  const unwrap = (input: string, depth = 0): string => {
    if (depth > 3) return input;
    const trimmed = input.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as {
          error?: { message?: string; code?: number; status?: string } | string;
          message?: string;
        };
        if (typeof parsed.error === 'object' && parsed.error !== null) {
          if (typeof parsed.error.message === 'string') {
            return unwrap(parsed.error.message, depth + 1);
          }
        }
        if (typeof parsed.error === 'string') {
          return unwrap(parsed.error, depth + 1);
        }
        if (typeof parsed.message === 'string') {
          return unwrap(parsed.message, depth + 1);
        }
      } catch {
        // Not valid JSON, fall through
      }
    }
    return trimmed;
  };

  const clean = unwrap(raw);
  if (isQuotaOrRateLimitError(raw) || isQuotaOrRateLimitError(clean)) {
    return 'API quota or rate limit reached (429). Retry shortly, switch to the Lite engine or lower reasoning effort, or select a billing-enabled Gemini API key in Settings > Secrets.';
  }
  if (clean.includes('PERMISSION_DENIED') || clean.includes('API_KEY_INVALID')) {
    return 'Gemini API key is missing or invalid. Please check your key in Settings > Secrets.';
  }
  return clean || 'Unexpected inference error.';
}
