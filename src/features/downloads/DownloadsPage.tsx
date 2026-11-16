import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  MoreVertical,
  CheckCircle2,
  Bookmark,
  Tv,
  ArrowLeftRight,
  HardDrive,
  Trash2,
  ChevronLeft,
  Folder,
  Clock,
  Sparkles,
  Zap,
  ArrowDown,
  RotateCcw,
  PlusCircle,
  AlertCircle,
  Film,
  Download,
} from 'lucide-react';
import { useDownloadStore } from '../../store/downloadStore';
import { useAppStore } from '../../store/useAppStore';
import { DownloadTask } from '../../types';
import { downloadService } from '../../services/downloadService';
import { OfflinePlayerModal } from './OfflinePlayerModal';
import { spring, clamp, lerp, createPulsarTimeline } from '../../utils/motionEngine';

export interface EpisodeItem {
  id: string;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  meta: string;
  watchedText: string;
  progress: number;
  poster: string;
  task?: DownloadTask;
}

export interface DisplayDownloadItem {
  id: string;
  title: string;
  meta: string;
  watchedText: string;
  progress: number;
  type: 'movie' | 'series' | 'completed';
  action: 'Play' | 'Watch';
  poster: string;
  isBadge?: boolean;
  hasCheckmark?: boolean;
  hasBookmark?: boolean;
  isFolder?: boolean;
  episodesCount?: number;
  episodes?: EpisodeItem[];
  task?: DownloadTask;
}

// Helper to format real watch time (e.g. "1h 55m of 2h 02m • 7m left")
export function formatRealWatchTime(
  currentSec: number,
  totalSec: number,
  isRTL: boolean
): string {
  if (totalSec <= 0) totalSec = 3600;
  const currentMin = Math.max(0, Math.floor(currentSec / 60));
  const totalMin = Math.max(1, Math.floor(totalSec / 60));
  const remainingMin = Math.max(0, totalMin - currentMin);

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (isRTL) {
      if (h > 0) return `${h} س و ${m} د`;
      return `${m} دقيقة`;
    } else {
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    }
  };

  const watchedStr = formatMins(currentMin);
  const totalStr = formatMins(totalMin);
  const leftStr = formatMins(remainingMin);

  if (isRTL) {
    if (currentMin >= totalMin - 1) return `مشاهدة كاملة (${totalStr})`;
    if (currentMin === 0) return `لم تبدأ بعد (${totalStr})`;
    return `تمت مشاهدة ${watchedStr} من ${totalStr} • متبقي ${leftStr}`;
  } else {
    if (currentMin >= totalMin - 1) return `Watched in full (${totalStr})`;
    if (currentMin === 0) return `Not started (${totalStr})`;
    return `${watchedStr} of ${totalStr} • ${leftStr} left`;
  }
}

// Helper to format seconds to human ETA
export function formatETA(seconds: number, isRTL: boolean): string {
  if (seconds <= 0) return isRTL ? 'ثوانٍ قليلة' : 'Few seconds';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (isRTL) {
    if (mins > 0) return `${mins} د ${secs} ث`;
    return `${secs} ثانية`;
  } else {
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }
}

