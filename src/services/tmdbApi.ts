import { VidApiMovie, VidApiTvShow, TmdbSeason, TmdbEpisode } from '../types';

const TMDB_API_KEYS = [
  '4e44d9029b1270a757cddc766a1bcb63',
  '844dba0bfd8f3a4f3799f6130ef9e335',
  '15d2ea6d0dc1d476efbca3eba2b9bbfb',
];

let activeKeyIndex = 0;

function getApiKey(): string {
  return TMDB_API_KEYS[activeKeyIndex % TMDB_API_KEYS.length];
}

function rotateApiKey(): void {
  activeKeyIndex = (activeKeyIndex + 1) % TMDB_API_KEYS.length;
}

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE_W500 = 'https://image.tmdb.org/t/p/w500';
const IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/original';

export const MOVIE_GENRES = [
  { id: 'all', label: 'All Genres' },
  { id: '28', label: 'Action' },
  { id: '12', label: 'Adventure' },
  { id: '16', label: 'Animation' },
  { id: '35', label: 'Comedy' },
  { id: '80', label: 'Crime' },
  { id: '99', label: 'Documentary' },
  { id: '18', label: 'Drama' },
  { id: '14', label: 'Fantasy' },
  { id: '27', label: 'Horror' },
  { id: '9648', label: 'Mystery' },
  { id: '10749', label: 'Romance' },
  { id: '878', label: 'Sci-Fi' },
  { id: '53', label: 'Thriller' },
];

export const TV_GENRES = [
  { id: 'all', label: 'All Categories' },
  { id: '10759', label: 'Action & Adventure' },
  { id: '16', label: 'Animation' },
  { id: '35', label: 'Comedy' },
  { id: '80', label: 'Crime' },
  { id: '99', label: 'Documentary' },
  { id: '18', label: 'Drama' },
  { id: '9648', label: 'Mystery' },
  { id: '10765', label: 'Sci-Fi & Fantasy' },
  { id: '10768', label: 'War & Politics' },
];

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

// Pure family-friendly / NSFW content filter
const NSFW_BLOCKED_WORDS = [
  'erotic', 'porn', 'pornographic', 'sex', 'sexual', 'sensual', 'softcore', 'hardcore',
  'hentai', 'nude', 'nudity', 'explicit', 'fetish', 'orgasm', 'incest', 'xxx', 'milf',
  'playboy', 'penthouse', 'lust', 'erotica', 'escort', 'camgirl', 'stripper', 'brothel',
  'hooker', 'whore', 'slut', 'gangbang', 'threesome', 'bdsm', 'dominatrix', 'intercourse',
  'orgies', 'orgy', 'nymphomaniac', 'swinger', 'pleasure', 'passion', 'carnal',
];

const NSFW_EXPLICIT_TITLES = [
  '365 days', 'fifty shades', '50 shades', 'nymphomaniac', 'deep water', 'wild things',
  'basic instinct', 'caligula', 'the voyeurs', 'sex/life', 'dark desire', 'after we collided',
  'after we fell', 'after ever happy', 'after everything', 'babygirl', "miller's girl",
  'eyes wide shut', 'blue is the warmest color', 'shortbus', 'antichrist', 'love 2015',
  'tie me up tie me down', 'wild orchid', '9 1/2 weeks', 'fatal attraction', 'body heat',
  'after',
];

const NSFW_REGEX = new RegExp(`\\b(${NSFW_BLOCKED_WORDS.join('|')})\\b`, 'i');

export function isFamilySafe(item: any): boolean {
  if (!item) return false;
  if (item.adult === true) return false;

  const title = (item.title || item.name || item.original_title || '').toLowerCase();
  const overview = (item.overview || '').toLowerCase();

  for (const blocked of NSFW_EXPLICIT_TITLES) {
    if (title === blocked || title.startsWith(blocked + ' ') || title.includes(` ${blocked} `) || title.includes(` ${blocked}:`)) {
      return false;
    }
  }

  if (NSFW_REGEX.test(title)) return false;

  if (/\b(erotic|porn|softcore|hentai|orgasm|incest|xxx|milf|gangbang|threesome|bdsm|sexual intercourse)\b/i.test(overview)) {
    return false;
  }

  return true;
}

