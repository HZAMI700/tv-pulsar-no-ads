import React from 'react';
import { Home, Trophy, Tv, Film, FolderHeart, Settings, Send, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NavigationTab } from '../../types';
import { isNativeApp } from '../../utils/platform';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab } = useAppStore();
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
      icon: <Activity className="w-5 h-5" />,
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
      className="hidden md:flex flex-col justify-between sticky top-0 h-screen w-16 lg:w-[70px] shrink-0 z-40 bg-[#080808] border-r border-white/5 select-none py-4"
    >
      {/* Brand Header: P wordmark in squircle */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="w-10 h-10 rounded-2xl bg-[#18181A] border border-white/10 flex items-center justify-center shadow-md hover:border-[#E50914]/50 transition-all cursor-pointer group"
          title="TV Pulsar"
        >
          <span className="text-xl font-black text-[#E50914] group-hover:scale-105 transition-transform">
            P
          </span>
        </button>
      </div>

      {/* Main Navigation Column */}
      <nav className="flex flex-col items-center gap-2.5 py-4">
        {navItems.map((item) => {
          const isActive = item.isCurrent;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => setCurrentTab(item.tab)}
              title={item.label}
              className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#6B1117] border border-[#E50914]/50 text-white shadow-[0_0_15px_rgba(229,9,20,0.35)]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </nav>

      {/* Footer Controls: Telegram & Settings */}
      <div className="flex flex-col items-center gap-2.5 pt-2">
        {/* Telegram Direct Channel */}
        <a
          href="https://t.me/blackroner"
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 flex items-center justify-center rounded-2xl text-[#E50914] hover:bg-white/5 hover:scale-105 transition-all cursor-pointer"
          title="Official Telegram Channel @blackroner"
        >
          <Send className="w-5 h-5 -rotate-12" />
        </a>

        {/* Settings */}
        <button
          type="button"
          onClick={() => setCurrentTab('settings')}
          title="Settings"
          className="w-11 h-11 flex items-center justify-center rounded-2xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <Settings className="w-5 h-5 hover:rotate-45 transition-transform" />
        </button>
      </div>
    </aside>
  );
};
