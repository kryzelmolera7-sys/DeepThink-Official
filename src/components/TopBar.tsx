import { Download, PanelLeft, SlidersHorizontal } from 'lucide-react';

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  threadTitle: string;
  hasCustomSystemPrompt: boolean;
  onOpenSystemPrompt: () => void;
  onExportMarkdown: () => void;
  canExport: boolean;
}

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
  threadTitle,
  hasCustomSystemPrompt,
  onOpenSystemPrompt,
  onExportMarkdown,
  canExport,
}: TopBarProps) {
  return (
    <header className="h-14 shrink-0 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#0B0F17]/95 flex items-center justify-between gap-6">
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
          <span className="font-display font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
            DeepThink 1
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            /
          </span>
          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-[360px]">
            {threadTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSystemPrompt}
          className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            hasCustomSystemPrompt
              ? 'border-blue-600/40 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span>System Prompt</span>
        </button>

        <button
          type="button"
          onClick={onExportMarkdown}
          disabled={!canExport}
          className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
}
