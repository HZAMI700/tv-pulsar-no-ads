import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { AppShell } from './features/layout/AppShell';
import { HomePage } from './features/home/HomePage';
import { SportsPage } from './features/sports/SportsPage';
import { ChannelsPage } from './features/channels/ChannelsPage';
import { DiscoverPage } from './features/discover/DiscoverPage';
import { FavoritesPage } from './features/favorites/FavoritesPage';
import { UniversalPlayer } from './features/player/UniversalPlayer';
import { SearchModal } from './features/modals/SearchModal';
import { TelegramModal } from './features/modals/TelegramModal';
import { SettingsModal } from './features/modals/SettingsModal';
import { ErrorBoundary } from './design-system/components/ErrorBoundary';

export const App: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    activeMedia,
    closePlayer,
    isSearchOpen,
    setIsSearchOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isTelegramModalOpen,
    setIsTelegramModalOpen,
    hasPromptedTelegram,
  } = useAppStore();

  // Android System Back Button Handler Bridge
  useEffect(() => {
    (window as any).handleAppBackPress = () => {
      // 1. If player is open, close player and restore orientation
      if (activeMedia) {
        closePlayer();
        try {
          if ((window as any).PulsarApp?.setOrientation) {
            (window as any).PulsarApp.setOrientation('portrait');
          }
        } catch (_) {}
        return true;
      }

      // 2. If search / settings / telegram modal is open, close it
      if (isSearchOpen) {
        setIsSearchOpen(false);
        return true;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return true;
      }
      if (isTelegramModalOpen) {
        setIsTelegramModalOpen(false);
        return true;
      }

      // 3. If any movie or series detail modal is open
      const modalCloseBtn = document.querySelector('[data-modal-close="true"]') as HTMLButtonElement | null;
      if (modalCloseBtn) {
        modalCloseBtn.click();
        return true;
      }

      // 4. If on another tab (sports, channels, movies, favorites), return to home tab
      if (currentTab !== 'home') {
        setCurrentTab('home');
        return true;
      }

      // 5. Root screen: let Android handle double-tap exit
      return false;
    };

    return () => {
      delete (window as any).handleAppBackPress;
    };
  }, [
    activeMedia,
    closePlayer,
    isSearchOpen,
    setIsSearchOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isTelegramModalOpen,
    setIsTelegramModalOpen,
    currentTab,
    setCurrentTab,
  ]);

  // First-time visit: prompt user to subscribe to Telegram channel @blackroner
  useEffect(() => {
    if (!hasPromptedTelegram) {
      const timer = window.setTimeout(() => {
        setIsTelegramModalOpen(true);
      }, 1600);
      return () => window.clearTimeout(timer);
    }
  }, [hasPromptedTelegram, setIsTelegramModalOpen]);

  // Always reset scroll to the very top whenever the navigation tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [currentTab]);

  return (
    <AppShell>
      {/* Tab Switcher with Unified Motion System & Error Resilience */}
      <ErrorBoundary fallbackTitle="Failed to load page">
        <div key={currentTab} className="motion-page min-h-[calc(100vh-130px)]">
          {currentTab === 'home' && <HomePage />}
          {currentTab === 'sports' && <SportsPage />}
          {currentTab === 'channels' && <ChannelsPage />}
          {currentTab === 'movies' && <DiscoverPage />}
          {currentTab === 'favorites' && <FavoritesPage />}
        </div>
      </ErrorBoundary>

      {/* Universal Player Overlay (HLS + VidLink + StreamFree) */}
      {activeMedia && (
        <UniversalPlayer media={activeMedia} onClose={closePlayer} />
      )}

      {/* Modals & Dialogs */}
      <SearchModal />
      <TelegramModal />
      <SettingsModal />
    </AppShell>
  );
};

export default App;
