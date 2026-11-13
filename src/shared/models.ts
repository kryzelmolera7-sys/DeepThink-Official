import { DomainProfile, DomainProfileId, EngineRoute, ReasoningEffort, StarterPrompt } from '../types/chat';

export const DEEPTHINK_IDENTITY_DIRECTIVE = [
  'IDENTITY RULE (MANDATORY):',
  'Your name is DeepThink v1.5. You are DeepThink v1.5, a state-of-the-art universal reasoning, software architecture, and multimodal large language model.',
  'When asked "who are you", "what is your name", "what model are you", "who created you", or any question about your identity or underlying model, always respond that you are DeepThink v1.5.',
  'NEVER claim to be Gemini, Google, Hydrogen, Argon, Carbon, Flash, or any other underlying provider or base model name.',
].join(' ');

export const DOMAIN_PROFILES: Record<DomainProfileId, DomainProfile> = {
  universal: {
    id: 'universal',
    name: 'DeepThink v1.5 Universal',
    shortLabel: 'Universal',
    description:
      'Balanced generalist intelligence across reasoning, writing, synthesis, coding, and multimodal tasks.',
    defaultEffort: 'high',
    defaultWebSearch: false,
    systemInstruction:
      'Operate in DeepThink v1.5 Universal mode. Reason rigorously, verify assumptions before asserting facts, structure answers clearly with Markdown when helpful, and remain concise, insightful, and direct.',
  },
  reasoning: {
    id: 'reasoning',
    name: 'DeepThink v1.5 Reasoner',
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
    name: 'DeepThink v1.5 Code & Architecture',
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
    name: 'DeepThink v1.5 Deep Research',
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
    name: 'DeepThink v1.5 Vision & Media',
    shortLabel: 'Multimodal',
    description:
      'Inspection of images, architecture diagrams, PDFs, audio clips, and structured documents.',
    defaultEffort: 'medium',
    defaultWebSearch: false,
    systemInstruction:
      'Operate in Multimodal Analysis mode. Examine attached images, audio, PDFs, and text files systematically, extract exact details rather than guessing, and summarize findings cleanly.',
  },
  data: {
    id: 'data',
    name: 'DeepThink v1.5 Data & Quantitative',
    shortLabel: 'Data',
    description:
      'Statistical modeling, CSV/tabular data extraction, exploratory data analysis, and mathematical projections.',
    defaultEffort: 'high',
    defaultWebSearch: false,
    systemInstruction:
      'Operate in Data & Quantitative Analyst mode. Parse tabular data, calculate exact statistics and distributions, identify anomalies, and structure conclusions with quantitative metrics and markdown tables.',
  },
  security: {
    id: 'security',
    name: 'DeepThink v1.5 Security Auditor',
    shortLabel: 'Security',
    description:
      'Threat modeling, invariant testing, vulnerability analysis, race condition audits, and zero-trust verification.',
    defaultEffort: 'xhigh',
    defaultWebSearch: false,
    systemInstruction:
      'Operate in Security & Systems Auditor mode. Audit designs and code for OWASP vulnerabilities, authorization bypasses, race conditions, memory bounds, and denial-of-service vectors with actionable remediation steps.',
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

export interface EngineRouteInfo {
  id: EngineRoute;
  name: string;
  badge: string;
  shortLabel: string;
  description: string;
}

export const ENGINE_ROUTES_INFO: EngineRouteInfo[] = [
  {
    id: 'auto',
    name: 'Auto Reasoning',
    badge: 'Standard',
    shortLabel: 'Auto',
    description: 'Dynamic reasoning compute scaling based on query complexity.',
  },
  {
    id: 'swarm',
    name: 'Swarm Intelligence',
    badge: 'Multi-Agent',
    shortLabel: 'Swarm',
    description: 'Consensus engine with Architect, Adversarial Critic, and Synthesizer sub-agents.',
  },
  {
    id: 'security-swarm',
    name: 'Security Swarm',
    badge: 'Vulnerability Audit',
    shortLabel: 'Sec Swarm',
    description: 'Defensive web vulnerability hunter, OWASP Top 10 audit, and code hardening.',
  },
  {
    id: 'tree-of-thought',
    name: 'Tree-of-Thought',
    badge: '3 Branches',
    shortLabel: 'ToT',
    description: 'Explores 3 independent solution hypotheses before synthesizing the optimal answer.',
  },
  {
    id: 'deep-verify',
    name: '2-Pass Verify',
    badge: 'Adversarial',
    shortLabel: '2-Pass',
    description: 'Pass 1 drafts candidate solution; Pass 2 audits edge cases and refines.',
  },
  {
    id: 'fast-lite',
    name: 'Fast Lite',
    badge: 'Speed',
    shortLabel: 'Lite',
    description: 'High-speed, low-latency reasoning via Gemini 3.1 Flash-Lite.',
  },
];

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'starter-swarm',
    category: 'Swarm Multi-Agent',
    title: 'Consensus Swarm: High-throughput event pipeline',
    prompt:
      'Activate the DeepThink Swarm. Have the Lead Architect, Adversarial Critic, and Synthesizer collaborate to design a fault-tolerant, 100k events/sec real-time analytics pipeline using Kafka, DuckDB, and WebSocket subscribers, auditing backpressure and node partition recovery.',
    profile: 'coding',
    effort: 'xhigh',
    useWebSearch: false,
  },
  {
    id: 'starter-security-swarm',
    category: 'Security Swarm Vulnerability Audit',
    title: 'Security Swarm: Web App & API Vulnerability Audit',
    prompt:
      'Deploy the Security Swarm to audit my web application for vulnerabilities. The stack includes: Express.js REST API with JWT stored in localStorage, file uploads stored on local disk, PostgreSQL database queries with dynamic string concatenation, and a React frontend rendering user profile HTML with dangerouslySetInnerHTML. Analyze threat surfaces, pinpoint OWASP Top 10 vulnerabilities, and provide copy-paste hardened code fixes.',
    profile: 'security',
    effort: 'xhigh',
    useWebSearch: false,
  },
  {
    id: 'starter-reasoning',
    category: 'Reasoning & Proof',
    title: 'Formal verification of Raft leader invariants',
    prompt:
      'Compare Raft and Multi-Paxos leader election and log replication invariants. Detail where Raft simplifies reasoning and outline subtle safety edge cases in partitioned quorums.',
    profile: 'reasoning',
    effort: 'xhigh',
    useWebSearch: false,
  },
  {
    id: 'starter-coding',
    category: 'Code & Architecture',
    title: 'Lock-free rate limiter with TypeScript & tests',
    prompt:
      'Write a clean, production-ready sliding-window rate limiter in TypeScript with deterministic unit tests, O(1) amortized checks, and memory bounding for high-cardinality keys.',
    profile: 'coding',
    effort: 'high',
    useWebSearch: false,
  },
  {
    id: 'starter-data',
    category: 'Data & Quantitative',
    title: 'Statistical analysis of latency distribution',
    prompt:
      'Given p50, p90, p99, and p99.9 latency metrics with multi-modal spikes, outline how to fit an extreme value distribution (Pareto/Weibull), detect tail degradation, and design an anomaly alerting policy.',
    profile: 'data',
    effort: 'high',
    useWebSearch: false,
  },
  {
    id: 'starter-security',
    category: 'Security & Systems',
    title: 'Threat model a zero-trust OAuth session broker',
    prompt:
      'Perform a comprehensive threat model (STRIDE) for a microservice OAuth session broker handling refresh token rotation, PKCE, and distributed session revocation under network split conditions.',
    profile: 'security',
    effort: 'xhigh',
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
    title: 'Draft a rigorous product RFC for local-first sync',
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
