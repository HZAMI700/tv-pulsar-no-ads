import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Star,
  ArrowLeft,
  Bookmark,
  Share2,
  Download,
  CheckCircle2,
  Pause,
  RotateCcw,
  ChevronDown,
  Plus,
  Check,
  Film,
} from 'lucide-react';
import { VidApiMovie, ActiveMedia } from '../../types';
import { tmdbService } from '../../services/tmdbApi';
import { useAppStore } from '../../store/useAppStore';
import { useDownloadStore } from '../../store/downloadStore';
import { DownloadQualityModal, VideoQuality } from './DownloadQualityModal';
import { downloadService } from '../../services/downloadService';
import { resolveVideoSource } from '../../services/videoSourceResolver';
import { t } from '../../utils/translations';
import { MediaCard } from './MediaCard';

interface MovieDetailModalProps {
  movie: VidApiMovie | null;
  onClose: () => void;
  onPlay: (media: ActiveMedia) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, onClose, onPlay }) => {
  const { isFavorite, toggleFavorite, watchHistory, language, openMovieDetail } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [details, setDetails] = useState<Partial<VidApiMovie>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [similarMovies, setSimilarMovies] = useState<VidApiMovie[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'trailers' | 'similar'>('overview');

  const isRTL = language === 'ar';

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    const raf = requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
    };
  }, [movie?.tmdb_id]);

  // Native Android bridge hook
  useEffect(() => {
    if (!movie) return;
    try {
      if ((window as any).PulsarApp?.setModalState) {
        (window as any).PulsarApp.setModalState(true);
      }
    } catch (_) {}

    return () => {
      try {
        if ((window as any).PulsarApp?.setModalState) {
          (window as any).PulsarApp.setModalState(false);
        }
      } catch (_) {}
    };
  }, [movie]);

  useEffect(() => {
    if (!movie?.tmdb_id) return;
    setLoadingDetails(true);
    tmdbService.getMovieDetails(movie.tmdb_id)
      .then((res) => {
        setDetails(res);
      })
      .catch(() => {})
      .finally(() => setLoadingDetails(false));

    // Fetch similar / recommended movies for this genre
    tmdbService.discoverMovies({ page: 1, sortBy: 'popularity.desc' })
      .then((res) => {
        if (res.items) {
          setSimilarMovies(res.items.filter((m) => m.tmdb_id !== movie.tmdb_id).slice(0, 8));
        }
      })
      .catch(() => {});
  }, [movie?.tmdb_id]);

  if (!movie) return null;

  const mediaId = `movie-${movie.tmdb_id}`;
  const isFav = isFavorite(mediaId);

  const displayTitle = details.title || movie.title;
  const displayOverview = details.overview || movie.overview || `Enjoy watching ${displayTitle} in high definition 1080p via our high-speed ad-free player.`;
  const displayBackdrop = details.backdrop_url || movie.backdrop_url || movie.poster_url;
  const displayRating = details.rating || (movie.rating && parseFloat(movie.rating) > 0 ? parseFloat(movie.rating).toFixed(1) : '7.8');
  const displayYear = details.year || movie.year || '2026';
  const displayGenre = details.genre || movie.genre || 'Action & Cinema';
  const displayRuntime = details.runtime ? `${details.runtime} min` : '124 min';

  const { tasks, startMovieDownload, pauseTask, resumeTask, freeStorageBytes } = useDownloadStore();
  const downloadTask = Object.values(tasks).find((t) => t.mediaId === mediaId);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('1080p');
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [webDownloadToast, setWebDownloadToast] = useState<string | null>(null);

  const handleStartPlayback = () => {
    if (downloadTask?.status === 'COMPLETED') {
      const subUrl = downloadTask.subtitleUrl || `https://appassets.androidplatform.net/downloads/${downloadTask.downloadId}.srt`;
      if (downloadService.playOfflineMedia(downloadTask.downloadId, displayTitle, subUrl)) {
        return;
      }
    }

    const existing = watchHistory.find((item) => item.id === mediaId);
    const offlineUrl = downloadTask?.status === 'COMPLETED' ? (downloadTask.playableUri || downloadTask.filePath) : undefined;

    onPlay({
      id: mediaId,
      title: displayTitle,
      subtitle: offlineUrl ? `${selectedQuality} • Offline Playback` : `${displayYear} • ${displayGenre} • Rating ${displayRating}`,
      type: 'movie',
      streamUrl: offlineUrl || tmdbService.buildMovieEmbedUrl(movie.tmdb_id, existing?.timestamp),
      poster: movie.poster_url,
      resumeTime: existing?.timestamp,
      totalDuration: existing?.duration,
      isLive: false,
    });
  };

  const handleDownloadClick = async () => {
    if (freeStorageBytes < 300 * 1024 * 1024) {
      setStorageWarning(true);
      setTimeout(() => setStorageWarning(false), 4000);
      return;
    }

    if (!downloadTask || downloadTask.status === 'CANCELED') {
      setShowQualityModal(true);
    } else if (downloadTask.status === 'DOWNLOADING') {
      pauseTask(downloadTask.downloadId);
    } else if (downloadTask.status === 'PAUSED' || downloadTask.status === 'FAILED') {
      resumeTask(downloadTask.downloadId);
    } else if (downloadTask.status === 'COMPLETED') {
      handleStartPlayback();
    }
  };

  const handleConfirmDownloadQuality = async (
    quality: VideoQuality,
    subtitleUrl?: string,
    subtitleLanguage?: string,
    subtitleLanguages?: string[],
    subtitleUrls?: Record<string, string>
  ) => {
    setSelectedQuality(quality);
    const moviePayload: VidApiMovie = {
      ...movie,
      title: displayTitle || movie.title || (movie as any).name || 'Movie',
      poster_url: movie.poster_url || details.poster_url || displayBackdrop || '',
    };

    if (!downloadService.isSupported()) {
      const resolved = resolveVideoSource({
        type: 'movie',
        mediaId: `movie-${movie.tmdb_id}`,
        tmdbId: movie.tmdb_id,
        title: moviePayload.title,
        quality,
      });
      const safeTitle = (moviePayload.title || 'Movie').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
      downloadService.directDownloadToDevice(resolved.url, `${safeTitle}_${quality}.mp4`);
      setShowQualityModal(false);
      const msg = isRTL
        ? `جاري تحميل "${moviePayload.title}" مباشرة إلى ملفات جهازك...`
        : `Downloading "${moviePayload.title}" directly to your device files...`;
      setWebDownloadToast(msg);
      setTimeout(() => setWebDownloadToast(null), 4500);
      return;
    }

    await startMovieDownload(
      moviePayload,
      quality,
      subtitleUrl,
      subtitleLanguage,
      subtitleLanguages,
      subtitleUrls
    );
  };

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#0B0B0B] text-white overflow-y-auto select-none motion-modal-enter"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Navigation Bar: Lowered for status bar clearance */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 pt-[max(2.5rem,env(safe-area-inset-top,2.5rem))] pb-3 bg-[#0B0B0B]/95 backdrop-blur-xl border-b border-white/10">
        <button
          data-modal-close="true"
          onClick={onClose}
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors cursor-pointer py-1 active:scale-95"
        >
          <ArrowLeft className={`w-5 h-5 text-white ${isRTL ? 'rotate-180' : ''}`} />
          <span className="text-base font-bold tracking-tight">{isRTL ? 'الرجوع' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(mediaId)}
            className="p-2 rounded-full bg-[#1C1C1E] border border-white/10 hover:bg-white/10 text-white/80 transition-all cursor-pointer active:scale-95"
            title="My List"
          >
            <Bookmark className={`w-4 h-4 ${isFav ? 'text-[#E50914] fill-[#E50914]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Backdrop Banner with Cinematic Dark Vignettes */}
      <div className="relative w-full h-[46vh] sm:h-[54vh] max-h-[520px] overflow-hidden bg-black">
        <img
          src={displayBackdrop}
          alt={displayTitle}
          className="w-full h-full object-cover object-center filter brightness-90 transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

        {/* Center Frosted Play Icon */}
        <div
          onClick={handleStartPlayback}
          className="absolute inset-0 flex items-center justify-center cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-black ml-0.5" />
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="px-4 sm:px-8 -mt-16 sm:-mt-20 relative z-10 space-y-4 max-w-4xl mx-auto pb-28">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow">
          {displayTitle}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-neutral-300 font-medium">
          <span className="font-semibold">{displayYear}</span>
          <span>•</span>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>{displayRating}</span>
          </div>
          <span>•</span>
          <span>{displayRuntime}</span>
          <span>•</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#E50914] text-white tracking-wider">
            4K UHD
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1C1C1E] border border-white/10 text-neutral-300">
            16+
          </span>
        </div>

        {/* Primary Play Button (White with black text and icon) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleStartPlayback}
            className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 cursor-pointer t-btn-press"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black" />
            <span>{downloadTask?.status === 'COMPLETED' ? (isRTL ? 'تشغيل دون إنترنت' : 'Play Offline (100%)') : (isRTL ? 'تشغيل الفيلم' : 'Play Movie')}</span>
          </button>

          <button
            onClick={() => toggleFavorite(mediaId)}
            className="px-4 py-3 rounded-xl bg-[#1C1C1E] hover:bg-[#262629] border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
          >
            {isFav ? <Check className="w-4 h-4 text-[#E50914]" /> : <Plus className="w-4 h-4" />}
            <span>{isRTL ? 'قائمتي' : 'My List'}</span>
          </button>
        </div>

        {/* Download Button with Multi-State UI & Quality Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadClick}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all active:scale-98 cursor-pointer ${
                downloadTask?.status === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                  : downloadTask?.status === 'DOWNLOADING'
                  ? 'bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40 hover:bg-[#E50914]/30'
                  : downloadTask?.status === 'PAUSED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : downloadTask?.status === 'FAILED'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-[#1C1C1E] text-white hover:bg-[#262629] border-white/10'
              }`}
            >
              {downloadTask?.status === 'COMPLETED' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isRTL ? 'تم التحميل • مشاهدة دون إنترنت' : 'Downloaded • Play Offline'}</span>
                </>
              ) : downloadTask?.status === 'DOWNLOADING' ? (
                <>
                  <Pause className="w-4 h-4 animate-pulse" />
                  <span>{isRTL ? `جاري التحميل (${downloadTask.progress}%)` : `Downloading (${downloadTask.progress}%)`}</span>
                </>
              ) : downloadTask?.status === 'PAUSED' ? (
                <>
                  <Play className="w-4 h-4 fill-amber-300" />
                  <span>{isRTL ? `مؤقت (${downloadTask.progress}%) • استئناف` : `Paused (${downloadTask.progress}%) • Resume`}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isRTL ? `تحميل الفيلم (${selectedQuality})` : `Download Movie (${selectedQuality})`}</span>
                </>
              )}
            </button>

            {(!downloadTask || downloadTask.status === 'CANCELED') && (
              <button
                onClick={() => setShowQualityModal(true)}
                className="px-3 py-2.5 rounded-xl bg-[#1C1C1E] border border-white/10 text-white/80 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                title="Change Download Quality"
              >
                <span>{selectedQuality}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Real-time downloading progress bar */}
          {downloadTask && downloadTask.status === 'DOWNLOADING' && (
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E50914] transition-all duration-300"
                style={{ width: `${Math.max(5, downloadTask.progress)}%` }}
              />
            </div>
          )}

          {storageWarning && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              {isRTL ? 'تنبيه: مساحة التخزين منخفضة على الجهاز.' : 'Warning: Low disk space on device. Free up storage to download.'}
            </p>
          )}
        </div>

        {/* Overview Synopsis */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
          {displayOverview}
        </p>

        {/* Cast */}
        {details.cast && details.cast.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h3 className="text-xs font-bold text-neutral-400">{isRTL ? 'طاقم العمل:' : 'Starring:'}</h3>
            <div className="flex flex-wrap gap-1.5">
              {details.cast.map((actor, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-[#1C1C1E] border border-white/5 text-xs text-neutral-300"
                >
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tabs: Overview • Similar */}
        <div className="flex items-center gap-6 border-b border-white/10 pt-4 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'overview'
                ? 'text-white font-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{isRTL ? 'نظرة عامة' : 'Overview'}</span>
            {activeSubTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('similar')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'similar'
                ? 'text-white font-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{isRTL ? 'أفلام مشابهة' : 'More Like This'}</span>
            {activeSubTab === 'similar' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeSubTab === 'overview' && (
          <div className="space-y-2 pt-2 text-xs text-neutral-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/5">
              <span>{isRTL ? 'التصنيف / النوع' : 'Category / Genre'}</span>
              <span className="font-bold text-white">{displayGenre}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/5">
              <span>{isRTL ? 'سنة الإصدار' : 'Release Year'}</span>
              <span className="font-bold text-white">{displayYear}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/5">
              <span>{isRTL ? 'دقة البث' : 'Streaming Quality'}</span>
              <span className="font-bold text-[#E50914]">4K Ultra HD & 1080p</span>
            </div>
          </div>
        )}

        {/* Tab 2: More Like This */}
        {activeSubTab === 'similar' && (
          <div className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {similarMovies.map((sim) => (
                <div
                  key={sim.tmdb_id}
                  onClick={() => openMovieDetail(sim, 'home')}
                  className="cursor-pointer group t-card"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#1C1C1E] border border-white/10 mb-1 relative">
                    <img
                      src={sim.poster_url}
                      alt={sim.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-yellow-400">
                      ★ {sim.rating || '7.5'}
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                    {sim.title}
                  </h4>
                  <p className="text-[10px] text-neutral-400">{sim.year || '2026'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Web Direct Download Toast */}
      {webDownloadToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-[#1E2232] border border-[#FF2A4B]/60 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-slideUp">
          <Download className="w-4 h-4 text-[#FF2A4B] animate-bounce" />
          <span>{webDownloadToast}</span>
        </div>
      )}

      {/* Quality Selection Modal */}
      <DownloadQualityModal
        isOpen={showQualityModal}
        onClose={() => setShowQualityModal(false)}
        mediaType="movie"
        movie={movie}
        initialQuality={selectedQuality}
        onConfirmMovie={handleConfirmDownloadQuality}
      />
    </div>,
    document.body
  );
};
