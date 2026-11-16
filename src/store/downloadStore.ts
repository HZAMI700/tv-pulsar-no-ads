import { create } from 'zustand';
import { DownloadTask, VidApiMovie, VidApiTvShow } from '../types';
import { downloadService } from '../services/downloadService';

interface DownloadState {
  tasks: Record<string, DownloadTask>;
  isHydrated: boolean;
  freeStorageBytes: number;

  // Actions
  upsertTask: (task: DownloadTask) => void;
  removeTask: (downloadId: string) => void;
  hydrateFromNative: () => Promise<void>;

  startMovieDownload: (
    movie: VidApiMovie,
    quality?: string,
    subtitleUrl?: string,
    subtitleLanguage?: string,
    subtitleLanguages?: string[],
    subtitleUrls?: Record<string, string>
  ) => Promise<string>;
  startEpisodeDownload: (
    series: VidApiTvShow,
    season: number,
    episode: number,
    quality?: string,
    episodeTitle?: string,
    subtitleUrl?: string,
    subtitleLanguage?: string,
    subtitleLanguages?: string[],
    subtitleUrls?: Record<string, string>
  ) => Promise<string>;
  bulkDownloadEpisodes: (
    series: VidApiTvShow,
    season: number,
    episodeNumbers: number[],
    quality?: string,
    subtitleUrl?: string,
    subtitleLanguage?: string,
    subtitleLanguages?: string[],
    subtitleUrls?: Record<string, string>
  ) => Promise<string[]>;
  downloadEntireSeason: (
    series: VidApiTvShow,
    season: number,
    episodeCount: number,
    quality?: string
  ) => Promise<string[]>;

  pauseTask: (downloadId: string) => void;
  resumeTask: (downloadId: string) => void;
  cancelTask: (downloadId: string) => void;
  deleteTask: (downloadId: string, deleteFile?: boolean) => void;

  getTaskByMedia: (mediaId: string, season?: number, episode?: number) => DownloadTask | undefined;
  hasCompletedDownload: (mediaId: string, season?: number, episode?: number) => boolean;
  getPlayableOfflineUri: (mediaId: string, season?: number, episode?: number) => string | undefined;
  saveToGallery: (downloadId: string) => Promise<{ success: boolean; path?: string; error?: string }>;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  tasks: {},
  isHydrated: false,
  freeStorageBytes: 10 * 1024 * 1024 * 1024,

