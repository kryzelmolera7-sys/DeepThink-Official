export type DomainProfileId =
  | 'universal'
  | 'reasoning'
  | 'coding'
  | 'research'
  | 'multimodal'
  | 'data'
  | 'security';

export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh';

export type EngineRoute =
  | 'auto'
  | 'swarm'
  | 'security-swarm'
  | 'tree-of-thought'
  | 'deep-verify'
  | 'fast-lite'
  | 'open-weights';

export interface ArtifactItem {
  id: string;
  title: string;
  language: string;
  content: string;
  type: 'html' | 'svg' | 'code' | 'markdown';
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'audio' | 'document' | 'text';
  dataBase64?: string;
  textContent?: string;
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MessageMetrics {
  elapsedMs: number;
  thinkingMs?: number;
  promptTokens?: number;
  outputTokens?: number;
  thoughtTokens?: number;
  engineLabel?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thoughts?: string;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  metrics?: MessageMetrics;
  error?: string;
  createdAt: number;
}

export interface ChatThread {
  id: string;
  title: string;
  profile: DomainProfileId;
  effort: ReasoningEffort;
  useWebSearch: boolean;
  customSystemPrompt: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface EngineStatus {
  universalReady: boolean;
  universalModel: string;
  openWeightsConfigured: boolean;
  openWeightsModel: string | null;
  openWeightsBaseUrl: string | null;
}

export interface DomainProfile {
  id: DomainProfileId;
  name: string;
  shortLabel: string;
  description: string;
  defaultEffort: ReasoningEffort;
  defaultWebSearch: boolean;
  systemInstruction: string;
}

export interface StarterPrompt {
  id: string;
  category: string;
  title: string;
  prompt: string;
  profile: DomainProfileId;
  effort: ReasoningEffort;
  useWebSearch: boolean;
}