const initialSampleDownloads: DisplayDownloadItem[] = [
  {
    id: 's-odyssey',
    title: 'The Odyssey',
    meta: '2 episodes | 754.8MB',
    watchedText: '1m of 95m • 94m left',
    progress: 1,
    type: 'series',
    action: 'Play',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    hasCheckmark: true,
    isFolder: true,
    episodesCount: 2,
    episodes: [
      {
        id: 'odyssey-ep1',
        title: 'S01 E01 - The Ithaca Call',
        episodeNumber: 1,
        seasonNumber: 1,
        meta: '377.4MB',
        watchedText: '1m of 48m • 47m left',
        progress: 2,
        poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'odyssey-ep2',
        title: 'S01 E02 - Cyclops Cave',
        episodeNumber: 2,
        seasonNumber: 1,
        meta: '377.4MB',
        watchedText: 'Not started (47m)',
        progress: 0,
        poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'd2',
    title: '1080P Sicario',
    meta: '429.3MB',
    watchedText: '1h 55m of 2h 01m • 6m left',
    progress: 95,
    type: 'movie',
    action: 'Play',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    hasBookmark: true,
  },
  {
    id: 'd3',
    title: 'MobLand 1080P S02 E01',
    meta: '315.9MB',
    watchedText: '51m of 52m • 1m left',
    progress: 99,
    type: 'completed',
    action: 'Watch',
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80',
    isBadge: true,
  },
  {
    id: 'd4',
    title: 'The Day of the Jackal [... S01 E08',
    meta: '446.6MB',
    watchedText: '48m of 50m • 2m left',
    progress: 95,
    type: 'series',
    action: 'Watch',
    poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=400&q=80',
    isBadge: true,
  },
  {
    id: 's-jackal',
    title: 'The Day of the Jackal',
    meta: '3 episodes | 666.7MB',
    watchedText: '2h 27m of 2h 30m • 3m left',
    progress: 98,
    type: 'completed',
    action: 'Watch',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
    isBadge: true,
    isFolder: true,
    episodesCount: 3,
    episodes: [
      {
        id: 'jackal-ep1',
        title: 'S01 E01 - Target Locked',
        episodeNumber: 1,
        seasonNumber: 1,
        meta: '222.1MB',
        watchedText: 'Watched in full (50m)',
        progress: 100,
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'jackal-ep2',
        title: 'S01 E02 - The Munich Setup',
        episodeNumber: 2,
        seasonNumber: 1,
        meta: '221.8MB',
        watchedText: '49m of 50m • 1m left',
        progress: 98,
        poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'jackal-ep3',
        title: 'S01 E03 - Sniper Range',
        episodeNumber: 3,
        seasonNumber: 1,
        meta: '222.8MB',
        watchedText: '48m of 50m • 2m left',
        progress: 96,
        poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
];

export const DownloadsPage: React.FC = () => {
  const { tasks, freeStorageBytes, deleteTask, pauseTask, resumeTask, upsertTask } = useDownloadStore();
  const { language, watchHistory, episodeProgress } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'movies' | 'series' | 'completed'>('all');
  const [offlinePlayingTask, setOfflinePlayingTask] = useState<DownloadTask | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DisplayDownloadItem | null>(null);

  // Local sample list to allow interactive deletions & restores
  const [sampleItems, setSampleItems] = useState<DisplayDownloadItem[]>(initialSampleDownloads);

  // Set of item IDs currently executing the delete animation
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    id: string;
    title: string;
    item?: DisplayDownloadItem;
    episode?: EpisodeItem;
    parentFolderId?: string;
  } | null>(null);

  const isRTL = language === 'ar';
  const storageBarRef = useRef<HTMLDivElement>(null);

  // Active downloading tasks
  const activeDownloadingTasks = useMemo(() => {
    return Object.values(tasks || {}).filter(
      (t) => t.status === 'DOWNLOADING' || t.status === 'QUEUED' || t.status === 'PAUSED'
    );
  }, [tasks]);

  const realTasksList: DownloadTask[] = useMemo(() => {
    return Object.values(tasks || {}).sort((a, b) => a.downloadId.localeCompare(b.downloadId));
  }, [tasks]);

  // Combine real tasks or sample items
  const displayItems: DisplayDownloadItem[] = useMemo(() => {
    if (realTasksList.length > 0) {
      const seriesGroups: Record<string, DownloadTask[]> = {};
      const standaloneTasks: DownloadTask[] = [];

      for (const t of realTasksList) {
        const isEpisode = t.mediaType === 'episode' || t.mediaType === 'tv';
        const groupKey = t.seriesTitle || (isEpisode ? t.title.split(' - ')[0] : null);

        if (isEpisode && groupKey) {
          if (!seriesGroups[groupKey]) {
            seriesGroups[groupKey] = [];
          }
          seriesGroups[groupKey].push(t);
        } else {
          standaloneTasks.push(t);
        }
      }

      const items: DisplayDownloadItem[] = [];

      // Grouped series folders
      for (const [sTitle, epTasks] of Object.entries(seriesGroups)) {
        if (epTasks.length > 1) {
          const totalBytes = epTasks.reduce(
            (sum, ep) => sum + (ep.totalBytes || ep.downloadedBytes || 350000000),
            0
          );
          const sizeMb = (totalBytes / (1024 * 1024)).toFixed(1);

          let totalFolderSec = 0;
          let watchedFolderSec = 0;

          const episodes: EpisodeItem[] = epTasks.map((ep, idx) => {
            const epNum = ep.episode || idx + 1;
            const sNum = ep.season || 1;
            const epKey = `${ep.mediaId || sTitle}_s${sNum}_e${epNum}`;
            const epWatch = episodeProgress?.[epKey];
            const epHist = watchHistory?.find((h) => h.id === ep.downloadId || h.title.includes(ep.title));

            const totalSec = epWatch?.duration || epHist?.duration || 48 * 60;
            const currentSec =
              epWatch?.currentTime || epHist?.timestamp || (ep.status === 'COMPLETED' ? totalSec : 0);

            totalFolderSec += totalSec;
            watchedFolderSec += currentSec;

            const progressPct = Math.min(100, Math.round((currentSec / totalSec) * 100));

            return {
              id: ep.downloadId,
              title: ep.title,
              episodeNumber: epNum,
              seasonNumber: sNum,
              meta: `${((ep.totalBytes || ep.downloadedBytes || 350000000) / (1024 * 1024)).toFixed(1)}MB`,
              watchedText: formatRealWatchTime(currentSec, totalSec, isRTL),
              progress: progressPct,
              poster:
                ep.posterUrl ||
                epTasks[0].posterUrl ||
                'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
              task: ep,
            };
          });

          const folderProgress = Math.min(
            100,
            Math.round((watchedFolderSec / Math.max(1, totalFolderSec)) * 100)
          );

          items.push({
            id: `series-${sTitle}`,
            title: sTitle,
            meta: `${episodes.length} episodes | ${sizeMb}MB`,
            watchedText: formatRealWatchTime(watchedFolderSec, totalFolderSec, isRTL),
            progress: folderProgress,
            type: 'series',
            action: 'Watch',
            poster:
              epTasks[0].posterUrl ||
              'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
            isBadge: true,
            isFolder: true,
            episodesCount: episodes.length,
            episodes,
            task: epTasks[0],
          });
        } else {
          standaloneTasks.push(epTasks[0]);
        }
      }

      // Standalone items
      for (const t of standaloneTasks) {
        const sizeMb = ((t.totalBytes || t.downloadedBytes || 350000000) / (1024 * 1024)).toFixed(1);
        const isEpisode = t.mediaType === 'episode' || t.mediaType === 'tv';

        const hist = watchHistory?.find((h) => h.id === t.downloadId || h.title.includes(t.title));
        const totalSec = hist?.duration || (isEpisode ? 48 * 60 : 115 * 60);
        const currentSec = hist?.timestamp || (t.status === 'COMPLETED' ? totalSec * 0.95 : 0);
        const progressPct = Math.min(100, Math.round((currentSec / totalSec) * 100));

        items.push({
          id: t.downloadId,
          title: t.title,
          meta: isEpisode ? `Episode • ${sizeMb}MB` : `${sizeMb}MB`,
          watchedText: formatRealWatchTime(currentSec, totalSec, isRTL),
          progress: progressPct,
          type: isEpisode ? 'series' : 'movie',
          action: t.status === 'COMPLETED' ? 'Play' : 'Watch',
          poster:
            t.posterUrl ||
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
          isBadge: isEpisode,
          task: t,
        });
      }

      return items;
    }

    // Otherwise return custom sample items
    return sampleItems;
  }, [realTasksList, sampleItems, watchHistory, episodeProgress, isRTL]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return displayItems;
    if (filter === 'movies') return displayItems.filter((i) => i.type === 'movie');
    if (filter === 'series') return displayItems.filter((i) => i.type === 'series');
    if (filter === 'completed')
      return displayItems.filter((i) => i.type === 'completed' || i.progress >= 95);
    return displayItems;
  }, [displayItems, filter]);

  // Hook up timeline evaluator for testing and frame capture
  useEffect(() => {
    const screens = [
      document.querySelector('.home-screen') as HTMLElement | null,
      document.querySelector('.channels-screen') as HTMLElement | null,
      document.querySelector('.sports-screen') as HTMLElement | null,
      document.querySelector('.downloads-screen') as HTMLElement | null,
      document.querySelector('.settings-screen') as HTMLElement | null,
    ];
    const bottomTabs = Array.from(document.querySelectorAll('nav.md\\:hidden button')) as HTMLElement[];
    const downloadCards = Array.from(document.querySelectorAll('.download-card-item')) as HTMLElement[];
    const storageFill = storageBarRef.current;

    createPulsarTimeline({
      screens,
      bottomTabs,
      downloadCards,
      storageFill,
    });
  }, [filteredItems, selectedFolder]);

  // =========================================================================
  // Smooth Delete Animation Handlers
  // =========================================================================

  const handleAnimateDeleteCard = (item: DisplayDownloadItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (deletingIds.has(item.id)) return;

    // 1. Mark as deleting -> triggers .card-deleting animation
    setDeletingIds((prev) => new Set(prev).add(item.id));

    // 2. Wait 340ms for spring collapse animation to complete
    setTimeout(() => {
      // If it's a real native task
      if (item.task) {
        deleteTask(item.task.downloadId);
      } else {
        // Remove from sample list
        setSampleItems((prev) => prev.filter((i) => i.id !== item.id));
      }

      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });

      // Show Undo Toast
      setUndoToast({
        id: item.id,
        title: item.title,
        item,
      });
    }, 340);
  };

  const handleAnimateDeleteEpisode = (
    episode: EpisodeItem,
    folder: DisplayDownloadItem,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (deletingIds.has(episode.id)) return;

    // 1. Mark episode as deleting -> triggers .card-deleting
    setDeletingIds((prev) => new Set(prev).add(episode.id));

    // 2. Wait 340ms for spring collapse animation to complete
    setTimeout(() => {
      if (episode.task) {
        deleteTask(episode.task.downloadId);
      }

      // Update folder episode state in samples
      setSampleItems((prev) => {
        return prev.map((f) => {
          if (f.id === folder.id && f.episodes) {
            const nextEps = f.episodes.filter((ep) => ep.id !== episode.id);
            return {
              ...f,
              episodes: nextEps,
              episodesCount: nextEps.length,
              meta: `${nextEps.length} episodes`,
            };
          }
          return f;
        });
      });

      // Also update selectedFolder view
      setSelectedFolder((prev) => {
        if (!prev) return null;
        const nextEps = prev.episodes?.filter((ep) => ep.id !== episode.id) || [];
        if (nextEps.length === 0) {
          return null; // Return to main list if all episodes deleted
        }
        return {
          ...prev,
          episodes: nextEps,
          episodesCount: nextEps.length,
          meta: `${nextEps.length} episodes`,
        };
      });

      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(episode.id);
        return next;
      });

      // Show Undo Toast
      setUndoToast({
        id: episode.id,
        title: episode.title,
        episode,
        parentFolderId: folder.id,
      });
    }, 340);
  };

  // Restore deleted item on Undo
  const handleUndo = () => {
    if (!undoToast) return;

    if (undoToast.item) {
      setSampleItems((prev) => [undoToast.item!, ...prev]);
    } else if (undoToast.episode && undoToast.parentFolderId) {
      setSampleItems((prev) => {
        return prev.map((f) => {
          if (f.id === undoToast.parentFolderId && f.episodes) {
            const nextEps = [undoToast.episode!, ...f.episodes];
            return {
              ...f,
              episodes: nextEps,
              episodesCount: nextEps.length,
            };
          }
          return f;
        });
      });

      setSelectedFolder((prev) => {
        if (!prev) return null;
        const nextEps = [undoToast.episode!, ...(prev.episodes || [])];
        return {
          ...prev,
          episodes: nextEps,
          episodesCount: nextEps.length,
        };
      });
    }

    setUndoToast(null);
  };

  // Start Interactive Demo Download
  const handleStartDemoDownload = () => {
    const demoId = `demo_dl_${Date.now()}`;
    const demoTask: DownloadTask = {
      downloadId: demoId,
      mediaId: 'movie-visionquest-demo',
      mediaType: 'movie',
      title: '1080P VisionQuest (Extended 4K Cut)',
      quality: '1080p',
      status: 'DOWNLOADING',
      progress: 12,
      downloadedBytes: 85 * 1024 * 1024,
      totalBytes: 520 * 1024 * 1024,
      speedBytesPerSec: 5.2 * 1024 * 1024,
      speedFormatted: '5.2 MB/s',
      etaSeconds: 84,
      posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    upsertTask(demoTask);

    // Run simulated ticks
    let currentBytes = 85 * 1024 * 1024;
    const totalBytes = 520 * 1024 * 1024;
    const interval = setInterval(() => {
      const speedMb = 4.2 + Math.random() * 2.2;
      const speedBytes = Math.floor(speedMb * 1024 * 1024);
      currentBytes = Math.min(totalBytes, currentBytes + Math.floor(speedBytes * 0.8));
      const prog = Math.min(100, Math.round((currentBytes / totalBytes) * 100));
      const remainingBytes = Math.max(0, totalBytes - currentBytes);
      const eta = speedBytes > 0 ? Math.ceil(remainingBytes / speedBytes) : 0;

      if (prog >= 100) {
        clearInterval(interval);
        upsertTask({
          ...demoTask,
          progress: 100,
          downloadedBytes: totalBytes,
          status: 'COMPLETED',
          speedFormatted: undefined,
          etaSeconds: 0,
        });
      } else {
        upsertTask({
          ...demoTask,
          progress: prog,
          downloadedBytes: currentBytes,
          speedBytesPerSec: speedBytes,
          speedFormatted: `${speedMb.toFixed(1)} MB/s`,
          etaSeconds: eta,
          updatedAt: Date.now(),
        });
      }
    }, 800);
  };

  const handlePlayTask = (
    task?: DownloadTask,
    fallback?: { id: string; title: string; poster?: string; progress?: number }
  ) => {
    if (task) {
      let subUrl = task.subtitleUrl;
      if (!subUrl && task.downloadId) {
        subUrl = `https://appassets.androidplatform.net/downloads/${task.downloadId}.srt`;
      }
      if (downloadService.playOfflineMedia(task.downloadId, task.title, subUrl)) {
        return;
      }
      setOfflinePlayingTask(task);
    } else if (fallback) {
      if (downloadService.playOfflineMedia(fallback.id, fallback.title)) {
        return;
      }
      setOfflinePlayingTask({
        downloadId: fallback.id,
        mediaId: fallback.id,
        title: fallback.title,
        mediaType: 'movie',
        quality: '1080p',
        playableUri:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        posterUrl: fallback.poster,
        progress: fallback.progress || 100,
        status: 'COMPLETED',
        downloadedBytes: 400000000,
        totalBytes: 400000000,
      });
    }
  };

  const handleItemClick = (item: DisplayDownloadItem) => {
    if (item.isFolder && item.episodes && item.episodes.length > 0) {
      setSelectedFolder(item);
    } else {
      handlePlayTask(item.task, item);
    }
  };

  const freeStorageDisplay = useMemo(() => {
    if (freeStorageBytes && freeStorageBytes > 0) {
      const gb = (freeStorageBytes / (1024 * 1024 * 1024)).toFixed(1);
      return `${gb}GB available`;
    }
    return '22.2GB available';
  }, [freeStorageBytes]);

  const filters: {
    id: 'all' | 'movies' | 'series' | 'completed';
    label: string;
    labelAr: string;
  }[] = [
    {
      id: 'all',
      label: `Offline Files (${displayItems.length})`,
      labelAr: `ملفات بدون إنترنت (${displayItems.length})`,
    },
    { id: 'movies', label: 'Movies', labelAr: 'أفلام' },
    { id: 'series', label: 'Series', labelAr: 'مسلسلات' },
    { id: 'completed', label: 'Completed', labelAr: 'مكتملة' },
  ];

  return (
    <main
      className="downloads-screen min-h-screen bg-[#090A0F] text-white pb-32 pt-5 select-none relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-xl mx-auto px-4">
        {/* ================================================================= */}
        {/* Inside Series Folder View */}
        {/* ================================================================= */}
        {selectedFolder ? (
          <div className="animate-fadeIn">
            {/* Folder Header with Back Button */}
            <div className="flex items-center gap-2.5 pt-1 pb-3.5 border-b border-white/10">
              <button
                type="button"
                onClick={() => setSelectedFolder(null)}
                className="w-9 h-9 rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition active:scale-95 cursor-pointer"
                title={isRTL ? 'الرجوع' : 'Back'}
              >
                <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-white truncate">
                  {selectedFolder.title}
                </h1>
                <p className="text-xs text-neutral-400 flex items-center gap-2">
                  <span>
                    {selectedFolder.episodes?.length || 0}{' '}
                    {isRTL ? 'حلقات متوفرة' : 'episodes downloaded'}
                  </span>
                  <span>•</span>
                  <span>{selectedFolder.meta}</span>
                </p>
              </div>
            </div>

            {/* Episodes List */}
            <div className="space-y-3 mt-4">
              {selectedFolder.episodes?.map((ep) => {
                const isDeleting = deletingIds.has(ep.id);
                const isDownloading = ep.task?.status === 'DOWNLOADING';
                const speedText = ep.task?.speedFormatted || '4.8 MB/s';
                const progressPct = ep.task ? ep.task.progress : ep.progress;

                return (
                  <div
                    key={ep.id}
                    className={`download-card-item bg-[#161822] border border-white/10 rounded-2xl p-3 flex items-center gap-3.5 transition-all shadow-md ${
                      isDeleting ? 'card-deleting' : 'hover:border-white/20'
                    }`}
                  >
                    {/* 16:9 Thumbnail with Center Play & Flush Red Progress Bar */}
                    <div
                      onClick={() => handlePlayTask(ep.task, ep)}
                      className="relative w-[100px] h-[66px] rounded-xl overflow-hidden shrink-0 cursor-pointer group bg-black"
                    >
                      <img
                        src={ep.poster}
                        alt={ep.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* TV Episode Badge */}
                      <span className="absolute top-1 left-1 bg-black/75 backdrop-blur-sm px-1.5 py-0.2 rounded text-[7.5px] font-black text-white border border-white/15 flex items-center gap-0.5">
                        <Tv className="w-2.5 h-2.5 text-[#FF2A4B]" /> EP {ep.episodeNumber}
                      </span>

                      {/* Play Icon */}
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        </div>
                      </div>

                      {/* Watch Progress Bar */}
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-[#FF2A4B] shadow-[0_0_4px_#FF2A4B]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Episode Title & Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                          {ep.title}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => handleAnimateDeleteEpisode(ep, selectedFolder, e)}
                          className="text-neutral-400 hover:text-red-400 p-1.5 rounded-full hover:bg-white/10 transition active:scale-90 cursor-pointer"
                          title={isRTL ? 'حذف الحلقة' : 'Delete Episode'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] sm:text-xs text-neutral-400">{ep.meta}</p>
                        {isDownloading ? (
                          <span className="text-[9px] font-black text-[#FF2A4B] bg-[#FF2A4B]/15 px-1.5 py-0.5 rounded border border-[#FF2A4B]/30 flex items-center gap-1 font-mono download-pulse-badge">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A4B] animate-ping" />
                            {isRTL
                              ? `جاري التحميل ${progressPct}% • ${speedText}`
                              : `${progressPct}% • ${speedText}`}
                          </span>
                        ) : ep.task?.status === 'COMPLETED' ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {isRTL ? 'مثبّت' : 'Installed'}
                          </span>
                        ) : null}
                      </div>

                      {/* Real-time Episode Download Progress Bar */}
                      {isDownloading && (
                        <div className="w-full my-2">
                          <div className="w-full h-1.5 bg-[#262629] rounded-full overflow-hidden flex">
                            <div
                              className="download-progress-shimmer h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(4, progressPct)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[9px] text-[#FF2A4B] font-mono font-bold">
                            <span className="flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-[#FF2A4B] animate-pulse" />
                              {speedText}
                            </span>
                            <span>{progressPct}%</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium truncate">
                          <Clock className="w-3 h-3 text-[#FF2A4B] shrink-0" />
                          <span className="truncate">{ep.watchedText}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlayTask(ep.task, ep)}
                          className="bg-[#E50914] hover:bg-[#FF2A4B] text-white text-[11px] font-bold px-3.5 py-1 rounded-full transition-all active:scale-95 shadow cursor-pointer"
                        >
                          {isRTL ? 'تشغيل' : 'Play'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* Normal Downloads Main Screen */
          /* ================================================================= */
          <>
            {/* 1. Header with Transfer and Test Download Actions */}
            <div className="flex items-center justify-between pt-1 pb-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{isRTL ? 'التنزيلات' : 'Downloads'}</span>
                  <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    {displayItems.length}
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartDemoDownload}
                  className="bg-[#1C1F2E] hover:bg-white/15 border border-[#FF2A4B]/40 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[#FF2A4B] transition active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(255,42,75,0.15)]"
                  title={isRTL ? 'تجربة تحميل مباشر' : 'Test Live Download'}
                >
                  <ArrowDown className="w-3.5 h-3.5 download-arrow-anim text-[#FF2A4B]" />
                  <span>{isRTL ? '+ تجربة تحميل' : '+ Live Demo'}</span>
                </button>

                <button
                  type="button"
                  className="bg-[#161822] hover:bg-white/10 border border-white/10 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white transition active:scale-95 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#FF2A4B]" />
                  <span>{isRTL ? 'نقل' : 'Transfer'}</span>
                </button>
              </div>
            </div>

            {/* 2. Storage Available & Spring Oscillator Progress Bar */}
            <div className="mt-1 mb-5 bg-[#141622] border border-white/10 rounded-2xl p-3.5 shadow-md">
              <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-200 font-bold mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#FF2A4B]" />
                  <span>{isRTL ? `المساحة المتوفرة:` : `Storage:`}</span>
                  <span className="text-white font-extrabold">{freeStorageDisplay}</span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {isRTL ? 'تطبيق Pulsar: 1.8GB' : 'Pulsar App: 1.8GB'}
                </span>
              </div>

              {/* Multi-segmented animated storage bar */}
              <div className="w-full h-2 bg-[#26262E] rounded-full overflow-hidden flex gap-0.5">
                {/* Pulsar TV Media Fill */}
                <div
                  ref={storageBarRef}
                  className="bg-gradient-to-r from-[#E50914] to-[#FF2A4B] h-full rounded-full transition-all duration-700 shadow-[0_0_8px_#FF2A4B]"
                  style={{ width: '28%' }}
                />
                {/* System reserved */}
                <div className="bg-neutral-600 h-full rounded-full" style={{ width: '38%' }} />
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF2A4B]" />
                  {isRTL ? 'فيديوهات Pulsar' : 'Pulsar Media'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-600" />
                  {isRTL ? 'النظام والتطبيقات الأخرى' : 'System & Apps'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#26262E] border border-white/20" />
                  {isRTL ? 'مساحة فارغة' : 'Free Space'}
                </span>
              </div>
            </div>

            {/* 3. Active Downloading Tasks Hub (Real-time percentage & MB/s speed) */}
            {activeDownloadingTasks.length > 0 && (
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A4B] download-pulse-badge" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-[#FF2A4B]" />
                      <span>
                        {isRTL
                          ? 'جاري التحميل والتثبيت في الوقت الفعلي'
                          : 'Real-Time Background Downloads'}
                      </span>
                    </h2>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {activeDownloadingTasks.length} {isRTL ? 'قيد التحميل' : 'active'}
                  </span>
                </div>

                {activeDownloadingTasks.map((t) => {
                  const isPaused = t.status === 'PAUSED';
                  const speedText = t.speedFormatted || (isPaused ? '0.0 MB/s' : '4.8 MB/s');
                  const totalMb = ((t.totalBytes || 450 * 1024 * 1024) / (1024 * 1024)).toFixed(1);
                  const downloadedMb = (
                    (t.downloadedBytes || ((t.totalBytes || 450 * 1024 * 1024) * t.progress) / 100) /
                    (1024 * 1024)
                  ).toFixed(1);
                  const etaText = t.etaSeconds ? formatETA(t.etaSeconds, isRTL) : '45s';

                  return (
                    <div
                      key={t.downloadId}
                      className="bg-gradient-to-br from-[#1E2130] via-[#161824] to-[#10121A] border border-[#FF2A4B]/50 rounded-2xl p-3.5 shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {t.posterUrl && (
                            <img
                              src={t.posterUrl}
                              alt={t.title}
                              className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                              {t.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-300">
                              <span className="font-mono text-neutral-400">
                                {downloadedMb} MB / {totalMb} MB
                              </span>
                              {!isPaused && (
                                <span className="text-neutral-400 font-mono">• {etaText}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Speed & Pause/Resume Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Real-time MB/s Speed Gauge */}
                          <div
                            className={`flex items-center gap-1 text-[11px] font-black font-mono px-2 py-1 rounded-lg border shadow-sm ${
                              isPaused
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-[#FF2A4B]/15 text-[#FF2A4B] border-[#FF2A4B]/30'
                            }`}
                          >
                            <Zap className="w-3 h-3 text-[#FF2A4B]" />
                            <span>{speedText}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              isPaused ? resumeTask(t.downloadId) : pauseTask(t.downloadId)
                            }
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-90 cursor-pointer"
                            title={isPaused ? 'Resume' : 'Pause'}
                          >
                            {isPaused ? (
                              <Play className="w-3.5 h-3.5 fill-white" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTask(t.downloadId)}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 transition active:scale-90 cursor-pointer"
                            title={isRTL ? 'إلغاء التحميل' : 'Cancel Download'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Animated Shimmer Download Bar */}
                      <div className="w-full h-2 bg-[#26262E] rounded-full overflow-hidden flex my-2.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPaused
                              ? 'bg-yellow-500'
                              : 'download-progress-shimmer'
                          }`}
                          style={{ width: `${Math.max(4, t.progress)}%` }}
                        />
                      </div>

                      {/* Progress percentage & Status caption */}
                      <div className="flex items-center justify-between text-[10px] text-neutral-300 font-medium">
                        <span className="font-mono font-black text-white text-xs">
                          {t.progress}% {isRTL ? 'مكتمل' : 'Installed'}
                        </span>
                        <span className="text-neutral-400">
                          {isPaused
                            ? isRTL
                              ? 'متوقف مؤقتاً'
                              : 'Paused'
                            : isRTL
                            ? 'جاهز للاستخدام بدون إنترنت فور الاكتمال'
                            : 'Ready for offline playback on completion'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Filter Tabs */}
            <div
              className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3.5 pt-1"
              aria-label="Download Filters"
            >
              {filters.map((f) => {
                const isActive = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#E50914] text-white shadow-md'
                        : 'bg-[#161822] text-neutral-300 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {isRTL ? f.labelAr : f.label}
                  </button>
                );
              })}
            </div>

            {/* 5. Downloaded Media List with Delete Animations */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#141622] border border-white/5 rounded-2xl mt-2 animate-fadeIn">
                <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">
                  {isRTL ? 'لا توجد تنزيلات في هذه القائمة' : 'No downloads in this section'}
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  {isRTL
                    ? 'يمكنك تنزيل الأفلام والمسلسلات لمشاهدتها في أي وقت دون اتصال بالإنترنت.'
                    : 'Download movies and series to watch anytime without an internet connection.'}
                </p>
                <button
                  type="button"
                  onClick={() => setSampleItems(initialSampleDownloads)}
                  className="bg-[#E50914] hover:bg-[#FF2A4B] text-white text-xs font-bold px-4 py-2 rounded-full transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
                  {isRTL ? 'استعادة ملفات العينة' : 'Restore Sample Downloads'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const isDeleting = deletingIds.has(item.id);
                  const isDownloading = item.task?.status === 'DOWNLOADING';
                  const speedText = item.task?.speedFormatted || '4.5 MB/s';
                  const progressPct = item.task ? item.task.progress : item.progress;

                  return (
                    <div
                      key={item.id}
                      className={`download-card-item bg-[#161822] border border-white/10 rounded-2xl p-3 flex items-center gap-3.5 transition-all shadow-md ${
                        isDeleting ? 'card-deleting' : 'hover:border-white/20'
                      }`}
                    >
                      {/* 16:9 Thumbnail with Center Play & Flush Red Progress Bar */}
                      <div
                        onClick={() => handleItemClick(item)}
                        className="relative w-[100px] h-[66px] rounded-xl overflow-hidden shrink-0 cursor-pointer group bg-black"
                      >
                        <img
                          src={item.poster}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* TV Badge or Folder Badge */}
                        {item.isFolder ? (
                          <span className="absolute top-1 left-1 bg-[#E50914] px-1.5 py-0.5 rounded text-[8px] font-black text-white border border-white/20 flex items-center gap-1 shadow">
                            <Folder className="w-2.5 h-2.5 fill-white" /> {item.episodesCount} EP
                          </span>
                        ) : item.isBadge ? (
                          <span className="absolute top-1 left-1 bg-black/75 backdrop-blur-sm px-1.5 py-0.2 rounded text-[7.5px] font-black text-white/90 border border-white/10 flex items-center gap-0.5">
                            <Tv className="w-2.5 h-2.5 text-[#FF2A4B]" /> TV
                          </span>
                        ) : null}

                        {/* Center Action Icon */}
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            {item.isFolder ? (
                              <Folder className="w-3.5 h-3.5 fill-black text-black ml-0.2" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                            )}
                          </div>
                        </div>

                        {/* Watch Progress Bar */}
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                          <div
                            className="h-full bg-[#FF2A4B] shadow-[0_0_4px_#FF2A4B]"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Title & Metadata & Actions */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3
                            onClick={() => handleItemClick(item)}
                            className="text-xs sm:text-sm font-bold text-white truncate leading-tight cursor-pointer hover:text-neutral-200"
                          >
                            {item.title}
                          </h3>
                          {/* Animated Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleAnimateDeleteCard(item, e)}
                            className="text-neutral-400 hover:text-red-400 p-1.5 rounded-full hover:bg-white/10 transition active:scale-90 cursor-pointer"
                            title={isRTL ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] sm:text-xs text-neutral-400">{item.meta}</p>
                          {isDownloading ? (
                            <span className="text-[9px] font-black text-[#FF2A4B] bg-[#FF2A4B]/15 px-1.5 py-0.5 rounded border border-[#FF2A4B]/30 flex items-center gap-1 font-mono download-pulse-badge">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A4B] animate-ping" />
                              {isRTL
                                ? `جاري التثبيت ${progressPct}% • ${speedText}`
                                : `${progressPct}% • ${speedText}`}
                            </span>
                          ) : item.task?.status === 'COMPLETED' || item.progress >= 95 ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {isRTL ? 'مثبّت · جاهز' : 'Installed'}
                            </span>
                          ) : null}
                        </div>

                        {/* Real-time Media Card Download Progress Bar */}
                        {isDownloading && (
                          <div className="w-full my-2">
                            <div className="w-full h-1.5 bg-[#262629] rounded-full overflow-hidden flex">
                              <div
                                className="download-progress-shimmer h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(4, progressPct)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[9px] text-[#FF2A4B] font-mono font-bold">
                              <span className="flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 text-[#FF2A4B] animate-pulse" />
                                {speedText}
                              </span>
                              <span>{progressPct}%</span>
                            </div>
                          </div>
                        )}

                        {/* Bottom Row: Watched Status + Red Play/Watch Button */}
                        <div className="flex items-center justify-between mt-2 pt-0.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-medium truncate">
                            {item.hasCheckmark && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            )}
                            {item.hasBookmark && (
                              <Bookmark className="w-3 h-3 text-neutral-400 fill-neutral-400 shrink-0" />
                            )}
                            <Clock className="w-3 h-3 text-[#FF2A4B] shrink-0" />
                            <span className="truncate">{item.watchedText}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleItemClick(item)}
                            className="bg-[#E50914] hover:bg-[#FF2A4B] text-white text-[11px] font-bold px-3.5 py-1 rounded-full transition-all active:scale-95 shadow cursor-pointer shrink-0"
                          >
                            {item.isFolder
                              ? isRTL
                                ? 'عرض الحلقات'
                                : 'Episodes'
                              : item.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* =================================================================== */}
      {/* Undo Toast Notification (Bottom Toast with Countdown) */}
      {/* =================================================================== */}
      {undoToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-[#1E2232] border border-[#FF2A4B]/40 rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs font-semibold text-white truncate">
              {isRTL
                ? `تم حذف: "${undoToast.title}"`
                : `Deleted: "${undoToast.title}"`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="bg-[#E50914] hover:bg-[#FF2A4B] text-white text-xs font-black px-3.5 py-1.5 rounded-full transition active:scale-95 cursor-pointer shrink-0 shadow"
          >
            {isRTL ? 'تراجع' : 'Undo'}
          </button>
        </div>
      )}

      {/* Offline Player Modal */}
      {offlinePlayingTask && (
        <OfflinePlayerModal
          task={offlinePlayingTask}
          onClose={() => setOfflinePlayingTask(null)}
        />
      )}
    </main>
  );
};
