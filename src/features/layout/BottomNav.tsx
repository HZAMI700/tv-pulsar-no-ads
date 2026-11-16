import React from 'react';
import { Home, Trophy, Tv, Download, Settings, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDownloadStore } from '../../store/downloadStore';
import { NavigationTab } from '../../types';
import { isNativeApp } from '../../utils/platform';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, language } = useAppStore();
  const { tasks } = useDownloadStore();

  const isRTL = language === 'ar';
  const isNative = isNativeApp();
  const downloadCount = Object.keys(tasks || {}).length || 4;

  const navItems: Array<{
    tab: NavigationTab;
    label: string;
    labelAr: string;
    icon: (isActive: boolean) => React.ReactNode;
    badge?: number;
    isCurrent: boolean;
  }> = [
    {
      tab: 'home',
      label: 'Home',
      labelAr: 'الرئيسية',
      icon: (active) => <Home className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105' : ''}`} />,
      isCurrent: currentTab === 'home' || currentTab === 'discover',
    },
    {
      tab: 'channels',
      label: 'Channels',
      labelAr: 'القنوات',
      icon: (active) => <Tv className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105' : ''}`} />,
      isCurrent: currentTab === 'channels',
    },
    {
      tab: 'sports',
      label: 'Matches',
      labelAr: 'المباريات',
      icon: (active) => <Trophy className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105' : ''}`} />,
      isCurrent: currentTab === 'sports',
    },
    ...(isNative
      ? [
          {
            tab: 'downloads' as NavigationTab,
            label: 'Downloads',
            labelAr: 'التنزيلات',
            icon: (active: boolean) => (
              <Download
                className={`w-5 h-5 transition-transform duration-200 ${
                  active ? 'scale-105' : ''
                }`}
              />
            ),
            badge: downloadCount,
            isCurrent: currentTab === 'downloads' || currentTab === 'library',
          },
        ]
      : [
          {
            tab: 'scores' as NavigationTab,
            label: 'Scores',
            labelAr: 'النتائج',
            icon: (active: boolean) => (
              <Activity
                className={`w-5 h-5 transition-transform duration-200 ${
                  active ? 'scale-105 text-[#E50914]' : ''
                }`}
              />
            ),
            isCurrent: currentTab === 'scores' || currentTab === 'download',
          },
        ]),
    {
      tab: 'settings',
      label: 'Settings',
      labelAr: 'الإعدادات',
      icon: (active) => <Settings className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-105 rotate-45 text-[#E50914]' : ''}`} />,
      isCurrent: currentTab === 'settings',
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0B0B0B]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] flex items-center justify-around z-40 select-none">
      {navItems.map((item) => {
        const isActive = item.isCurrent;
        return (
          <button
            key={item.tab}
            onClick={() => setCurrentTab(item.tab)}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors duration-150 cursor-pointer ${
              isActive ? 'text-[#E50914]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <div className="relative">
              {item.icon(isActive)}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#E50914] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {item.badge}
                </span>
              )}
            </div>

            <span
              className={`text-[10px] mt-1 tracking-tight truncate max-w-[72px] ${
                isActive ? 'font-bold text-[#E50914]' : 'font-medium text-neutral-400'
              }`}
            >
              {isRTL ? item.labelAr : item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