  upsertTask: (task) => {
    set((state) => {
      const prev = state.tasks[task.downloadId];

      let subUrl = task.subtitleUrl || prev?.subtitleUrl;
      let subLang = task.subtitleLanguage || prev?.subtitleLanguage;
      if (!subUrl && typeof localStorage !== 'undefined') {
        try {
          const cached = localStorage.getItem(`pulsar_sub_${task.downloadId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            subUrl = parsed.url;
            subLang = parsed.lang;
          }
        } catch (_) {}
      }

      const merged: DownloadTask = {
        ...(prev || {}),
        ...task,
        title: task.title || prev?.title || '',
        posterUrl: task.posterUrl || prev?.posterUrl,
        mediaType: task.mediaType || prev?.mediaType || 'movie',
        quality: task.quality || prev?.quality || '1080p',
        subtitleUrl: subUrl,
        subtitleLanguage: subLang,
        updatedAt: Date.now(),
      };
      return {
        tasks: {
          ...state.tasks,
          [task.downloadId]: merged,
        },
      };
    });
  },

  removeTask: (downloadId) => {
    set((state) => {
      const next = { ...state.tasks };
      delete next[downloadId];
      return { tasks: next };
    });
  },

  hydrateFromNative: async () => {
    try {
      const [downloads, freeBytes] = await Promise.all([
        downloadService.getAllDownloads(),
        downloadService.getAvailableStorageBytes(),
      ]);

      const map: Record<string, DownloadTask> = {};
      downloads.forEach((t) => {
        map[t.downloadId] = t;
      });

      set({
        tasks: map,
        isHydrated: true,
        freeStorageBytes: freeBytes,
      });
    } catch (e) {
      console.warn('[useDownloadStore] Failed to hydrate native downloads', e);
      set({ isHydrated: true });
    }
  },

  startMovieDownload: async (
    movie,
    quality = '1080p',
    subtitleUrl,
    subtitleLanguage,
    subtitleLanguages,
    subtitleUrls
  ) => {
    const mediaId = `movie-${movie.tmdb_id}`;
    const existing = get().getTaskByMedia(mediaId);

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return existing.downloadId;
      }
      if (existing.status === 'DOWNLOADING' || existing.status === 'QUEUED') {
        return existing.downloadId;
      }
      if (existing.status === 'PAUSED') {
        get().resumeTask(existing.downloadId);
        return existing.downloadId;
      }
    }

    const downloadId = await downloadService.startMovieDownload(movie, quality);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          `pulsar_sub_${downloadId}`,
          JSON.stringify({
            url: subtitleUrl,
            lang: subtitleLanguage || 'ar',
            languages: subtitleLanguages || (subtitleLanguage ? [subtitleLanguage] : ['ar']),
            urls: subtitleUrls || (subtitleUrl ? { [subtitleLanguage || 'ar']: subtitleUrl } : {}),
          })
        );
      } catch (_) {}
    }

    get().upsertTask({
      downloadId,
      mediaId,
      mediaType: 'movie',
      title: movie.title,
      quality,
      status: 'QUEUED',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      posterUrl: movie.poster_url,
      subtitleUrl,
      subtitleLanguage,
      subtitleLanguages: subtitleLanguages || (subtitleLanguage ? [subtitleLanguage] : ['ar']),
      subtitleUrls: subtitleUrls || (subtitleUrl ? { [subtitleLanguage || 'ar']: subtitleUrl } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return downloadId;
  },

  startEpisodeDownload: async (
    series,
    season,
    episode,
    quality = '1080p',
    episodeTitle,
    subtitleUrl,
    subtitleLanguage,
    subtitleLanguages,
    subtitleUrls
  ) => {
    const mediaId = `tv-${series.tmdb_id}`;
    const existing = get().getTaskByMedia(mediaId, season, episode);

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return existing.downloadId;
      }
      if (existing.status === 'DOWNLOADING' || existing.status === 'QUEUED') {
        return existing.downloadId;
      }
      if (existing.status === 'PAUSED') {
        get().resumeTask(existing.downloadId);
        return existing.downloadId;
      }
    }

    const downloadId = await downloadService.startEpisodeDownload(series, season, episode, quality, episodeTitle);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          `pulsar_sub_${downloadId}`,
          JSON.stringify({
            url: subtitleUrl,
            lang: subtitleLanguage || 'ar',
            languages: subtitleLanguages || (subtitleLanguage ? [subtitleLanguage] : ['ar']),
            urls: subtitleUrls || (subtitleUrl ? { [subtitleLanguage || 'ar']: subtitleUrl } : {}),
          })
        );
      } catch (_) {}
    }

    get().upsertTask({
      downloadId,
      mediaId,
      seriesId: mediaId,
      seriesTitle: series.title,
      mediaType: 'episode',
      title: `${series.title} • S${season} E${episode}`,
      season,
      episode,
      quality,
      status: 'QUEUED',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      posterUrl: series.poster_url,
      subtitleUrl,
      subtitleLanguage,
      subtitleLanguages: subtitleLanguages || (subtitleLanguage ? [subtitleLanguage] : ['ar']),
      subtitleUrls: subtitleUrls || (subtitleUrl ? { [subtitleLanguage || 'ar']: subtitleUrl } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return downloadId;
  },

  bulkDownloadEpisodes: async (
    series,
    season,
    episodeNumbers,
    quality = '1080p',
    subtitleUrl,
    subtitleLanguage,
    subtitleLanguages,
    subtitleUrls
  ) => {
    const downloadIds: string[] = [];
    for (const ep of episodeNumbers) {
      try {
        const id = await get().startEpisodeDownload(
          series,
          season,
          ep,
          quality,
          `Episode ${ep}`,
          subtitleUrl,
          subtitleLanguage,
          subtitleLanguages,
          subtitleUrls
        );
        downloadIds.push(id);
      } catch (err) {
        console.warn(`Failed to queue S${season}E${ep}`, err);
      }
    }
    return downloadIds;
  },

  downloadEntireSeason: async (series, season, episodeCount, quality = '1080p') => {
    const downloadIds: string[] = [];
    for (let ep = 1; ep <= episodeCount; ep++) {
      try {
        const id = await get().startEpisodeDownload(series, season, ep, quality, `Episode ${ep}`);
        downloadIds.push(id);
      } catch (err) {
        console.warn(`Failed to queue S${season}E${ep}`, err);
      }
    }
    return downloadIds;
  },

  pauseTask: (downloadId) => {
    downloadService.pause(downloadId);
    set((state) => {
      const task = state.tasks[downloadId];
      if (!task) return state;
      return {
        tasks: {
          ...state.tasks,
          [downloadId]: { ...task, status: 'PAUSED', updatedAt: Date.now() },
        },
      };
    });
  },

  resumeTask: (downloadId) => {
    downloadService.resume(downloadId);
    set((state) => {
      const task = state.tasks[downloadId];
      if (!task) return state;
      return {
        tasks: {
          ...state.tasks,
          [downloadId]: { ...task, status: 'QUEUED', updatedAt: Date.now() },
        },
      };
    });
  },

  cancelTask: (downloadId) => {
    downloadService.cancel(downloadId);
    set((state) => {
      const task = state.tasks[downloadId];
      if (!task) return state;
      return {
        tasks: {
          ...state.tasks,
          [downloadId]: { ...task, status: 'CANCELED', updatedAt: Date.now() },
        },
      };
    });
  },

  deleteTask: (downloadId, deleteFile = true) => {
    downloadService.delete(downloadId, deleteFile);
    get().removeTask(downloadId);
  },

  getTaskByMedia: (mediaId, season, episode) => {
    const list = Object.values(get().tasks);
    const cleanTargetId = (mediaId || '').toString().replace(/^(?:movie|tv)-/, '').replace(/[^0-9]/g, '');
    return list.find((t) => {
      const cleanTaskId = (t.mediaId || '').toString().replace(/^(?:movie|tv)-/, '').replace(/[^0-9]/g, '');
      const isIdMatch = t.mediaId === mediaId || (cleanTargetId && cleanTargetId === cleanTaskId);
      if (!isIdMatch) return false;
      if (season !== undefined && t.season !== season) return false;
      if (episode !== undefined && t.episode !== episode) return false;
      return true;
    });
  },

  hasCompletedDownload: (mediaId, season, episode) => {
    const task = get().getTaskByMedia(mediaId, season, episode);
    return Boolean(task && task.status === 'COMPLETED' && (task.playableUri || task.filePath));
  },

  getPlayableOfflineUri: (mediaId, season, episode) => {
    const task = get().getTaskByMedia(mediaId, season, episode);
    if (task && task.status === 'COMPLETED') {
      return task.playableUri || (task.downloadId ? downloadService.getPlayableUri(task.downloadId) : undefined);
    }
    return undefined;
  },

  saveToGallery: async (downloadId) => {
    return downloadService.saveToGallery(downloadId);
  },
}));

// Initialize store listener for real-time progress updates from native Android
if (typeof window !== 'undefined') {
  downloadService.subscribe((task) => {
    if (task.status === 'DELETED') {
      useDownloadStore.getState().removeTask(task.downloadId);
    } else {
      useDownloadStore.getState().upsertTask(task);
    }
  });

  // Re-hydrate when native finishes loading downloads catalog
  window.__pulsarInitDownloads = (rawList: any) => {
    try {
      const list = typeof rawList === 'string' ? JSON.parse(rawList) : rawList;
      if (Array.isArray(list)) {
        list.forEach((item) => {
          useDownloadStore.getState().upsertTask(item);
        });
      }
    } catch (_) {}
  };

  // Initial hydration
  setTimeout(() => {
    useDownloadStore.getState().hydrateFromNative();
  }, 100);
}
