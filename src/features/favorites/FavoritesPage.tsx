import React, { useEffect, useState, useMemo } from 'react';
import { Heart, Bookmark, History, Play, Trash2, Film, Tv, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ChannelItem, VidApiMovie, VidApiTvShow, ActiveMedia } from '../../types';
import { channelsService } from '../../services/channelsApi';
import { tmdbService } from '../../services/tmdbApi';
import { ChannelCard } from '../channels/ChannelCard';
import { MediaCard } from '../discover/MediaCard';
import { MovieDetailModal } from '../discover/MovieDetailModal';
import { SeriesDetailModal } from '../discover/SeriesDetailModal';

export const FavoritesPage: React.FC = () => {
  const {
    favorites,
    watchLater,
    watchHistory,
    removeFromWatchHistory,
    clearWatchHistory,
    setActiveMedia,
    setCurrentTab,
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'later' | 'history'>('favorites');
  const [allChannels, setAllChannels] = useState<ChannelItem[]>([]);
  const [allMovies, setAllMovies] = useState<VidApiMovie[]>([]);
  const [allTv, setAllTv] = useState<VidApiTvShow[]>([]);

  const [selectedMovie, setSelectedMovie] = useState<VidApiMovie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<VidApiTvShow | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [channelsRes, moviesList, tvList] = await Promise.all([
          channelsService.getAllChannels().catch(() => []),
          tmdbService.getTrendingMovies().catch(() => []),
          tmdbService.getTrendingTvShows().catch(() => []),
        ]);
        setAllChannels(channelsRes);
        setAllMovies(moviesList);
        setAllTv(tvList);
      } catch (err) {
        console.error('Error loading library data', err);
      }
    }
    loadCatalog();
  }, []);

  // Fetch missing favorited movies/series not present in trending
  useEffect(() => {
    const allIds = Array.from(new Set([...favorites, ...watchLater]));
    const missingMovieIds = allIds
      .filter((id) => id.startsWith('movie-') || id.startsWith('vidapi-movie-'))
      .map((id) => id.replace(/^vidapi-movie-/, '').replace(/^movie-/, ''))
      .filter((tmdbId) => tmdbId && !allMovies.some((m) => m.tmdb_id.toString() === tmdbId));

    const missingTvIds = allIds
      .filter((id) => id.startsWith('tv-') || id.startsWith('vidapi-tv-'))
      .map((id) => id.replace(/^vidapi-tv-/, '').replace(/^tv-/, ''))
      .filter((tmdbId) => tmdbId && !allTv.some((t) => t.tmdb_id.toString() === tmdbId));

    if (missingMovieIds.length > 0) {
      Promise.allSettled(
        missingMovieIds.map((id) => tmdbService.getMovieDetails(id))
      ).then((results) => {
        const fetched = results
          .filter((r): r is PromiseFulfilledResult<VidApiMovie> => r.status === 'fulfilled' && Boolean(r.value))
          .map((r) => r.value);
        if (fetched.length > 0) {
          setAllMovies((prev) => {
            const existing = new Set(prev.map((m) => m.tmdb_id.toString()));
            const toAdd = fetched.filter((f) => !existing.has(f.tmdb_id.toString()));
            return [...prev, ...toAdd];
          });
        }
      });
    }

    if (missingTvIds.length > 0) {
      Promise.allSettled(
        missingTvIds.map((id) => tmdbService.getTvShowDetails(id))
      ).then((results) => {
        const fetched = results
          .filter((r): r is PromiseFulfilledResult<{ details: VidApiTvShow; seasons: any[] }> => r.status === 'fulfilled' && Boolean(r.value?.details))
          .map((r) => r.value.details);
        if (fetched.length > 0) {
          setAllTv((prev) => {
            const existing = new Set(prev.map((t) => t.tmdb_id.toString()));
            const toAdd = fetched.filter((f) => !existing.has(f.tmdb_id.toString()));
            return [...prev, ...toAdd];
          });
        }
      });
    }
  }, [favorites, watchLater, allMovies.length, allTv.length]);

  // Filter Favorite Channels
  const favoriteChannels = useMemo(() => {
    return allChannels.filter((c) => favorites.includes(c.id));
  }, [allChannels, favorites]);

  // Filter Favorite Movies/Series
  const favoriteMedia = useMemo(() => {
    const list: Array<VidApiMovie | VidApiTvShow> = [];
    allMovies.forEach((m) => {
      if (favorites.includes(`movie-${m.tmdb_id}`) || favorites.includes(`vidapi-movie-${m.tmdb_id}`)) {
        list.push(m);
      }
    });
    allTv.forEach((t) => {
      if (favorites.includes(`tv-${t.tmdb_id}`) || favorites.includes(`vidapi-tv-${t.tmdb_id}`)) {
        list.push(t);
      }
    });
    return list;
  }, [allMovies, allTv, favorites]);

  // Filter Watch Later Media
  const watchLaterMedia = useMemo(() => {
    const list: Array<VidApiMovie | VidApiTvShow> = [];
    allMovies.forEach((m) => {
      if (watchLater.includes(`movie-${m.tmdb_id}`) || watchLater.includes(`vidapi-movie-${m.tmdb_id}`)) {
        list.push(m);
      }
    });
    allTv.forEach((t) => {
      if (watchLater.includes(`tv-${t.tmdb_id}`) || watchLater.includes(`vidapi-tv-${t.tmdb_id}`)) {
        list.push(t);
      }
    });
    return list;
  }, [allMovies, allTv, watchLater]);

  const handlePlayChannel = (c: ChannelItem) => {
    setActiveMedia({
      id: c.id,
      title: c.name,
      subtitle: c.program || `${c.category} • بث مباشر عالي الدقة`,
      type: 'channel',
      streamUrl: c.src,
      poster: c.resolvedLogo,
      isLive: true,
    });
  };

  const handleSelectMedia = (item: VidApiMovie | VidApiTvShow) => {
    if (item.type === 'movie') {
      setSelectedMovie(item as VidApiMovie);
    } else {
      setSelectedSeries(item as VidApiTvShow);
    }
  };

  const handleResumeHistory = (item: ActiveMedia) => {
    setActiveMedia(item);
  };

  return (
    <div className="px-4 md:px-8 py-5 space-y-5 select-none max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-5 md:p-6 bg-gradient-to-r from-[#17192C] via-[#111322] to-[#0D0E18] border border-purple-500/25 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF1838] to-[#990014] flex items-center justify-center shadow-[0_0_20px_rgba(255,24,56,0.55)] text-white shrink-0">
              <Bookmark className="w-6 h-6 drop-shadow" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                قائمتي ومكتبتي الشخصية
              </h1>
              <p className="text-xs text-white/60 mt-0.5">
                مساحتك الخاصة لمتابعة القنوات المفضلة، قائمة المشاهدة لاحقاً، وسجل المشاهدة
              </p>
            </div>
          </div>

          {/* Sub-Tabs Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-[#090A12] border border-white/10 self-start md:self-center shrink-0">
            <button
              onClick={() => setActiveSubTab('favorites')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                activeSubTab === 'favorites'
                  ? 'bg-[#FF1838] text-white shadow-[0_0_12px_rgba(255,24,56,0.5)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>المفضلة ({favoriteChannels.length + favoriteMedia.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('later')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                activeSubTab === 'later'
                  ? 'bg-[#FF1838] text-white shadow-[0_0_12px_rgba(255,24,56,0.5)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>المشاهدة لاحقاً ({watchLaterMedia.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                activeSubTab === 'history'
                  ? 'bg-[#FF1838] text-white shadow-[0_0_12px_rgba(255,24,56,0.5)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>سجل المشاهدة ({watchHistory.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: FAVORITES */}
      {activeSubTab === 'favorites' && (
        <div className="space-y-6">
          {/* Favorite Channels Section */}
          {favoriteChannels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-[#FF1838]" />
                <h2 className="text-sm font-bold text-white">قنواتي المفضلة ({favoriteChannels.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {favoriteChannels.map((c) => (
                  <ChannelCard key={c.id} channel={c} onPlay={handlePlayChannel} className="w-full" />
                ))}
              </div>
            </div>
          )}

          {/* Favorite Movies & TV Shows */}
          {favoriteMedia.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-[#FF1838]" />
                <h2 className="text-sm font-bold text-white">الأفلام والمسلسلات المفضلة ({favoriteMedia.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {favoriteMedia.map((m) => (
                  <MediaCard key={m.tmdb_id} item={m} onSelect={handleSelectMedia} className="w-full" />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {favoriteChannels.length === 0 && favoriteMedia.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-[#12131D] border border-white/10 space-y-3">
              <Heart className="w-12 h-12 text-white/20 mx-auto" />
              <h3 className="text-base font-bold text-white">قائمة المفضلة فارغة حالياً</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                يمكنك الضغط على أيقونة القلب في أي قناة أو فيلم أو مسلسل لإضافته إلى قائمتك المفضلة هنا.
              </p>
              <button
                onClick={() => setCurrentTab('home')}
                className="mt-2 px-5 py-2 rounded-2xl bg-[#FF1838] hover:bg-[#d60025] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                تصفح المحتوى الرئيسي
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: WATCH LATER */}
      {activeSubTab === 'later' && (
        <div className="space-y-4">
          {watchLaterMedia.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {watchLaterMedia.map((item) => (
                <MediaCard key={item.tmdb_id} item={item} onSelect={handleSelectMedia} className="w-full" />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-[#12131D] border border-white/10 space-y-3">
              <Bookmark className="w-12 h-12 text-white/20 mx-auto" />
              <h3 className="text-base font-bold text-white">لا توجد عناصر في قائمة المشاهدة لاحقاً</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                اضغط على زر "مشاهدة لاحقاً" داخل تفاصيل أي فيلم أو مسلسل لحفظه هنا والرجوع إليه متى أردت.
              </p>
              <button
                onClick={() => setCurrentTab('movies')}
                className="mt-2 px-5 py-2 rounded-2xl bg-[#FF1838] hover:bg-[#d60025] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                تصفح الأفلام والمسلسلات
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: WATCH HISTORY & CONTINUE WATCHING */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {watchHistory.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">{watchHistory.length} عنصر في سجل المشاهدة</span>
                <button
                  onClick={clearWatchHistory}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-[#FF1838] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح السجل بالكامل</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {watchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#12131D] hover:bg-[#181a29] border border-white/10 hover:border-[#FF1838]/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-12 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          <Play className="w-5 h-5 text-white/40" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF1838] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">
                          {item.subtitle || 'بث مباشر'}
                        </p>
                        <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-white/60">
                          {new Date(item.watchedAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 mr-2">
                      <button
                        onClick={() => handleResumeHistory(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF1838] hover:bg-[#d60025] text-white text-[11px] font-bold shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>تشغيل</span>
                      </button>

                      <button
                        onClick={() => removeFromWatchHistory(item.id)}
                        className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-[#12131D] border border-white/10 space-y-3">
              <History className="w-12 h-12 text-white/20 mx-auto" />
              <h3 className="text-base font-bold text-white">سجل المشاهدة فارغ</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                أي قناة أو فيلم أو مباراة تشاهدها ستظهر هنا تلقائياً لتمكنك من استئناف المشاهدة بنقرة واحدة.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dedicated Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={setActiveMedia}
        />
      )}

      {/* Dedicated Series Detail Modal */}
      {selectedSeries && (
        <SeriesDetailModal
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
          onPlay={setActiveMedia}
        />
      )}
    </div>
  );
};
