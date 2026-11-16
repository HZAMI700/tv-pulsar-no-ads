import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Star,
  ArrowLeft,
  Bookmark,
  Download,
  Check,
  CheckCircle2,
  Pause,
  RotateCcw,
  Plus,
  Tv,
} from 'lucide-react';
import { VidApiTvShow, ActiveMedia, TmdbSeason, TmdbEpisode } from '../../types';
import { tmdbService } from '../../services/tmdbApi';
import { useAppStore } from '../../store/useAppStore';
import { useDownloadStore } from '../../store/downloadStore';
import { DownloadQualityModal, VideoQuality } from './DownloadQualityModal';
import { downloadService } from '../../services/downloadService';
import { resolveVideoSource } from '../../services/videoSourceResolver';
import { t } from '../../utils/translations';

interface SeriesDetailModalProps {
  series: VidApiTvShow | null;
  initialSeason?: number;
  onClose: () => void;
  onPlay: (media: ActiveMedia) => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  series,
  initialSeason = 1,
  onClose,
  onPlay,
}) => {
  const { isFavorite, toggleFavorite, language, getEpisodeProgress, episodeProgress, watchHistory, openSeriesDetail } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [details, setDetails] = useState<Partial<VidApiTvShow>>({});
  const [seasons, setSeasons] = useState<TmdbSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason || 1);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [similarShows, setSimilarShows] = useState<VidApiTvShow[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'episodes' | 'similar'>('episodes');

  const isRTL = language === 'ar';

  useEffect(() => {
    if (initialSeason && initialSeason > 0) {
      setSelectedSeason(initialSeason);
    }
  }, [initialSeason]);

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
  }, [series?.tmdb_id]);

  useEffect(() => {
    if (!series) return;
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
  }, [series]);

  // Load TV details & seasons
  useEffect(() => {
    if (!series?.tmdb_id) return;

    tmdbService.getTvShowDetails(series.tmdb_id)
      .then((res) => {
        setDetails(res.details || {});
        if (res.seasons && res.seasons.length > 0) {
          const valid = res.seasons.filter((s) => s.seasonNumber > 0);
          setSeasons(valid.length > 0 ? valid : res.seasons);
        }
      })
      .catch(() => {});

    tmdbService.discoverTvShows({ page: 1, sortBy: 'popularity.desc' })
      .then((res) => {
        if (res.items) {
          setSimilarShows(res.items.filter((s) => s.tmdb_id !== series.tmdb_id).slice(0, 8));
        }
      })
      .catch(() => {});
  }, [series?.tmdb_id]);

  // Load Season Episodes
  useEffect(() => {
    if (!series?.tmdb_id || !selectedSeason) return;

    setLoadingEpisodes(true);
    tmdbService.getSeasonEpisodes(series.tmdb_id, selectedSeason)
      .then((eps) => {
        setEpisodes(eps || []);
      })
      .catch(() => {
        setEpisodes([]);
      })
      .finally(() => setLoadingEpisodes(false));
  }, [series?.tmdb_id, selectedSeason]);

  if (!series) return null;

  const mediaId = `tv-${series.tmdb_id}`;
  const isFav = isFavorite(mediaId);

  const displayTitle = details.title || series.title;
  const displayOverview = details.overview || series.overview || `Watch all seasons of ${displayTitle} in high definition with ad-free instant streaming.`;
  const displayBackdrop = details.backdrop_url || series.backdrop_url || series.poster_url;
  const displayRating = details.rating || (series.rating && parseFloat(series.rating) > 0 ? parseFloat(series.rating).toFixed(1) : '8.2');
  const displayYear = details.year || series.year || '2026';
  const totalEpisodesCount = seasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0) || 10;

  const { tasks, startEpisodeDownload, pauseTask, resumeTask } = useDownloadStore();
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('1080p');
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedEpisodeForModal, setSelectedEpisodeForModal] = useState<TmdbEpisode | null>(null);
  const [resolvingEpisodeNum, setResolvingEpisodeNum] = useState<number | null>(null);
  const [webDownloadToast, setWebDownloadToast] = useState<string | null>(null);

  // Resume tracking
  const existingHistory = watchHistory.find((w) => w.id.startsWith(`tv-${series.tmdb_id}`));
  const hasResume = Boolean(existingHistory && existingHistory.timestamp && existingHistory.timestamp > 10);

  const handlePlayEpisode = (epNum: number, seasonNum = selectedSeason, startTime?: number) => {
    const epObj = episodes.find((e) => e.episodeNumber === epNum);
    const epTask = Object.values(tasks).find(
      (t) => t.mediaId === mediaId && t.season === seasonNum && t.episode === epNum
    );

    if (epTask?.status === 'COMPLETED') {
      const subUrl = epTask.subtitleUrl || `https://appassets.androidplatform.net/downloads/${epTask.downloadId}.srt`;
      if (downloadService.playOfflineMedia(epTask.downloadId, `${displayTitle} S${seasonNum} E${epNum}`, subUrl)) {
        return;
      }
    }

    const offlineUrl = epTask?.status === 'COMPLETED' ? (epTask.playableUri || epTask.filePath) : undefined;
    const streamUrl = offlineUrl || tmdbService.buildTvEmbedUrl(series.tmdb_id, seasonNum, epNum, startTime);

    onPlay({
      id: `${mediaId}-s${seasonNum}e${epNum}`,
      title: `${displayTitle} - S${seasonNum} E${epNum}`,
      subtitle: epObj?.name ? `${epObj.name}` : `Season ${seasonNum} • Episode ${epNum}`,
      type: 'tv',
      streamUrl,
      poster: epObj?.stillPath || series.poster_url,
      resumeTime: startTime,
      isLive: false,
    });
  };

  const handleToggleDownloadEpisode = (ep: TmdbEpisode) => {
    if (!downloadService.isSupported()) {
      setSelectedEpisodeForModal(ep);
      setShowQualityModal(true);
      return;
    }

    const epTask = Object.values(tasks).find(
      (t) => t.mediaId === mediaId && t.season === selectedSeason && t.episode === ep.episodeNumber
    );

    if (!epTask || epTask.status === 'CANCELED') {
      setSelectedEpisodeForModal(ep);
      setShowQualityModal(true);
    } else if (epTask.status === 'DOWNLOADING') {
      pauseTask(epTask.downloadId);
    } else if (epTask.status === 'PAUSED' || epTask.status === 'FAILED') {
      resumeTask(epTask.downloadId);
    } else if (epTask.status === 'COMPLETED') {
      handlePlayEpisode(ep.episodeNumber, selectedSeason);
    }
  };

  const handleConfirmEpisodes = async (
    episodeNumbers: number[],
    quality: VideoQuality,
    subtitleUrl?: string,
    subtitleLanguage?: string,
    subtitleLanguages?: string[],
    subtitleUrls?: Record<string, string>
  ) => {
    setSelectedQuality(quality);
    setShowQualityModal(false);

    for (const epNum of episodeNumbers) {
      const ep = episodes.find((e) => e.episodeNumber === epNum) || selectedEpisodeForModal;
      if (!ep) continue;

      if (!downloadService.isSupported()) {
        setResolvingEpisodeNum(epNum);
        const startingMsg = isRTL
          ? `جاري تجهيز واستخراج ملف الحلقة ${epNum} للتحميل المباشر (${quality})...`
          : `Preparing direct video download for Episode ${epNum} (${quality})...`;
        setWebDownloadToast(startingMsg);

        try {
          const resolved = await downloadService.resolveDirectDownloadUrl({
            title: displayTitle || series.title,
            type: 'episode',
            season: selectedSeason,
            episode: epNum,
            quality,
            tmdbId: series.tmdb_id,
          });

          downloadService.directDownloadToDevice(resolved.downloadUrl, resolved.fileName);
          const successMsg = isRTL
            ? `بدأ تحميل الحلقة ${epNum} مباشرة إلى جهازك (${resolved.fileName})`
            : `Started downloading Episode ${epNum} (${resolved.fileName}) to your device...`;
          setWebDownloadToast(successMsg);
        } catch (err) {
          console.error('Failed to resolve episode download URL', err);
          const errMsg = isRTL
            ? `تعذر استخراج رابط تحميل الحلقة ${epNum}، يرجى المحاولة لاحقاً.`
            : `Failed to resolve Episode ${epNum} download link.`;
          setWebDownloadToast(errMsg);
        } finally {
          setResolvingEpisodeNum(null);
          setTimeout(() => setWebDownloadToast(null), 5000);
        }
      } else {
        await startEpisodeDownload(
          series,
          selectedSeason,
          ep.episodeNumber,
          quality,
          ep.name || `Episode ${ep.episodeNumber}`,
          subtitleUrl,
          subtitleLanguage,
          subtitleLanguages,
          subtitleUrls
        );
      }
    }
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

      {/* Hero Backdrop Banner */}
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
          onClick={() => handlePlayEpisode(1)}
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
          <span>{totalEpisodesCount} {isRTL ? 'حلقة' : 'Episodes'}</span>
          <span>•</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#E50914] text-white tracking-wider">
            TV-MA
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1C1C1E] border border-white/10 text-neutral-300">
            Full HD
          </span>
        </div>

        {/* Action Button: Play Episode 1 / Resume */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handlePlayEpisode(1)}
            className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 cursor-pointer t-btn-press"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black" />
            <span>
              {hasResume
                ? (isRTL ? `استئناف المشاهدة` : `Resume Watching`)
                : (isRTL ? 'تشغيل الحلقة 1' : 'Play Episode 1')}
            </span>
          </button>

          <button
            onClick={() => toggleFavorite(mediaId)}
            className="px-4 py-3 rounded-xl bg-[#1C1C1E] hover:bg-[#262629] border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95"
          >
            {isFav ? <Check className="w-4 h-4 text-[#E50914]" /> : <Plus className="w-4 h-4" />}
            <span>{isRTL ? 'قائمتي' : 'My List'}</span>
          </button>
        </div>

        {/* Overview Synopsis */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
          {displayOverview}
        </p>

        {/* Season Selector Pills */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
            {seasons.map((season) => {
              const isActive = selectedSeason === season.seasonNumber;
              return (
                <button
                  type="button"
                  key={season.seasonNumber}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSeason(season.seasonNumber);
                    setActiveSubTab('episodes');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 t-btn-press ${
                    isActive
                      ? 'bg-white text-black shadow-lg font-black'
                      : 'bg-[#1C1C1E] text-neutral-300 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {isRTL ? `الموسم ${season.seasonNumber}` : `Season ${season.seasonNumber}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Tabs: Episodes • Similar */}
        <div className="flex items-center gap-6 border-b border-white/10 pt-2 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveSubTab('episodes')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'episodes'
                ? 'text-white font-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{isRTL ? 'الحلقات' : 'Episodes'}</span>
            {activeSubTab === 'episodes' && (
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
            <span>{isRTL ? 'مسلسلات مشابهة' : 'More Like This'}</span>
            {activeSubTab === 'similar' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
          </button>
        </div>

        {/* Tab 1: Episodes Vertical List */}
        {activeSubTab === 'episodes' && (
          <div className="space-y-3 pt-2">
            {loadingEpisodes ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-[#141414] animate-pulse" />
                ))}
              </div>
            ) : episodes.length > 0 ? (
              <div className="space-y-2.5">
                {episodes.map((ep) => {
                  const epProg = getEpisodeProgress(series.tmdb_id, selectedSeason, ep.episodeNumber);
                  const isWatched = Boolean(
                    epProg?.watched ||
                    (epProg && epProg.duration > 0 && epProg.currentTime / epProg.duration > 0.85)
                  );
                  const hasPartial = Boolean(!isWatched && epProg && epProg.currentTime > 5);
                  const progressPct = epProg && epProg.duration > 0
                    ? Math.min(100, Math.round((epProg.currentTime / epProg.duration) * 100))
                    : 0;

                  const epTask = Object.values(tasks).find(
                    (t) => t.mediaId === mediaId && t.season === selectedSeason && t.episode === ep.episodeNumber
                  );

                  return (
                    <div
                      key={ep.episodeNumber}
                      onClick={() => handlePlayEpisode(ep.episodeNumber)}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-[#141414] hover:bg-[#1C1C1E] border border-white/5 hover:border-white/20 transition-all cursor-pointer group select-none t-card"
                    >
                      {/* Left: Number + 16:9 Thumbnail + Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-neutral-500 w-4 text-center shrink-0">
                          {ep.episodeNumber}
                        </span>

                        <div className="relative w-24 sm:w-28 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                          <img
                            src={
                              ep.stillPath ||
                              displayBackdrop ||
                              'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={ep.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-white/90 group-hover:bg-[#E50914] text-black group-hover:text-white flex items-center justify-center transition-colors shadow">
                              <Play className="w-2.5 h-2.5 fill-current ml-0.2" />
                            </div>
                          </div>

                          {/* Progress bar at base */}
                          {isWatched ? (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E50914]" />
                          ) : hasPartial ? (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                              <div
                                className="h-full bg-[#E50914]"
                                style={{ width: `${Math.max(10, progressPct)}%` }}
                              />
                            </div>
                          ) : null}
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                            {ep.name || `Episode ${ep.episodeNumber}`}
                          </h4>
                          <p className="text-[10px] text-neutral-400">
                            {ep.duration || '45m'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Prominent Download Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={resolvingEpisodeNum === ep.episodeNumber}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDownloadEpisode(ep);
                          }}
                          className={`h-11 px-3 sm:px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                            resolvingEpisodeNum === ep.episodeNumber
                              ? 'bg-[#E50914]/25 border-[#E50914] text-[#E50914] animate-pulse ring-2 ring-[#E50914]/30'
                              : epTask?.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                              : epTask?.status === 'DOWNLOADING'
                              ? 'bg-[#E50914]/25 border-[#E50914] text-[#E50914] hover:bg-[#E50914]/35'
                              : epTask?.status === 'PAUSED'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-[#1C1C1E] border-white/15 text-white/90 hover:text-white hover:bg-[#28282B] hover:border-white/25 active:bg-[#141416]'
                          }`}
                          title={isRTL ? `تحميل الحلقة ${ep.episodeNumber}` : `Download Episode ${ep.episodeNumber}`}
                        >
                          {resolvingEpisodeNum === ep.episodeNumber ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                              <span className="hidden sm:inline font-semibold text-[11px]">{isRTL ? 'جاري التجهيز...' : 'Preparing...'}</span>
                            </>
                          ) : epTask?.status === 'COMPLETED' ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              <span className="hidden sm:inline text-[11px]">{isRTL ? 'تم التحميل' : 'Downloaded'}</span>
                            </>
                          ) : epTask?.status === 'DOWNLOADING' ? (
                            <>
                              <Pause className="w-4 h-4 animate-pulse" />
                              <span className="text-xs">{epTask.progress}%</span>
                            </>
                          ) : epTask?.status === 'PAUSED' ? (
                            <>
                              <Play className="w-4 h-4 fill-amber-300" />
                              <span className="hidden sm:inline text-[11px]">{isRTL ? 'استئناف' : 'Resume'}</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5 text-[#E50914] shrink-0" />
                              <span className="font-semibold text-xs">{isRTL ? 'تحميل' : 'Download'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-neutral-500 text-xs">
                {isRTL ? 'لا توجد حلقات متاحة لهذا الموسم.' : 'No episodes currently available for this season.'}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Similar Shows */}
        {activeSubTab === 'similar' && (
          <div className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {similarShows.map((sim) => (
                <div
                  key={sim.tmdb_id}
                  onClick={() => openSeriesDetail(sim, 1, 'home')}
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
                      ★ {sim.rating || '8.0'}
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

      {/* Bulk / Single Episode & Quality Selection Modal */}
      <DownloadQualityModal
        isOpen={showQualityModal}
        onClose={() => {
          setShowQualityModal(false);
          setSelectedEpisodeForModal(null);
        }}
        mediaType="tv"
        series={series}
        season={selectedSeason}
        episodes={selectedEpisodeForModal ? [selectedEpisodeForModal] : episodes}
        initialQuality={selectedQuality}
        onConfirmEpisodes={handleConfirmEpisodes}
      />
    </div>,
    document.body
  );
};
