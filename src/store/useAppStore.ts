import { create } from 'zustand';
import { ActiveMedia, NavigationTab, WatchHistoryItem, EpisodeWatchProgress } from '../types';

interface AppState {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;

  activeMedia: ActiveMedia | null;
  setActiveMedia: (media: ActiveMedia | null) => void;
  closePlayer: () => void;

  heroMedia: ActiveMedia | null;
  setHeroMedia: (media: ActiveMedia | null) => void;

  noSpoilerMode: boolean;
  toggleNoSpoiler: () => void;

  // Favorites (المفضلة)
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  // Watch Later (المشاهدة لاحقاً)
  watchLater: string[];
  toggleWatchLater: (id: string) => void;
  isWatchLater: (id: string) => boolean;

  // Watch History (سجل المشاهدة ومتابعة العرض)
  watchHistory: WatchHistoryItem[];
  addToWatchHistory: (media: ActiveMedia, timestamp?: number, duration?: number) => void;
  updateWatchProgress: (
    mediaId: string,
    currentTime: number,
    duration: number,
    tvMeta?: ActiveMedia['tvMeta']
  ) => void;
  removeFromWatchHistory: (id: string) => void;
  clearWatchHistory: () => void;

  // Episode Watch Progress (حالات مشاهدة حلقات المسلسلات)
  episodeProgress: Record<string, EpisodeWatchProgress>;
  setEpisodeProgress: (
    showTmdbId: string,
    seasonNumber: number,
    episodeNumber: number,
    currentTime: number,
    duration: number,
    isCompleted?: boolean
  ) => void;
  getEpisodeProgress: (
    showTmdbId: string,
    seasonNumber: number,
    episodeNumber: number
  ) => EpisodeWatchProgress | null;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  isTelegramModalOpen: boolean;
  setIsTelegramModalOpen: (open: boolean) => void;

  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;

  hasPromptedTelegram: boolean;
  markTelegramPrompted: () => void;
}

const loadInitialLanguage = (): 'ar' | 'en' => {
  try {
    const saved = localStorage.getItem('pulsar_language');
    const lang = saved === 'en' ? 'en' : 'ar';
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    return lang;
  } catch {
    return 'ar';
  }
};

