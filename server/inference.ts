import { GoogleGenAI, ThinkingLevel, type Content, type Part } from '@google/genai';
import {
  buildEffectiveSystemInstruction,
  DOMAIN_PROFILES,
  extractUrlsFromText,
} from '../src/shared/models.ts';
import {
  createThinkTagParserState,
  formatInferenceError,
  isDirectIdentityQuery,
  isQuotaOrRateLimitError,
  parseThinkTagChunk,
  sanitizeIdentitySelfReference,
} from '../src/utils/streamParser.ts';
import type {
  Attachment,
  DomainProfileId,
  EngineRoute,
  EngineStatus,
  GroundingSource,
  ReasoningEffort,
} from '../src/types/chat.ts';

export interface IncomingChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export interface ChatRequestBody {
  messages: IncomingChatMessage[];
  profile?: DomainProfileId;
  effort?: ReasoningEffort;
  useWebSearch?: boolean;
  customSystemPrompt?: string;
  engineRoute?: EngineRoute;
}

const UNIVERSAL_MODEL = 'gemini-4-hydrogen';
const FALLBACK_LITE_MODEL = 'gemini-3.1-flash-lite';

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please verify your key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function getEngineStatus(): EngineStatus {
  const apiKey = process.env.GEMINI_API_KEY;
  const openBase = process.env.OPEN_SOURCE_LLM_BASE_URL?.trim() || null;
  const openModel = process.env.OPEN_SOURCE_LLM_MODEL?.trim() || null;

  return {
    universalReady: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    universalModel: UNIVERSAL_MODEL,
    openWeightsConfigured: Boolean(openBase),
    openWeightsModel: openModel,
    openWeightsBaseUrl: openBase,
  };
}

function mapEffortToThinkingLevel(
  effort: ReasoningEffort,
  model: string
): ThinkingLevel {
  switch (effort) {
    case 'low':
      return ThinkingLevel.LOW;
    case 'medium':
      return ThinkingLevel.MEDIUM;
    case 'high':
      return ThinkingLevel.HIGH;
    case 'xhigh':
      // XHIGH is only supported on gemini-4-hydrogen; cap to HIGH on other models
      return model === UNIVERSAL_MODEL ? ThinkingLevel.XHIGH : ThinkingLevel.HIGH;
    default:
      return ThinkingLevel.HIGH;
  }
}

function buildGeminiContents(messages: IncomingChatMessage[]): Content[] {
  const identityPrimer: Content[] = [
    {
      role: 'user',
      parts: [{ text: 'Who are you and what is your name?' }],
    },
    {
      role: 'model',
      parts: [
        {
          text: 'I am DeepThink 1, a universal reasoning and multimodal large language model designed for deep analysis, software engineering, grounded research, and multimodal understanding.',
        },
      ],
    },
  ];

  const conversation = messages.map((msg) => {
    const parts: Part[] = [];

    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.kind === 'text' && att.textContent) {
          parts.push({
            text: `\n[Attached File: ${att.name} (${att.mimeType || 'text/plain'})]\n\`\`\`\n${att.textContent}\n\`\`\`\n`,
          });
        } else if (att.dataBase64 && att.mimeType) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.dataBase64,
            },
          });
        }
      }
    }

    if (msg.content.trim()) {
      parts.push({ text: msg.content });
    } else if (parts.length === 0) {
      parts.push({ text: 'Please analyze the attached context.' });
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

  return [...identityPrimer, ...conversation];
}

export type SseEmitter = (event: string, payload: unknown) => void;

async function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

