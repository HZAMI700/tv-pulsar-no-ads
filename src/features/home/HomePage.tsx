import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  Play,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Info,
  Star,
  Sparkles,
  Globe,
  MapPin,
  Film,
  Tv,
  Flame,
} from 'lucide-react';
import { ChannelItem, VidApiMovie, VidApiTvShow, MatchItem, ActiveMedia } from '../../types';
import { streamFreeService } from '../../services/streamFreeApi';
import { channelsService } from '../../services/channelsApi';
import { tmdbService } from '../../services/tmdbApi';
import { geoService, LocalizedMediaItem, UserCountryInfo } from '../../services/geoService';
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

const GENRE_TILES = [
  { id: '28', nameEn: 'Action', nameAr: 'حركة وأكشن', icon: '💥', gradient: 'from-red-600 via-rose-700 to-amber-900' },
  { id: '35', nameEn: 'Comedy', nameAr: 'كوميديا', icon: '😂', gradient: 'from-amber-500 via-orange-600 to-red-800' },
  { id: '18', nameEn: 'Drama', nameAr: 'دراما', icon: '🎭', gradient: 'from-blue-600 via-indigo-700 to-purple-900' },
  { id: '878', nameEn: 'Sci-Fi', nameAr: 'خيال علمي', icon: '🚀', gradient: 'from-cyan-600 via-blue-700 to-indigo-900' },
  { id: '27', nameEn: 'Horror', nameAr: 'رعب وتشويق', icon: '👻', gradient: 'from-emerald-700 via-teal-800 to-slate-950' },
  { id: '16', nameEn: 'Animation', nameAr: 'رسوم وأنيمي', icon: '✨', gradient: 'from-pink-500 via-rose-600 to-purple-900' },
  { id: '80', nameEn: 'Crime & Noir', nameAr: 'جريمة وغموض', icon: '🕵️', gradient: 'from-stone-700 via-zinc-800 to-neutral-950' },
  { id: '12', nameEn: 'Adventure', nameAr: 'مغامرات', icon: '🗺️', gradient: 'from-teal-600 via-emerald-700 to-cyan-900' },
];

