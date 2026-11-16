import React, { useState, useMemo, useEffect } from 'react';
import {
  HardDrive,
  List,
  LayoutGrid,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Film,
  Tv,
  CheckCircle2,
  Clock,
  MoreVertical,
  Bookmark,
  Heart,
  Share2,
  Folder,
  Layers,
  ArrowLeft,
  ArrowRight,
  Download,
  Smartphone,
} from 'lucide-react';
import { useDownloadStore } from '../../store/downloadStore';
import { useAppStore } from '../../store/useAppStore';
import { DownloadTask, VidApiMovie, VidApiTvShow, ChannelItem } from '../../types';
import { downloadService } from '../../services/downloadService';
import { OfflinePlayerModal } from '../downloads/OfflinePlayerModal';
import { channelsService } from '../../services/channelsApi';
import { tmdbService } from '../../services/tmdbApi';
import { ChannelCard } from '../channels/ChannelCard';
import { MediaCard } from '../discover/MediaCard';
import { t } from '../../utils/translations';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const kb = bytes / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  if (kb >= 1) return `${Math.round(kb)} KB`;
  return `${bytes} B`;
}

interface SeriesFolder {
  seriesKey: string;
  seriesId: string;
  seriesTitle: string;
  posterUrl?: string;
  tasks: DownloadTask[];
  totalBytes: number;
  isAllCompleted: boolean;
  hasActiveDownload: boolean;
}

