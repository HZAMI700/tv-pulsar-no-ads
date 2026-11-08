import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Play,
  Info,
  Film,
  Clapperboard,
  Search,
  Star,
  Clock,
  Check,
  Plus,
  Layers,
  X,
  History,
  RotateCcw,
} from 'lucide-react';
import { VidApiMovie, VidApiTvShow, ActiveMedia, WatchHistoryItem } from '../../types';
import { tmdbService, MOVIE_GENRES, TV_GENRES } from '../../services/tmdbApi';
import { MediaCard } from './MediaCard';
import { MovieDetailModal } from './MovieDetailModal';
import { SeriesDetailModal } from './SeriesDetailModal';
import { useAppStore } from '../../store/useAppStore';

// Curated Sagas / Collections with 100% verified working TMDB images
const CURATED_COLLECTIONS = [
  {
    id: 'batman',
    title: 'Batman The Long Halloween',
    subtitle: 'DC Universe Collection',
    poster: 'https://image.tmdb.org/t/p/w500/sR7gppb0YGjwLvE6Vnj6wYv5MnW.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/uS9apevOgs2fuYghf9szOoK1u63.jpg',
    query: 'Batman',
    year: '2024',
  },
  {
    id: 'after',
    title: 'After Collection',
    subtitle: 'Romantic Saga',
    poster: 'https://image.tmdb.org/t/p/w500/yzDuAQCY2n6zzOlBkn6JzhLhY3k.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/k22XyPbce7zvzzf5OnT4uaY8ZD1.jpg',
    query: 'After',
    year: '2023',
  },
  {
    id: '300',
    title: '300 Collection',
    subtitle: 'Spartan Epic Series',
    poster: 'https://image.tmdb.org/t/p/w500/h7Lcio0c9ohxPhSZg42eTlKIVVY.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/lgBZlJ1LHQel5nneNQMoesmvc7l.jpg',
    query: '300',
    year: '2022',
  },
  {
    id: 'dune',
    title: 'Dune Saga',
    subtitle: 'Sci-Fi Masterpiece',
    poster: 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
    query: 'Dune',
    year: '2024',
  },
  {
    id: 'avengers',
    title: 'Marvel Avengers',
    subtitle: 'Marvel Cinematic Universe',
    poster: 'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/gHLs7Fy3DzLmLsD4lmfqL55KGcl.jpg',
    query: 'Avengers',
    year: '2023',
  },
  {
    id: 'johnwick',
    title: 'John Wick Chapters',
    subtitle: 'Action Adrenaline',
    poster: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/7I6VUdPj6tQECNHdviJkUHD2u89.jpg',
    query: 'John Wick',
    year: '2023',
  },
  {
    id: 'spider',
    title: 'Spider-Man Across the Multiverse',
    subtitle: 'Animation Marvel',
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/kVd3a9YeLGkoeR50jGEXM6EqseS.jpg',
    query: 'Spider-Man',
    year: '2024',
  },
  {
    id: 'harry',
    title: 'Harry Potter Saga',
    subtitle: 'Wizarding World',
    poster: 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/bfh9Z3Ghz4FOJAfLOAhmc3ccnHU.jpg',
    query: 'Harry Potter',
    year: '2023',
  },
];

