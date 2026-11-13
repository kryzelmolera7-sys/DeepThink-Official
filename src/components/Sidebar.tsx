import {
  Cpu,
  Moon,
  Plus,
  Search,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import type { ChatThread } from '../types/chat';
import { filterThreads, groupThreadsByRecency } from '../utils/threadStorage';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  threads: ChatThread[];
  activeThreadId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  onOpenArchitecture: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Sidebar({
  isOpen,
  onCloseMobile,
  threads,
  activeThreadId,
  searchQuery,
  onSearchChange,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onOpenArchitecture,
  isDark,
  onToggleTheme,
}: SidebarProps) {
  const filtered = filterThreads(threads, searchQuery);
  const grouped = groupThreadsByRecency(filtered);

  const sidebarBody = (
    <aside
      aria-label="Workspace navigation"
      className="flex flex-col h-full w-[268px] shrink-0 bg-slate-100 dark:bg-[#0F1520] border-r border-slate-200 dark:border-slate-800/90 select-none shadow-xl md:shadow-none"
    >
      {/* Brand header */}
      <div className="flex items-center justify-between gap-3 px-4 h-14 border-b border-slate-200 dark:border-slate-800/90">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandMark className="w-6 h-6 shrink-0" />
          <span className="font-display text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap truncate">
            DeepThink 1
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary New Thread + Search */}
      <div className="p-3 space-y-2.5">
        <button
          type="button"
          onClick={() => {
            onNewThread();
            onCloseMobile();
          }}
          className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New Thread</span>
        </button>

        <div className="relative">
          <Search
            className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search threads..."
            aria-label="Search threads"
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 dark:focus:border-blue-500"
          />
        </div>
      </div>

      {/* Thread history list */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-4">
        {grouped.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {searchQuery.trim()
              ? 'No matching threads.'
              : 'No saved threads yet.'}
          </p>
        ) : (
          grouped.map((group) => (
            <div key={group.bucket}>
              <div className="px-2 pb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {group.bucket}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  return (
                    <li key={thread.id} className="group relative flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectThread(thread.id);
                          onCloseMobile();
                        }}
                        className={`w-full text-left pl-2.5 pr-8 py-2 rounded-lg text-[13px] transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isActive
                            ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-50 font-medium border border-slate-200/90 dark:border-slate-700/80'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <span className="block truncate">{thread.title}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(thread.id);
                        }}
                        aria-label={`Delete thread '${thread.title}'`}
                        className="absolute right-1.5 p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Bottom workspace utilities */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/90 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenArchitecture}
          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Cpu className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
          <span>Architecture</span>
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop persistent sidebar when open */}
      {isOpen && <div className="hidden md:flex h-full">{sidebarBody}</div>}

      {/* Mobile slide-over drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarBody}</div>
        </div>
      )}
    </>
  );
}
