export type ContentType = 'channel' | 'match' | 'movie' | 'tv' | 'episode';

export type NavigationTab = 'home' | 'sports' | 'channels' | 'movies' | 'discover' | 'favorites';

export interface ChannelItem {
  id: string;
  name: string;
  src: string;
  category: string;
  country: string;
  program?: string;
  isFeatured?: boolean;
  logoAsset?: string;
  resolvedLogo?: string;
  viewers?: number;
}

export interface MatchStreamSource {
  quality: string;
  url: string;
  live?: boolean;
}

export interface MatchServer {
  id: string;
  name: string;
  quality: string;
  url: string;
  isLive: boolean;
  isBest?: boolean;
  latencyMs?: number;
}

export interface MatchItem {
  id: string;
  name: string;
  category: string;
  league: string;
  streamKey: string;
  matchTimestamp: number;
  viewers?: number;
  thumbnailUrl?: string;
  sources: MatchStreamSource[];
  liveSources: MatchStreamSource[];
  servers: MatchServer[];
  team1?: { name: string; logo?: string; score?: number };
  team2?: { name: string; logo?: string; score?: number };
  playableUrl: string;
  isLive: boolean;
}

export interface VidApiMovie {
  tmdb_id: string;
  imdb_id?: string;
  title: string;
  year: string;
  poster_url: string;
  backdrop_url?: string;
  overview?: string;
  rating: string;
  genre: string;
  popularity: string;
  type: 'movie';
  embed_url: string;
  cast?: string[];
  director?: string;
  runtime?: number;
}

export interface VidApiTvShow {
  tmdb_id: string;
  imdb_id?: string;
  title: string;
  year: string;
  poster_url: string;
  backdrop_url?: string;
  overview?: string;
  rating: string;
  genre: string;
  popularity: string;
  type: 'tv';
  embed_url: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  cast?: string[];
}

export interface TmdbSeason {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterPath?: string;
  airDate?: string;
}

export interface TmdbEpisode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillPath?: string;
  airDate?: string;
  duration?: string;
  voteAverage?: number;
}

export interface VidApiEpisode {
  show_tmdb_id: string;
  season_number: string | number;
  episode_number: string | number;
  episode_title: string;
  air_date: string;
  show_title: string;
  show_imdb_id?: string;
  type: 'episode';
  embed_url: string;
}

export interface ActiveMedia {
  id: string;
  title: string;
  subtitle?: string;
  type: ContentType;
  streamUrl: string;
  poster?: string;
  badges?: string[];
  resumeTime?: number;
  totalDuration?: number;
  isLive?: boolean;
  tvMeta?: {
    tmdbId?: string;
    imdbId?: string;
    season: number;
    episode: number;
    showTitle: string;
  };
  matchMeta?: {
    category: string;
    streamKey: string;
    servers: MatchServer[];
    activeServerIndex: number;
  };
}

export interface WatchProgress {
  mediaId: string;
  timestamp: number;
  duration: number;
  updatedAt: number;
}

export interface EpisodeWatchProgress {
  currentTime: number;
  duration: number;
  watched: boolean;
  updatedAt: number;
}

export interface WatchHistoryItem {
  id: string;
  title: string;
  subtitle?: string;
  type: ContentType;
  streamUrl: string;
  poster?: string;
  timestamp: number;
  duration?: number;
  watchedAt: number;
  tvMeta?: {
    tmdbId?: string;
    imdbId?: string;
    season: number;
    episode: number;
    showTitle: string;
  };
  matchMeta?: {
    category: string;
    streamKey: string;
    servers: MatchServer[];
    activeServerIndex: number;
  };
}
