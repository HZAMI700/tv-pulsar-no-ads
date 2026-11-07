import React, { useState } from 'react';
import { Home, Trophy, Tv, Film, Bookmark, Settings, Send, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NavigationTab } from '../../types';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, setIsSettingsOpen } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems: Array<{ tab: NavigationTab; label: string; icon: React.ReactNode }> = [
    { tab: 'home', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { tab: 'sports', label: 'المباريات مباشر', icon: <Trophy className="w-5 h-5" /> },
    { tab: 'channels', label: 'القنوات الحية', icon: <Tv className="w-5 h-5" /> },
    { tab: 'movies', label: 'الأفلام والمسلسلات', icon: <Film className="w-5 h-5" /> },
    { tab: 'favorites', label: 'قائمتي', icon: <Bookmark className="w-5 h-5" /> },
  ];

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`hidden md:flex flex-col justify-between fixed top-0 bottom-0 right-0 z-40 bg-[#07080D]/90 backdrop-blur-2xl border-l border-white/8 transition-all duration-300 ease-out select-none ${
        isExpanded ? 'w-64 shadow-[0_0_40px_rgba(0,0,0,0.8)]' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-6 overflow-hidden">
        <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF1838] to-[#990014] flex items-center justify-center shadow-[0_0_20px_rgba(255,24,56,0.5)]">
          <Tv className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00E676] ring-2 ring-[#07080D]" />
        </div>
        {isExpanded && (
          <div className="flex flex-col truncate">
            <span className="text-lg font-black tracking-wider text-white">
              PULSAR<span className="text-[#FF1838]">TV</span>
            </span>
            <span className="text-[10px] text-white/50 tracking-widest font-mono">STREAMING CINEMA</span>
          </div>
        )}
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 space-y-1.5 py-4">
        {navItems.map((item) => {
          const isActive = currentTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setCurrentTab(item.tab)}
              className={`group relative flex items-center w-full gap-4 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF1838]/20 to-transparent text-white border-r-2 border-[#FF1838]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-[#FF1838]' : 'text-white/70'
                }`}
              >
                {item.icon}
              </span>
              {isExpanded && (
                <span className="truncate text-sm font-semibold tracking-wide">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Quick Links */}
      <div className="px-3 py-6 space-y-2 border-t border-white/8">
        {/* Telegram Direct Channel */}
        <a
          href="https://t.me/blackroner"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center w-full gap-4 px-3.5 py-2.5 rounded-xl font-medium text-[#00F2FE]/80 hover:text-white hover:bg-[#00F2FE]/10 transition-colors"
          title="قناة تيليجرام الرسمية"
        >
          <Send className="w-5 h-5 shrink-0 text-[#00F2FE] group-hover:scale-110 transition-transform" />
          {isExpanded && (
            <div className="truncate text-right">
              <span className="text-xs font-bold block text-white">قناة تيليجرام</span>
              <span className="text-[10px] text-white/50 block">@blackroner</span>
            </div>
          )}
        </a>

        {/* Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="group relative flex items-center w-full gap-4 px-3.5 py-2.5 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Settings className="w-5 h-5 shrink-0 group-hover:rotate-45 transition-transform" />
          {isExpanded && <span className="truncate text-xs font-medium">الإعدادات</span>}
        </button>
      </div>
    </aside>
  );
};
