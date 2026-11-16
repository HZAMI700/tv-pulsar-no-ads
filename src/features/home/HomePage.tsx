import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Search, Play, Plus, ChevronRight, Check, Loader2, Info } from 'lucide-react';
import { ChannelItem, VidApiMovie, VidApiTvShow, MatchItem, ActiveMedia } from '../../types';
import { streamFreeService } from '../../services/streamFreeApi';
import { channelsService } from '../../services/channelsApi';
import { tmdbService } from '../../services/tmdbApi';
import { useAppStore } from '../../store/useAppStore';
import { ContentRail } from './ContentRail';
import { MediaCard } from '../discover/MediaCard';
import { ChannelCard } from '../channels/ChannelCard';
import { ShimmerRail } from '../../design-system/components/ShimmerLoader';

interface DynamicRail {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  items: (VidApiMovie | VidApiTvShow)[];
}

interface HomeCache {
  matches: MatchItem[];
  channels: ChannelItem[];
  movies: VidApiMovie[];
  latestMovies: VidApiMovie[];
  actionMovies: VidApiMovie[];
  tvShows: VidApiTvShow[];
  dynamicRails: DynamicRail[];
  timestamp: number;
}

let homeDataCache: HomeCache | null = null;
const INFINITE_GENRE_DEFINITIONS = [
  { id: 'comedy', title: 'Comedy & Laughs', titleAr: 'أفلام كوميدية ممتعة', subtitle: 'Feel-good comedy hits', subtitleAr: 'أحدث الأفلام الكوميدية', type: 'movie' as const, genreId: '35' },
  { id: 'scifi', title: 'Sci-Fi & Cyberpunk', titleAr: 'خيال علمي وفانتازيا', subtitle: 'Futuristic worlds & technology', subtitleAr: 'عوالم مستقبلية وإثارة', type: 'movie' as const, genreId: '878' },
  { id: 'animation', title: 'Top Animation & Anime', titleAr: 'أفضل أفلام الرسوم المتحركة والأنيمي', subtitle: 'Anime & animated blockbusters', subtitleAr: 'إنتاجات عالمية وترجمات كاملة', type: 'movie' as const, genreId: '16' },
  { id: 'crime', title: 'Crime, Mystery & Noir', titleAr: 'جريمة وتشويق وغموض', subtitle: 'Intense detective thrillers', subtitleAr: 'أقوى قصص الغموض والتحقيق', type: 'movie' as const, genreId: '80' },
  { id: 'horror', title: 'Horror & Suspense', titleAr: 'أفلام الرعب والإثارة', subtitle: 'Chills & thrilling scares', subtitleAr: 'أجواء مرعبة وتشويق متواصل', type: 'movie' as const, genreId: '27' },
  { id: 'adventure', title: 'Epic Adventures', titleAr: 'مغامرات ملحمية', subtitle: 'Grand quests & journeys', subtitleAr: 'رحلات واستكشافات ملحمية', type: 'movie' as const, genreId: '12' },
  { id: 'scifi-tv', title: 'Sci-Fi & Fantasy Series', titleAr: 'مسلسلات خيال علمي', subtitle: 'Binge-worthy sci-fi seasons', subtitleAr: 'عوالم فانتازيا ومسلسلات متكاملة', type: 'tv' as const, genreId: '10765' },
  { id: 'drama', title: 'Award-Winning Dramas', titleAr: 'دراما عالمية وجوائز', subtitle: 'Compelling emotional cinema', subtitleAr: 'أعمال درامية حائزة على جوائز', type: 'movie' as const, genreId: '18' },
  { id: 'action-tv', title: 'Action & Adventure Series', titleAr: 'مسلسلات الأكشن والمغامرة', subtitle: 'High-adrenaline TV productions', subtitleAr: 'إثارة وأكشن لا يتوقف', type: 'tv' as const, genreId: '10759' },
  { id: 'romance', title: 'Romance & Heartfelt', titleAr: 'رومانسية ومشاعر', subtitle: 'Love stories & dramas', subtitleAr: 'قصص حب رومانسية مؤثرة', type: 'movie' as const, genreId: '10749' },
];

function formatGenresBullet(genreStr?: string, defaultGenres = 'Action • Drama • Thriller'): string {
  if (!genreStr) return defaultGenres;
  const parts = genreStr.split(/[,/|•]/).map((g) => g.trim()).filter(Boolean);
  if (parts.length === 0) return defaultGenres;
  return parts.slice(0, 5).join(' • ');
}