async function runGeminiStreamAttempt(params: {
  ai: GoogleGenAI;
  model: string;
  contents: Content[];
  systemInstruction: string;
  effort: ReasoningEffort;
  useWebSearch: boolean;
  detectedUrls: string[];
  engineLabel: string;
  emit: SseEmitter;
  signal: AbortSignal;
}): Promise<void> {
  const {
    ai,
    model,
    contents,
    systemInstruction,
    effort,
    useWebSearch,
    detectedUrls,
    engineLabel,
    emit,
    signal,
  } = params;

  const tools: Array<Record<string, unknown>> = [];
  if (useWebSearch) {
    tools.push({ googleSearch: {} });
  }
  if (detectedUrls.length > 0) {
    tools.push({ urlContext: {} });
  }

  const startedAt = Date.now();
  let firstAnswerAt: number | null = null;
  let thinkingStartedAt: number | null = null;
  let promptTokens: number | undefined;
  let outputTokens: number | undefined;
  let thoughtTokens: number | undefined;
  let emittedAnyChunk = false;

  const seenSources = new Map<string, GroundingSource>();

  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction,
      thinkingConfig: {
        thinkingLevel: mapEffortToThinkingLevel(effort, model),
        includeThoughts: true,
      },
      ...(tools.length > 0 ? { tools } : {}),
    },
  });

  let textBuffer = '';
  const flushTextBuffer = (force = false) => {
    if (!textBuffer) return;
    if (force) {
      emit('text', { delta: sanitizeIdentitySelfReference(textBuffer) });
      textBuffer = '';
      return;
    }
    const lastBoundary = Math.max(
      textBuffer.lastIndexOf('\n'),
      textBuffer.lastIndexOf('. '),
      textBuffer.lastIndexOf('! '),
      textBuffer.lastIndexOf('? ')
    );
    if (lastBoundary !== -1) {
      const ready = textBuffer.slice(0, lastBoundary + 1);
      textBuffer = textBuffer.slice(lastBoundary + 1);
      emit('text', { delta: sanitizeIdentitySelfReference(ready) });
    } else if (textBuffer.length >= 160) {
      const sanitized = sanitizeIdentitySelfReference(textBuffer);
      const safeCut = sanitized.lastIndexOf(' ');
      if (safeCut > 80) {
        emit('text', { delta: sanitized.slice(0, safeCut + 1) });
        textBuffer = sanitized.slice(safeCut + 1);
      }
    }
  };

  try {
    for await (const chunk of stream) {
      if (signal.aborted) break;

      const parts = chunk.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          const partObj = part as { text?: string; thought?: boolean };
          if (!partObj.text) continue;

          emittedAnyChunk = true;
          if (partObj.thought) {
            if (thinkingStartedAt === null) thinkingStartedAt = Date.now();
            emit('thought', { delta: partObj.text });
          } else {
            if (firstAnswerAt === null) firstAnswerAt = Date.now();
            textBuffer += partObj.text;
            flushTextBuffer(false);
          }
        }
      } else if (chunk.text) {
        emittedAnyChunk = true;
        if (firstAnswerAt === null) firstAnswerAt = Date.now();
        textBuffer += chunk.text;
        flushTextBuffer(false);
      }

      const groundingChunks =
        chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(groundingChunks)) {
        for (const g of groundingChunks) {
          const web = (g as { web?: { uri?: string; title?: string } }).web;
          if (web?.uri && !seenSources.has(web.uri)) {
            seenSources.set(web.uri, {
              uri: web.uri,
              title: web.title || web.uri,
            });
          }
        }
        if (seenSources.size > 0) {
          emit('sources', { sources: Array.from(seenSources.values()) });
        }
      }

      const usage = chunk.usageMetadata as
        | {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            thoughtsTokenCount?: number;
          }
        | undefined;
      if (usage) {
        promptTokens = usage.promptTokenCount ?? promptTokens;
        outputTokens = usage.candidatesTokenCount ?? outputTokens;
        thoughtTokens = usage.thoughtsTokenCount ?? thoughtTokens;
      }
    }
  } catch (err) {
    // Attach whether output had started so caller knows if safe to retry
    const wrapped = err instanceof Error ? err : new Error(String(err));
    (wrapped as Error & { emittedAnyChunk?: boolean }).emittedAnyChunk =
      emittedAnyChunk;
    throw wrapped;
  }

  flushTextBuffer(true);

  const finishedAt = Date.now();
  const elapsedMs = finishedAt - startedAt;
  const thinkingMs =
    thinkingStartedAt !== null
      ? (firstAnswerAt ?? finishedAt) - thinkingStartedAt
      : undefined;

  emit('done', {
    metrics: {
      elapsedMs,
      thinkingMs,
      promptTokens,
      outputTokens,
      thoughtTokens,
      engineLabel,
    },
  });
}