const LANGUAGE_TILES = [
  { code: 'ar', nameEn: 'Arabic Cinema', nameAr: 'السينما العربية', flag: '🇹🇳 🇪🇬 🇩🇿', badge: 'MENA' },
  { code: 'en', nameEn: 'Hollywood / Global', nameAr: 'هوليوود والعالمية', flag: '🇺🇸 🇬🇧', badge: 'EN' },
  { code: 'fr', nameEn: 'French Cinema', nameAr: 'السينما الفرنسية', flag: '🇫🇷', badge: 'FR' },
  { code: 'es', nameEn: 'Spanish Cinema', nameAr: 'السينما الإسبانية', flag: '🇪🇸', badge: 'ES' },
  { code: 'ko', nameEn: 'Korean K-Drama', nameAr: 'الكورية والدراما', flag: '🇰🇷', badge: 'KO' },
  { code: 'tr', nameEn: 'Turkish Sagas', nameAr: 'المسلسلات التركية', flag: '🇹🇷', badge: 'TR' },
  { code: 'it', nameEn: 'Italian Cinema', nameAr: 'السينما الإيطالية', flag: '🇮🇹', badge: 'IT' },
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
  const [localizedData, setLocalizedData] = useState(() => geoService.getLocalizedRailData());
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const availableCountries = useMemo(() => geoService.getAvailableCountries(), []);
  const [isLoading, setIsLoading] = useState(() => !homeDataCache);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreRails, setHasMoreRails] = useState(true);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);

  const currentRailIndexRef = useRef(homeDataCache?.dynamicRails?.length || 0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Auto-detect country via Geo-IP asynchronously
  useEffect(() => {
    geoService.detectCountryAsync().then((res) => {
      if (res && res.items && res.items.length > 0) {
        setLocalizedData(res);
      }
    });
  }, []);

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
        title: 'Vikings: Valhalla',
        subtitle: 'S02:E04 • 32m remaining',
        type: 'tv' as const,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        progress: 75,
      },
      {
        id: 'cw2',
        title: 'Breaking Silence',
        subtitle: '1080p • 45m remaining',
        type: 'movie' as const,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=600&q=80',
        progress: 60,
      },
      {
        id: 'cw3',
        title: 'Fallen Kingdom',
        subtitle: 'S01:E01 • 18m remaining',
        type: 'tv' as const,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        progress: 88,
      },
      {
        id: 'cw4',
        title: 'Cyber Protocol',
        subtitle: '1080p • 12m remaining',
        type: 'movie' as const,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80',
        progress: 45,
      },
      {
        id: 'cw5',
        title: 'Shadow Agent',
        subtitle: 'S03:E02 • 50m remaining',
        type: 'tv' as const,
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        progress: 30,
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

  // Curated Featured Slider Items (matching Netflix / Nxsha Mobile Full-Bleed Hero Banner)
  const featuredItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      type: 'movie' | 'tv';
      badge: string;
      badgeAr: string;
      filmType: string;
      filmTypeAr: string;
      genres: string;
      genresAr: string;
      rating: string;
      quality: string;
      tagline: string;
      taglineAr: string;
      backdrop: string;
      mediaItem: VidApiMovie | VidApiTvShow | null;
    }> = [];

    // 1. Primary Feature: THE ODYSSEY (matching the exact screenshot)
    list.push({
      id: 'hero-odyssey',
      title: 'THE ODYSSEY',
      type: 'movie',
      badge: 'PULSAR EXCLUSIVE',
      badgeAr: 'حصري لـ PULSAR',
      filmType: 'A PULSAR FILM',
      filmTypeAr: 'فيلم أصلي من PULSAR',
      genres: 'Action & Adventure',
      genresAr: 'أكشن ومغامرات',
      rating: '8.8',
      quality: '4K UHD',
      tagline: 'An epic journey beyond the limits...',
      taglineAr: 'رحلة ملحمية تتجاوز الحدود...',
      backdrop: '/art/odyssey-clean-backdrop.jpg',
      mediaItem: actionMovies.length > 0 ? actionMovies[0] : null,
    });

    // 2. Featured Series (e.g. The Day of the Jackal)
    if (tvShows.length > 0) {
      const t0 = tvShows[0];
      list.push({
        id: `hero-tv-${t0.tmdb_id}`,
        title: (t0.title || 'THE DAY OF THE JACKAL').toUpperCase(),
        type: 'tv',
        badge: 'PULSAR EXCLUSIVE',
        badgeAr: 'حصري لـ PULSAR',
        filmType: 'A PULSAR SERIES',
        filmTypeAr: 'مسلسل أصلي من PULSAR',
        genres: formatGenresBullet(t0.genre, 'Thriller • Mystery • Espionage'),
        genresAr: 'إثارة • غموض • تشويق',
        rating: '8.9',
        quality: '4K UHD',
        tagline: 'A thrilling cat-and-mouse manhunt across Europe...',
        taglineAr: 'مطاردة ملحمية تحبس الأنفاس عبر أوروبا...',
        backdrop:
          t0.backdrop_url ||
          t0.poster_url ||
          'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1200&q=85',
        mediaItem: t0,
      });
    }

    // 3. Featured Film (e.g. Outlaw King)
    if (movies.length > 0) {
      const m0 = movies[0];
      list.push({
        id: `hero-m-${m0.tmdb_id}`,
        title: (m0.title || 'OUTLAW KING').toUpperCase(),
        type: 'movie',
        badge: 'PULSAR EXCLUSIVE',
        badgeAr: 'حصري لـ PULSAR',
        filmType: 'A PULSAR FILM',
        filmTypeAr: 'فيلم أصلي من PULSAR',
        genres: formatGenresBullet(m0.genre, 'Historical • Action • Drama'),
        genresAr: 'تاريخي • حروب • ملحمي',
        rating: '8.6',
        quality: '4K UHD',
        tagline: 'The battle for a crown and freedom began in blood...',
        taglineAr: 'معركة الحرية والتاج تبدأ وسط الحصار...',
        backdrop:
          m0.backdrop_url ||
          m0.poster_url ||
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85',
        mediaItem: m0,
      });
    }

    // 4. Featured Cinema Release
    if (latestMovies.length > 0) {
      const m1 = latestMovies[0];
      list.push({
        id: `hero-lat-${m1.tmdb_id}`,
        title: (m1.title || 'CAMPUS DRIVERS').toUpperCase(),
        type: 'movie',
        badge: 'PULSAR EXCLUSIVE',
        badgeAr: 'حصري لـ PULSAR',
        filmType: 'A PULSAR FILM',
        filmTypeAr: 'فيلم أصلي من PULSAR',
        genres: formatGenresBullet(m1.genre, 'Drama • Romance • Youth'),
        genresAr: 'دراما • شبابي • إثارة',
        rating: '8.4',
        quality: '1080P',
        tagline: 'Speed, adrenaline and rivalries on the street...',
        taglineAr: 'السرعة والإثارة والمنافسة في شوارع المدينة...',
        backdrop:
          m1.backdrop_url ||
          m1.poster_url ||
          'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=85',
        mediaItem: m1,
      });
    }

    return list;
  }, [tvShows, movies, latestMovies, actionMovies]);

  // Touch Swipe & Slider Controls
  const touchStartXRef = useRef<number | null>(null);

  // Auto-advance hero slides every 18 seconds
  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % featuredItems.length);
    }, 18000);
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
    <div className="w-full min-w-0 pb-32 select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full min-w-0 mx-auto">
        {/* 1. Integrated Search & Category Quick Filters (Exact match to screenshot) */}
        <div className="pt-1 pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 z-20 relative">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="w-full md:w-[420px] lg:w-[460px] bg-[#121214] border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition-all active:scale-[0.99] shadow-md"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-normal">
              {isRTL ? 'ابحث عن الأفلام والمسلسلات والرياضة...' : 'Search for movies, series, live sports...'}
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
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={chip.action}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#18181A] border border-white/10 text-neutral-300 hover:text-white hover:border-[#E50914] hover:bg-[#E50914]/15 transition-all whitespace-nowrap active:scale-95 cursor-pointer shadow-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Full-Bleed Modern Hero Carousel (Left-Aligned Layout matching Screenshot) */}
        <div
          className="relative w-full h-[470px] sm:h-[490px] md:h-[510px] rounded-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden select-none mb-8 touch-pan-y group"
          onTouchStart={handleHeroTouchStart}
          onTouchEnd={handleHeroTouchEnd}
        >
          {/* Floating Prev Button (Left) */}
          <button
            type="button"
            onClick={() => setActiveHeroIdx((prev) => (prev - 1 + featuredItems.length) % featuredItems.length)}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-[#E50914] text-white border border-white/15 backdrop-blur-md items-center justify-center transition-all cursor-pointer shadow-xl active:scale-90 group-hover:opacity-100 opacity-80"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Floating Next Button (Right) */}
          <button
            type="button"
            onClick={() => setActiveHeroIdx((prev) => (prev + 1) % featuredItems.length)}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-[#E50914] text-white border border-white/15 backdrop-blur-md items-center justify-center transition-all cursor-pointer shadow-xl active:scale-90 group-hover:opacity-100 opacity-80"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

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
                className="w-full h-full object-cover object-right-top brightness-95 filter"
              />
            </div>
          ))}

          {/* Cinematic Overlays: Left rich dark gradient + bottom vignette */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0B0B0B] via-[#0B0B0B]/85 via-50% to-transparent pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0B0B0B] via-transparent to-transparent pointer-events-none" />

          {/* Left-Aligned Hero Content Block (Matching Screenshot) */}
          <div className="absolute inset-y-0 left-0 z-20 flex flex-col justify-center pl-8 sm:pl-12 md:pl-16 pr-4 max-w-xl text-left">
            {/* Tagline Capsule: 🔴 PULSAR EXCLUSIVE */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#FF4D5E] bg-[#E50914]/20 border border-[#E50914]/40 px-3 py-0.5 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#E50914]" />
                {isRTL ? currentHero.badgeAr : currentHero.badge}
              </span>
            </div>

            {/* A PULSAR FILM */}
            <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-300 mt-2">
              {isRTL ? currentHero.filmTypeAr : currentHero.filmType}
            </p>

            {/* THE ODYSSEY */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight mt-1 drop-shadow-lg">
              {currentHero.title}
            </h1>

            {/* Action & Adventure */}
            <p className="text-sm font-semibold text-neutral-300 mt-2">
              {isRTL ? currentHero.genresAr : currentHero.genres}
            </p>

            {/* ★ 8.8  4K UHD */}
            <div className="flex items-center gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 text-xs font-black text-white bg-[#E50914] px-2.5 py-0.5 rounded-md shadow-sm">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                {currentHero.rating || '8.8'}
              </span>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                {currentHero.quality || '4K UHD'}
              </span>
            </div>

            {/* An epic journey beyond the limits... */}
            <p className="text-xs sm:text-sm text-neutral-300 font-normal mt-3 max-w-lg leading-relaxed line-clamp-2">
              {isRTL ? currentHero.taglineAr : currentHero.tagline}
            </p>

            {/* 3 Action Buttons */}
            <div className="mt-5 flex items-center gap-3 sm:gap-3.5 flex-wrap">
              {/* 1. Watch Now Button */}
              <button
                type="button"
                onClick={() => handlePlayHero(currentHero)}
                className="bg-[#E50914] hover:bg-red-700 text-white font-extrabold text-sm px-7 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(229,9,20,0.55)] active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>{isRTL ? 'تشغيل الآن' : 'Watch Now'}</span>
              </button>

              {/* 2. + My List Button */}
              <button
                type="button"
                onClick={() => toggleFavorite(currentHero.id)}
                className="bg-[#1C1C1E]/90 hover:bg-[#2C2C2E] border border-white/20 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-full flex items-center justify-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
              >
                {isHeroInMyList ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">{isRTL ? 'في قائمتي' : 'Added'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
                    <span>{isRTL ? 'قائمتي' : 'My List'}</span>
                  </>
                )}
              </button>

              {/* 3. ⓘ Details Button */}
              <button
                type="button"
                onClick={() => handleInfoHero(currentHero)}
                className="bg-[#1C1C1E]/90 hover:bg-[#2C2C2E] border border-white/20 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-full flex items-center justify-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
              >
                <Info className="w-4 h-4 text-white" />
                <span>{isRTL ? 'تفاصيل' : 'Details'}</span>
              </button>
            </div>
          </div>

          {/* Slider Dots Indicator Centered at Bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {featuredItems.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveHeroIdx(i)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeHeroIdx % featuredItems.length === i
                    ? 'w-6 h-1.5 bg-[#E50914]'
                    : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* 3. Continue Watching (Rail 1 directly below Hero, matching screenshot) */}
        {continueWatchingList.length > 0 && (
          <div className="px-4 mb-8">
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-1.5 h-5 rounded-full bg-[#E50914]" />
              <Film className="w-4 h-4 text-white" />
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {isRTL ? 'متابعة المشاهدة' : 'Continue Watching'}
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory -mx-4 px-4 pb-2">
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
                  className="w-[190px] sm:w-[230px] md:w-[250px] shrink-0 snap-start cursor-pointer group select-none"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-[#161618] border border-white/10 group-hover:border-white/30 shadow-lg transition-all duration-300">
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-9 h-9 rounded-full bg-black/60 border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </div>
                    </div>
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

        {/* 4. Live Sports & Channels Stories Circles (Rail 2 directly below Continue Watching, matching screenshot) */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 rounded-full bg-[#E50914]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {isRTL ? 'القنوات الرياضية المباشرة' : 'Live Sports & Channels'}
              </h3>
            </div>
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
              ? channels.slice(0, 24)
              : [
                  { id: 'c-bein', name: 'beIN SPORTS ...', resolvedLogo: '/logos/bein-sports-1.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein1', name: 'beIN SPORTS 1', resolvedLogo: '/logos/bein-sports-1.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein2', name: 'beIN SPORTS 2', resolvedLogo: '/logos/bein-sports-2.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein3', name: 'beIN SPORTS 3', resolvedLogo: '/logos/bein-sports-3.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein4', name: 'beIN SPORTS 4', resolvedLogo: '/logos/bein-sports-4.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein6', name: 'beIN SPORTS 6', resolvedLogo: '/logos/bein-sports-6.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein7', name: 'beIN SPORTS 7', resolvedLogo: '/logos/bein-sports-7.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-bein8', name: 'beIN SPORTS 8', resolvedLogo: '/logos/bein-sports-8.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-euro7', name: 'beIN SPORTS 7', resolvedLogo: '/logos/eurosport-1-de.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-euro9', name: 'beIN SPORTS 9', resolvedLogo: '/logos/eurosport-2-de.png', src: 'https://wideiptv.top/player/beINAR', category: 'Sports' },
                  { id: 'c-jazeera', name: 'Al Jazeera', resolvedLogo: '/logos/france-24-fr.png', src: 'https://wideiptv.top/player/beINAR', category: 'News' },
                  { id: 'c-mosaique', name: 'Mosaique FM', resolvedLogo: '/logos/mosaique-fm.png', src: 'https://wideiptv.top/player/beINAR', category: 'Radio' },
                ]
            ).map((ch) => (
              <div
                key={ch.id}
                onClick={() => handlePlayChannel(ch as ChannelItem)}
                className="cursor-pointer group flex flex-col items-center select-none shrink-0"
              >
                <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 via-pink-600 to-red-600 mb-2 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(229,9,20,0.5)] transition-all duration-200">
                  <div className="w-full h-full rounded-full bg-[#141416] border border-white/10 flex items-center justify-center overflow-hidden p-2">
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

        {/* Rail 1: Trending Global Movies */}
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

        {/* Rail 2: Latest Cinema Releases */}
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

        {/* Rail 3: Localized Country Rail (Tunisia, Algeria, Egypt, Morocco, etc. - in 3rd position directly after Trending Global and Latest Cinema) */}
        {localizedData && localizedData.items && localizedData.items.length > 0 && (
          <div className="relative mb-2">
            <ContentRail
              title={isRTL ? localizedData.info.railTitleAr : localizedData.info.railTitleEn}
              subtitle={isRTL ? localizedData.info.railSubtitleAr : localizedData.info.railSubtitleEn}
              badge={
                <span className="text-xs bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                  <MapPin className="w-3 h-3 text-[#E50914]" />
                  {localizedData.info.flag} {isRTL ? localizedData.info.nameAr : localizedData.info.nameEn}
                </span>
              }
              actionText={isRTL ? 'تغيير البلد' : 'Change Country'}
              onAction={() => setShowCountryPicker((prev) => !prev)}
            >
              {localizedData.items.map((item) => (
                <MediaCard key={item.tmdb_id} item={item} onSelect={handleSelectMedia} />
              ))}
            </ContentRail>

            {/* Quick Country Switcher Pill Selector if toggled */}
            {showCountryPicker && (
              <div className="flex items-center gap-2 px-4 md:px-8 pb-3 overflow-x-auto no-scrollbar animate-in fade-in duration-200">
                {availableCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      const res = geoService.setCountry(c.code);
                      setLocalizedData(res);
                      setShowCountryPicker(false);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      localizedData.info.code === c.code
                        ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg shadow-red-900/40'
                        : 'bg-[#1C1C1E] text-neutral-300 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{isRTL ? c.nameAr : c.nameEn}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rail 4: Top 10 Ranked Rail (Outline numbers 1..10) */}
        <div className="px-4 mb-6">
          <h3 className="text-sm font-bold tracking-tight text-white mb-2.5">
            {isRTL ? '⭐ أفضل 10 أفلام ومسلسلات' : '⭐ Top 10 Movies & Series'}
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



        {/* Rail 6: Featured TV Series */}
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

        {/* Rail 7: Action Blockbusters */}
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

        {/* Rail 8: Browse by Genre (Vibrant visual cards like nxsha.space) */}
        <div className="px-4 md:px-8 my-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-4 rounded-full bg-[#E50914]" />
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-[#F8FAFC]">
                  {isRTL ? '🎭 تصفح حسب التصنيف' : '🎭 Browse by Genre'}
                </h2>
                <p className="text-xs text-[#94A3B8] font-normal mt-0.5">
                  {isRTL ? 'استكشف آلاف الأفلام والمسلسلات حسب نوعك المفضل' : 'Explore thousands of titles by your favorite themes'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('movies')}
              className="text-[13px] font-normal text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              {isRTL ? 'جميع التصنيفات' : 'All Genres'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {GENRE_TILES.map((g) => (
              <div
                key={g.id}
                onClick={() => setCurrentTab('movies')}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${g.gradient} p-4 flex flex-col justify-between h-24 border border-white/10 hover:border-white/30 shadow-lg cursor-pointer transform hover:-translate-y-1 transition-all duration-300 active:scale-95`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl drop-shadow">{g.icon}</span>
                  <div className="w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <span className="font-bold text-sm text-white drop-shadow truncate">
                  {isRTL ? g.nameAr : g.nameEn}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rail 9: Browse by Language (Visual pills like nxsha.space) */}
        <div className="px-4 md:px-8 my-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-4 rounded-full bg-[#E50914]" />
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-[#F8FAFC]">
                  {isRTL ? '🌐 تصفح حسب لغة العرض' : '🌐 Browse by Language'}
                </h2>
                <p className="text-xs text-[#94A3B8] font-normal mt-0.5">
                  {isRTL ? 'أعمال ناطقة ومدبلجة ومترجمة بأعلى دقة' : 'Original audio & translated international cinema'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {LANGUAGE_TILES.map((l) => (
              <div
                key={l.code}
                onClick={() => setCurrentTab('movies')}
                className="flex items-center gap-3 bg-[#1C1C1E] hover:bg-[#252528] border border-white/10 hover:border-[#E50914] px-4 py-3 rounded-2xl cursor-pointer transition-all active:scale-95 shrink-0 shadow-md group"
              >
                <span className="text-xl">{l.flag}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white group-hover:text-[#E50914] transition-colors">
                    {isRTL ? l.nameAr : l.nameEn}
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                    {l.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rail 10: Popular TV Channels */}
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
    </div>
  );
};
