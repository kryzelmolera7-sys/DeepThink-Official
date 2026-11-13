import { useEffect } from 'react';
import { X } from 'lucide-react';
import { DOMAIN_PROFILE_LIST } from '../shared/models';
import type { EngineStatus } from '../types/chat';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineStatus: EngineStatus | null;
}

export function ArchitectureModal({
  isOpen,
  onClose,
  engineStatus,
}: ArchitectureModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="architecture-title"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[88vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <h2
            id="architecture-title"
            className="font-display text-base font-semibold text-slate-900 dark:text-slate-50"
          >
            DeepThink v1.5 Model Architecture & Engine
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close model architecture dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          <section className="space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Active Server Inference Backends
            </h3>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-4">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Universal Reasoning Core
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {engineStatus?.universalModel || 'gemini-4-hydrogen'} ·{' '}
                  {engineStatus?.universalReady ? 'Ready' : 'Key Required'}
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-4">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Tree-of-Thought Explorer
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  3-Branch Multi-Hypothesis Synthesis
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-4">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  2-Pass Adversarial Verification
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  Draft + Adversarial Invariant Audit
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-4">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  High-Quota Lite Fallback
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  gemini-3.1-flash-lite · Auto-Failover
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-4">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Open-Weights OpenAI-Compatible Route
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {engineStatus?.openWeightsConfigured
                    ? `${engineStatus.openWeightsModel || 'Custom Model'} · Connected`
                    : 'Optional (OPEN_SOURCE_LLM_BASE_URL)'}
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              In Auto mode, DeepThink v1.5 routes through the Universal Reasoning
              Core and automatically fails over to{' '}
              <code className="font-mono">gemini-3.1-flash-lite</code> (or your
              configured open-weights endpoint) if quota limits occur. To run
              open-weights models like Qwen or DeepSeek directly, configure{' '}
              <code className="font-mono">OPEN_SOURCE_LLM_BASE_URL</code> and{' '}
              <code className="font-mono">OPEN_SOURCE_LLM_MODEL</code> in your
              server environment.
            </p>
          </section>

          <section className="space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Universal Domain Profiles
            </h3>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              {DOMAIN_PROFILE_LIST.map((p) => (
                <div key={p.id} className="px-3.5 py-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {p.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      Default effort: {p.defaultEffort}
                      {p.defaultWebSearch ? ' · Web Search' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
