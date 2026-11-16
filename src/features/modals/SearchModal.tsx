import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, Play, Film, Tv, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ChannelItem, MatchItem, VidApiMovie, VidApiTvShow, ActiveMedia } from '../../types';
import { channelsService } from '../../services/channelsApi';
import { streamFreeService } from '../../services/streamFreeApi';
import { tmdbService } from '../../services/tmdbApi';

export const SearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    setActiveMedia,
    openMovieDetail,
    openSeriesDetail,
    language,
  } = useAppStore();

  const isRTL = language === 'ar';

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'movies' | 'tv' | 'matches' | 'channels'>('all');
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [movies, setMovies] = useState<VidApiMovie[]>([]);
  const [tvShows, setTvShows] = useState<VidApiTvShow[]>([]);

  useEffect(() => {
    if (!isSearchOpen) return;

    channelsService.getAllChannels().then(setChannels).catch(() => {});
    streamFreeService.getLiveMatches('all').then(setMatches).catch(() => {});
    tmdbService.getTrendingMovies().then(setMovies).catch(() => {});
    tmdbService.getTrendingTvShows().then(setTvShows).catch(() => {});
  }, [isSearchOpen]);

  // Live TMDB Search for query
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(() => {
      tmdbService
        .searchCatalog(query.trim())
        .then((results) => {
          const mList = results.filter((r) => r.type === 'movie') as VidApiMovie[];
          const tList = results.filter((r) => r.type === 'tv') as VidApiTvShow[];
          if (mList.length > 0) setMovies(mList);
          if (tList.length > 0) setTvShows(tList);
        })
        .catch(() => {});
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  const cleanQuery = query.trim().toLowerCase();

  const filteredChannels = useMemo(() => {
    if (!cleanQuery) return [];
    return channels
      .filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          (c.category && c.category.toLowerCase().includes(cleanQuery)) ||
          (c.program && c.program.toLowerCase().includes(cleanQuery))
      )
      .slice(0, 12);
  }, [channels, cleanQuery]);

  const filteredMatches = useMemo(() => {
    if (!cleanQuery) return [];
    return matches
      .filter(
        (m) =>
          m.name.toLowerCase().includes(cleanQuery) ||
          m.league.toLowerCase().includes(cleanQuery) ||
          (m.team1?.name && m.team1.name.toLowerCase().includes(cleanQuery)) ||
          (m.team2?.name && m.team2.name.toLowerCase().includes(cleanQuery))
      )
      .slice(0, 8);
  }, [matches, cleanQuery]);

  const filteredMovies = useMemo(() => {
    if (!cleanQuery) return [];
    return movies
      .filter(
        (m) =>
          m.title.toLowerCase().includes(cleanQuery) ||
          (m.genre && m.genre.toLowerCase().includes(cleanQuery)) ||
          (m.year && m.year.includes(cleanQuery))
      )
      .slice(0, 18);
  }, [movies, cleanQuery]);

  const filteredTvShows = useMemo(() => {
    if (!cleanQuery) return [];
    return tvShows
      .filter(
        (t) =>
          t.title.toLowerCase().includes(cleanQuery) ||
          (t.genre && t.genre.toLowerCase().includes(cleanQuery)) ||
          (t.year && t.year.includes(cleanQuery))
      )
      .slice(0, 18);
  }, [tvShows, cleanQuery]);

  const totalResultsCount =
    filteredChannels.length +
    filteredMatches.length +
    filteredMovies.length +
    filteredTvShows.length;

  // Curated Netflix-style "Top Searches" when input is empty
  const topSearches = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'movie' | 'tv' | 'match' | 'channel';
      thumbnail: string;
      rawItem: any;
    }> = [];

    // Mix top movies
    movies.slice(0, 4).forEach((m) => {
      list.push({
        id: `m-${m.tmdb_id}`,
        title: m.title,
        subtitle: `${m.year || '2026'} • ${m.genre || 'Film'}`,
        type: 'movie',
        thumbnail: m.backdrop_url || m.poster_url,
        rawItem: m,
      });
    });

    // Mix top TV shows
    tvShows.slice(0, 4).forEach((t) => {
      list.push({
        id: `t-${t.tmdb_id}`,
        title: t.title,
        subtitle: `${t.year || '2026'} • ${t.genre || 'Series'}`,
        type: 'tv',
        thumbnail: t.backdrop_url || t.poster_url,
        rawItem: t,
      });
    });

    // Fallbacks if data is still loading
    if (list.length === 0) {
      list.push(
        {
          id: 'ts-1',
          title: 'The Day of the Jackal',
          subtitle: '2026 • Thriller Series',
          type: 'tv',
          thumbnail: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=600&q=80',
          rawItem: null,
        },
        {
          id: 'ts-2',
          title: 'Outlaw King',
          subtitle: '2026 • War & Period Drama',
          type: 'movie',
          thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
          rawItem: null,
        },
        {
          id: 'ts-3',
          title: 'MobLand',
          subtitle: '2026 • Crime & Action',
          type: 'tv',
          thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80',
          rawItem: null,
        },
        {
          id: 'ts-4',
          title: 'Campus Drivers',
          subtitle: '2026 • Romance & Drama',
          type: 'movie',
          thumbnail: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
          rawItem: null,
        }
      );
    }

    return list;
  }, [movies, tvShows]);

  const handleSelectMedia = (item: VidApiMovie | VidApiTvShow) => {
    setIsSearchOpen(false);
    if (item.type === 'movie') {
      openMovieDetail(item as VidApiMovie, 'home');
    } else {
      openSeriesDetail(item as VidApiTvShow, 1, 'home');
    }
  };

  const handlePlayChannel = (c: ChannelItem) => {
    setIsSearchOpen(false);
    setActiveMedia({
      id: c.id,
      title: c.name,
      subtitle: c.program || `${c.category} • HD Live Stream`,
      type: 'channel',
      streamUrl: c.src,
      poster: c.resolvedLogo,
      isLive: true,
    });
  };

  const handlePlayMatch = (m: MatchItem) => {
    setIsSearchOpen(false);
    setActiveMedia({
      id: m.id,
      title: m.name,
      subtitle: `${m.league} • Live Stream`,
      type: 'match',
      streamUrl: m.playableUrl,
      poster: m.thumbnailUrl,
      isLive: true,
    });
  };

  const handleTopSearchClick = (item: typeof topSearches[0]) => {
    setIsSearchOpen(false);
    if (item.rawItem) {
      if (item.type === 'movie') {
        openMovieDetail(item.rawItem as VidApiMovie, 'home');
      } else {
        openSeriesDetail(item.rawItem as VidApiTvShow, 1, 'home');
      }
    } else {
      setActiveMedia({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        type: item.type === 'movie' ? 'movie' : 'tv',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: item.thumbnail,
        isLive: false,
      });
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div
      onClick={() => setIsSearchOpen(false)}
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col justify-start select-none animate-in fade-in duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto flex flex-col h-full sm:h-auto sm:max-h-[90vh] bg-[#0B0B0B] sm:border sm:border-white/10 sm:rounded-3xl sm:my-8 overflow-hidden shadow-2xl"
      >
        {/* Netflix Search Header Bar */}
        <div className="pt-[max(3rem,env(safe-area-inset-top,3rem))] sm:pt-4 pb-3 px-4 bg-[#141414] border-b border-[#232323] flex items-center gap-3 shrink-0">
          <div className="flex-1 bg-[#1C1C1E] border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 focus-within:border-white/30 transition-colors">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isRTL
                  ? 'ابحث عن فيلم، مسلسل، قناة، أو مباراة...'
                  : 'Search for movies, series, channels, matches...'
              }
              className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="text-xs font-bold text-neutral-300 hover:text-white px-2 py-1 cursor-pointer transition-colors shrink-0"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
        </div>

        {/* Category Pills (Visible when searching) */}
        {cleanQuery && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] border-b border-[#232323] overflow-x-auto no-scrollbar shrink-0 text-xs font-semibold">
            {[
              { id: 'all', label: isRTL ? `الكل (${totalResultsCount})` : `All (${totalResultsCount})` },
              { id: 'movies', label: isRTL ? `أفلام (${filteredMovies.length})` : `Movies (${filteredMovies.length})` },
              { id: 'tv', label: isRTL ? `مسلسلات (${filteredTvShows.length})` : `Series (${filteredTvShows.length})` },
              { id: 'matches', label: isRTL ? `مباريات (${filteredMatches.length})` : `Matches (${filteredMatches.length})` },
              { id: 'channels', label: isRTL ? `قنوات (${filteredChannels.length})` : `Channels (${filteredChannels.length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-[#E50914] text-white font-bold shadow'
                    : 'bg-[#1C1C1E] text-neutral-400 hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Content Body: Top Searches or Search Results */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
          {/* Empty State: Netflix Top Searches List */}
          {!cleanQuery && (
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                {isRTL ? 'عمليات البحث الأكثر شيوعاً' : 'Top Searches'}
              </h3>

              <div className="divide-y divide-[#1C1C1E] border border-white/5 rounded-2xl overflow-hidden bg-[#141414]">
                {topSearches.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleTopSearchClick(item)}
                    className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-[#1C1C1E] transition-colors cursor-pointer group"
                  >
                    {/* Thumbnail + Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#E50914] transition-colors line-clamp-1 block">
                          {item.title}
                        </span>
                        <span className="text-[10px] sm:text-xs text-neutral-400 block mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Circular Play Button Icon (Signature Netflix Search Action) */}
                    <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white shrink-0 group-hover:scale-110 group-hover:border-white group-hover:bg-white group-hover:text-black transition-all ml-2">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Query: No Results */}
          {cleanQuery && totalResultsCount === 0 && (
            <div className="py-16 text-center text-neutral-400 space-y-3">
              <Search className="w-12 h-12 mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-white">
                {isRTL ? `لا توجد نتائج تطابق "${query}"` : `No matching results found for "${query}"`}
              </p>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                {isRTL
                  ? 'جرب البحث باسم فيلم أو مسلسل آخر، أو اختر من القنوات والمباريات.'
                  : 'Try searching for another movie, TV show title, sports team, or channel.'}
              </p>
            </div>
          )}

          {/* Active Query: Results Grid */}
          {cleanQuery && totalResultsCount > 0 && (
            <div className="space-y-6">
              {/* 1. Live Matches */}
              {(activeFilter === 'all' || activeFilter === 'matches') && filteredMatches.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                    <Trophy className="w-4 h-4 text-[#E50914]" />
                    <span>{isRTL ? 'المباريات المباشرة' : 'Live Matches'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredMatches.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handlePlayMatch(m)}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#141414] hover:bg-[#1C1C1E] border border-white/5 hover:border-[#E50914]/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shrink-0">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate group-hover:text-[#E50914]">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">{m.league}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                          LIVE
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. TV Channels */}
              {(activeFilter === 'all' || activeFilter === 'channels') && filteredChannels.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                    <Tv className="w-4 h-4 text-[#E50914]" />
                    <span>{isRTL ? 'القنوات التلفزيونية' : 'Live TV Channels'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredChannels.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handlePlayChannel(c)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] hover:bg-[#1C1C1E] border border-white/5 hover:border-[#E50914]/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {c.resolvedLogo ? (
                            <img
                              src={c.resolvedLogo}
                              alt={c.name}
                              className="w-9 h-9 rounded-lg object-contain bg-black/40 p-1 shrink-0 border border-white/10"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-white/60 shrink-0">
                              <Tv className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate group-hover:text-[#E50914]">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {c.program || c.category}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded bg-[#E50914] text-white text-[10px] font-bold active:scale-95 transition-transform shrink-0"
                        >
                          {isRTL ? 'مشاهدة' : 'Watch'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Movies (Netflix 3-Column Poster Grid) */}
              {(activeFilter === 'all' || activeFilter === 'movies') && filteredMovies.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                    <Film className="w-4 h-4 text-[#E50914]" />
                    <span>{isRTL ? 'الأفلام' : 'Movies'}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {filteredMovies.map((m) => (
                      <div
                        key={m.tmdb_id}
                        onClick={() => handleSelectMedia(m)}
                        className="group flex flex-col cursor-pointer select-none"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1C1C1E] border border-white/10 group-hover:border-[#E50914]/60 transition-all duration-300 shadow-md">
                          <img
                            src={m.poster_url}
                            alt={m.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-[9px] font-bold text-yellow-400 px-1.5 py-0.2 rounded border border-white/10">
                            ★ {m.rating || '7.0'}
                          </span>
                        </div>
                        <span className="mt-1.5 text-xs font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                          {m.title}
                        </span>
                        <span className="text-[10px] text-neutral-400">{m.year || '2026'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Series (Netflix 3-Column Poster Grid) */}
              {(activeFilter === 'all' || activeFilter === 'tv') && filteredTvShows.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                    <Tv className="w-4 h-4 text-[#E50914]" />
                    <span>{isRTL ? 'المسلسلات' : 'TV Series'}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {filteredTvShows.map((t) => (
                      <div
                        key={t.tmdb_id}
                        onClick={() => handleSelectMedia(t)}
                        className="group flex flex-col cursor-pointer select-none"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1C1C1E] border border-white/10 group-hover:border-[#E50914]/60 transition-all duration-300 shadow-md">
                          <img
                            src={t.poster_url}
                            alt={t.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-[9px] font-bold text-yellow-400 px-1.5 py-0.2 rounded border border-white/10">
                            ★ {t.rating || '7.5'}
                          </span>
                        </div>
                        <span className="mt-1.5 text-xs font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                          {t.title}
                        </span>
                        <span className="text-[10px] text-neutral-400">{t.year || '2026'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
