import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Star, ArrowLeft, Bookmark, Heart, Clock, User, Film, Share2 } from 'lucide-react';
import { VidApiMovie, ActiveMedia } from '../../types';
import { tmdbService } from '../../services/tmdbApi';
import { useAppStore } from '../../store/useAppStore';

interface MovieDetailModalProps {
  movie: VidApiMovie | null;
  onClose: () => void;
  onPlay: (media: ActiveMedia) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, onClose, onPlay }) => {
  const { isFavorite, toggleFavorite, watchHistory } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [details, setDetails] = useState<Partial<VidApiMovie>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'trailers' | 'similar'>('overview');

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
  }, [movie?.tmdb_id]);

  // Notify native Android bridge and handle hardware back
  useEffect(() => {
    if (!movie) return;
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
  }, [movie, onClose]);

  useEffect(() => {
    if (!movie?.tmdb_id) return;
    setLoadingDetails(true);
    tmdbService.getMovieDetails(movie.tmdb_id)
      .then((res) => {
        setDetails(res);
      })
      .catch(() => {})
      .finally(() => setLoadingDetails(false));
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

  const handleStartPlayback = () => {
    const existing = watchHistory.find((item) => item.id === mediaId);
    onPlay({
      id: mediaId,
      title: displayTitle,
      subtitle: `${displayYear} • ${displayGenre} • Rating ${displayRating}`,
      type: 'movie',
      streamUrl: tmdbService.buildMovieEmbedUrl(movie.tmdb_id, existing?.timestamp),
      poster: movie.poster_url,
      resumeTime: existing?.timestamp,
      totalDuration: existing?.duration,
      isLive: false,
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

        {/* Metadata Row: Year • Rating • Runtime • 4K (Matching Screenshot 4) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-white/70 font-medium">
          <span>{displayYear}</span>
          <span>•</span>
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>{displayRating}</span>
          </div>
          <span>•</span>
          <span>{displayRuntime}</span>
          <span>•</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-white/10 text-white/90 border border-white/20">
            4K Ultra HD
          </span>
        </div>

        {/* Action Button: Play Movie + 4K Badge (Matching Screenshot 4) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleStartPlayback}
            className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-white/95 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-98 cursor-pointer t-btn-press"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black" />
            <span>Play Movie</span>
          </button>

          <div className="px-3 py-3 rounded-xl bg-white/10 border border-white/15 text-white/80 text-xs font-black shrink-0">
            4K
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

        {/* Cast & Director */}
        {details.cast && details.cast.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h3 className="text-xs font-bold text-white/70">Starring:</h3>
            <div className="flex flex-wrap gap-1.5">
              {details.cast.map((actor, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80"
                >
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detail Sub-Tabs: Overview • Trailers • Similar */}
        <div className="flex items-center gap-6 border-b border-white/10 pt-4 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeSubTab === 'overview'
                ? 'text-white font-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <span>Overview</span>
            {activeSubTab === 'overview' && (
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

        {/* Tab 1: Overview */}
        {activeSubTab === 'overview' && (
          <div className="space-y-3 pt-2 text-xs text-white/70">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <span>Category / Genre</span>
              <span className="font-bold text-white">{displayGenre}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <span>Release Year</span>
              <span className="font-bold text-white">{displayYear}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <span>Streaming Engine</span>
              <span className="font-bold text-[#FF1838]">VidLink Pro FHD</span>
            </div>
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
              onClick={handleStartPlayback}
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
              Explore more similar cinema titles via Collections and Trending Now on the Home page.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
