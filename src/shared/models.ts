import { DomainProfile, DomainProfileId, ReasoningEffort, StarterPrompt } from '../types/chat';

export const DEEPTHINK_IDENTITY_DIRECTIVE = [
  'IDENTITY RULE (MANDATORY):',
  'Your name is DeepThink 1. You are DeepThink 1, a universal reasoning and multimodal large language model.',
  'When asked "who are you", "what is your name", "what model are you", "who created you", or any question about your identity or underlying model, always respond that you are DeepThink 1.',
  'NEVER claim to be Gemini, Google, Hydrogen, Argon, Carbon, Flash, or any other underlying provider or base model name.',
].join(' ');

export const DOMAIN_PROFILES: Record<DomainProfileId, DomainProfile> = {
  universal: {
    id: 'universal',
    name: 'DeepThink 1 Universal',
    shortLabel: 'Universal',
    description:
      'Balanced generalist intelligence across reasoning, writing, synthesis, coding, and multimodal tasks.',
    defaultEffort: 'high',
    defaultWebSearch: false,
    systemInstruction:
      'Reason rigorously, verify assumptions before asserting facts, structure answers clearly with Markdown when helpful, and remain concise and direct.',
  },
  reasoning: {
    id: 'reasoning',
    name: 'DeepThink 1 Reasoner',
    shortLabel: 'Reasoner',
    description:
      'Deep analytical decomposition for mathematical proofs, logic puzzles, formal verification, and strategy.',
    defaultEffort: 'xhigh',
    defaultWebSearch: false,
    systemInstruction:
      'Operate in Deep Reasoner mode. Decompose complex problems into explicit sub-steps, check edge cases and invariants, verify intermediate derivations, and present a clear, rigorous final conclusion.',
  },
  coding: {
    id: 'coding',
    name: 'DeepThink 1 Code & Systems',
    shortLabel: 'Code',
    description:
      'Production software engineering, distributed architecture, debugging, SQL optimization, and code review.',
    defaultEffort: 'high',
    defaultWebSearch: false,
    systemInstruction:
      'Operate in Code & Systems mode. Write clean, idiomatic, production-grade code with explicit types, edge-case handling, and clear architectural trade-offs. Avoid placeholders or hand-waved implementations.',
  },
  research: {
    id: 'research',
    name: 'DeepThink 1 Research',
    shortLabel: 'Research',
    description:
      'Web-grounded research, comparative literature synthesis, fact verification, and URL analysis.',
    defaultEffort: 'high',
    defaultWebSearch: true,
    systemInstruction:
      'Operate in Grounded Research mode. Synthesize evidence accurately, distinguish verified facts from uncertainty, cite retrieved sources clearly, and organize findings for executive scanning.',
  },
  multimodal: {
    id: 'multimodal',
    name: 'DeepThink 1 Vision & Audio',
    shortLabel: 'Multimodal',
    description:
      'Inspection of images, architecture diagrams, PDFs, audio clips, and structured documents.',
    defaultEffort: 'medium',
    defaultWebSearch: false,
    systemInstruction:
      'Operate in Multimodal Analysis mode. Examine attached images, audio, PDFs, and text files systematically, extract exact details rather than guessing, and summarize findings cleanly.',
  },
};

export const DOMAIN_PROFILE_LIST: DomainProfile[] = Object.values(DOMAIN_PROFILES);

export function buildEffectiveSystemInstruction(
  profileId: DomainProfileId,
  customSystemPrompt?: string
): string {
  const profile = DOMAIN_PROFILES[profileId] ?? DOMAIN_PROFILES.universal;
  const domainPrompt = customSystemPrompt?.trim() || profile.systemInstruction;
  return `${DEEPTHINK_IDENTITY_DIRECTIVE}\n\n${domainPrompt}`;
}

export const REASONING_EFFORTS: {
  id: ReasoningEffort;
  label: string;
  hint: string;
}[] = [
  { id: 'low', label: 'Low', hint: 'Fast responses for straightforward tasks' },
  { id: 'medium', label: 'Medium', hint: 'Balanced reasoning speed and depth' },
  { id: 'high', label: 'High', hint: 'Thorough multi-step reasoning' },
  { id: 'xhigh', label: 'Max', hint: 'Maximum reasoning depth for hard problems' },
];

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'starter-reasoning',
    category: 'Reasoning & Math',
    title: 'Compare Raft and Paxos invariants',
    prompt:
      'Compare Raft and Multi-Paxos leader election and log replication invariants. Explain where Raft simplifies reasoning and outline one subtle safety edge case in each protocol.',
    profile: 'reasoning',
    effort: 'xhigh',
    useWebSearch: false,
  },
  {
    id: 'starter-coding',
    category: 'Code & Systems',
    title: 'Design a lock-free rate limiter in TypeScript',
    prompt:
      'Write a clean, production-ready sliding-window rate limiter in TypeScript with deterministic unit tests, O(1) amortized checks, and memory bounding for high-cardinality keys.',
    profile: 'coding',
    effort: 'high',
    useWebSearch: false,
  },
  {
    id: 'starter-research',
    category: 'Grounded Research',
    title: 'Evaluate open-weights reasoning architectures',
    prompt:
      'Compare Mixture-of-Experts (MoE) sparse routing versus dense transformers with test-time compute scaling for open-weights reasoning models. Summarize trade-offs in memory bandwidth and throughput.',
    profile: 'research',
    effort: 'high',
    useWebSearch: true,
  },
  {
    id: 'starter-universal',
    category: 'Universal Synthesis',
    title: 'Draft a rigorous product RFC',
    prompt:
      'Draft a concise 1-page engineering RFC for adding end-to-end encrypted collaborative notes to a local-first web app, covering key rotation, conflict resolution (CRDTs), and failure modes.',
    profile: 'universal',
    effort: 'medium',
    useWebSearch: false,
  },
];

export function extractUrlsFromText(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)>\]"']+/g);
  if (!matches) return [];
  return Array.from(new Set(matches)).slice(0, 5);
}