const YEARS = [
  { id: 'all', label: 'All Years' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
  { id: '2022', label: '2022' },
  { id: '2021', label: '2021' },
  { id: '2020', label: '2020' },
  { id: '2019', label: '2019' },
  { id: '2015', label: '2015' },
];

const SORT_OPTIONS = [
  { id: 'popularity.desc', label: 'Trending Now' },
  { id: 'primary_release_date.desc', label: 'New Releases' },
  { id: 'vote_average.desc', label: 'Highest Rated' },
];

export const DiscoverPage: React.FC = () => {
  const {
    setActiveMedia,
    isFavorite,
    toggleFavorite,
    watchHistory,
    removeFromWatchHistory,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const [viewMode, setViewMode] = useState<'rails' | 'grid'>('rails');

  // Hero carousel (5 items)
  const [heroIndex, setHeroIndex] = useState(0);

  // Rails Data
  const [trendingList, setTrendingList] = useState<(VidApiMovie | VidApiTvShow)[]>([]);
  const [topRatedList, setTopRatedList] = useState<(VidApiMovie | VidApiTvShow)[]>([]);
  const [actionList, setActionList] = useState<(VidApiMovie | VidApiTvShow)[]>([]);
  const [animeList, setAnimeList] = useState<(VidApiMovie | VidApiTvShow)[]>([]);

  // Infinite Scroll State
  const [items, setItems] = useState<(VidApiMovie | VidApiTvShow)[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<(VidApiMovie | VidApiTvShow)[] | null>(null);
  const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'movies' | 'tv'>('all');

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Modals
  const [selectedMovie, setSelectedMovie] = useState<VidApiMovie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<VidApiTvShow | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const activeGenres = activeTab === 'movies' ? MOVIE_GENRES : TV_GENRES;

  // Initial Rails Loading
  useEffect(() => {
    let isMounted = true;
    async function loadRails() {
      try {
        const [trendingMovies, trendingTv, topMovies, actionRes, animeRes] = await Promise.all([
          tmdbService.getTrendingMovies().catch(() => []),
          tmdbService.getTrendingTvShows().catch(() => []),
          tmdbService.discoverMovies({ page: 1, sortBy: 'vote_average.desc' }).catch(() => ({ items: [] })),
          tmdbService.discoverMovies({ page: 1, genreId: '28', sortBy: 'popularity.desc' }).catch(() => ({ items: [] })),
          tmdbService.discoverTvShows({ page: 1, genreId: '16', sortBy: 'popularity.desc' }).catch(() => ({ items: [] })),
        ]);

        if (!isMounted) return;

        setTrendingList([...trendingMovies, ...trendingTv]);
        setTopRatedList(topMovies.items || []);
        setActionList(actionRes.items || []);
        setAnimeList(animeRes.items || []);
      } catch (e) {
        console.error('Failed to load rails content', e);
      }
    }
    loadRails();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Page 1 for Catalog
  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setPage(1);
    try {
      if (activeTab === 'movies') {
        const res = await tmdbService.discoverMovies({
          page: 1,
          genreId: selectedGenre,
          year: selectedYear,
          sortBy,
        });
        setItems(res.items);
        setTotalPages(res.totalPages);
      } else {
        const res = await tmdbService.discoverTvShows({
          page: 1,
          genreId: selectedGenre,
          year: selectedYear,
          sortBy,
        });
        setItems(res.items);
        setTotalPages(res.totalPages);
      }
    } catch (e) {
      console.error('Failed to load initial catalog', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedGenre, selectedYear, sortBy]);

  // Load More for Infinite Scroll
  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      let res: { items: (VidApiMovie | VidApiTvShow)[]; totalPages: number };
      if (activeTab === 'movies') {
        res = await tmdbService.discoverMovies({
          page: nextPage,
          genreId: selectedGenre,
          year: selectedYear,
          sortBy,
        });
      } else {
        res = await tmdbService.discoverTvShows({
          page: nextPage,
          genreId: selectedGenre,
          year: selectedYear,
          sortBy,
        });
      }
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => `${i.type}-${i.tmdb_id}`));
        const fresh = res.items.filter((i) => !existingIds.has(`${i.type}-${i.tmdb_id}`));
        return [...prev, ...fresh];
      });
      setPage(nextPage);
    } catch (e) {
      console.error('Error loading next page', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, page, totalPages, activeTab, selectedGenre, selectedYear, sortBy]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !isLoadingMore && page < totalPages) {
          loadNextPage();
        }
      },
      { root: null, rootMargin: '400px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage, isLoading, isLoadingMore, page, totalPages]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      loadFirstPage();
    }
  }, [loadFirstPage, searchQuery]);

  // Live In-Section Search Debounce (Shows BOTH Movies and Series)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await tmdbService.searchCatalog(searchQuery);
        // User requirement: show results from BOTH movies and series!
        setSearchResults(results);
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setIsLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hero carousel auto-timer
  useEffect(() => {
    if (trendingList.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(5, trendingList.length));
    }, 6500);
    return () => clearInterval(interval);
  }, [trendingList]);

  const handleTabChange = (tab: 'movies' | 'tv') => {
    setActiveTab(tab);
    setSelectedGenre('all');
    setSelectedYear('all');
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleSelectMedia = (item: VidApiMovie | VidApiTvShow) => {
    if (item.type === 'movie') {
      setSelectedMovie(item as VidApiMovie);
    } else {
      setSelectedSeries(item as VidApiTvShow);
    }
  };

  const handlePlayFromModal = (media: ActiveMedia) => {
    setSelectedMovie(null);
    setSelectedSeries(null);
    setActiveMedia(media);
  };

  const handleResumeHistory = (item: WatchHistoryItem) => {
    const rawId = (item.tvMeta?.tmdbId || item.id)
      .toString()
      .replace(/^(?:vidapi-)?(?:movie|tv)-/, '')
      .split(/[-_sSeE]/)[0]
      .replace(/[^0-9]/g, '');

    let streamUrl = item.streamUrl;

    if (item.type === 'tv') {
      const season = item.tvMeta?.season || 1;
      const episode = item.tvMeta?.episode || 1;
      streamUrl = tmdbService.buildTvEmbedUrl(rawId || item.id, season, episode, item.timestamp);
    } else if (item.type === 'movie') {
      streamUrl = tmdbService.buildMovieEmbedUrl(rawId || item.id, item.timestamp);
    }

    setActiveMedia({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      type: item.type,
      streamUrl,
      poster: item.poster,
      resumeTime: item.timestamp,
      totalDuration: item.duration,
      isLive: false,
      tvMeta: item.tvMeta,
    });
  };

  const heroItem =
    trendingList.length > 0
      ? trendingList[heroIndex % Math.min(5, trendingList.length)]
      : null;

  const handlePlayHero = () => {
    if (!heroItem) return;
    if (heroItem.type === 'movie') {
      setActiveMedia({
        id: `movie-${heroItem.tmdb_id}`,
        title: heroItem.title,
        subtitle: `${heroItem.year} • ${heroItem.genre || 'Cinema'} • Rating ${heroItem.rating}`,
        type: 'movie',
        streamUrl: tmdbService.buildMovieEmbedUrl(heroItem.tmdb_id),
        poster: heroItem.poster_url,
        isLive: false,
      });
    } else {
      handleSelectMedia(heroItem);
    }
  };

  const displayedList = useMemo(() => {
    if (searchResults !== null) {
      if (searchTypeFilter === 'movies') {
        return searchResults.filter((r) => r.type === 'movie');
      }
      if (searchTypeFilter === 'tv') {
        return searchResults.filter((r) => r.type === 'tv');
      }
      return searchResults;
    }
    return items;
  }, [searchResults, searchTypeFilter, items]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Filter watch history strictly to movies and TV series only
  const movieSeriesHistory = useMemo(() => {
    return (watchHistory || []).filter(
      (item) => item && item.id && (item.type === 'movie' || item.type === 'tv')
    );
  }, [watchHistory]);

  return (
    <div className="pb-24 select-none max-w-[1700px] mx-auto text-white motion-page">
      {/* 1. Dedicated In-Section Search Bar (Top of Movies Section) */}
      <div className="px-4 md:px-8 pt-3 pb-2">
        <div className="relative flex flex-col items-center w-full max-w-xl mx-auto space-y-2">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن فيلم أو مسلسل بالإنجليزية أو العربية..."
              className="w-full h-11 pr-10 pl-10 rounded-2xl bg-[#141624]/95 border border-white/15 focus:border-[#E50914] text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none shadow-xl transition-all duration-200"
            />
            <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-white/50 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Search Type Switcher (Shows BOTH by default, with easy toggle) */}
          {searchQuery && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setSearchTypeFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer motion-press ${
                  searchTypeFilter === 'all'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                الكل (أفلام ومسلسلات)
              </button>
              <button
                onClick={() => setSearchTypeFilter('movies')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer motion-press ${
                  searchTypeFilter === 'movies'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                أفلام فقط
              </button>
              <button
                onClick={() => setSearchTypeFilter('tv')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer motion-press ${
                  searchTypeFilter === 'tv'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                مسلسلات فقط
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Immersive Hero Spotlight Banner (Top Slider Cards) */}
      {!searchQuery && !heroItem && (
        <div className="relative w-full h-[50vh] sm:h-[58vh] max-h-[520px] overflow-hidden bg-[#10121F] animate-pulse flex flex-col justify-end p-6">
          <div className="max-w-md space-y-3 mx-auto text-center flex flex-col items-center">
            <div className="h-8 w-48 bg-white/10 rounded-xl" />
            <div className="h-4 w-24 bg-white/10 rounded-lg" />
            <div className="flex gap-3 pt-2">
              <div className="h-10 w-28 bg-white/20 rounded-xl" />
              <div className="h-10 w-28 bg-white/10 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {!searchQuery && heroItem && (
        <div className="relative w-full h-[52vh] sm:h-[60vh] max-h-[560px] overflow-hidden bg-black transition-all duration-300">
          <img
            src={heroItem.backdrop_url || heroItem.poster_url}
            alt={heroItem.title}
            className="w-full h-full object-cover object-center filter brightness-90 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080D]/80 via-transparent to-transparent" />

          {/* Hero Content Overlay */}
          <div className="absolute bottom-5 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 z-10 flex flex-col items-center text-center space-y-3">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl max-w-2xl line-clamp-2">
              {heroItem.title}
            </h1>
            <span className="text-xs sm:text-sm text-white/80 font-bold drop-shadow">
              {heroItem.year || '2026'}
            </span>

            {/* Side-by-side Play & Information buttons */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={handlePlayHero}
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-white/90 text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer motion-press"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                <span>Play</span>
              </button>

              <button
                onClick={() => handleSelectMedia(heroItem)}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#2A2A2A]/80 hover:bg-[#3A3A3A] text-white font-bold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md active:scale-95 transition-all cursor-pointer border border-white/10 motion-press"
              >
                <Info className="w-4 h-4 text-white" />
                <span>Information</span>
              </button>
            </div>

            {/* Carousel indicator dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    heroIndex % 5 === idx
                      ? 'w-6 bg-[#E50914] shadow-[0_0_8px_#E50914]'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Continue Watching (متابعة المشاهدة) - Strictly UNDER the Main Top Slider & Only for Movies and Series */}
      {!searchQuery && movieSeriesHistory && movieSeriesHistory.length > 0 && (
        <section className="px-4 md:px-8 pt-4 pb-2 space-y-2.5">
          <div className="flex items-center justify-between text-white/90">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#FF1838]" />
              <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                متابعة المشاهدة (سجل العرض)
              </h3>
            </div>
            <span className="text-[10px] text-white/40 font-bold">أفلام ومسلسلات فقط</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {movieSeriesHistory.map((item) => {
              const sec = Math.floor(item.timestamp || 0);
              const m = Math.floor(sec / 60);
              const s = Math.floor(sec % 60);
              const timeDisplay = `${m}:${s < 10 ? '0' : ''}${s}`;

              return (
                <div
                  key={item.id}
                  onClick={() => handleResumeHistory(item)}
                  className="group relative w-[150px] sm:w-[175px] aspect-[16/9] rounded-2xl overflow-hidden bg-[#12131D] border border-white/15 hover:border-[#FF1838]/80 cursor-pointer shrink-0 t-card shadow-lg active:scale-96 transition-all"
                >
                  <img
                    src={
                      item.poster ||
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-2">
                    <span className="text-[11px] font-bold text-white truncate drop-shadow">
                      {item.tvMeta?.showTitle || item.title}
                    </span>
                    <div className="flex items-center justify-between text-[9px] text-white/80 mt-0.5">
                      <span className="text-[#00E676] font-bold flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5 text-[#00E676]" />
                        <span>
                          {item.tvMeta?.season && item.tvMeta?.episode
                            ? `S${item.tvMeta.season}:E${item.tvMeta.episode} (${timeDisplay})`
                            : `دقيقة ${m}`}
                        </span>
                      </span>
                      <span className="px-1 py-0.2 rounded bg-black/60 text-[8px] font-bold text-white/70">
                        {item.type === 'tv' ? 'مسلسل' : 'فيلم'}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1 rounded-full bg-white/20 mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#FF1838] rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(10, ((item.timestamp || 0) / (item.duration || 3600)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchHistory(item.id);
                    }}
                    className="absolute top-1.5 left-1.5 p-1 rounded-full bg-black/70 hover:bg-[#FF1838] text-white/70 hover:text-white transition-colors"
                    title="إزالة من السجل"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Mode Switcher: Collections & Rails vs Infinite Grid */}
      <div className="px-4 md:px-8 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('rails')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer motion-press ${
              viewMode === 'rails'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            Collections & Rails
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer motion-press flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>تصفح شامل (Infinite Scroll)</span>
          </button>
        </div>

        {viewMode === 'grid' && (
          <div className="flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => handleTabChange('movies')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'movies' ? 'bg-[#E50914] text-white' : 'text-white/60'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => handleTabChange('tv')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                activeTab === 'tv' ? 'bg-[#E50914] text-white' : 'text-white/60'
              }`}
            >
              Series
            </button>
          </div>
        )}
      </div>

      {/* 5. RAILS VIEW: Collections, Trending, Top Rated (Matching Screenshot 2 & 3) */}
      {viewMode === 'rails' && !searchQuery && (
        <div className="space-y-6 pt-2">
          {/* Rail 1: Collections (Fixed high-res verified images with graceful fallback) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4 md:px-8">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Collections
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 md:px-8 scroll-smooth">
              {CURATED_COLLECTIONS.map((col) => (
                <div
                  key={col.id}
                  onClick={() => {
                    setSearchQuery(col.query);
                    setViewMode('grid');
                  }}
                  className="w-[125px] sm:w-[150px] aspect-[2/3] rounded-2xl overflow-hidden relative cursor-pointer group shrink-0 border border-white/10 hover:border-white/40 transition-all duration-300 t-card bg-[#141624]"
                >
                  <img
                    src={col.poster}
                    alt={col.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-2.5">
                    <span className="text-[11px] font-black text-white leading-tight drop-shadow">
                      {col.title}
                    </span>
                    <span className="text-[9px] text-[#FF1838] font-bold mt-0.5">
                      {col.subtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rail 2: Trending Now */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4 md:px-8">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Trending Now
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 md:px-8 scroll-smooth">
              {trendingList.length > 0
                ? trendingList.slice(0, 16).map((item) => (
                    <div key={`trend-${item.type}-${item.tmdb_id}`} className="shrink-0 w-[125px] sm:w-[150px]">
                      <MediaCard
                        item={item}
                        className="w-full"
                        onSelect={() => handleSelectMedia(item)}
                      />
                    </div>
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="shrink-0 w-[125px] sm:w-[150px] aspect-[2/3] rounded-2xl bg-white/5 animate-pulse"
                    />
                  ))}
            </div>
          </section>

          {/* Rail 3: Top Rated */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-4 md:px-8">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Top Rated
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 md:px-8 scroll-smooth">
              {topRatedList.length > 0
                ? topRatedList.slice(0, 16).map((item) => (
                    <div key={`top-${item.type}-${item.tmdb_id}`} className="shrink-0 w-[125px] sm:w-[150px]">
                      <MediaCard
                        item={item}
                        className="w-full"
                        onSelect={() => handleSelectMedia(item)}
                      />
                    </div>
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="shrink-0 w-[125px] sm:w-[150px] aspect-[2/3] rounded-2xl bg-white/5 animate-pulse"
                    />
                  ))}
            </div>
          </section>

          {/* Rail 4: Action & Thriller */}
          {actionList.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-4 md:px-8">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Action & Thriller
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 md:px-8 scroll-smooth">
                {actionList.slice(0, 16).map((item) => (
                  <div key={`act-${item.type}-${item.tmdb_id}`} className="shrink-0 w-[125px] sm:w-[150px]">
                    <MediaCard
                      item={item}
                      className="w-full"
                      onSelect={() => handleSelectMedia(item)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rail 5: Anime & Animation */}
          {animeList.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-4 md:px-8">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Anime & Animation
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 md:px-8 scroll-smooth">
                {animeList.slice(0, 16).map((item) => (
                  <div key={`ani-${item.type}-${item.tmdb_id}`} className="shrink-0 w-[125px] sm:w-[150px]">
                    <MediaCard
                      item={item}
                      className="w-full"
                      onSelect={() => handleSelectMedia(item)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Seamless Infinite Scroll Catalog Section directly below curated rails */}
          <section className="space-y-4 px-4 md:px-8 pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  استكشف المزيد من الأفلام والمسلسلات
                </h2>
                <p className="text-xs text-white/50">
                  تصفح لا نهائي لآلاف العناوين العالمية مع التحديث التلقائي
                </p>
              </div>

              {/* Quick Type Switcher (Movies / Series) */}
              <div className="flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10 text-xs self-start sm:self-auto">
                <button
                  onClick={() => handleTabChange('movies')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'movies' ? 'bg-[#E50914] text-white shadow' : 'text-white/60 hover:text-white'
                  }`}
                >
                  أفلام (Movies)
                </button>
                <button
                  onClick={() => handleTabChange('tv')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'tv' ? 'bg-[#E50914] text-white shadow' : 'text-white/60 hover:text-white'
                  }`}
                >
                  مسلسلات (Series)
                </button>
              </div>
            </div>

            {/* Infinite Titles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {items.map((item, idx) => (
                <div
                  key={`rails-infinite-${item.type}-${item.tmdb_id}-${idx}`}
                  className="w-full t-fade-in"
                >
                  <MediaCard
                    item={item}
                    className="w-full"
                    onSelect={() => handleSelectMedia(item)}
                  />
                </div>
              ))}
            </div>

            {/* Infinite Scroll Sentinel for Rails View */}
            <div ref={viewMode === 'rails' ? sentinelRef : undefined} className="h-16 flex items-center justify-center py-4">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-5 h-5 rounded-full border-2 border-[#E50914]/30 border-t-[#E50914] animate-spin" />
                  <span>جاري تحميل المزيد من العناوين تلقائياً...</span>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* 6. INFINITE SCROLL GRID (When grid mode or searching) */}
      {(viewMode === 'grid' || searchQuery) && (
        <div className="px-4 md:px-8 space-y-4 pt-2">
          {/* Filters Bar: Genre, Year, Sort */}
          <div className="flex flex-wrap items-center gap-2 bg-[#141624]/80 p-3 rounded-2xl border border-white/10">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="h-9 px-3 rounded-xl bg-black/60 border border-white/15 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {activeGenres.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#141624]">
                  {g.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-9 px-3 rounded-xl bg-black/60 border border-white/15 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y.id} value={y.id} className="bg-[#141624]">
                  {y.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 rounded-xl bg-black/60 border border-white/15 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#141624]">
                  {s.label}
                </option>
              ))}
            </select>

            <span className="text-xs text-white/50 mr-auto">
              {displayedList.length} titles loaded
            </span>
          </div>

          {/* Titles Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : displayedList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {displayedList.map((item, idx) => (
                <div
                  key={`${item.type}-${item.tmdb_id}-${idx}`}
                  className="w-full t-fade-in"
                >
                  <MediaCard
                    item={item}
                    className="w-full"
                    onSelect={() => handleSelectMedia(item)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-white/50 text-sm">
              لم يتم العثور على نتائج مطابقة للبحث.
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          {!searchQuery && (
            <div ref={viewMode === 'grid' ? sentinelRef : undefined} className="h-14 flex items-center justify-center py-4">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-5 h-5 rounded-full border-2 border-[#E50914]/30 border-t-[#E50914] animate-spin" />
                  <span>جاري تحميل المزيد من العناوين تلقائياً...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dedicated Movie Detail Full-Screen View */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={handlePlayFromModal}
        />
      )}

      {/* Dedicated Series Detail Full-Screen View */}
      {selectedSeries && (
        <SeriesDetailModal
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
          onPlay={handlePlayFromModal}
        />
      )}
    </div>
  );
};
