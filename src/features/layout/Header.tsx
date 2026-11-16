import React from 'react';
import { Search, Globe, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../utils/translations';
import { NavigationTab } from '../../types';

export const Header: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    setIsSearchOpen,
    language,
    setLanguage,
  } = useAppStore();

  const isRTL = language === 'ar';

  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
  };

  const navItems: Array<{ tab: NavigationTab; label: string }> = [
    { tab: 'home', label: t('home', language) },
    { tab: 'sports', label: t('matches', language) },
    { tab: 'scores', label: t('scores', language) },
    { tab: 'settings', label: t('settings', language) },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080808] transition-all select-none pt-[max(1rem,env(safe-area-inset-top,1rem))] sm:pt-4 pb-2.5">
      <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 sm:px-6 md:px-8">
        {/* Left: PULSAR Wordmark */}
        <div
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-2 cursor-pointer active:scale-98 transition-transform"
        >
          <span className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#E50914] font-sans">
            PULSAR
          </span>
        </div>

        {/* Center / Navigation Row */}
        <nav aria-label="Primary" className="order-3 w-full min-w-0 md:order-none md:w-auto md:flex-1 md:ml-6">
          <ul className="flex items-center gap-5 overflow-x-auto no-scrollbar md:gap-7">
            {navItems.map((item) => {
              const active =
                currentTab === item.tab ||
                (item.tab === 'sports' && currentTab === 'sports') ||
                (item.tab === 'home' && (currentTab === 'home' || currentTab === 'discover' || currentTab === 'movies'));

              return (
                <li key={item.tab} className="shrink-0">
                  <button
                    onClick={() => setCurrentTab(item.tab)}
                    className={`block py-1 text-sm md:text-[15px] font-semibold transition-all cursor-pointer relative ${
                      active
                        ? 'text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#E50914]'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Actions: Visible on mobile only */}
        <div className="flex md:hidden items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1C1C1E] border border-white/10 text-white/90 hover:text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-[#E50914]" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Search"
            title={t('search', language)}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
