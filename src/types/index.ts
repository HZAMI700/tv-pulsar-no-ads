export type ContentType = 'channel' | 'match' | 'movie' | 'tv' | 'episode';

export type NavigationTab = 'home' | 'sports' | 'channels' | 'movies' | 'discover' | 'favorites' | 'downloads' | 'library' | 'download' | 'settings' | 'scores';

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
  subtitleUrl?: string;
  subtitleLanguage?: string;
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

export interface EspnCompetitor {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  score: number;
  homeAway: 'home' | 'away';
  logo?: string;
  record?: string;
  winner?: boolean;
}

export interface EspnEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  sport: string;
  league: string;
  leagueName: string;
  state: 'pre' | 'in' | 'post';
  statusDetail: string;
  isLive: boolean;
  clock?: string;
  period?: number;
  venue?: string;
  broadcast?: string;
  home: EspnCompetitor;
  away: EspnCompetitor;
}

export interface EspnStandingRow {
  rank: number;
  team: {
    id: string;
    name: string;
    displayName: string;
    abbreviation: string;
    logo?: string;
  };
  stats: Record<string, string>;
  points: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalDifferential: string;
}

export interface EspnStandingTable {
  name: string;
  abbreviation: string;
  rows: EspnStandingRow[];
}

export interface EspnGameAnalytics {
  eventId: string;
  homeStats: Record<string, string>;
  awayStats: Record<string, string>;
  predictor?: {
    homeWinPercentage?: number;
    awayWinPercentage?: number;
  };
  plays?: Array<{
    id: string;
    text: string;
    clock?: string;
    type?: string;
    teamId?: string;
    scoringPlay?: boolean;
  }>;
  leaders?: Array<{
    name: string;
    displayName: string;
    leaders: Array<{
      displayValue: string;
      athlete: {
        id: string;
        displayName: string;
        headshot?: string;
        position?: string;
        jersey?: string;
      };
    }>;
  }>;
}



export type DownloadStatus = 'QUEUED' | 'DOWNLOADING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'DELETED';

export interface DownloadTask {
  downloadId: string;
  mediaId: string;
  mediaType: 'movie' | 'episode' | 'tv';
  title: string;
  seriesId?: string;
  seriesTitle?: string;
  season?: number;
  episode?: number;
  quality: string;
  status: DownloadStatus;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  filePath?: string;
  fileUri?: string;
  playableUri?: string;
  subtitleUrl?: string;
  subtitleLanguage?: string;
  subtitleLanguages?: string[];
  subtitleUrls?: Record<string, string>;
  posterUrl?: string;
  error?: string;
  speedBytesPerSec?: number;
  speedFormatted?: string;
  etaSeconds?: number;
  createdAt?: number;
  updatedAt?: number;
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




