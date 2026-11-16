import React, { useState } from 'react';
import { Home, Trophy, Tv, Film, FolderHeart, Settings, Send, Download, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NavigationTab } from '../../types';
import { isNativeApp } from '../../utils/platform';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, setIsSettingsOpen } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const isNative = isNativeApp();

  const navItems: Array<{
    tab: NavigationTab;
    label: string;
    icon: React.ReactNode;
    isCurrent: boolean;
  }> = [
    {
      tab: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      isCurrent: currentTab === 'home',
    },
    {
      tab: 'sports',
      label: 'Matches',
      icon: <Trophy className="w-5 h-5" />,
      isCurrent: currentTab === 'sports',
    },
    {
      tab: 'channels',
      label: 'Channels',
      icon: <Tv className="w-5 h-5" />,
      isCurrent: currentTab === 'channels',
    },
    {
      tab: 'scores',
      label: 'Scores & Analytics',
      icon: <Activity className="w-5 h-5 text-[#E50914]" />,
      isCurrent: currentTab === 'scores' || currentTab === 'download',
    },
    {
      tab: 'movies',
      label: 'Movies & TV',
      icon: <Film className="w-5 h-5" />,
      isCurrent: currentTab === 'movies' || currentTab === 'discover',
    },
    ...(isNative
      ? [
          {
            tab: 'library' as NavigationTab,
            label: 'Downloads & Library',
            icon: <FolderHeart className="w-5 h-5" />,
            isCurrent:
              currentTab === 'library' ||
              currentTab === 'favorites' ||
              currentTab === 'downloads',
          },
        ]
      : []),
  ];

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`hidden md:flex flex-col justify-between fixed top-0 bottom-0 right-0 z-40 bg-[#000000]/95 backdrop-blur-2xl border-l border-[#232323] transition-all duration-300 ease-out select-none ${
        isExpanded ? 'w-64 shadow-[0_0_40px_rgba(0,0,0,0.9)]' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-6 overflow-hidden">
        <div className="relative shrink-0 w-10 h-10 rounded-xl bg-[#232323] border border-white/10 flex items-center justify-center shadow-md">
          <span className="text-lg font-black text-[#e50914]">P</span>
        </div>
        {isExpanded && (
          <div className="flex flex-col truncate">
            <span className="text-lg font-black tracking-wider text-white">
              <span className="text-[#e50914]">PULSAR</span> TV
            </span>
            <span className="text-[10px] text-white/50 tracking-widest font-mono">STREAMING & CINEMA</span>
          </div>
        )}
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 space-y-1.5 py-4">
        {navItems.map((item) => {
          const isActive = item.isCurrent;
          return (
            <button
              key={item.tab}
              onClick={() => setCurrentTab(item.tab)}
              className={`group relative flex items-center w-full gap-4 px-3.5 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#e50914]/20 text-[#e50914] border-r-2 border-[#e50914]'
                  : 'text-white/70 hover:text-white hover:bg-[#232323]'
              }`}
            >
              <span
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-[#e50914]' : 'text-white/70'
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
      <div className="px-3 py-6 space-y-2 border-t border-[#232323]">
        {/* Telegram Direct Channel */}
        <a
          href="https://t.me/blackroner"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center w-full gap-4 px-3.5 py-2.5 rounded-xl font-medium text-white/70 hover:text-white hover:bg-[#232323] transition-colors"
          title="Official Telegram Channel"
        >
          <Send className="w-5 h-5 shrink-0 text-[#e50914] group-hover:scale-110 transition-transform" />
          {isExpanded && (
            <div className="truncate text-left">
              <span className="text-xs font-bold block text-white">Telegram Community</span>
              <span className="text-[10px] text-white/50 block">@blackroner</span>
            </div>
          )}
        </a>

        {/* Settings */}
        <button
          onClick={() => setCurrentTab('settings')}
          className="group relative flex items-center w-full gap-4 px-3.5 py-2.5 rounded-xl font-medium text-white/70 hover:text-white hover:bg-[#232323] transition-colors cursor-pointer"
        >
          <Settings className="w-5 h-5 shrink-0 group-hover:rotate-45 transition-transform" />
          {isExpanded && <span className="truncate text-xs font-medium text-white">Settings</span>}
        </button>
      </div>
    </aside>
  );
};
