import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Star,
  ArrowLeft,
  Bookmark,
  Heart,
  Download,
  Share2,
  Check,
  Plus,
  Tv,
  Film,
  Info,
} from 'lucide-react';
import { VidApiTvShow, ActiveMedia, TmdbSeason, TmdbEpisode } from '../../types';
import { tmdbService } from '../../services/tmdbApi';
import { useAppStore } from '../../store/useAppStore';

interface SeriesDetailModalProps {
  series: VidApiTvShow | null;
  onClose: () => void;
  onPlay: (media: ActiveMedia) => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  series,
  onClose,
  onPlay,
}) => {
  const { isFavorite, toggleFavorite, language, getEpisodeProgress, episodeProgress, watchHistory } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [details, setDetails] = useState<Partial<VidApiTvShow>>({});
  const [seasons, setSeasons] = useState<TmdbSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'episodes' | 'trailers' | 'similar'>('episodes');

  // Ensure modal always initializes scrolled to the very top & locks background body scroll
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

  // Notify native Android bridge and handle hardware back
  useEffect(() => {
    if (!series) return;
    try {
      if ((window as any).PulsarApp?.setModalState) {
        (window as any).PulsarApp.setModalState(true);
      }
    } catch (_) {}

    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      try {
        if ((window as any).PulsarApp?.setModalState) {
          (window as any).PulsarApp.setModalState(false);
        }
      } catch (_) {}
    };
  }, [series, onClose]);

  // Load TV Show details and seasons from TMDB
  useEffect(() => {
    if (!series?.tmdb_id) return;

    tmdbService
      .getTvShowDetails(series.tmdb_id)
      .then(({ details: d, seasons: s }) => {
        setDetails(d);
        setSeasons(s);
        if (s.length > 0) {
          setSelectedSeason(s[0].seasonNumber);
        }
      })
      .catch(() => {});
  }, [series?.tmdb_id]);

  // Load episodes whenever selectedSeason changes
  useEffect(() => {
    if (!series?.tmdb_id) return;

    setLoadingEpisodes(true);
    tmdbService
      .getSeasonEpisodes(series.tmdb_id, selectedSeason)
      .then((eps) => {
        setEpisodes(eps);
      })
      .catch(() => {})
      .finally(() => setLoadingEpisodes(false));
  }, [series?.tmdb_id, selectedSeason]);

  if (!series) return null;

  const mediaId = `tv-${series.tmdb_id}`;
  const isFav = isFavorite(mediaId);

  const displayTitle = details.title || series.title;
  const displayOverview =
    details.overview ||
    series.overview ||
    `Enjoy watching all seasons and episodes of ${displayTitle} in high definition 1080p via our high-speed ad-free player.`;
  const displayBackdrop =
    details.backdrop_url || series.backdrop_url || series.poster_url;
  const displayRating =
    details.rating ||
    (series.rating && parseFloat(series.rating) > 0
      ? parseFloat(series.rating).toFixed(1)
      : '8.1');
  const displayYear = details.year || series.year || '2026';
  const displayGenre = details.genre || series.genre || 'Action & Drama';
  const totalEpisodesCount = details.numberOfEpisodes || episodes.length || 24;

  const lastHistory = watchHistory.find(
    (item) => item.id === mediaId || item.id === `tv-${series.tmdb_id}`
  );
  const resumeSeason = lastHistory?.tvMeta?.season || 1;
  const resumeEpisode = lastHistory?.tvMeta?.episode || 1;
  const resumeTime = lastHistory?.timestamp || 0;
  const hasResume = Boolean(lastHistory && (resumeEpisode > 1 || resumeSeason > 1 || resumeTime > 10));

  const handlePlayEpisode = (episodeNumber: number, seasonNumber: number = selectedSeason, customTime?: number) => {
    const epProg = getEpisodeProgress(series.tmdb_id, seasonNumber, episodeNumber);
    const timeToResume = typeof customTime === 'number' ? customTime : epProg?.currentTime;

    onPlay({
      id: `tv-${series.tmdb_id}`,
      title: `${displayTitle} - S${seasonNumber} E${episodeNumber}`,
      subtitle: `${displayYear} • ${displayGenre} • Episode ${episodeNumber}`,
      type: 'tv',
      streamUrl: tmdbService.buildTvEmbedUrl(
        series.tmdb_id,
        seasonNumber,
        episodeNumber,
        timeToResume
      ),
      poster: series.poster_url,
      resumeTime: timeToResume,
      totalDuration: epProg?.duration,
      isLive: false,
      tvMeta: {
        tmdbId: series.tmdb_id,
        season: seasonNumber,
        episode: episodeNumber,
        showTitle: displayTitle,
      },
    });
  };

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#0E1018] text-white overflow-y-auto select-none motion-modal-enter"
    >
      {/* Top Navigation Bar: Back Arrow + "Details" */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0E1018]/90 backdrop-blur-md border-b border-white/5">
        <button
          data-modal-close="true"
          onClick={onClose}
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors cursor-pointer py-1 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
          <span className="text-base font-bold tracking-tight">Details</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(mediaId)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
          >
            <Bookmark className={`w-4 h-4 ${isFav ? 'text-[#FF1838] fill-[#FF1838]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Backdrop Banner (Matching Screenshot 4) */}
      <div className="relative w-full h-[45vh] sm:h-[52vh] max-h-[500px] overflow-hidden bg-black">
        <img
          src={displayBackdrop}
          alt={displayTitle}
          className="w-full h-full object-cover object-center filter brightness-95 transition-all duration-300"
        />
        {/* Gradients blending into dark background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1018] via-[#0E1018]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
      </div>

      {/* Main Details Body */}
      <div className="px-4 sm:px-8 -mt-16 sm:-mt-20 relative z-10 space-y-4 max-w-4xl mx-auto pb-24">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
          {displayTitle}
        </h1>

        {/* Metadata Row: Year • Rating • Episode Count • HD (Matching Screenshot 4) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-white/70 font-medium">
          <span>{displayYear}</span>
          <span>•</span>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>{displayRating}</span>
          </div>
          <span>•</span>
          <span>{totalEpisodesCount} Episodes</span>
          <span>•</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-white/10 text-white/90 border border-white/20">
            TV-MA
          </span>
        </div>

        {/* Action Button: Play Episode 1 / Resume + HD Badge (Matching Screenshot 4) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              if (hasResume) {
                setSelectedSeason(resumeSeason);
                handlePlayEpisode(resumeEpisode, resumeSeason, resumeTime);
              } else {
                handlePlayEpisode(1);
              }
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-white/95 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-98 cursor-pointer t-btn-press"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black" />
            <span>
              {hasResume
                ? `Resume (S${resumeSeason} • E${resumeEpisode})`
                : 'Play Episode 1'}
            </span>
          </button>

          <div className="px-3 py-3 rounded-xl bg-white/10 border border-white/15 text-white/80 text-xs font-black shrink-0">
            HD
          </div>
        </div>

        {/* Add to My List Link (Matching Screenshot 4) */}
        <div className="pt-0.5">
          <button
            onClick={() => toggleFavorite(mediaId)}
            className="inline-flex items-center gap-2 text-[#FF1838] hover:text-[#ff3853] text-xs sm:text-sm font-bold transition-colors cursor-pointer select-none"
          >
            <Bookmark className={`w-4 h-4 ${isFav ? 'fill-[#FF1838]' : ''}`} />
            <span>{isFav ? 'Added to My List' : 'Add to My List'}</span>
          </button>
        </div>

        {/* Overview Synopsis (Matching Screenshot 4) */}
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal text-right sm:text-left">
          {displayOverview}
        </p>

        {/* Season Selector Pills (Matching Screenshot 4) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {seasons.map((season) => {
              const isActive = selectedSeason === season.seasonNumber;
              return (
                <button
                  key={season.seasonNumber}
                  onClick={() => setSelectedSeason(season.seasonNumber)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 t-btn-press ${
                    isActive
                      ? 'bg-white text-black shadow-lg font-black'
                      : 'bg-[#1C1E2A] text-white/80 hover:text-white border border-white/5'
                  }`}
                >
                  Season {season.seasonNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Sub-Tabs: Episodes • Trailers • Similar (Matching Screenshot 5) */}
        <div className="flex items-center gap-6 border-b border-white/10 pt-2 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveSubTab('episodes')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'episodes'
                ? 'text-white font-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <span>Episodes</span>
            {activeSubTab === 'episodes' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('trailers')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'trailers'
                ? 'text-white font-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <span>Trailers</span>
            {activeSubTab === 'trailers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('similar')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'similar'
                ? 'text-white font-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <span>Similar</span>
            {activeSubTab === 'similar' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
          </button>
        </div>

        {/* Tab 1: Episodes Vertical List (Matching Screenshot 5) */}
        {activeSubTab === 'episodes' && (
          <div className="space-y-3 pt-2">
            {loadingEpisodes ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : episodes.length > 0 ? (
              <div className="space-y-3">
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

                  return (
                    <div
                      key={ep.episodeNumber}
                      onClick={() => handlePlayEpisode(ep.episodeNumber)}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-[#141624]/60 hover:bg-[#1E2136] border transition-all cursor-pointer group select-none t-card ${
                        isWatched
                          ? 'border-[#00E676]/40 bg-[#00E676]/5'
                          : hasPartial
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      {/* Left: Number + Thumbnail with Play Overlay & Progress Bar */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white/50 w-4 text-center shrink-0">
                          {ep.episodeNumber}
                        </span>

                        {/* Thumbnail with centered play button & watch progress indicator */}
                        <div className="relative w-24 sm:w-28 aspect-[16/9] rounded-xl overflow-hidden bg-black/80 shrink-0 border border-white/10">
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
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/70 group-hover:bg-[#FF1838] border border-white/40 flex items-center justify-center transition-colors">
                              <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                            </div>
                          </div>

                          {/* Progress bar at base of thumbnail */}
                          {isWatched ? (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00E676] shadow-[0_0_6px_#00E676]" />
                          ) : hasPartial ? (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                              <div
                                className="h-full bg-amber-400 shadow-[0_0_6px_#FFB300]"
                                style={{ width: `${Math.max(10, progressPct)}%` }}
                              />
                            </div>
                          ) : null}
                        </div>

                        {/* Title and Status Tags */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FF1838] transition-colors">
                              Episode {ep.episodeNumber}
                            </h4>
                            {isWatched ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#00E676]/20 border border-[#00E676]/40 text-[#00E676] text-[10px] font-bold shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Watched</span>
                              </span>
                            ) : hasPartial ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold shrink-0">
                                <span>Watched {progressPct}%</span>
                              </span>
                            ) : null}
                          </div>
                          {ep.name && ep.name !== `Episode ${ep.episodeNumber}` && (
                            <p className="text-[11px] text-white/60 truncate max-w-[150px] sm:max-w-xs">
                              {ep.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Download icon + HD Badge (Matching Screenshot 5) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayEpisode(ep.episodeNumber);
                          }}
                          className="p-1.5 rounded-lg text-white/50 hover:text-white transition-colors"
                          title="Download / Stream"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-white/10 text-white/70 border border-white/10">
                          HD
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-white/50 text-xs">
                No episodes currently available for this season.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Trailers */}
        {activeSubTab === 'trailers' && (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
            <Play className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-xs text-white/60">
              Official HD trailer is available directly through the video player.
            </p>
            <button
              onClick={() => handlePlayEpisode(1)}
              className="mt-3 px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold"
            >
              Play Trailer
            </button>
          </div>
        )}

        {/* Tab 3: Similar */}
        {activeSubTab === 'similar' && (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
            <p className="text-xs text-white/60">
              Explore more TV series and similar shows via Collections and Trending Now on the Home page.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
