import {
  Brain,
  Code2,
  Database,
  Eye,
  GitBranch,
  Globe,
  Mic,
  ShieldAlert,
  Sparkles,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { BrandMark } from './BrandMark';

interface CapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CapabilitiesModal({ isOpen, onClose }: CapabilitiesModalProps) {
  if (!isOpen) return null;

  const capabilities = [
    {
      icon: Brain,
      title: 'Universal Reasoning v1.5 & Adaptive Thinking',
      badge: 'Reasoning Core',
      description:
        'Powered by the Gemini 4 Hydrogen reasoning engine with test-time compute scaling (Low, Medium, High, and Max XHIGH). Inspect step-by-step thinking traces before receiving final answers.',
    },
    {
      icon: GitBranch,
      title: 'Tree-of-Thought & Multi-Hypothesis Explorer',
      badge: 'New in v1.5',
      description:
        'Decomposes hard problems into 3 distinct, independent reasoning branches (analytical, invariant-first, architectural), critiques trade-offs across branches, and synthesizes the optimal verified strategy.',
    },
    {
      icon: ShieldAlert,
      title: '2-Pass Adversarial Self-Critique',
      badge: 'Verification',
      description:
        'Pass 1 generates an initial reasoning draft and candidate solution; Pass 2 audits the draft for hidden edge cases, invariant breaches, and logical gaps to produce authoritative answers.',
    },
    {
      icon: Code2,
      title: 'Interactive Artifact Canvas & Sandboxed Execution',
      badge: 'New in v1.5',
      description:
        'Render and test generated HTML5 pages, SVG graphics, and web components in a live, isolated sandboxed canvas. Inspect syntax-highlighted code and download files with 1 click.',
    },
    {
      icon: Globe,
      title: 'Live Google Search & URL Context Grounding',
      badge: 'Real-Time Web',
      description:
        'Retrieve fresh web results, verify current documentation, extract knowledge from URLs, and view numbered source attribution links embedded directly in responses.',
    },
    {
      icon: Eye,
      title: 'Vision, Audio & Document Multimodal Studio',
      badge: 'Multimodal',
      description:
        'Upload screenshots, UI diagrams, architectural schemas, audio clips, and PDFs up to 8 MB. DeepThink v1.5 inspects raw visual tokens and audio streams directly.',
    },
    {
      icon: Database,
      title: 'Data & Quantitative Analyst Mode',
      badge: 'New in v1.5',
      description:
        'Calculate statistics, analyze latency distributions, extract structured insights from CSV and JSON, and generate clean Markdown data tables.',
    },
    {
      icon: Mic,
      title: 'Voice Dictation & Speech Synthesis',
      badge: 'New in v1.5',
      description:
        'Dictate prompts hands-free with microphone speech-to-text, and listen to synthesized responses using native browser text-to-speech audio.',
    },
    {
      icon: Zap,
      title: 'Open-Weights & Resilient Quota Failover',
      badge: 'Resilience',
      description:
        'Automatic failover chain to Gemini 3.1 Flash-Lite and optional support for local or hosted open-source endpoints (Qwen 3, DeepSeek, vLLM, Ollama).',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capabilities-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <BrandMark className="w-6 h-6 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="capabilities-modal-title"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  DeepThink v1.5 Capabilities
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                  v1.5 Flagship
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Universal reasoning, multimodal analysis, and interactive canvas tools
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close capabilities modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/40">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Select specialized profiles & engine routes in the composer toolbar.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
