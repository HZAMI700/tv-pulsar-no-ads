import React from 'react';
import { Home, Trophy, Tv, Film, Bookmark } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NavigationTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab } = useAppStore();

  const navItems: Array<{ tab: NavigationTab; label: string; icon: React.ReactNode }> = [
    { tab: 'home', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { tab: 'sports', label: 'المباريات', icon: <Trophy className="w-5 h-5" /> },
    { tab: 'channels', label: 'القنوات', icon: <Tv className="w-5 h-5" /> },
    { tab: 'movies', label: 'أفلام ومسلسلات', icon: <Film className="w-5 h-5" /> },
    { tab: 'favorites', label: 'قائمتي', icon: <Bookmark className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] left-3.5 right-3.5 z-40">
      <div className="relative flex items-center justify-around py-2 px-3 bg-[#0E1018]/95 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.95)]">
        {navItems.map((item) => {
          const isActive = currentTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setCurrentTab(item.tab)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer select-none motion-press ${
                isActive ? 'text-[#FF1838]' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {/* Active Glowing Red Indicator Bar with smooth spring */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 rounded-full bg-[#FF1838] shadow-[0_0_14px_#FF1838] transition-all duration-300" />
              )}
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,24,56,0.6)]' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-[62px] ${isActive ? 'font-bold text-[#FF1838]' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