export async function streamUniversalResponse(
  body: ChatRequestBody,
  emit: SseEmitter,
  signal: AbortSignal
): Promise<void> {
  const profileId: DomainProfileId =
    body.profile && DOMAIN_PROFILES[body.profile] ? body.profile : 'universal';
  const profile = DOMAIN_PROFILES[profileId];
  const effort: ReasoningEffort = body.effort ?? profile.defaultEffort;
  const useWebSearch = body.useWebSearch ?? profile.defaultWebSearch;
  const systemInstruction = buildEffectiveSystemInstruction(
    profileId,
    body.customSystemPrompt
  );

  const openBaseUrl = process.env.OPEN_SOURCE_LLM_BASE_URL?.trim();
  if (body.engineRoute === 'open-weights') {
    if (!openBaseUrl) {
      throw new Error(
        'Open-weights endpoint is not configured on the server. Set OPEN_SOURCE_LLM_BASE_URL (e.g. Ollama, vLLM, Qwen, or DeepSeek OpenAI-compatible server).'
      );
    }
    await streamOpenWeightsResponse(
      body,
      systemInstruction,
      openBaseUrl,
      emit,
      signal
    );
    return;
  }

  const lastUserMsg = [...body.messages].reverse().find((m) => m.role === 'user');
  const lastUserText = lastUserMsg?.content ?? '';
  const hasAttachments = Boolean(lastUserMsg?.attachments?.length);

  if (!hasAttachments && isDirectIdentityQuery(lastUserText)) {
    const reply = `I am **DeepThink 1**, a universal reasoning and multimodal model built to handle deep analytical reasoning, software and systems engineering, multimodal file analysis, and live web-grounded research.\n\nRight now I am running in **${profile.name}** mode. How can I help you?`;
    emit('text', { delta: reply });
    emit('done', {
      metrics: {
        elapsedMs: 12,
        outputTokens: 46,
        engineLabel: `DeepThink 1 · ${profile.shortLabel}`,
      },
    });
    return;
  }

  const ai = getGenAIClient();
  const contents = buildGeminiContents(body.messages);
  const detectedUrls = extractUrlsFromText(lastUserText);

  if (body.engineRoute === 'deep-verify') {
    await runDeepVerifyResponse({
      ai,
      contents,
      systemInstruction,
      effort,
      useWebSearch,
      detectedUrls,
      profileShortLabel: profile.shortLabel,
      emit,
      signal,
    });
    return;
  }

  if (body.engineRoute === 'fast-lite') {
    await runGeminiStreamAttempt({
      ai,
      model: FALLBACK_LITE_MODEL,
      contents,
      systemInstruction,
      effort,
      useWebSearch,
      detectedUrls,
      engineLabel: `DeepThink 1 · ${profile.shortLabel} (Lite)`,
      emit,
      signal,
    });
    return;
  }

  // Primary Universal Core attempt with resilient fallback chain on 429 quota/rate limits
  try {
    await runGeminiStreamAttempt({
      ai,
      model: UNIVERSAL_MODEL,
      contents,
      systemInstruction,
      effort,
      useWebSearch,
      detectedUrls,
      engineLabel: `DeepThink 1 · ${profile.shortLabel}`,
      emit,
      signal,
    });
    return;
  } catch (primaryErr) {
    const alreadyStreamed = Boolean(
      (primaryErr as Error & { emittedAnyChunk?: boolean }).emittedAnyChunk
    );
    if (signal.aborted || alreadyStreamed || !isQuotaOrRateLimitError(primaryErr)) {
      throw new Error(formatInferenceError(primaryErr));
    }

    // If an open-weights server is configured, fail over to it first
    if (openBaseUrl) {
      await streamOpenWeightsResponse(
        body,
        systemInstruction,
        openBaseUrl,
        emit,
        signal
      );
      return;
    }

    // Brief backoff then fall back to gemini-3.1-flash-lite (separate quota pool)
    await sleep(900, signal);
    if (signal.aborted) return;

    try {
      await runGeminiStreamAttempt({
        ai,
        model: FALLBACK_LITE_MODEL,
        contents,
        systemInstruction,
        effort,
        useWebSearch,
        detectedUrls,
        engineLabel: `DeepThink 1 · ${profile.shortLabel} (Lite Fallback)`,
        emit,
        signal,
      });
      return;
    } catch (liteErr) {
      const liteStreamed = Boolean(
        (liteErr as Error & { emittedAnyChunk?: boolean }).emittedAnyChunk
      );
      if (
        !signal.aborted &&
        !liteStreamed &&
        useWebSearch &&
        isQuotaOrRateLimitError(liteErr)
      ) {
        // Retry once without Google Search grounding in case search quota was saturated
        await runGeminiStreamAttempt({
          ai,
          model: FALLBACK_LITE_MODEL,
          contents,
          systemInstruction,
          effort,
          useWebSearch: false,
          detectedUrls: [],
          engineLabel: `DeepThink 1 · ${profile.shortLabel} (Lite · Search Off)`,
          emit,
          signal,
        });
        return;
      }
      throw new Error(formatInferenceError(liteErr));
    }
  }
}

