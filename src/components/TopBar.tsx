import { useState } from 'react';
import {
  ChevronDown,
  Download,
  FileCode,
  FileText,
  PanelLeft,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import type { EngineRoute } from '../types/chat';

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  threadTitle: string;
  hasCustomSystemPrompt: boolean;
  engineRoute?: EngineRoute;
  onOpenSystemPrompt: () => void;
  onOpenCapabilities: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  canExport: boolean;
}

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
  threadTitle,
  hasCustomSystemPrompt,
  engineRoute,
  onOpenSystemPrompt,
  onOpenCapabilities,
  onExportMarkdown,
  onExportJson,
  canExport,
}: TopBarProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <header className="h-14 shrink-0 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#090D16]/95 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="min-h-[38px] min-w-[38px] p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span className="font-display font-semibold text-slate-900 dark:text-slate-100">
              DeepThink
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
              v1.5
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            /
          </span>
          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[160px] sm:max-w-[280px]">
            {threadTitle}
          </span>
          {engineRoute === 'swarm' && (
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800/80 whitespace-nowrap">
              <span>🐝</span> Swarm Active
            </span>
          )}
          {engineRoute === 'security-swarm' && (
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80 whitespace-nowrap">
              <span>🛡️</span> Security Swarm
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenCapabilities}
          className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="hidden sm:inline">Capabilities</span>
        </button>

        <button
          type="button"
          onClick={onOpenSystemPrompt}
          className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            hasCustomSystemPrompt
              ? 'border-blue-600/40 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">System Prompt</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            disabled={!canExport}
            aria-expanded={exportOpen}
            aria-haspopup="menu"
            className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {exportOpen && canExport && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl p-1 z-30 space-y-0.5"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportOpen(false);
                  onExportMarkdown();
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Markdown (.md)</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportOpen(false);
                  onExportJson();
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                <span>JSON (.json)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
