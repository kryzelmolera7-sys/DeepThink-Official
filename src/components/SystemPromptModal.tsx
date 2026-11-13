import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DOMAIN_PROFILES } from '../shared/models';
import type { DomainProfileId } from '../types/chat';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DomainProfileId;
  customSystemPrompt: string;
  onSave: (prompt: string) => void;
}

export function SystemPromptModal({
  isOpen,
  onClose,
  profile,
  customSystemPrompt,
  onSave,
}: SystemPromptModalProps) {
  const [draft, setDraft] = useState(customSystemPrompt);

  useEffect(() => {
    if (isOpen) {
      setDraft(customSystemPrompt);
    }
  }, [isOpen, customSystemPrompt]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const profileDefault = DOMAIN_PROFILES[profile].systemInstruction;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-prompt-title"
    >
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <h2
            id="system-prompt-title"
            className="font-display text-base font-semibold text-slate-900 dark:text-slate-50"
          >
            System Instructions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close system instructions dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Override the active profile system prompt for this thread. Leave
            empty to use the default instructions for{' '}
            <strong className="font-medium text-slate-900 dark:text-slate-200">
              {DOMAIN_PROFILES[profile].name}
            </strong>
            .
          </p>

          <div>
            <label
              htmlFor="system-prompt-textarea"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Custom System Prompt
            </label>
            <textarea
              id="system-prompt-textarea"
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={profileDefault}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDraft('')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            Reset to Default
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draft.trim());
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors"
            >
              Save Instructions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