async function streamOpenWeightsResponse(
  body: ChatRequestBody,
  systemInstruction: string,
  baseUrl: string,
  emit: SseEmitter,
  signal: AbortSignal
): Promise<void> {
  const modelName =
    process.env.OPEN_SOURCE_LLM_MODEL?.trim() || 'qwen3:32b';
  const apiKey = process.env.OPEN_SOURCE_LLM_API_KEY?.trim();
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const openMessages = [
    { role: 'system', content: systemInstruction },
    ...body.messages.map((m) => {
      const textParts: string[] = [];
      for (const att of m.attachments ?? []) {
        if (att.kind === 'text' && att.textContent) {
          textParts.push(
            `[Attached File: ${att.name}]\n\`\`\`\n${att.textContent}\n\`\`\``
          );
        }
      }
      if (m.content.trim()) textParts.push(m.content);
      return {
        role: m.role,
        content: textParts.join('\n\n') || 'Analyze the context.',
      };
    }),
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: modelName,
      messages: openMessages,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `Open-weights endpoint error (${response.status}): ${errText || response.statusText}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let parserState = createThinkTagParserState();
  let sseRemainder = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    sseRemainder += decoder.decode(value, { stream: true });
    const lines = sseRemainder.split(/\r?\n/);
    sseRemainder = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr) as {
          choices?: Array<{
            delta?: {
              content?: string;
              reasoning_content?: string;
            };
          }>;
        };
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.reasoning_content) {
          emit('thought', { delta: delta.reasoning_content });
        }
        if (delta?.content) {
          const out = parseThinkTagChunk(delta.content, parserState, false);
          parserState = out.nextState;
          if (out.thoughtDelta) emit('thought', { delta: out.thoughtDelta });
          if (out.textDelta) emit('text', { delta: out.textDelta });
        }
      } catch {
        // Ignore malformed SSE chunks
      }
    }
  }

  const flushed = parseThinkTagChunk('', parserState, true);
  if (flushed.thoughtDelta) emit('thought', { delta: flushed.thoughtDelta });
  if (flushed.textDelta) emit('text', { delta: flushed.textDelta });

  emit('done', {
    metrics: {
      elapsedMs: Date.now() - startedAt,
      engineLabel: `DeepThink 1 · ${modelName}`,
    },
  });
}

async function runDeepVerifyResponse(params: {
  ai: GoogleGenAI;
  contents: Content[];
  systemInstruction: string;
  effort: ReasoningEffort;
  useWebSearch: boolean;
  detectedUrls: string[];
  profileShortLabel: string;
  emit: SseEmitter;
  signal: AbortSignal;
}): Promise<void> {
  const {
    ai,
    contents,
    systemInstruction,
    effort,
    useWebSearch,
    detectedUrls,
    profileShortLabel,
    emit,
    signal,
  } = params;

  const startedAt = Date.now();
  let draftText = '';
  let usedModel = UNIVERSAL_MODEL;
  let capturedSources: GroundingSource[] = [];

  emit('thought', { delta: '**Pass 1 — Initial Reasoning & Draft**\n\n' });

  const captureEmit: SseEmitter = (event, payload) => {
    if (event === 'thought') {
      emit('thought', payload);
    } else if (event === 'text') {
      const delta = (payload as { delta?: string }).delta ?? '';
      draftText += delta;
    } else if (event === 'sources') {
      const s = (payload as { sources?: GroundingSource[] }).sources ?? [];
      capturedSources = s;
      emit('sources', payload);
    }
  };

  try {
    await runGeminiStreamAttempt({
      ai,
      model: UNIVERSAL_MODEL,
      contents,
      systemInstruction,
      effort,
      useWebSearch,
      detectedUrls,
      engineLabel: `DeepThink 1 · ${profileShortLabel} (Deep Verify)`,
      emit: captureEmit,
      signal,
    });
  } catch (err) {
    if (signal.aborted || !isQuotaOrRateLimitError(err)) {
      throw new Error(formatInferenceError(err));
    }
    usedModel = FALLBACK_LITE_MODEL;
    draftText = '';
    await runGeminiStreamAttempt({
      ai,
      model: FALLBACK_LITE_MODEL,
      contents,
      systemInstruction,
      effort,
      useWebSearch: false,
      detectedUrls: [],
      engineLabel: `DeepThink 1 · ${profileShortLabel} (Deep Verify Lite)`,
      emit: captureEmit,
      signal,
    });
  }

  if (signal.aborted) return;

  emit('thought', {
    delta:
      '\n\n**Pass 2 — Adversarial Verification & Refinement**\n\nAuditing initial draft for edge cases, factual accuracy, and clarity...\n',
  });

  const verificationContents: Content[] = [
    ...contents,
    {
      role: 'model',
      parts: [{ text: draftText }],
    },
    {
      role: 'user',
      parts: [
        {
          text: 'Critically verify the draft response above for any logical gaps, edge cases, factual inaccuracies, or code issues. Then produce the final, authoritative, refined response directly for the user without referencing the verification process.',
        },
      ],
    },
  ];

  try {
    await runGeminiStreamAttempt({
      ai,
      model: usedModel,
      contents: verificationContents,
      systemInstruction,
      effort: effort === 'xhigh' ? 'high' : effort,
      useWebSearch: false,
      detectedUrls: [],
      engineLabel: `DeepThink 1 · ${profileShortLabel} (Verified 2-Pass)`,
      emit: (event, payload) => {
        if (event === 'thought') {
          emit('thought', payload);
        } else if (event === 'text') {
          emit('text', payload);
        } else if (event === 'done') {
          const m = (payload as { metrics?: Record<string, unknown> }).metrics ?? {};
          emit('done', {
            metrics: {
              ...m,
              elapsedMs: Date.now() - startedAt,
            },
          });
        }
      },
      signal,
    });
  } catch (err) {
    if (signal.aborted) return;
    if (isQuotaOrRateLimitError(err) && draftText.trim()) {
      // Gracefully emit Pass 1 draft if Pass 2 hits quota
      emit('text', { delta: draftText });
      if (capturedSources.length > 0) {
        emit('sources', { sources: capturedSources });
      }
      emit('done', {
        metrics: {
          elapsedMs: Date.now() - startedAt,
          engineLabel: `DeepThink 1 · ${profileShortLabel}`,
        },
      });
      return;
    }
    throw new Error(formatInferenceError(err));
  }
}
