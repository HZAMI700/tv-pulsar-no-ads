import React from 'react';
import { Search, Send, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const Header: React.FC = () => {
  const {
    currentTab,
    setIsSearchOpen,
    setIsSettingsOpen,
  } = useAppStore();

  return (
    <header className="sticky top-0 z-30 w-full px-4 md:px-8 py-3.5 bg-gradient-to-b from-[#07080D]/98 via-[#07080D]/90 to-transparent backdrop-blur-md flex items-center justify-between border-b border-white/5 transition-all select-none">
      {/* Right side in RTL: Brand Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 cursor-pointer">
          <span className="text-xl md:text-2xl font-black tracking-tight text-white font-sans">
            TV<span className="text-[#FF1838]">Pulsar</span>
          </span>
        </div>
      </div>

      {/* Middle: Search Pill (Hidden when on Movies & Series tab, as it has its own dedicated search bar) */}
      {currentTab !== 'movies' ? (
        <div className="flex-1 max-w-md mx-2.5 transition-all duration-200">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between w-full h-10 px-3.5 rounded-2xl bg-[#12131D] border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-all cursor-pointer shadow-inner active:scale-98"
          >
            <span className="text-xs truncate">.. ابحث عن مباراة أو قناة</span>
            <Search className="w-4 h-4 text-white/50 shrink-0" />
          </button>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Left side in RTL: Telegram Glow Button + Settings Squircle */}
      <div className="flex items-center gap-2">
        {/* Telegram Channel Button with vivid cyan glow */}
        <a
          href="https://t.me/blackroner"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-[#00F2FE] hover:bg-blue-600/30 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center shadow-[0_0_15px_rgba(0,180,255,0.4)]"
          title="قناتنا على تيليجرام @blackroner"
        >
          <Send className="w-4 h-4 text-[#00F2FE]" />
        </a>

        {/* Settings Squircle Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#12131D] border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
