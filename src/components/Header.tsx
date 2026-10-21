import React from 'react';
import { Language, translations } from '../lib/i18n';
import { Cpu, Plus, Globe } from 'lucide-react';

interface HeaderProps {
  currentTab: 'workbench' | 'diagnostics' | 'training';
  setCurrentTab: (tab: 'workbench' | 'diagnostics' | 'training') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenNewTicket: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  onOpenNewTicket,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              {t.appName}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline whitespace-nowrap">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single line, whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80">
          <button
            type="button"
            onClick={() => setCurrentTab('workbench')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'workbench'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t.nav.workbench}
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('diagnostics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'diagnostics'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t.nav.diagnostics}
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('training')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'training'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t.nav.training}
          </button>
        </nav>

        {/* Zone 3: Actions (Language toggle + Primary action button) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            title="Switch Language / تغییر زبان"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono uppercase">{lang === 'fa' ? 'EN' : 'FA'}</span>
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenNewTicket}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.nav.newTicket}</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-900 px-4 py-2 bg-slate-950 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setCurrentTab('workbench')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
            currentTab === 'workbench' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400'
          }`}
        >
          {t.nav.workbench}
        </button>
        <button
          type="button"
          onClick={() => setCurrentTab('diagnostics')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
            currentTab === 'diagnostics' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400'
          }`}
        >
          {t.nav.diagnostics}
        </button>
        <button
          type="button"
          onClick={() => setCurrentTab('training')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
            currentTab === 'training' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400'
          }`}
        >
          {t.nav.training}
        </button>
      </div>
    </header>
  );
};