const TMDB_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const tmdbCache = new Map<string, { timestamp: number; data: any }>();

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  const now = Date.now();
  const cached = tmdbCache.get(cacheKey);

  if (cached && now - cached.timestamp < TMDB_CACHE_TTL) {
    return JSON.parse(JSON.stringify(cached.data)) as T;
  }

  // Always query with en-US to retrieve real English names for all movies and series
  const query = new URLSearchParams({
    api_key: getApiKey(),
    language: 'en-US',
    ...params,
  });

  const url = `${TMDB_BASE}${endpoint}?${query.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429 || res.status === 401) {
        rotateApiKey();
        const retryQuery = new URLSearchParams({
          api_key: getApiKey(),
          language: 'en-US',
          ...params,
        });
        const retryRes = await fetch(`${TMDB_BASE}${endpoint}?${retryQuery.toString()}`);
        if (!retryRes.ok) throw new Error(`TMDB HTTP ${retryRes.status}`);
        const data = await retryRes.json();
        
        // Cache successful response
        if (tmdbCache.size > 250) {
          const oldestKey = tmdbCache.keys().next().value;
          if (oldestKey) tmdbCache.delete(oldestKey);
        }
        tmdbCache.set(cacheKey, { timestamp: now, data });
        return data as T;
      }
      throw new Error(`TMDB HTTP ${res.status}`);
    }
    const data = await res.json();
    
    // Cache successful response
    if (tmdbCache.size > 250) {
      const oldestKey = tmdbCache.keys().next().value;
      if (oldestKey) tmdbCache.delete(oldestKey);
    }
    tmdbCache.set(cacheKey, { timestamp: now, data });
    return data as T;
  } catch (err) {
    // If network fails but we have stale cache, return it rather than failing
    if (cached) {
      console.warn(`TMDB fetch error for ${endpoint}, using stale cache`, err);
      return JSON.parse(JSON.stringify(cached.data)) as T;
    }
    console.warn(`TMDB fetch error for ${endpoint}`, err);
    throw err;
  }
}

export interface TmdbCatalogResponse<T> {
  page: number;
  items: T[];
  totalPages: number;
  totalCount: number;
}

export const tmdbService = {
  /**
   * Centralized VidLink Pro Embed URL Builder
   * Movie: https://vidlink.pro/movie/{tmdb_id}
   * TV: https://vidlink.pro/tv/{tmdb_id}/{season}/{episode}
   */
  buildMovieEmbedUrl(tmdbId: string, resumeAt?: number): string {
    const cleanId = tmdbId.toString().split(/[-_]/)[0].replace(/[^0-9]/g, '') || tmdbId;
    const sec = resumeAt && resumeAt > 2 ? Math.floor(resumeAt) : 0;
    const startParam = sec > 0 ? `&startAtNew=${sec}&startAt=${sec}&time=${sec}` : '';
    return `https://vidlink.pro/movie/${cleanId}?primaryColor=FF1838&secondaryColor=170000&iconColor=FF1838&icons=vid&title=false&poster=true&autoplay=true&nextbutton=true${startParam}&muted=false&mute=0&volume=1`;
  },

  buildTvEmbedUrl(tmdbId: string, season: number = 1, episode: number = 1, resumeAt?: number): string {
    const cleanId = tmdbId.toString().split(/[-_sSeE]/)[0].replace(/[^0-9]/g, '') || tmdbId;
    const sec = resumeAt && resumeAt > 2 ? Math.floor(resumeAt) : 0;
    const startParam = sec > 0 ? `&startAtNew=${sec}&startAt=${sec}&time=${sec}` : '';
    return `https://vidlink.pro/tv/${cleanId}/${season}/${episode}?primaryColor=FF1838&secondaryColor=170000&iconColor=FF1838&icons=vid&title=false&poster=true&autoplay=true&nextbutton=true${startParam}&muted=false&mute=0&volume=1`;
  },

  /**
   * Discover Movies with exactly 100 items per catalog page
   */
  async discoverMovies(options: {
    page: number;
    genreId?: string;
    year?: string;
    sortBy?: string;
  }): Promise<TmdbCatalogResponse<VidApiMovie>> {
    const { page, genreId, year, sortBy = 'popularity.desc' } = options;
    const tmdbPageStart = (page - 1) * 5 + 1;
    const pagesToFetch = [0, 1, 2, 3, 4].map((offset) => tmdbPageStart + offset);

    const baseParams: Record<string, string> = {
      include_adult: 'false',
      include_video: 'false',
      sort_by: sortBy,
    };

    if (sortBy === 'vote_average.desc') {
      baseParams['vote_count.gte'] = '80';
    }

    if (genreId && genreId !== 'all') {
      baseParams['with_genres'] = genreId;
    }

    if (year && year !== 'all') {
      baseParams['primary_release_year'] = year;
    }

    const responses = await Promise.allSettled(
      pagesToFetch.map((p) =>
        tmdbFetch<{ results: any[]; total_results: number; total_pages: number }>(
          '/discover/movie',
          { ...baseParams, page: p.toString() }
        )
      )
    );

    const allRawItems: any[] = [];
    let totalResults = 0;

    for (const res of responses) {
      if (res.status === 'fulfilled') {
        allRawItems.push(...(res.value.results || []));
        totalResults = Math.max(totalResults, res.value.total_results || 0);
      }
    }

    // Map to VidApiMovie format with real English title (strictly filtered for family safety)
    const items: VidApiMovie[] = allRawItems
      .filter(isFamilySafe)
      .slice(0, 100)
      .map((m) => {
      const genreName =
        m.genre_ids && m.genre_ids.length > 0 && GENRE_MAP[m.genre_ids[0]]
          ? GENRE_MAP[m.genre_ids[0]]
          : 'Cinema';

      const releaseYear = m.release_date ? m.release_date.split('-')[0] : '2026';
      const poster = m.poster_path
        ? `${IMAGE_BASE_W500}${m.poster_path}`
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
      const backdrop = m.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${m.backdrop_path}` : undefined;

      const englishTitle = m.title || m.original_title || 'Movie';

      return {
        tmdb_id: m.id.toString(),
        title: englishTitle,
        year: releaseYear,
        poster_url: poster,
        backdrop_url: backdrop,
        overview: m.overview || undefined,
        rating: m.vote_average ? m.vote_average.toFixed(1) : '6.5',
        genre: genreName,
        popularity: m.popularity ? m.popularity.toString() : '100',
        type: 'movie',
        embed_url: this.buildMovieEmbedUrl(m.id.toString()),
      };
    });

    const catalogTotalPages = Math.max(1, Math.min(100, Math.ceil(totalResults / 100)));

    return {
      page,
      items,
      totalPages: catalogTotalPages,
      totalCount: totalResults,
    };
  },

  /**
   * Discover TV Shows with exactly 100 items per catalog page
   */
  async discoverTvShows(options: {
    page: number;
    genreId?: string;
    year?: string;
    sortBy?: string;
  }): Promise<TmdbCatalogResponse<VidApiTvShow>> {
    const { page, genreId, year, sortBy = 'popularity.desc' } = options;
    const tmdbPageStart = (page - 1) * 5 + 1;
    const pagesToFetch = [0, 1, 2, 3, 4].map((offset) => tmdbPageStart + offset);

    const baseParams: Record<string, string> = {
      include_adult: 'false',
      include_null_first_air_dates: 'false',
      sort_by: sortBy === 'primary_release_date.desc' ? 'first_air_date.desc' : sortBy,
    };

    if (sortBy === 'vote_average.desc') {
      baseParams['vote_count.gte'] = '60';
    }

    if (genreId && genreId !== 'all') {
      baseParams['with_genres'] = genreId;
    }

    if (year && year !== 'all') {
      baseParams['first_air_date_year'] = year;
    }

    const responses = await Promise.allSettled(
      pagesToFetch.map((p) =>
        tmdbFetch<{ results: any[]; total_results: number; total_pages: number }>(
          '/discover/tv',
          { ...baseParams, page: p.toString() }
        )
      )
    );

    const allRawItems: any[] = [];
    let totalResults = 0;

    for (const res of responses) {
      if (res.status === 'fulfilled') {
        allRawItems.push(...(res.value.results || []));
        totalResults = Math.max(totalResults, res.value.total_results || 0);
      }
    }

    // Map to VidApiTvShow format with real English title (strictly filtered for family safety)
    const items: VidApiTvShow[] = allRawItems
      .filter(isFamilySafe)
      .slice(0, 100)
      .map((tv) => {
      const genreName =
        tv.genre_ids && tv.genre_ids.length > 0 && GENRE_MAP[tv.genre_ids[0]]
          ? GENRE_MAP[tv.genre_ids[0]]
          : 'TV Series';

      const releaseYear = tv.first_air_date ? tv.first_air_date.split('-')[0] : '2026';
      const poster = tv.poster_path
        ? `${IMAGE_BASE_W500}${tv.poster_path}`
        : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=500&q=80';
      const backdrop = tv.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${tv.backdrop_path}` : undefined;

      const englishTitle = tv.name || tv.original_name || 'TV Series';

      return {
        tmdb_id: tv.id.toString(),
        title: englishTitle,
        year: releaseYear,
        poster_url: poster,
        backdrop_url: backdrop,
        overview: tv.overview || undefined,
        rating: tv.vote_average ? tv.vote_average.toFixed(1) : '7.0',
        genre: genreName,
        popularity: tv.popularity ? tv.popularity.toString() : '100',
        type: 'tv',
        embed_url: this.buildTvEmbedUrl(tv.id.toString(), 1, 1),
      };
    });

    const catalogTotalPages = Math.max(1, Math.min(100, Math.ceil(totalResults / 100)));

    return {
      page,
      items,
      totalPages: catalogTotalPages,
      totalCount: totalResults,
    };
  },

  /**
   * Search Movies and TV shows by keyword (e.g., Game of Thrones, The Mentalist)
   */
  async searchCatalog(query: string): Promise<(VidApiMovie | VidApiTvShow)[]> {
    if (!query.trim()) return [];

    try {
      const [movieRes, tvRes] = await Promise.all([
        tmdbFetch<{ results: any[] }>('/search/movie', {
          query: query.trim(),
          include_adult: 'false',
        }),
        tmdbFetch<{ results: any[] }>('/search/tv', {
          query: query.trim(),
          include_adult: 'false',
        }),
      ]);

      const movies: VidApiMovie[] = (movieRes.results || [])
        .filter(isFamilySafe)
        .slice(0, 15)
        .map((m) => ({
        tmdb_id: m.id.toString(),
        title: m.title || m.original_title || '',
        year: m.release_date ? m.release_date.split('-')[0] : '',
        poster_url: m.poster_path
          ? `${IMAGE_BASE_W500}${m.poster_path}`
          : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
        backdrop_url: m.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${m.backdrop_path}` : undefined,
        overview: m.overview || undefined,
        rating: m.vote_average ? m.vote_average.toFixed(1) : '6.5',
        genre: m.genre_ids?.[0] && GENRE_MAP[m.genre_ids[0]] ? GENRE_MAP[m.genre_ids[0]] : 'Cinema',
        popularity: m.popularity?.toString() || '0',
        type: 'movie',
        embed_url: this.buildMovieEmbedUrl(m.id.toString()),
      }));

      const tvs: VidApiTvShow[] = (tvRes.results || [])
        .filter(isFamilySafe)
        .slice(0, 15)
        .map((tv) => ({
        tmdb_id: tv.id.toString(),
        title: tv.name || tv.original_name || '',
        year: tv.first_air_date ? tv.first_air_date.split('-')[0] : '',
        poster_url: tv.poster_path
          ? `${IMAGE_BASE_W500}${tv.poster_path}`
          : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=500&q=80',
        backdrop_url: tv.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${tv.backdrop_path}` : undefined,
        overview: tv.overview || undefined,
        rating: tv.vote_average ? tv.vote_average.toFixed(1) : '7.0',
        genre: tv.genre_ids?.[0] && GENRE_MAP[tv.genre_ids[0]] ? GENRE_MAP[tv.genre_ids[0]] : 'TV Series',
        popularity: tv.popularity?.toString() || '0',
        type: 'tv',
        embed_url: this.buildTvEmbedUrl(tv.id.toString(), 1, 1),
      }));

      return [...movies, ...tvs].sort((a, b) => parseFloat(b.popularity) - parseFloat(a.popularity));
    } catch (err) {
      console.warn('Search failed', err);
      return [];
    }
  },

  /**
   * Get Movie Full Details + Credits (Cast & Director)
   */
  async getMovieDetails(tmdbId: string): Promise<Partial<VidApiMovie>> {
    try {
      const cleanId = tmdbId.toString().split(/[-_]/)[0].replace(/[^0-9]/g, '') || tmdbId;
      const data = await tmdbFetch<any>(`/movie/${cleanId}`, {
        append_to_response: 'credits',
      });

      const cast = (data.credits?.cast || []).slice(0, 6).map((c: any) => c.name);
      const director = data.credits?.crew?.find((c: any) => c.job === 'Director')?.name;

      return {
        title: data.title || data.original_title,
        overview: data.overview,
        backdrop_url: data.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${data.backdrop_path}` : undefined,
        poster_url: data.poster_path ? `${IMAGE_BASE_W500}${data.poster_path}` : undefined,
        rating: data.vote_average ? data.vote_average.toFixed(1) : undefined,
        year: data.release_date ? data.release_date.split('-')[0] : undefined,
        genre: data.genres?.[0]?.name,
        runtime: data.runtime,
        cast,
        director,
      };
    } catch {
      return {};
    }
  },

  /**
   * Get TV Show Details + Seasons + Cast
   */
  async getTvShowDetails(tmdbId: string): Promise<{
    details: Partial<VidApiTvShow>;
    seasons: TmdbSeason[];
  }> {
    try {
      const cleanId = tmdbId.toString().split(/[-_sSeE]/)[0].replace(/[^0-9]/g, '') || tmdbId;
      const data = await tmdbFetch<any>(`/tv/${cleanId}`, {
        append_to_response: 'credits',
      });

      const cast = (data.credits?.cast || []).slice(0, 6).map((c: any) => c.name);
      const rawSeasons = (data.seasons || []).filter((s: any) => s.season_number > 0);

      const seasons: TmdbSeason[] = rawSeasons.map((s: any) => ({
        id: s.id,
        seasonNumber: s.season_number,
        name: s.name || `Season ${s.season_number}`,
        episodeCount: s.episode_count || 10,
        posterPath: s.poster_path ? `${IMAGE_BASE_W500}${s.poster_path}` : undefined,
        airDate: s.air_date,
      }));

      return {
        details: {
          title: data.name || data.original_name,
          overview: data.overview,
          backdrop_url: data.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${data.backdrop_path}` : undefined,
          poster_url: data.poster_path ? `${IMAGE_BASE_W500}${data.poster_path}` : undefined,
          rating: data.vote_average ? data.vote_average.toFixed(1) : undefined,
          year: data.first_air_date ? data.first_air_date.split('-')[0] : undefined,
          genre: data.genres?.[0]?.name,
          numberOfSeasons: data.number_of_seasons,
          numberOfEpisodes: data.number_of_episodes,
          cast,
        },
        seasons: seasons.length > 0 ? seasons : [
          { id: 1, seasonNumber: 1, name: 'Season 1', episodeCount: 12 },
        ],
      };
    } catch {
      return {
        details: {},
        seasons: [{ id: 1, seasonNumber: 1, name: 'Season 1', episodeCount: 12 }],
      };
    }
  },

  /**
   * Get Full Episode List for a specific TV Season
   */
  async getSeasonEpisodes(tmdbId: string, seasonNumber: number): Promise<TmdbEpisode[]> {
    try {
      const cleanId = tmdbId.toString().split(/[-_sSeE]/)[0].replace(/[^0-9]/g, '') || tmdbId;
      const data = await tmdbFetch<any>(`/tv/${cleanId}/season/${seasonNumber}`);
      const rawEpisodes = data.episodes || [];

      return rawEpisodes.map((ep: any) => ({
        id: ep.id,
        episodeNumber: ep.episode_number,
        seasonNumber: ep.season_number || seasonNumber,
        name: ep.name || `Episode ${ep.episode_number}`,
        overview: ep.overview || `Season ${seasonNumber} Episode ${ep.episode_number}.`,
        stillPath: ep.still_path ? `${IMAGE_BASE_W500}${ep.still_path}` : undefined,
        airDate: ep.air_date,
        duration: ep.runtime ? `${ep.runtime}m` : '45m',
        voteAverage: ep.vote_average,
      }));
    } catch {
      const episodes: TmdbEpisode[] = [];
      for (let i = 1; i <= 12; i++) {
        episodes.push({
          id: i,
          episodeNumber: i,
          seasonNumber,
          name: `Episode ${i}`,
          overview: `Season ${seasonNumber} Episode ${i}.`,
          duration: '45m',
        });
      }
      return episodes;
    }
  },

  /**
   * Get Trending Content for Home Page Rails
   */
  async getTrendingMovies(): Promise<VidApiMovie[]> {
    try {
      const data = await tmdbFetch<{ results: any[] }>('/trending/movie/week');
      return (data.results || [])
        .filter(isFamilySafe)
        .slice(0, 20)
        .map((m) => ({
        tmdb_id: m.id.toString(),
        title: m.title || m.original_title || '',
        year: m.release_date ? m.release_date.split('-')[0] : '2026',
        poster_url: m.poster_path
          ? `${IMAGE_BASE_W500}${m.poster_path}`
          : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
        backdrop_url: m.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${m.backdrop_path}` : undefined,
        overview: m.overview || undefined,
        rating: m.vote_average ? m.vote_average.toFixed(1) : '7.0',
        genre: m.genre_ids?.[0] && GENRE_MAP[m.genre_ids[0]] ? GENRE_MAP[m.genre_ids[0]] : 'Cinema',
        popularity: m.popularity?.toString() || '100',
        type: 'movie',
        embed_url: this.buildMovieEmbedUrl(m.id.toString()),
      }));
    } catch {
      return [];
    }
  },

  async getTrendingTvShows(): Promise<VidApiTvShow[]> {
    try {
      const data = await tmdbFetch<{ results: any[] }>('/trending/tv/week');
      return (data.results || [])
        .filter(isFamilySafe)
        .slice(0, 20)
        .map((tv) => ({
        tmdb_id: tv.id.toString(),
        title: tv.name || tv.original_name || '',
        year: tv.first_air_date ? tv.first_air_date.split('-')[0] : '2026',
        poster_url: tv.poster_path
          ? `${IMAGE_BASE_W500}${tv.poster_path}`
          : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=500&q=80',
        backdrop_url: tv.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${tv.backdrop_path}` : undefined,
        overview: tv.overview || undefined,
        rating: tv.vote_average ? tv.vote_average.toFixed(1) : '7.5',
        genre: tv.genre_ids?.[0] && GENRE_MAP[tv.genre_ids[0]] ? GENRE_MAP[tv.genre_ids[0]] : 'TV Series',
        popularity: tv.popularity?.toString() || '100',
        type: 'tv',
        embed_url: this.buildTvEmbedUrl(tv.id.toString(), 1, 1),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Latest Cinema Releases (Now Playing in Theaters)
   */
  async getLatestMovies(): Promise<VidApiMovie[]> {
    try {
      const data = await tmdbFetch<{ results: any[] }>('/movie/now_playing', { page: '1' });
      return (data.results || [])
        .filter(isFamilySafe)
        .slice(0, 20)
        .map((m) => ({
          tmdb_id: m.id.toString(),
          title: m.title || m.original_title || '',
          year: m.release_date ? m.release_date.split('-')[0] : '2026',
          poster_url: m.poster_path
            ? `${IMAGE_BASE_W500}${m.poster_path}`
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
          backdrop_url: m.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${m.backdrop_path}` : undefined,
          overview: m.overview || undefined,
          rating: m.vote_average ? m.vote_average.toFixed(1) : '7.0',
          genre: m.genre_ids?.[0] && GENRE_MAP[m.genre_ids[0]] ? GENRE_MAP[m.genre_ids[0]] : 'Cinema',
          popularity: m.popularity?.toString() || '100',
          type: 'movie',
          embed_url: this.buildMovieEmbedUrl(m.id.toString()),
        }));
    } catch {
      return [];
    }
  },

  /**
   * Latest TV Series On The Air (Currently Airing)
   */
  async getLatestTvShows(): Promise<VidApiTvShow[]> {
    try {
      const data = await tmdbFetch<{ results: any[] }>('/tv/on_the_air', { page: '1' });
      return (data.results || [])
        .filter(isFamilySafe)
        .slice(0, 20)
        .map((tv) => ({
          tmdb_id: tv.id.toString(),
          title: tv.name || tv.original_name || '',
          year: tv.first_air_date ? tv.first_air_date.split('-')[0] : '2026',
          poster_url: tv.poster_path
            ? `${IMAGE_BASE_W500}${tv.poster_path}`
            : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=500&q=80',
          backdrop_url: tv.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${tv.backdrop_path}` : undefined,
          overview: tv.overview || undefined,
          rating: tv.vote_average ? tv.vote_average.toFixed(1) : '7.5',
          genre: tv.genre_ids?.[0] && GENRE_MAP[tv.genre_ids[0]] ? GENRE_MAP[tv.genre_ids[0]] : 'TV Series',
          popularity: tv.popularity?.toString() || '100',
          type: 'tv',
          embed_url: this.buildTvEmbedUrl(tv.id.toString(), 1, 1),
        }));
    } catch {
      return [];
    }
  },
};
