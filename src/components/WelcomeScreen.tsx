import { ArrowUpRight } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { STARTER_PROMPTS } from '../shared/models';
import type { StarterPrompt } from '../types/chat';

interface WelcomeScreenProps {
  onSelectStarter: (starter: StarterPrompt) => void;
}

export function WelcomeScreen({ onSelectStarter }: WelcomeScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <BrandMark className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
            DeepThink 1 Universal Workspace
          </h1>
          <p className="text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-balance">
            Multi-step reasoning with inspectable thought traces, code synthesis,
            multimodal file analysis, and live web-grounded research.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {STARTER_PROMPTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStarter(item)}
              className="group text-left p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-blue-600/50 dark:hover:border-blue-500/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {item.category}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
              <div className="font-display text-[15px] font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {item.title}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                {item.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
