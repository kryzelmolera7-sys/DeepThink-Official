import { ArrowUpRight } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { STARTER_PROMPTS } from '../shared/models';
import type { StarterPrompt } from '../types/chat';

interface WelcomeScreenProps {
  onSelectStarter: (starter: StarterPrompt) => void;
}

export function WelcomeScreen({ onSelectStarter }: WelcomeScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 flex flex-col items-center relative">
      <div className="w-full max-w-3xl space-y-6 my-auto py-4 relative">
        <div className="space-y-3.5 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
            <BrandMark className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-display text-2xl sm:text-[32px] font-semibold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
              DeepThink v1.5 Universal Workspace
            </h1>
          </div>
          <p className="text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-balance">
            Multi-agent consensus Swarm, Security Swarm web vulnerability auditor,
            Tree-of-Thought exploration, interactive code & artifact canvas, 7
            specialized domains, live web grounding, and voice interaction.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800/80">
              🐝 Multi-Agent Swarm
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80">
              🛡️ Security Swarm
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
              Tree-of-Thought
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
              Live Artifact Canvas
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
              Voice Dictation & Audio
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {STARTER_PROMPTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStarter(item)}
              className="group text-left p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 hover:border-blue-600/60 dark:hover:border-blue-500/60 hover:-translate-y-0.5 active:scale-[0.99] shadow-2xs dark:shadow-none transition-[transform,border-color,background-color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {item.category}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
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
