import React, { useEffect, useState } from 'react';
import { HeroBanner } from './HeroBanner';
import { ContentRail } from './ContentRail';
import { MatchCard } from '../sports/MatchCard';
import { ChannelCard } from '../channels/ChannelCard';
import { MediaCard } from '../discover/MediaCard';
import { MovieDetailModal } from '../discover/MovieDetailModal';
import { SeriesDetailModal } from '../discover/SeriesDetailModal';
import { ShimmerRail } from '../../design-system/components/ShimmerLoader';
import { MatchItem, ChannelItem, VidApiMovie, VidApiTvShow, ActiveMedia } from '../../types';
import { streamFreeService } from '../../services/streamFreeApi';
import { channelsService } from '../../services/channelsApi';
import { tmdbService } from '../../services/tmdbApi';
import { useAppStore } from '../../store/useAppStore';

interface HomeCache {
  matches: MatchItem[];
  channels: ChannelItem[];
  beinChannels: ChannelItem[];
  movies: VidApiMovie[];
  actionMovies: VidApiMovie[];
  tvShows: VidApiTvShow[];
  timestamp: number;
}

let homeDataCache: HomeCache | null = null;
const HOME_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const HomePage: React.FC = () => {
  const { setActiveMedia, setCurrentTab } = useAppStore();

  const [matches, setMatches] = useState<MatchItem[]>(() => homeDataCache?.matches || []);
  const [channels, setChannels] = useState<ChannelItem[]>(() => homeDataCache?.channels || []);
  const [beinChannels, setBeinChannels] = useState<ChannelItem[]>(() => homeDataCache?.beinChannels || []);
  const [movies, setMovies] = useState<VidApiMovie[]>(() => homeDataCache?.movies || []);
  const [actionMovies, setActionMovies] = useState<VidApiMovie[]>(() => homeDataCache?.actionMovies || []);
  const [tvShows, setTvShows] = useState<VidApiTvShow[]>(() => homeDataCache?.tvShows || []);
  const [isLoading, setIsLoading] = useState(() => !homeDataCache);
  const [selectedMovie, setSelectedMovie] = useState<VidApiMovie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<VidApiTvShow | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      const hasFreshCache = homeDataCache && Date.now() - homeDataCache.timestamp < HOME_CACHE_TTL;
      if (!hasFreshCache && !homeDataCache) {
        setIsLoading(true);
      }

      try {
        const [liveMatches, allChannels, trendingMovies, actionMoviesRes, trendingTv] = await Promise.all([
          streamFreeService.getLiveMatches('soccer').catch(() => []),
          channelsService.getAllChannels().catch(() => []),
          tmdbService.getTrendingMovies().catch(() => []),
          tmdbService.discoverMovies({ page: 1, genreId: '28', sortBy: 'popularity.desc' }).catch(() => ({ items: [] })),
          tmdbService.getTrendingTvShows().catch(() => []),
        ]);

        if (!isMounted) return;

        // Filter beIN Sports channels and prioritize AR 2 & AR 1 to match TOD UI benchmark
        const beIN = allChannels.filter(
          (c) =>
            c.name.toLowerCase().includes('bein') ||
            c.category.toLowerCase().includes('bein')
        );

        // Ensure AR 2 and AR 1 lead the list with rich metadata
        const ar2 = beIN.find((c) => c.name.includes('AR 2') || c.id.includes('ar2'));
        const ar1 = beIN.find((c) => c.name.includes('AR 1') || c.id.includes('ar1'));
        const others = beIN.filter((c) => c !== ar1 && c !== ar2);

        const prioritizedBeIN: ChannelItem[] = [];
        if (ar2) {
          prioritizedBeIN.push({
            ...ar2,
            program: 'French Premier League Live',
          });
        }
        if (ar1) {
          prioritizedBeIN.push({
            ...ar1,
            program: 'UEFA Champions League Matchday',
          });
        }
        prioritizedBeIN.push(...others);

        const finalBeIN = prioritizedBeIN.length > 0 ? prioritizedBeIN : beIN;
        const actMovies = actionMoviesRes.items || [];

        // Update state
        setMatches(liveMatches);
        setChannels(allChannels);
        setBeinChannels(finalBeIN);
        setMovies(trendingMovies);
        setActionMovies(actMovies);
        setTvShows(trendingTv);

        // Update in-memory cache
        homeDataCache = {
          matches: liveMatches,
          channels: allChannels,
          beinChannels: finalBeIN,
          movies: trendingMovies,
          actionMovies: actMovies,
          tvShows: trendingTv,
          timestamp: Date.now(),
        };
      } catch (err) {
        console.error('Error loading home page content', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayMatch = (m: MatchItem) => {
    setActiveMedia({
      id: m.id,
      title: m.name,
      subtitle: `${m.league} • بث مباشر`,
      type: 'match',
      streamUrl: m.playableUrl,
      poster: m.thumbnailUrl,
      isLive: true,
    });
  };

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

  const handlePlayFromModal = (media: ActiveMedia) => {
    setSelectedMovie(null);
    setSelectedSeries(null);
    setActiveMedia(media);
  };

  // Hero banner for wide displays
  const heroFeatured: ActiveMedia = matches.length > 0
    ? {
        id: matches[0].id,
        title: matches[0].name,
        subtitle: `${matches[0].league} • بث مباشر بدقة FHD 1080p`,
        type: 'match',
        streamUrl: matches[0].playableUrl,
        poster:
          matches[0].thumbnailUrl ||
          'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80',
        isLive: matches[0].isLive,
      }
    : {
        id: 'default-hero',
        title: 'beIN SPORTS 1 HD',
        subtitle: 'استوديو تحليلي وبث مباشر لأقوى المباريات العالمية',
        type: 'channel',
        streamUrl: 'https://wideiptv.top/player/beINAR',
        poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80',
        isLive: true,
      };

  return (
    <div className="space-y-4 pb-16 select-none">
      {/* Desktop Hero Banner (Hidden on mobile to match screenshot benchmark) */}
      <div className="hidden md:block">
        <HeroBanner item={heroFeatured} onPlay={setActiveMedia} />
      </div>

      {/* Rail 1: beIN SPORTS Network (Top of screen on Mobile matching Right Screenshot) */}
      {isLoading ? (
        <ShimmerRail aspect="16/9" />
      ) : beinChannels.length > 0 ? (
        <ContentRail
          title="باقة beIN SPORTS"
          subtitle="تغطية حصرية بالتعليق العربي بتقنية Full HD"
          actionText="عرض كل القنوات"
          onAction={() => setCurrentTab('channels')}
        >
          {beinChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} onPlay={handlePlayChannel} />
          ))}
        </ContentRail>
      ) : null}

      {/* Rail 2: Trending Global Movies (Directly below beIN Sports matching Right Screenshot) */}
      {isLoading ? (
        <ShimmerRail aspect="2/3" />
      ) : movies.length > 0 ? (
        <ContentRail
          title="أحدث الأفلام العالمية"
          subtitle="مكتبة ضخمة بجودة 1080p مع الترجمة الاحترافية"
          actionText="تصفح المزيد"
          onAction={() => setCurrentTab('movies')}
        >
          {movies.map((movie) => (
            <MediaCard key={movie.tmdb_id} item={movie} onSelect={handleSelectMedia} />
          ))}
        </ContentRail>
      ) : null}

      {/* Rail 3: Live Sports & Matches */}
      {isLoading ? (
        <ShimmerRail aspect="16/9" />
      ) : matches.length > 0 ? (
        <ContentRail
          title="مباريات اليوم المباشرة"
          subtitle="أقوى المواجهات الكروية في الدوريات العالمية والمحلية"
          actionText="عرض كل المباريات"
          onAction={() => setCurrentTab('sports')}
        >
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onPlay={handlePlayMatch}
              className="w-[240px] sm:w-[280px] shrink-0"
            />
          ))}
        </ContentRail>
      ) : null}

      {/* Rail 4: Featured TV Series */}
      {isLoading ? (
        <ShimmerRail aspect="2/3" />
      ) : tvShows.length > 0 ? (
        <ContentRail
          title="مسلسلات تلفزيونية مختارة"
          subtitle="حلقات جديدة ومواسم كاملة بدون إعلانات مزعجة"
          actionText="تصفح المسلسلات"
          onAction={() => setCurrentTab('movies')}
        >
          {tvShows.map((tv) => (
            <MediaCard key={tv.tmdb_id} item={tv} onSelect={handleSelectMedia} />
          ))}
        </ContentRail>
      ) : null}

      {/* Rail 5: Popular Action & Thriller Movies */}
      {actionMovies.length > 0 && (
        <ContentRail
          title="أفلام الأكشن والإثارة والتشويق"
          subtitle="مختارات سينمائية عالية التقييم بدقة بلوراي"
          actionText="عرض المزيد"
          onAction={() => setCurrentTab('movies')}
        >
          {actionMovies.map((movie) => (
            <MediaCard key={movie.tmdb_id} item={movie} onSelect={handleSelectMedia} />
          ))}
        </ContentRail>
      )}

      {/* Rail 6: General Top Channels */}
      {isLoading ? (
        <ShimmerRail aspect="16/9" />
      ) : channels.length > 0 ? (
        <ContentRail
          title="قنوات تلفزيونية شائعة"
          subtitle="قنوات الأخبار، الترفيه، المنوعات والوثائقيات"
          actionText="عرض الكل"
          onAction={() => setCurrentTab('channels')}
        >
          {channels.slice(0, 16).map((channel) => (
            <ChannelCard key={channel.id} channel={channel} onPlay={handlePlayChannel} />
          ))}
        </ContentRail>
      ) : null}
      {/* Dedicated Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={handlePlayFromModal}
        />
      )}

      {/* Dedicated Series Detail Modal */}
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