interface LibraryPageProps {
  initialTab?: 'downloads' | 'mylist';
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ initialTab = 'downloads' }) => {
  const { currentTab, setCurrentTab, favorites = [], setActiveMedia, openMovieDetail, openSeriesDetail, language } = useAppStore();
  const { tasks, pauseTask, resumeTask, deleteTask, freeStorageBytes } = useDownloadStore();

  const isNativeApp = downloadService.isSupported();

  const [activeSegment, setActiveSegment] = useState<'downloads' | 'mylist'>(
    !isNativeApp || currentTab === 'favorites' ? 'mylist' : initialTab
  );
  const [selectedSeriesKey, setSelectedSeriesKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [offlinePlayingTask, setOfflinePlayingTask] = useState<DownloadTask | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const isRTL = language === 'ar';

  // Catalog for My List
  const [allChannels, setAllChannels] = useState<ChannelItem[]>([]);
  const [allMovies, setAllMovies] = useState<VidApiMovie[]>([]);
  const [allTv, setAllTv] = useState<VidApiTvShow[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const [channelsRes, moviesList, tvList] = await Promise.all([
          channelsService.getAllChannels().catch(() => []),
          tmdbService.getTrendingMovies().catch(() => []),
          tmdbService.getTrendingTvShows().catch(() => []),
        ]);
        if (!isMounted) return;
        setAllChannels(Array.isArray(channelsRes) ? channelsRes : []);
        setAllMovies(Array.isArray(moviesList) ? moviesList : []);
        setAllTv(Array.isArray(tvList) ? tvList : []);
      } catch (_) {}
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const allTasksList = useMemo(() => {
    return Object.values(tasks).sort((a, b) => a.downloadId.localeCompare(b.downloadId));
  }, [tasks]);

  const completedList = useMemo(() => {
    return allTasksList.filter((t) => t.status === 'COMPLETED');
  }, [allTasksList]);

  const totalDownloadedBytes = useMemo(() => {
    return completedList.reduce((acc, t) => acc + (t.totalBytes || t.downloadedBytes || 0), 0);
  }, [completedList]);

  const usedPercentage = useMemo(() => {
    const total = totalDownloadedBytes + freeStorageBytes;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(2, (totalDownloadedBytes / total) * 100));
  }, [totalDownloadedBytes, freeStorageBytes]);

  // Group TV episodes under Series Folders
  const { seriesFolders, standaloneMovies } = useMemo(() => {
    const folders: Record<string, SeriesFolder> = {};
    const movies: DownloadTask[] = [];

    allTasksList.forEach((task) => {
      const isSeriesEp =
        task.mediaType === 'episode' ||
        (task.season !== undefined && task.season !== null && task.season > 0);

      if (isSeriesEp) {
        const cleanTitle =
          task.seriesTitle ||
          (task.title ? task.title.split(' • ')[0].trim() : 'Series');
        const seriesKey = task.seriesId || cleanTitle.toLowerCase();

        if (!folders[seriesKey]) {
          folders[seriesKey] = {
            seriesKey,
            seriesId: task.seriesId || seriesKey,
            seriesTitle: cleanTitle,
            posterUrl: task.posterUrl,
            tasks: [],
            totalBytes: 0,
            isAllCompleted: true,
            hasActiveDownload: false,
          };
        }
        folders[seriesKey].tasks.push(task);
        folders[seriesKey].totalBytes += task.totalBytes || task.downloadedBytes || 0;
        if (task.status !== 'COMPLETED') {
          folders[seriesKey].isAllCompleted = false;
        }
        if (task.status === 'DOWNLOADING' || task.status === 'QUEUED') {
          folders[seriesKey].hasActiveDownload = true;
        }
        if (!folders[seriesKey].posterUrl && task.posterUrl) {
          folders[seriesKey].posterUrl = task.posterUrl;
        }
      } else {
        movies.push(task);
      }
    });

    // Sort episodes in each series folder by season, then episode
    Object.values(folders).forEach((folder) => {
      folder.tasks.sort((a, b) => {
        if ((a.season || 0) !== (b.season || 0)) {
          return (a.season || 0) - (b.season || 0);
        }
        return (a.episode || 0) - (b.episode || 0);
      });
    });

    return { seriesFolders: Object.values(folders), standaloneMovies: movies };
  }, [allTasksList]);

  const activeFolder = useMemo(() => {
    if (!selectedSeriesKey) return null;
    return seriesFolders.find((f) => f.seriesKey === selectedSeriesKey) || null;
  }, [seriesFolders, selectedSeriesKey]);

  const handlePlayOffline = (task: DownloadTask) => {
    let subUrl = task.subtitleUrl;
    if (!subUrl && task.downloadId) {
      subUrl = `https://appassets.androidplatform.net/downloads/${task.downloadId}.srt`;
    }

    // 1. Native Android Media3 Offline Player (zero HTTP, direct hardware codec)
    if (downloadService.playOfflineMedia(task.downloadId, task.title, subUrl)) {
      return;
    }

    // 2. Web fallback modal
    setOfflinePlayingTask(task);
  };

  // Favorite Items resolution
  const favoriteChannels = useMemo(() => {
    return allChannels.filter((c) => favorites.includes(c.id));
  }, [allChannels, favorites]);

  const favoriteMovies = useMemo(() => {
    return allMovies.filter(
      (m) => favorites.includes(`movie-${m.tmdb_id}`) || favorites.includes(`vidapi-movie-${m.tmdb_id}`)
    );
  }, [allMovies, favorites]);

  const favoriteTv = useMemo(() => {
    return allTv.filter(
      (t) => favorites.includes(`tv-${t.tmdb_id}`) || favorites.includes(`vidapi-tv-${t.tmdb_id}`)
    );
  }, [allTv, favorites]);

  const totalFavoritesCount = favoriteChannels.length + favoriteMovies.length + favoriteTv.length;

  return (
    <div
      className="px-4 md:px-8 py-5 space-y-6 select-none max-w-5xl mx-auto pb-32 text-[#F8FAFC]"
      onClick={() => setActiveMenuId(null)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. In Native App: Segmented Switcher (Downloads | My List). In Web: Header title for My List */}
      {isNativeApp ? (
        <div className="flex items-center justify-center">
          <div className="flex items-center p-1 rounded-full bg-[#131620] border border-white/8 shadow-inner">
            <button
              onClick={() => {
                setActiveSegment('downloads');
                setSelectedSeriesKey(null);
              }}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeSegment === 'downloads'
                  ? 'bg-[#FF2A4B] text-[#F8FAFC] shadow-[0_0_16px_rgba(255,42,75,0.4)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {t('downloads', language)} ({allTasksList.length})
            </button>
            <button
              onClick={() => {
                setActiveSegment('mylist');
                setSelectedSeriesKey(null);
              }}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeSegment === 'mylist'
                  ? 'bg-[#FF2A4B] text-[#F8FAFC] shadow-[0_0_16px_rgba(255,42,75,0.4)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {t('myList', language)} ({totalFavoritesCount})
            </button>
          </div>
        </div>
      ) : (
        /* Web Mode Header - Only My List is active on Web */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#141620] via-[#1A1D2B] to-[#141620] border border-white/8">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-[#FF2A4B]" />
              <span>{t('myList', language)}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF2A4B]/20 text-[#FF2A4B] border border-[#FF2A4B]/30 font-mono">
                {totalFavoritesCount}
              </span>
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1">
              {language === 'ar'
                ? 'قائمة الأعمال والقنوات المفضلة التي قمت بحفظها للوصول السريع'
                : 'Your saved movies, series, and live sports channels for instant access'}
            </p>
          </div>

          <a
            href="/TVPulsar_v2.0.0.apk"
            download="TVPulsar_v2.0.0.apk"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2A4B] to-[#d91d3b] hover:brightness-110 text-white text-xs font-bold shadow-[0_0_20px_rgba(255,42,75,0.35)] transition-all shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Smartphone className="w-4 h-4" />
            <span>{t('downloadApp', language)}</span>
          </a>
        </div>
      )}

      {/* 2. DOWNLOADS SECTION (Only when in Native App & activeSegment === 'downloads') */}
      {isNativeApp && activeSegment === 'downloads' && (
        <>
          {/* A. If viewing inside a specific Series Folder */}
          {activeFolder ? (
            <div className="space-y-4">
              {/* Breadcrumb / Back button */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSeriesKey(null)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E2230] hover:bg-[#282D40] border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  <span>{t('backToDownloads', language)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف جميع حلقات هذا المسلسل؟' : 'Delete all downloaded episodes of this series?')) {
                      activeFolder.tasks.forEach((t) => deleteTask(t.downloadId));
                      setSelectedSeriesKey(null);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('deleteAllEpisodes', language)}</span>
                </button>
              </div>

              {/* Series Banner Header */}
              <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#181B26] via-[#141622] to-[#181B26] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-24 h-36 rounded-xl overflow-hidden bg-[#1E2230] border border-white/15 shadow-xl shrink-0">
                  {activeFolder.posterUrl ? (
                    <img
                      src={activeFolder.posterUrl}
                      alt={activeFolder.seriesTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1E2230] flex items-center justify-center">
                      <Folder className="w-8 h-8 text-[#FF2A4B]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-start space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF2A4B]/20 text-[#FF2A4B] text-[11px] font-bold border border-[#FF2A4B]/30">
                    <Folder className="w-3 h-3" />
                    <span>{t('seriesFolder', language)}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {activeFolder.seriesTitle}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#94A3B8] font-mono">
                    <span>
                      {activeFolder.tasks.length} {t('episodes', language)}
                    </span>
                    <span>•</span>
                    <span>{formatBytes(activeFolder.totalBytes)}</span>
                    <span>•</span>
                    <span className="text-[#10B981] font-sans font-semibold">
                      {activeFolder.isAllCompleted ? t('readyOffline', language) : 'Downloading...'}
                    </span>
                  </div>

                  {activeFolder.tasks.some((t) => t.status === 'COMPLETED') && (
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          const firstReady = activeFolder.tasks.find((t) => t.status === 'COMPLETED');
                          if (firstReady) handlePlayOffline(firstReady);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF2A4B] hover:bg-[#ff3b5c] text-white text-xs font-bold shadow-[0_0_15px_rgba(255,42,75,0.4)] transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{t('playOffline', language)} (S{activeFolder.tasks[0]?.season} E{activeFolder.tasks[0]?.episode})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* List of episodes inside this series folder */}
              <div className="space-y-2.5">
                {activeFolder.tasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  const isDownloading = task.status === 'DOWNLOADING';
                  const isPaused = task.status === 'PAUSED';
                  const displaySize = formatBytes(task.totalBytes || task.downloadedBytes);

                  return (
                    <div
                      key={task.downloadId}
                      className="group flex items-center justify-between p-3 rounded-xl bg-[#131620] border border-white/8 hover:border-white/15 transition-all gap-3"
                    >
                      {/* Left: Thumbnail & S:E badge */}
                      <div
                        onClick={() => isCompleted && handlePlayOffline(task)}
                        className={`relative w-24 h-16 rounded-lg overflow-hidden bg-[#1E2230] border border-white/8 shrink-0 flex items-center justify-center ${
                          isCompleted ? 'cursor-pointer' : ''
                        }`}
                      >
                        {task.posterUrl ? (
                          <img
                            src={task.posterUrl}
                            alt={task.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Film className="w-5 h-5 text-[#FF2A4B]/60" />
                        )}
                        {isCompleted && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center group-hover:bg-[#FF2A4B] transition-all">
                              <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div
                        onClick={() => isCompleted && handlePlayOffline(task)}
                        className={`flex-1 min-w-0 ${isCompleted ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#FF2A4B]/20 text-[#FF2A4B] text-[10px] font-bold font-mono border border-[#FF2A4B]/30">
                            S{task.season || 1} E{task.episode || 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {task.title.replace(/^.*•\s*/, '')}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] font-mono mt-1">
                          <span>{displaySize}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#1E2230] text-[10px] font-bold">
                            {task.quality || '1080p'}
                          </span>
                          <span>•</span>
                          {isCompleted ? (
                            <span className="text-[#10B981] font-semibold">✓ {t('readyOffline', language)}</span>
                          ) : isDownloading ? (
                            <span className="text-[#FF2A4B] font-semibold">{task.progress || 0}%</span>
                          ) : (
                            <span className="text-yellow-400 font-semibold">{task.status}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isCompleted && (
                          <button
                            onClick={() => handlePlayOffline(task)}
                            className="p-2 rounded-lg bg-[#FF2A4B] text-white hover:bg-[#ff3b5c] transition-all cursor-pointer"
                            title={t('playOffline', language)}
                          >
                            <Play className="w-4 h-4 fill-white" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(task.downloadId)}
                          className="p-2 rounded-lg bg-[#1E2230] text-[#94A3B8] hover:text-red-400 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* B. Root Downloads List (Showing Series Folders + Standalone Movies) */
            <>
              {/* Storage Summary Card */}
              <div className="p-4 rounded-2xl bg-[#131620] border border-white/8 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#94A3B8] truncate">
                    <HardDrive className="w-4 h-4 text-[#FF2A4B] shrink-0" />
                    <span className="font-mono text-[#F8FAFC] font-semibold">
                      {formatBytes(totalDownloadedBytes)}
                    </span>
                    <span>{t('storageUsed', language)}</span>
                    <span className="text-[#64748B]">•</span>
                    <span className="font-mono text-[#94A3B8]">
                      {formatBytes(freeStorageBytes)} {t('storageFree', language)}
                    </span>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center p-0.5 rounded-xl bg-[#1E2230] border border-white/8 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-[#FF2A4B] text-white shadow-sm'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#FF2A4B] text-white shadow-sm'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF2A4B] rounded-full transition-all duration-300 shadow-[0_0_8px_#FF2A4B]"
                    style={{ width: `${usedPercentage}%` }}
                  />
                </div>
              </div>

              {/* Downloads Content */}
              {seriesFolders.length > 0 || standaloneMovies.length > 0 ? (
                <div className="space-y-4">
                  {/* SERIES FOLDERS SECTION */}
                  {seriesFolders.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                        <Folder className="w-3.5 h-3.5 text-[#FF2A4B]" />
                        <span>{language === 'ar' ? 'مجلدات المسلسلات' : 'Series Folders'} ({seriesFolders.length})</span>
                      </h3>

                      <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' : 'space-y-3'}>
                        {seriesFolders.map((folder) => {
                          const readyCount = folder.tasks.filter((t) => t.status === 'COMPLETED').length;

                          return (
                            <div
                              key={folder.seriesKey}
                              onClick={() => setSelectedSeriesKey(folder.seriesKey)}
                              className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-[#141724] border border-white/10 hover:border-[#FF2A4B]/40 hover:bg-[#181B2B] transition-all gap-3 cursor-pointer shadow-lg select-none"
                            >
                              {/* Stacked Poster Card Motif */}
                              <div className="relative w-[85px] h-[75px] shrink-0 flex items-center justify-center">
                                {/* Back card decorative stack */}
                                <div className="absolute w-[70px] h-[65px] rounded-lg bg-[#252A3D] -top-1 -right-1 opacity-60 border border-white/5" />
                                {/* Front card poster */}
                                <div className="relative w-[76px] h-[68px] rounded-xl overflow-hidden bg-[#1E2230] border border-white/15 shadow-md flex items-center justify-center">
                                  {folder.posterUrl ? (
                                    <img
                                      src={folder.posterUrl}
                                      alt={folder.seriesTitle}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  ) : (
                                    <Folder className="w-7 h-7 text-[#FF2A4B]" />
                                  )}
                                  {/* Folder overlay badge icon */}
                                  <div className="absolute top-1 left-1 p-1 rounded-md bg-black/75 backdrop-blur-md text-[#FF2A4B]">
                                    <Layers className="w-3 h-3" />
                                  </div>
                                </div>
                              </div>

                              {/* Title & Folder Metadata */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-white group-hover:text-[#FF2A4B] transition-colors truncate">
                                    {folder.seriesTitle}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-mono">
                                  <span className="px-2 py-0.5 rounded-md bg-[#1E2230] text-[#F8FAFC] font-bold text-[10px] border border-white/8">
                                    {folder.tasks.length} {t('episodes', language)}
                                  </span>
                                  <span>•</span>
                                  <span>{formatBytes(folder.totalBytes)}</span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] pt-0.5">
                                  {folder.isAllCompleted ? (
                                    <span className="text-[#10B981] font-semibold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{t('readyOffline', language)} ({readyCount}/{folder.tasks.length})</span>
                                    </span>
                                  ) : folder.hasActiveDownload ? (
                                    <span className="text-[#FF2A4B] font-semibold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A4B] animate-pulse" />
                                      <span>Downloading...</span>
                                    </span>
                                  ) : (
                                    <span className="text-yellow-400 font-semibold">Paused</span>
                                  )}
                                </div>
                              </div>

                              {/* Trailing Open Arrow */}
                              <div className="p-2 rounded-xl bg-[#1E2230] text-[#94A3B8] group-hover:text-white group-hover:bg-[#FF2A4B] transition-all shrink-0">
                                {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STANDALONE MOVIES SECTION */}
                  {standaloneMovies.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                        <Film className="w-3.5 h-3.5 text-[#FF2A4B]" />
                        <span>{language === 'ar' ? 'الأفلام المنفردة' : 'Standalone Movies'} ({standaloneMovies.length})</span>
                      </h3>

                      <div className="space-y-3">
                        {standaloneMovies.map((task) => {
                          const isCompleted = task.status === 'COMPLETED';
                          const isDownloading = task.status === 'DOWNLOADING';
                          const isPaused = task.status === 'PAUSED';
                          const displaySize = formatBytes(task.totalBytes || task.downloadedBytes);

                          return (
                            <div
                              key={task.downloadId}
                              className="group relative flex items-center justify-between p-3 rounded-2xl bg-[#131620] border border-white/8 hover:border-white/15 transition-all gap-3 select-none"
                            >
                              <div
                                onClick={() => isCompleted && handlePlayOffline(task)}
                                className={`relative w-[110px] h-[68px] rounded-[10px] overflow-hidden bg-[#1E2230] border border-white/8 shrink-0 flex items-center justify-center ${
                                  isCompleted ? 'cursor-pointer' : ''
                                }`}
                              >
                                {task.posterUrl ? (
                                  <img
                                    src={task.posterUrl}
                                    alt={task.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <Film className="w-5 h-5 text-[#FF2A4B]/60" />
                                )}
                                {isCompleted && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#FF2A4B] transition-all">
                                      <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div
                                onClick={() => isCompleted && handlePlayOffline(task)}
                                className={`flex-1 min-w-0 flex flex-col justify-center space-y-1 ${
                                  isCompleted ? 'cursor-pointer' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <h3 className="text-[15px] font-semibold text-[#F8FAFC] tracking-tight truncate group-hover:text-white">
                                    {task.title}
                                  </h3>
                                  <span className="px-2 py-0.5 rounded-md bg-[#1E2230] border border-white/8 text-[10px] font-mono font-bold text-[#94A3B8] shrink-0">
                                    {task.quality || '1080p'}
                                  </span>
                                </div>

                                <div className="text-xs text-[#94A3B8] font-mono">
                                  {displaySize}
                                </div>

                                <div className="flex items-center gap-2 text-[11px] pt-0.5">
                                  {isCompleted ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981] font-semibold border border-[#10B981]/30">
                                      ✓ {t('readyOffline', language)}
                                    </span>
                                  ) : isDownloading ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(255,42,75,0.16)] text-[#FF2A4B] font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A4B] animate-pulse" />
                                      {task.progress || 0}%
                                    </span>
                                  ) : (
                                    <span className="text-yellow-400 font-semibold">{task.status}</span>
                                  )}
                                </div>
                              </div>

                              {/* Menu / Delete button */}
                              <div className="relative shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === task.downloadId ? null : task.downloadId);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[#1E2230] border border-white/8 text-[#94A3B8] hover:text-[#F8FAFC] transition-all flex items-center justify-center cursor-pointer"
                                  aria-label="Options"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeMenuId === task.downloadId && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-10 w-44 rounded-xl bg-[#1E2230] border border-white/10 shadow-2xl p-1.5 z-30 space-y-1"
                                  >
                                    {isCompleted && (
                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handlePlayOffline(task);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#F8FAFC] hover:bg-white/10 cursor-pointer"
                                      >
                                        <Play className="w-3.5 h-3.5 text-[#FF2A4B]" />
                                        <span>{t('playOffline', language)}</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        deleteTask(task.downloadId);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#FF2A4B] hover:bg-white/10 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty state when no downloads */
                <div className="p-12 text-center rounded-2xl bg-[#131620] border border-white/8 space-y-3">
                  <Film className="w-10 h-10 text-[#64748B] mx-auto" />
                  <h3 className="text-base font-bold text-[#F8FAFC]">{t('noDownloads', language)}</h3>
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                    {t('noDownloadsSub', language)}
                  </p>
                  <button
                    onClick={() => setCurrentTab('movies')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF2A4B] text-white text-xs font-bold shadow-[0_0_15px_rgba(255,42,75,0.4)] cursor-pointer"
                  >
                    {t('moviesAndTv', language)}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 3. MY LIST SECTION (Always visible in Web, or when activeSegment === 'mylist' in Native App) */}
      {(!isNativeApp || activeSegment === 'mylist') && (
        <div className="space-y-6">
          {favoriteChannels.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Tv className="w-4 h-4 text-[#FF2A4B]" />
                <span>{t('savedChannels', language)} ({favoriteChannels.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {favoriteChannels.map((c) => (
                  <ChannelCard
                    key={c.id}
                    channel={c}
                    className="w-full"
                    onPlay={(ch) =>
                      setActiveMedia({
                        id: ch.id,
                        title: ch.name,
                        subtitle: ch.program || `${ch.category} • HD Live Stream`,
                        type: 'channel',
                        streamUrl: ch.src,
                        poster: ch.resolvedLogo,
                        isLive: true,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {favoriteMovies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#FF2A4B]" />
                <span>{t('savedMovies', language)} ({favoriteMovies.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {favoriteMovies.map((m) => (
                  <MediaCard
                    key={m.tmdb_id}
                    item={m}
                    className="w-full"
                    onSelect={(it) => openMovieDetail(it as VidApiMovie, 'favorites')}
                  />
                ))}
              </div>
            </div>
          )}

          {favoriteTv.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#FF2A4B]" />
                <span>{t('savedSeries', language)} ({favoriteTv.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {favoriteTv.map((t) => (
                  <MediaCard
                    key={t.tmdb_id}
                    item={t}
                    className="w-full"
                    onSelect={(it) => openSeriesDetail(it as VidApiTvShow, 1, 'favorites')}
                  />
                ))}
              </div>
            </div>
          )}

          {totalFavoritesCount === 0 && (
            <div className="p-12 text-center rounded-2xl bg-[#131620] border border-white/8 space-y-3">
              <Heart className="w-10 h-10 text-[#64748B] mx-auto" />
              <h3 className="text-base font-bold text-[#F8FAFC]">{t('emptyList', language)}</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                {t('emptyListSub', language)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Standalone Offline Player for Web/Browser fallback */}
      {offlinePlayingTask && (
        <OfflinePlayerModal
          task={offlinePlayingTask}
          onClose={() => setOfflinePlayingTask(null)}
        />
      )}
    </div>
  );
};