import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { AppShell } from './features/layout/AppShell';
import { HomePage } from './features/home/HomePage';
import { SportsPage } from './features/sports/SportsPage';
import { ChannelsPage } from './features/channels/ChannelsPage';
import { DiscoverPage } from './features/discover/DiscoverPage';
import { FavoritesPage } from './features/favorites/FavoritesPage';
import { DownloadsPage } from './features/downloads/DownloadsPage';
import { LibraryPage } from './features/library/LibraryPage';
import { DownloadPage } from './features/download/DownloadPage';
import { ScoresPage } from './features/scores/ScoresPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { UniversalPlayer } from './features/player/UniversalPlayer';
import { MovieDetailModal } from './features/discover/MovieDetailModal';
import { SeriesDetailModal } from './features/discover/SeriesDetailModal';
import { SearchModal } from './features/modals/SearchModal';
import { TelegramModal } from './features/modals/TelegramModal';
import { SettingsModal } from './features/modals/SettingsModal';
import { ErrorBoundary } from './design-system/components/ErrorBoundary';
import { isNativeApp } from './utils/platform';

export const App: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    activeMedia,
    closePlayer,
    activeDetail,
    closeDetail,
    setActiveMedia,
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
      // Note: activeDetail is preserved so the user returns to the Movie or Series Detail page!
      if (activeMedia) {
        closePlayer();
        try {
          if ((window as any).PulsarApp?.setOrientation) {
            (window as any).PulsarApp.setOrientation('portrait');
          }
        } catch (_) {}
        return true;
      }

      // 2. If movie or series detail page is open, close detail page and return to previous tab
      if (activeDetail) {
        closeDetail();
        return true;
      }

      // 3. If search / settings / telegram modal is open, close it
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

      // 4. If any legacy modal close button exists
      const modalCloseBtn = document.querySelector('[data-modal-close="true"]') as HTMLButtonElement | null;
      if (modalCloseBtn) {
        modalCloseBtn.click();
        return true;
      }

      // 5. If on another tab (sports, channels, movies, favorites, downloads), return to home tab
      if (currentTab !== 'home') {
        setCurrentTab('home');
        return true;
      }

      // 6. Root screen: let Android handle double-tap exit
      return false;
    };

    return () => {
      delete (window as any).handleAppBackPress;
    };
  }, [
    activeMedia,
    closePlayer,
    activeDetail,
    closeDetail,
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
      <ErrorBoundary key={currentTab} fallbackTitle="Failed to load page">
        <div className="motion-page min-h-[calc(100vh-130px)]">
          {currentTab === 'home' && <HomePage />}
          {currentTab === 'sports' && <SportsPage />}
          {currentTab === 'channels' && <ChannelsPage />}
          {currentTab === 'movies' && <DiscoverPage />}
          {currentTab === 'discover' && <DiscoverPage />}
          {currentTab === 'download' && <ScoresPage />}
          {currentTab === 'scores' && <ScoresPage />}
          {currentTab === 'settings' && <SettingsPage />}
          {currentTab === 'downloads' && (isNativeApp() ? <DownloadsPage /> : <HomePage />)}
          {(currentTab === 'library' || currentTab === 'favorites') && (
            isNativeApp() ? <DownloadsPage /> : <FavoritesPage />
          )}
        </div>
      </ErrorBoundary>

      {/* Universal Player Overlay (HLS + VidLink + StreamFree) */}
      {activeMedia && (
        <UniversalPlayer media={activeMedia} onClose={closePlayer} />
      )}

      {/* Central Movie Detail Screen */}
      {activeDetail?.type === 'movie' && activeDetail.movie && (
        <MovieDetailModal
          movie={activeDetail.movie}
          onClose={closeDetail}
          onPlay={(media) => setActiveMedia(media)}
        />
      )}

      {/* Central Series Detail Screen with Season Context */}
      {activeDetail?.type === 'tv' && activeDetail.series && (
        <SeriesDetailModal
          series={activeDetail.series}
          initialSeason={activeDetail.selectedSeason || 1}
          onClose={closeDetail}
          onPlay={(media) => setActiveMedia(media)}
        />
      )}

      {/* Modals & Dialogs */}
      <SearchModal />
      <TelegramModal />
      <SettingsModal />
    </AppShell>
  );
};

export default App;