export const HomePage: React.FC = () => {
  const {
    setActiveMedia,
    setCurrentTab,
    setIsSearchOpen,
    openMovieDetail,
    openSeriesDetail,
    watchHistory,
    isFavorite,
    toggleFavorite,
    language,
  } = useAppStore();

  const isRTL = language === 'ar';

  const [channels, setChannels] = useState<ChannelItem[]>(() => homeDataCache?.channels || []);
  const [movies, setMovies] = useState<VidApiMovie[]>(() => homeDataCache?.movies || []);
  const [latestMovies, setLatestMovies] = useState<VidApiMovie[]>(() => homeDataCache?.latestMovies || []);
  const [actionMovies, setActionMovies] = useState<VidApiMovie[]>(() => homeDataCache?.actionMovies || []);
  const [tvShows, setTvShows] = useState<VidApiTvShow[]>(() => homeDataCache?.tvShows || []);
  const [dynamicRails, setDynamicRails] = useState<DynamicRail[]>(() => homeDataCache?.dynamicRails || []);
  const [isLoading, setIsLoading] = useState(() => !homeDataCache);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreRails, setHasMoreRails] = useState(true);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);

  const currentRailIndexRef = useRef(homeDataCache?.dynamicRails?.length || 0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial Data Load
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [liveMatches, allChannels, trendingMovies, newMovies, actionRes, trendingTv] =
          await Promise.all([
            streamFreeService.getLiveMatches('all').catch(() => []),
            channelsService.getAllChannels().catch(() => []),
            tmdbService.getTrendingMovies().catch(() => []),
            tmdbService.getLatestMovies().catch(() => []),
            tmdbService.discoverMovies({ page: 1, genreId: '28', sortBy: 'popularity.desc' }).catch(() => ({ items: [] })),
            tmdbService.getTrendingTvShows().catch(() => []),
          ]);

        if (!isMounted) return;

        setChannels(allChannels);
        setMovies(trendingMovies);
        setLatestMovies(newMovies);
        setActionMovies(actionRes.items || []);
        setTvShows(trendingTv);

        homeDataCache = {
          matches: liveMatches,
          channels: allChannels,
          movies: trendingMovies,
          latestMovies: newMovies,
          actionMovies: actionRes.items || [],
          tvShows: trendingTv,
          dynamicRails: dynamicRails || [],
          timestamp: Date.now(),
        };
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (!homeDataCache) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Infinite Scroll: Load Next Genre / Discovery Rail
  const loadNextRail = useCallback(async () => {
    if (isLoadingMore || !hasMoreRails) return;
    setIsLoadingMore(true);

    try {
      const railIdx = currentRailIndexRef.current;
      let nextRail: DynamicRail | null = null;

      if (railIdx < INFINITE_GENRE_DEFINITIONS.length) {
        const def = INFINITE_GENRE_DEFINITIONS[railIdx];
        if (def.type === 'movie') {
          const res = await tmdbService.discoverMovies({ page: 1, genreId: def.genreId, sortBy: 'popularity.desc' });
          if (res.items && res.items.length > 0) {
            nextRail = {
              id: def.id,
              title: def.title,
              titleAr: def.titleAr,
              subtitle: def.subtitle,
              subtitleAr: def.subtitleAr,
              items: res.items,
            };
          }
        } else {
          const res = await tmdbService.discoverTvShows({ page: 1, genreId: def.genreId, sortBy: 'popularity.desc' });
          if (res.items && res.items.length > 0) {
            nextRail = {
              id: def.id,
              title: def.title,
              titleAr: def.titleAr,
              subtitle: def.subtitle,
              subtitleAr: def.subtitleAr,
              items: res.items,
            };
          }
        }
      } else {
        // Fallback to progressive pages of popular discoveries
        const pageNum = Math.floor((railIdx - INFINITE_GENRE_DEFINITIONS.length) / 2) + 2;
        const isMovie = railIdx % 2 === 0;

        if (isMovie) {
          const res = await tmdbService.discoverMovies({ page: pageNum, sortBy: 'popularity.desc' });
          if (res.items && res.items.length > 0) {
            nextRail = {
              id: `discover-movies-p${pageNum}`,
              title: `Global Discoveries • Page ${pageNum}`,
              titleAr: `اكتشف المزيد من الأفلام العالمية • صفحة ${pageNum}`,
              subtitle: 'Popular cinema hits from across the globe',
              subtitleAr: 'أحدث الأفلام العالمية المتنوعة',
              items: res.items,
            };
          }
        } else {
          const res = await tmdbService.discoverTvShows({ page: pageNum, sortBy: 'popularity.desc' });
          if (res.items && res.items.length > 0) {
            nextRail = {
              id: `discover-tv-p${pageNum}`,
              title: `Global Series • Page ${pageNum}`,
              titleAr: `مسلسلات عالمية مختارة • صفحة ${pageNum}`,
              subtitle: 'Engaging television sagas and seasons',
              subtitleAr: 'مواسم جديدة وحلقات حصرية',
              items: res.items,
            };
          }
        }
      }

      if (nextRail) {
        currentRailIndexRef.current += 1;
        setDynamicRails((prev) => {
          const updated = [...prev, nextRail!];
          if (homeDataCache) {
            homeDataCache.dynamicRails = updated;
          }
          return updated;
        });
      } else if (railIdx > 30) {
        setHasMoreRails(false);
      }
    } catch (e) {
      console.warn('Could not load next infinite rail', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreRails]);

  // Set up Sentinel IntersectionObserver for smooth infinite loading
  useEffect(() => {
    if (!sentinelRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoading && !isLoadingMore && hasMoreRails) {
          loadNextRail();
        }
      },
      { rootMargin: '600px 0px 600px 0px' }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadNextRail, isLoading, isLoadingMore, hasMoreRails]);

  const continueWatchingList = useMemo(() => {
    if (watchHistory && watchHistory.length > 0) {
      return watchHistory.filter((item) => item && item.id);
    }
    return [
      {
        id: 'cw1',
        title: 'MobLand - S2 E4',
        subtitle: 'S02:E04 • 32m remaining',
        type: 'tv' as const,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=80',
        progress: 75,
      },
      {
        id: 'cw2',
        title: 'Ebenezer',
        subtitle: '1080p • 45m remaining',
        type: 'movie' as const,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80',
        progress: 60,
      },
      {
        id: 'cw3',
        title: 'DEAD-END JOB',
        subtitle: 'S01:E01 • 18m remaining',
        type: 'tv' as const,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=500&q=80',
        progress: 88,
      },
    ];
  }, [watchHistory]);

  const top10List = useMemo(() => {
    if (movies.length >= 3) return movies.slice(0, 10);
    if (latestMovies.length >= 3) return latestMovies.slice(0, 10);
    return [
      {
        tmdb_id: 't1',
        title: 'Campus Drivers',
        year: '2026',
        rating: '8.4',
        genre: 'Drama',
        poster_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=400&q=80',
        type: 'movie' as const,
        popularity: '98',
        embed_url: '',
      },
      {
        tmdb_id: 't2',
        title: 'Sicario',
        year: '2026',
        rating: '8.8',
        genre: 'Action Thriller',
        poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
        type: 'movie' as const,
        popularity: '95',
        embed_url: '',
      },
      {
        tmdb_id: 't3',
        title: 'The Odyssey',
        year: '2026',
        rating: '8.2',
        genre: 'Adventure',
        poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        type: 'movie' as const,
        popularity: '90',
        embed_url: '',
      },
    ];
  }, [movies, latestMovies]);

  // Curated Featured Slider Items (matching Netflix Mobile Full-Bleed Hero Banner)
  const featuredItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      type: 'movie' | 'tv';
      badge: string;
      badgeAr: string;
      genres: string;
      genresAr: string;
      backdrop: string;
      mediaItem: VidApiMovie | VidApiTvShow | null;
    }> = [];

    // 1. Featured Series (e.g. The Day of the Jackal)
    if (tvShows.length > 0) {
      const t0 = tvShows[0];
      list.push({
        id: `hero-tv-${t0.tmdb_id}`,
        title: (t0.title || 'THE DAY OF THE JACKAL').toUpperCase(),
        type: 'tv',
        badge: 'A PULSAR SERIES',
        badgeAr: 'مسلسل أصلي من PULSAR',
        genres: formatGenresBullet(t0.genre, 'Thriller • Mystery • Espionage • High Stakes'),
        genresAr: 'إثارة • غموض • جاسوسية • تشويق عالي',
        backdrop:
          t0.backdrop_url ||
          t0.poster_url ||
          'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1200&q=85',
        mediaItem: t0,
      });
    }

    // 2. Featured Film (e.g. Outlaw King / Sicario)
    if (movies.length > 0) {
      const m0 = movies[0];
      list.push({
        id: `hero-m-${m0.tmdb_id}`,
        title: (m0.title || 'OUTLAW KING').toUpperCase(),
        type: 'movie',
        badge: 'A PULSAR FILM',
        badgeAr: 'فيلم أصلي من PULSAR',
        genres: formatGenresBullet(m0.genre, 'Middle Ages • Royalty • War • Rousing • Period Piece'),
        genresAr: 'تاريخي • حروب • ملحمي • إثارة • دراما',
        backdrop:
          m0.backdrop_url ||
          m0.poster_url ||
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85',
        mediaItem: m0,
      });
    }

    // 3. Featured Cinema Release
    if (latestMovies.length > 0) {
      const m1 = latestMovies[0];
      list.push({
        id: `hero-lat-${m1.tmdb_id}`,
        title: (m1.title || 'CAMPUS DRIVERS').toUpperCase(),
        type: 'movie',
        badge: 'A PULSAR FILM',
        badgeAr: 'فيلم سينمائي جديد',
        genres: formatGenresBullet(m1.genre, 'Drama • Romance • Youth • High Energy'),
        genresAr: 'دراما • شبابي • سرعة • رومانسي',
        backdrop:
          m1.backdrop_url ||
          m1.poster_url ||
          'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=85',
        mediaItem: m1,
      });
    }

    // 4. Featured Secondary Series
    if (tvShows.length > 1) {
      const t1 = tvShows[1];
      list.push({
        id: `hero-tv2-${t1.tmdb_id}`,
        title: (t1.title || 'MOBLAND').toUpperCase(),
        type: 'tv',
        badge: 'A PULSAR SERIES',
        badgeAr: 'مسلسل أصلي من PULSAR',
        genres: formatGenresBullet(t1.genre, 'Crime • Mafia • Suspense • Dark'),
        genresAr: 'جريمة • مافيا • دراما مظلمة • تشويق',
        backdrop:
          t1.backdrop_url ||
          t1.poster_url ||
          'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85',
        mediaItem: t1,
      });
    }

    // 5. Featured Action Adventure
    if (actionMovies.length > 0) {
      const a0 = actionMovies[0];
      list.push({
        id: `hero-act-${a0.tmdb_id}`,
        title: (a0.title || 'THE ODYSSEY').toUpperCase(),
        type: 'movie',
        badge: 'A PULSAR FILM',
        badgeAr: 'فيلم أصلي من PULSAR',
        genres: formatGenresBullet(a0.genre, 'Action • Sci-Fi • Adventure • Blockbuster'),
        genresAr: 'أكشن • خيال علمي • مغامرات • إنتاج ضخم',
        backdrop:
          a0.backdrop_url ||
          a0.poster_url ||
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
        mediaItem: a0,
      });
    }

    // Static fallback items if API is empty or offline
    if (list.length === 0) {
      list.push({
        id: 'hero-outlaw',
        title: 'OUTLAW KING',
        type: 'movie',
        badge: 'A PULSAR FILM',
        badgeAr: 'فيلم أصلي من PULSAR',
        genres: 'Middle Ages • Royalty • War • Rousing • Period Piece',
        genresAr: 'تاريخي • حروب • ملحمي • إثارة • دراما',
        backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85',
        mediaItem: null,
      });
      list.push({
        id: 'hero-jackal',
        title: 'THE DAY OF THE JACKAL',
        type: 'tv',
        badge: 'A PULSAR SERIES',
        badgeAr: 'مسلسل أصلي من PULSAR',
        genres: 'Thriller • Mystery • Espionage • Intense',
        genresAr: 'إثارة • غموض • جاسوسية • تشويق عالي',
        backdrop: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1200&q=85',
        mediaItem: null,
      });
    }

    return list;
  }, [tvShows, movies, latestMovies, actionMovies]);

  // Touch Swipe & Slider Controls
  const touchStartXRef = useRef<number | null>(null);

  // Auto-advance hero slides every 7 seconds
  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % featuredItems.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredItems.length]);

  const currentHero = featuredItems[activeHeroIdx % featuredItems.length] || featuredItems[0];
  const isHeroInMyList = isFavorite(currentHero.id);

  const handlePlayHero = (hero: typeof currentHero) => {
    if (hero.mediaItem) {
      if (hero.type === 'movie') {
        openMovieDetail(hero.mediaItem as VidApiMovie, 'home');
      } else {
        openSeriesDetail(hero.mediaItem as VidApiTvShow, 1, 'home');
      }
    } else {
      setActiveMedia({
        id: hero.id,
        title: hero.title,
        subtitle: isRTL ? hero.genresAr : hero.genres,
        type: hero.type,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: hero.backdrop,
        isLive: false,
      });
    }
  };

  const handleInfoHero = (hero: typeof currentHero) => {
    if (hero.mediaItem) {
      if (hero.type === 'movie') {
        openMovieDetail(hero.mediaItem as VidApiMovie, 'home');
      } else {
        openSeriesDetail(hero.mediaItem as VidApiTvShow, 1, 'home');
      }
    } else {
      // Fallback detail
      openMovieDetail(
        {
          tmdb_id: hero.id,
          title: hero.title,
          genre: isRTL ? hero.genresAr : hero.genres,
          year: '2026',
          rating: '8.8',
          poster_url: hero.backdrop,
          backdrop_url: hero.backdrop,
          type: 'movie',
          popularity: '98',
          embed_url: '',
        },
        'home'
      );
    }
  };

  const handleHeroTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    touchStartXRef.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left
        setActiveHeroIdx((prev) => (prev + 1) % featuredItems.length);
      } else {
        // Swiped right
        setActiveHeroIdx((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
      }
    }
  };

  const handlePlayChannelCircle = (channelName: string, streamUrl: string) => {
    const found = channels.find((c) => c.name.toLowerCase().includes(channelName.toLowerCase()));
    if (found) {
      setActiveMedia({
        id: found.id,
        title: found.name,
        subtitle: found.program || `${found.category} • Live HD Stream`,
        type: 'channel',
        streamUrl: found.src,
        poster: found.resolvedLogo,
        isLive: true,
      });
    } else {
      setActiveMedia({
        id: `circle-${channelName}`,
        title: `${channelName} Live Feed`,
        subtitle: 'Live Sports Broadcast • 1080p 60FPS',
        type: 'channel',
        streamUrl,
        isLive: true,
      });
    }
  };

  const handleSelectMedia = (item: VidApiMovie | VidApiTvShow) => {
    if (item.type === 'movie') {
      openMovieDetail(item as VidApiMovie, 'home');
    } else {
      openSeriesDetail(item as VidApiTvShow, 1, 'home');
    }
  };

  const handlePlayChannel = (c: ChannelItem) => {
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

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white pb-32 pt-1 select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[1920px] mx-auto px-2 md:px-8">
        {/* 1. Integrated Search & Category Quick Filters */}
        <div className="px-2 md:px-4 pt-1 pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 z-20 relative">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 max-w-xl bg-[#1C1C1E]/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition-all active:scale-[0.99] shadow-lg"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-medium">
              {isRTL ? 'ابحث عن الأفلام والمسلسلات والرياضة...' : 'Search movies, series, live sports...'}
            </span>
          </div>

          {/* Quick Filter Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { label: isRTL ? '🔥 الكل' : '🔥 All', action: () => setCurrentTab('home') },
              { label: isRTL ? '⚽ المباريات' : '⚽ Matches', action: () => setCurrentTab('sports') },
              { label: isRTL ? '📺 القنوات' : '📺 Channels', action: () => setCurrentTab('channels') },
              { label: isRTL ? '🎬 الأفلام' : '🎬 Movies', action: () => setCurrentTab('movies') },
              { label: isRTL ? '📊 النتائج والتحليلات' : '📊 Scores & Analytics', action: () => setCurrentTab('scores') },
              { label: isRTL ? '⭐ توب 10' : '⭐ Top 10', action: () => setCurrentTab('movies') },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={chip.action}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1C1C1E] border border-white/10 text-neutral-300 hover:text-white hover:border-[#E50914] hover:bg-[#E50914]/15 transition-all whitespace-nowrap active:scale-95 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('settings')}
            className="hidden md:flex relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-red-950 items-center justify-center font-black text-xs border border-white/15 cursor-pointer text-white shadow-lg active:scale-95 shrink-0"
            title="Profile / Settings"
          >
            YA
            <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] ring-2 ring-[#0B0B0B] absolute -top-0.5 -right-0.5" />
          </button>
        </div>

        {/* 2. Full-Bleed Netflix Hero Portrait Slider */}
        <div
          className="relative w-full h-[65vh] min-h-[480px] max-h-[620px] sm:h-[72vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden select-none mb-8 touch-pan-y"
          onTouchStart={handleHeroTouchStart}
          onTouchEnd={handleHeroTouchEnd}
        >
          {/* Background Poster Images with Smooth Fade Transition */}
          {featuredItems.map((item, idx) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                idx === activeHeroIdx % featuredItems.length ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={item.backdrop}
                alt={item.title}
                className="w-full h-full object-cover object-center brightness-90 filter ken-burns"
              />
            </div>
          ))}

          {/* Cinematic Overlays: Top Vignette + Bottom Rich Gradient + Subtle Side Vignette */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0B0B0B]/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/85 via-45% to-transparent pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0B0B0B]/70 via-transparent to-[#0B0B0B]/70 pointer-events-none hidden md:block" />

          {/* Top Center PULSAR Brand Mark */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
            <span className="font-black text-xs sm:text-sm tracking-widest text-[#E50914] drop-shadow-md">
              PULSAR
            </span>
          </div>

          {/* Lower Hero Content: Category Badge + Large Bold Title + Genres + 3-Button Action Row */}
          <div className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center text-center px-4">
            {/* Category Badge e.g. A PULSAR FILM / A PULSAR SERIES */}
            <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {isRTL ? currentHero.badgeAr : currentHero.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] max-w-lg leading-tight px-2">
              {currentHero.title}
            </h1>

            {/* Bulleted Descriptors / Genres */}
            <p className="mt-2 text-[11px] sm:text-xs text-white/80 font-medium tracking-wide flex items-center justify-center flex-wrap gap-1.5 drop-shadow px-4 max-w-md">
              {isRTL ? currentHero.genresAr : currentHero.genres}
            </p>

            {/* 3-Action Control Row (Exact match to Netflix mobile screenshot) */}
            <div className="mt-4 flex items-center justify-center gap-6 sm:gap-8 w-full max-w-sm">
              {/* 1. Left Action: + My List */}
              <button
                type="button"
                onClick={() => toggleFavorite(currentHero.id)}
                className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-90 transition-all cursor-pointer min-w-[64px]"
                title="My List"
              >
                {isHeroInMyList ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
                <span className="text-[11px] font-semibold tracking-tight text-white/90">
                  {isRTL ? 'قائمتي' : 'My List'}
                </span>
              </button>

              {/* 2. Center Action: White Rounded Play Button */}
              <button
                type="button"
                onClick={() => handlePlayHero(currentHero)}
                className="bg-white hover:bg-neutral-200 text-black font-extrabold text-sm sm:text-base px-7 sm:px-9 py-2 sm:py-2.5 rounded-md flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                <span>{isRTL ? 'تشغيل' : 'Play'}</span>
              </button>

              {/* 3. Right Action: ⓘ Info */}
              <button
                type="button"
                onClick={() => handleInfoHero(currentHero)}
                className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-90 transition-all cursor-pointer min-w-[64px]"
                title="Info"
              >
                <Info className="w-5 h-5 text-white" />
                <span className="text-[11px] font-semibold tracking-tight text-white/90">
                  {isRTL ? 'معلومات' : 'Info'}
                </span>
              </button>
            </div>

            {/* Slider Dots Indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {featuredItems.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveHeroIdx(i)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeHeroIdx % featuredItems.length === i
                      ? 'w-4 h-1 bg-[#E50914]'
                      : 'w-1.5 h-1 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3. Live Sports & Channels Stories Circles */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
              {isRTL ? 'القنوات الرياضية المباشرة' : 'Live Sports & Channels'}
            </h3>
            <button
              type="button"
              onClick={() => setCurrentTab('channels')}
              className="text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-0.5 cursor-pointer hover:underline"
            >
              <span>{isRTL ? 'جميع القنوات' : 'All Channels'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth">
            {(channels && channels.length > 0
              ? channels.slice(0, 20)
              : [
                  { id: 'c-bein', name: 'beIN Sports 1', resolvedLogo: '/logos/bein-sports-1.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein2', name: 'beIN Sports 2', resolvedLogo: '/logos/bein-sports-2.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein3', name: 'beIN Sports 3', resolvedLogo: '/logos/bein-sports-3.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-sky', name: 'Sky Sports', resolvedLogo: '/logos/sky-sports-main-event-uk.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-canal', name: 'CANAL+ Sport', resolvedLogo: '/logos/canal-plus-sport-5-afrique-fr.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-dazn', name: 'DAZN 1', resolvedLogo: '/logos/dazn-1-es.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-espn', name: 'ESPN', resolvedLogo: '/logos/espnu-us.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-alkass', name: 'Alkass', resolvedLogo: '/logos/alkass.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-eurosport', name: 'Eurosport 1', resolvedLogo: '/logos/eurosport-1-de.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-watania', name: 'Watania 1', resolvedLogo: '/logos/watania-1.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                ]
            ).map((ch) => (
              <div
                key={ch.id}
                onClick={() => handlePlayChannel(ch as ChannelItem)}
                className="cursor-pointer group flex flex-col items-center select-none shrink-0"
              >
                <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-full p-[2px] bg-gradient-to-tr from-[#E50914] via-red-600 to-purple-600 mb-2 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(229,9,20,0.5)] transition-all duration-200">
                  <div className="w-full h-full rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center overflow-hidden p-2">
                    {ch.resolvedLogo ? (
                      <img src={ch.resolvedLogo} alt={ch.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-bold text-[10px] text-white text-center leading-tight truncate px-1">
                        {ch.name}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#E50914] text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                    • LIVE
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-neutral-300 group-hover:text-white font-medium truncate w-18 md:w-20 text-center transition-colors">
                  {ch.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Continue Watching (Fixed edge-to-edge scroll) */}
        {continueWatchingList.length > 0 && (
          <div className="px-4 mb-6">
            <h3 className="text-sm font-bold tracking-tight text-white mb-2.5">
              {isRTL ? 'متابعة المشاهدة' : 'Continue Watching'}
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory -mx-4 px-4 pb-2">
              {continueWatchingList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveMedia({
                      id: item.id,
                      title: item.title,
                      subtitle: item.subtitle,
                      type: item.type,
                      streamUrl: item.streamUrl,
                      poster: item.poster,
                      isLive: false,
                    });
                  }}
                  className="w-[160px] sm:w-[220px] shrink-0 snap-start cursor-pointer group select-none"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1C1C1E] border border-white/10 group-hover:border-white/25 transition-all duration-300">
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/60 border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 left-2 text-[9px] font-black bg-yellow-400 text-black px-1.5 py-0.2 rounded shadow truncate max-w-[130px]">
                      {item.title}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-[#E50914] shadow-[0_0_4px_#E50914]"
                        style={{ width: `${(item as any).progress || 60}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Top 10 Movies & Series (Fixed RTL alignment & smooth full-bleed carousel) */}
        <div className="px-4 mb-6">
          <h3 className="text-sm font-bold tracking-tight text-white mb-2.5">
            {isRTL ? 'أفضل 10 أفلام ومسلسلات' : 'Top 10 Movies & Series'}
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory -mx-4 px-4 pt-1 pb-2">
            {top10List.map((item, index) => {
              const title = (item as any)?.title || (item as any)?.name || 'Title';
              const poster = item?.poster_url || (item as any)?.backdrop_url;

              return (
                <div
                  key={(item as any)?.tmdb_id || index}
                  onClick={() => handleSelectMedia(item as any)}
                  className="flex items-end shrink-0 snap-start cursor-pointer group select-none"
                >
                  {/* Outline Number */}
                  <span className="top10-num z-0">{index + 1}</span>

                  {/* Vertical Poster with Red TOP 10 Badge */}
                  <div className="relative w-[86px] h-[120px] sm:w-[100px] sm:h-[140px] rounded-xl overflow-hidden border border-white/15 z-10 shadow-xl bg-[#1C1C1E] group-hover:scale-105 transition-transform duration-300">
                    {poster ? (
                      <img
                        src={poster}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1C1C1E] flex items-center justify-center p-2 text-center text-[10px] text-white/50">
                        {title}
                      </div>
                    )}
                    <span className="absolute top-1.5 right-1.5 bg-[#E50914] text-[7px] font-black px-1.5 py-0.5 rounded shadow tracking-tight">
                      TOP 10
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Trending Global Movies Rail */}
        {isLoading ? (
          <ShimmerRail aspect="2/3" />
        ) : movies.length > 0 ? (
          <ContentRail
            title={isRTL ? 'أفلام رائجة عالمياً' : 'Trending Global Movies'}
            subtitle={isRTL ? 'جودة 1080p مع ترجمة عربية' : 'Huge library in 1080p quality'}
            actionText={isRTL ? 'عرض المزيد' : 'View All'}
            onAction={() => setCurrentTab('movies')}
          >
            {movies.map((movie) => (
              <MediaCard key={movie.tmdb_id} item={movie} onSelect={handleSelectMedia} />
            ))}
          </ContentRail>
        ) : null}

        {/* 7. Latest Cinema Releases */}
        {latestMovies.length > 0 && (
          <ContentRail
            title={isRTL ? 'أحدث إصدارات السينما' : 'Latest Cinema Releases'}
            subtitle={isRTL ? 'إصدارات 2025-2026 الحصرية' : 'Brand new digital releases'}
            actionText={isRTL ? 'عرض الكل' : 'View All'}
            onAction={() => setCurrentTab('movies')}
          >
            {latestMovies.map((movie) => (
              <MediaCard key={movie.tmdb_id} item={movie} onSelect={handleSelectMedia} />
            ))}
          </ContentRail>
        )}

        {/* 8. Featured TV Series */}
        {tvShows.length > 0 && (
          <ContentRail
            title={isRTL ? 'مسلسلات مميزة' : 'Featured TV Series'}
            subtitle={isRTL ? 'مواسم كاملة بدون إعلانات' : 'Complete seasons ad-free'}
            actionText={isRTL ? 'تصفح المسلسلات' : 'Browse Series'}
            onAction={() => setCurrentTab('movies')}
          >
            {tvShows.map((tv) => (
              <MediaCard key={tv.tmdb_id} item={tv} onSelect={handleSelectMedia} />
            ))}
          </ContentRail>
        )}

        {/* 9. Action Blockbusters */}
        {actionMovies.length > 0 && (
          <ContentRail
            title={isRTL ? 'أفلام حركة وإثارة' : 'Action Blockbusters'}
            subtitle={isRTL ? 'أقوى أفلام الأكشن والإثارة' : 'Adrenaline-packed cinematic thrills'}
            actionText={isRTL ? 'المزيد' : 'More'}
            onAction={() => setCurrentTab('movies')}
          >
            {actionMovies.map((m) => (
              <MediaCard key={m.tmdb_id} item={m} onSelect={handleSelectMedia} />
            ))}
          </ContentRail>
        )}

        {/* 10. Popular TV Channels */}
        {channels.length > 0 && (
          <ContentRail
            title={isRTL ? 'قنوات تلفزيونية مميزة' : 'Popular TV Channels'}
            subtitle={isRTL ? 'بث مباشر عالي الدقة' : 'Live high-definition feeds'}
            actionText={isRTL ? 'جميع القنوات' : 'All Channels'}
            onAction={() => setCurrentTab('channels')}
          >
            {channels.slice(0, 24).map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onPlay={handlePlayChannel} />
            ))}
          </ContentRail>
        )}

        {/* 11. DYNAMIC INFINITE SCROLL RAILS */}
        {dynamicRails.map((rail) => (
          <ContentRail
            key={rail.id}
            title={isRTL ? rail.titleAr : rail.title}
            subtitle={isRTL ? rail.subtitleAr : rail.subtitle}
            actionText={isRTL ? 'المزيد' : 'Explore'}
            onAction={() => setCurrentTab('movies')}
          >
            {rail.items.map((item) => (
              <MediaCard
                key={(item as any).tmdb_id}
                item={item as any}
                onSelect={handleSelectMedia}
              />
            ))}
          </ContentRail>
        ))}

        {/* Sentinel & Infinite Loading Indicator */}
        <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center text-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 bg-[#1C1C1E] border border-white/10 px-4 py-2 rounded-full shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
              <span>{isRTL ? 'جاري تحميل المزيد من المحتوى...' : 'Discovering more titles...'}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
