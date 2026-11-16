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
    <header className="sticky top-0 z-50 w-full bg-[#000000] border-b border-[#232323] transition-all select-none pt-[max(3.25rem,env(safe-area-inset-top,3.25rem))] sm:pt-4 pb-2.5">
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 md:px-9">
        {/* Left: PULSAR Wordmark */}
        <div
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-2 cursor-pointer active:scale-98 transition-transform"
        >
          <span className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#E50914] font-sans">
            PULSAR
          </span>
        </div>

        {/* Center / Navigation Row (Horizontal scrollable on mobile, inline on desktop) */}
        <nav aria-label="Primary" className="order-3 w-full min-w-0 md:order-none md:w-auto md:flex-1 md:ml-8">
          <ul className="flex items-center gap-4 overflow-x-auto no-scrollbar md:gap-6">
            {navItems.map((item) => {
              const active =
                currentTab === item.tab ||
                (item.tab === 'sports' && currentTab === 'sports') ||
                (item.tab === 'home' && (currentTab === 'home' || currentTab === 'discover' || currentTab === 'movies'));

              return (
                <li key={item.tab} className="shrink-0">
                  <button
                    onClick={() => setCurrentTab(item.tab)}
                    className={`block border-b-2 py-1 text-sm md:text-base transition-all cursor-pointer ${
                      active
                        ? 'border-[#E50914] font-bold text-white'
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Actions: Language Switcher and Search */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#232323] border border-white/10 text-white/90 hover:text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-[#E50914]" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 rounded-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