const loadInitialFavorites = (): string[] => {
  try {
    const raw = localStorage.getItem('pulsar_favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadInitialWatchLater = (): string[] => {
  try {
    const raw = localStorage.getItem('pulsar_watch_later');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadInitialHistory = (): WatchHistoryItem[] => {
  try {
    const raw = localStorage.getItem('pulsar_watch_history');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && (item.type === 'movie' || item.type === 'tv'));
  } catch {
    return [];
  }
};

const loadInitialEpisodeProgress = (): Record<string, EpisodeWatchProgress> => {
  try {
    const raw = localStorage.getItem('pulsar_episode_progress');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const loadInitialSpoilerMode = (): boolean => {
  try {
    return localStorage.getItem('pulsar_no_spoiler') === 'true';
  } catch {
    return false;
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  currentTab: 'home',
  setCurrentTab: (tab) => set({ currentTab: tab }),

  activeMedia: null,
  setActiveMedia: (media) => {
    if (media && (media.type === 'movie' || media.type === 'tv')) {
      get().addToWatchHistory(media);
    }
    set({ activeMedia: media });
  },
  closePlayer: () => set({ activeMedia: null }),

  heroMedia: null,
  setHeroMedia: (media) => set({ heroMedia: media }),

  noSpoilerMode: loadInitialSpoilerMode(),
  toggleNoSpoiler: () =>
    set((state) => {
      const next = !state.noSpoilerMode;
      try {
        localStorage.setItem('pulsar_no_spoiler', String(next));
      } catch {}
      return { noSpoilerMode: next };
    }),

  // Favorites
  favorites: loadInitialFavorites(),
  toggleFavorite: (id: string) =>
    set((state) => {
      const exists = state.favorites.includes(id);
      const nextFavorites = exists
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id];
      try {
        localStorage.setItem('pulsar_favorites', JSON.stringify(nextFavorites));
      } catch {}
      return { favorites: nextFavorites };
    }),
  isFavorite: (id: string) => get().favorites.includes(id),

  // Watch Later
  watchLater: loadInitialWatchLater(),
  toggleWatchLater: (id: string) =>
    set((state) => {
      const exists = state.watchLater.includes(id);
      const nextList = exists
        ? state.watchLater.filter((item) => item !== id)
        : [...state.watchLater, id];
      try {
        localStorage.setItem('pulsar_watch_later', JSON.stringify(nextList));
      } catch {}
      return { watchLater: nextList };
    }),
  isWatchLater: (id: string) => get().watchLater.includes(id),

  // Watch History (Strictly for Movies and Series only)
  watchHistory: loadInitialHistory(),
  addToWatchHistory: (media, timestamp = 0, duration = 0) =>
    set((state) => {
      if (media.type !== 'movie' && media.type !== 'tv') {
        return state;
      }
      const existing = state.watchHistory.filter((item) => item.id !== media.id);
      const newItem: WatchHistoryItem = {
        id: media.id,
        title: media.title,
        subtitle: media.subtitle,
        type: media.type,
        streamUrl: media.streamUrl,
        poster: media.poster,
        timestamp: timestamp || media.resumeTime || 0,
        duration: duration || media.totalDuration || 0,
        watchedAt: Date.now(),
        tvMeta: media.tvMeta,
      };
      const updated = [newItem, ...existing].slice(0, 40); // keep last 40 items
      try {
        localStorage.setItem('pulsar_watch_history', JSON.stringify(updated));
      } catch {}
      return { watchHistory: updated };
    }),
  updateWatchProgress: (mediaId, currentTime, duration, tvMeta) =>
    set((state) => {
      const cleanTargetId = mediaId.toString().replace(/^(?:vidapi-)?(?:movie|tv)-/, '').replace(/[^0-9]/g, '');

      // Find by exact ID or by numeric TMDB ID
      const index = state.watchHistory.findIndex((item) => {
        if (item.id === mediaId) return true;
        const cleanItemId = item.id.toString().replace(/^(?:vidapi-)?(?:movie|tv)-/, '').replace(/[^0-9]/g, '');
        return cleanTargetId && cleanItemId === cleanTargetId;
      });

      const formatMinSec = (sec: number) => {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };

      const existing = index !== -1 ? state.watchHistory[index] : null;
      const timeText = formatMinSec(currentTime);

      const updatedItem: WatchHistoryItem = {
        id: existing?.id || mediaId,
        title: existing?.title || tvMeta?.showTitle || 'متابعة المشاهدة',
        subtitle:
          tvMeta && tvMeta.season && tvMeta.episode
            ? `الموسم ${tvMeta.season} • ح ${tvMeta.episode} (${timeText})`
            : `استئناف (${timeText})`,
        type: tvMeta ? 'tv' : existing?.type || 'movie',
        streamUrl: existing?.streamUrl || '',
        poster: existing?.poster,
        timestamp: currentTime,
        duration: duration || existing?.duration || 0,
        watchedAt: Date.now(),
        tvMeta: tvMeta || existing?.tvMeta,
      };

      const remaining = state.watchHistory.filter((item) => {
        if (item.id === mediaId) return false;
        const cleanItemId = item.id.toString().replace(/^(?:vidapi-)?(?:movie|tv)-/, '').replace(/[^0-9]/g, '');
        return !(cleanTargetId && cleanItemId === cleanTargetId);
      });

      const nextHistory = [updatedItem, ...remaining].slice(0, 40);

      try {
        localStorage.setItem('pulsar_watch_history', JSON.stringify(nextHistory));
      } catch {}
      return { watchHistory: nextHistory };
    }),
  removeFromWatchHistory: (id: string) =>
    set((state) => {
      const filtered = state.watchHistory.filter((item) => item.id !== id);
      try {
        localStorage.setItem('pulsar_watch_history', JSON.stringify(filtered));
      } catch {}
      return { watchHistory: filtered };
    }),
  clearWatchHistory: () => {
    try {
      localStorage.removeItem('pulsar_watch_history');
    } catch {}
    set({ watchHistory: [] });
  },

  // Episode Watch Tracking (Progress indicators on Series Detail page)
  episodeProgress: loadInitialEpisodeProgress(),
  setEpisodeProgress: (showTmdbId, seasonNumber, episodeNumber, currentTime, duration, isCompleted = false) =>
    set((state) => {
      const cleanId = showTmdbId.toString().replace(/[^0-9]/g, '');
      const key = `${cleanId}_s${seasonNumber}_e${episodeNumber}`;
      const watched = isCompleted || (duration > 0 && currentTime / duration > 0.85);

      const nextProgress: EpisodeWatchProgress = {
        currentTime,
        duration,
        watched,
        updatedAt: Date.now(),
      };

      const updated = {
        ...state.episodeProgress,
        [key]: nextProgress,
      };

      try {
        localStorage.setItem('pulsar_episode_progress', JSON.stringify(updated));
      } catch {}
      return { episodeProgress: updated };
    }),
  getEpisodeProgress: (showTmdbId, seasonNumber, episodeNumber) => {
    const cleanId = showTmdbId.toString().replace(/[^0-9]/g, '');
    const key = `${cleanId}_s${seasonNumber}_e${episodeNumber}`;
    return get().episodeProgress[key] || null;
  },

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  isSearchOpen: false,
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),

  isTelegramModalOpen: false,
  setIsTelegramModalOpen: (open) => set({ isTelegramModalOpen: open }),

  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),

  language: loadInitialLanguage(),
  setLanguage: (lang: 'ar' | 'en') => {
    try {
      localStorage.setItem('pulsar_language', lang);
      if (typeof document !== 'undefined') {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      }
    } catch {}
    set({ language: lang });
  },

  hasPromptedTelegram: (() => {
    try {
      return localStorage.getItem('pulsar_tg_prompted') === 'true';
    } catch {
      return false;
    }
  })(),
  markTelegramPrompted: () => {
    try {
      localStorage.setItem('pulsar_tg_prompted', 'true');
    } catch {}
    set({ hasPromptedTelegram: true });
  },
}));
