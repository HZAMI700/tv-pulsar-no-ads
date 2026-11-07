import { VidApiMovie, VidApiTvShow, WatchProgress } from '../types';

const VIDAPI_BASE = 'https://vidapi.ru';
const VAPLAYER_BASE = 'https://vaplayer.ru';
const VIDLINK_BASE = 'https://vidlink.pro';
const TOD_PRIMARY_COLOR = '%23FF1838';

export interface VidApiResponse<T> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  items: T[];
}

export interface TvEpisodeItem {
  episodeNumber: number;
  title: string;
  seasonNumber: number;
  duration?: string;
  overview?: string;
}

export const vidApiService = {
  async getLatestMovies(page: number = 1): Promise<VidApiResponse<VidApiMovie>> {
    const res = await fetch(`${VIDAPI_BASE}/movies/latest/page-${page}.json`);
    if (!res.ok) throw new Error(`Failed to fetch movies page ${page}`);
    return res.json();
  },

  async getLatestTvShows(page: number = 1): Promise<VidApiResponse<VidApiTvShow>> {
    const res = await fetch(`${VIDAPI_BASE}/tvshows/latest/page-${page}.json`);
    if (!res.ok) throw new Error(`Failed to fetch TV shows page ${page}`);
    return res.json();
  },

  /**
   * Centralized VidLink Pro Movie Embed (Single Source of Truth)
   * Uses startAtNew (VidLink standard) and startAt for precise minute/second resume
   */
  buildMovieEmbedUrl(tmdbId: string, resumeAt?: number, _server?: number): string {
    const cleanId = tmdbId.toString().split(/[-_]/)[0].replace(/[^0-9]/g, '') || tmdbId;
    const sec = resumeAt && resumeAt > 2 ? Math.floor(resumeAt) : 0;
    const startParam = sec > 0 ? `&startAtNew=${sec}&startAt=${sec}&time=${sec}` : '';
    return `${VIDLINK_BASE}/movie/${cleanId}?primaryColor=FF1838&secondaryColor=170000&iconColor=FF1838&icons=vid&title=false&poster=true&autoplay=true&nextbutton=true${startParam}&muted=false&mute=0&volume=1`;
  },

  /**
   * Centralized VidLink Pro TV Embed (Single Source of Truth)
   * Uses startAtNew (VidLink standard) and startAt for precise episode + timestamp resume
   */
  buildTvEmbedUrl(tmdbId: string, season: number = 1, episode: number = 1, resumeAt?: number, _server?: number): string {
    const cleanId = tmdbId.toString().split(/[-_sSeE]/)[0].replace(/[^0-9]/g, '') || tmdbId;
    const sec = resumeAt && resumeAt > 2 ? Math.floor(resumeAt) : 0;
    const startParam = sec > 0 ? `&startAtNew=${sec}&startAt=${sec}&time=${sec}` : '';
    return `${VIDLINK_BASE}/tv/${cleanId}/${season}/${episode}?primaryColor=FF1838&secondaryColor=170000&iconColor=FF1838&icons=vid&title=false&poster=true&autoplay=true&nextbutton=true${startParam}&muted=false&mute=0&volume=1`;
  },

  /**
   * Generate curated episode structure for any TV series
   */
  getEpisodesForSeason(seasonNumber: number, episodeCount: number = 12): TvEpisodeItem[] {
    const episodes: TvEpisodeItem[] = [];
    for (let i = 1; i <= episodeCount; i++) {
      episodes.push({
        episodeNumber: i,
        seasonNumber,
        title: `الحلقة ${i}`,
        duration: '45 دقيقة',
        overview: `أحداث مشوقة ومثيرة من الموسم ${seasonNumber} الحلقة ${i}.`,
      });
    }
    return episodes;
  },

  saveProgress(mediaId: string, timestamp: number, duration: number): void {
    try {
      const progress: WatchProgress = {
        mediaId,
        timestamp,
        duration,
        updatedAt: Date.now(),
      };
      localStorage.setItem(`progress_${mediaId}`, JSON.stringify(progress));
    } catch (e) {
      console.warn('Could not save progress to localStorage', e);
    }
  },

  getProgress(mediaId: string): WatchProgress | null {
    try {
      const raw = localStorage.getItem(`progress_${mediaId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getAllSavedProgress(): WatchProgress[] {
    const list: WatchProgress[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('progress_')) {
          const item = localStorage.getItem(key);
          if (item) {
            list.push(JSON.parse(item));
          }
        }
      }
    } catch (_) {}
    return list;
  },
};
