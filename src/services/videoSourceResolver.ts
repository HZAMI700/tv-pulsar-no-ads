export interface VideoResolutionParams {
  type: 'movie' | 'tv' | 'episode' | 'channel' | 'match';
  mediaId: string;
  tmdbId?: string;
  season?: number;
  episode?: number;
  quality?: string;
  resumeAt?: number;
  directUrl?: string;
  title?: string;
}

export interface ResolvedVideoSource {
  url: string;
  headers: Record<string, string>;
  type: 'mp4' | 'hls' | 'dash' | 'embed';
  quality: string;
  title?: string;
  tmdbId?: string;
  season?: number;
  episode?: number;
}

const VIDLINK_BASE = 'https://vidlink.pro';

function cleanTmdbId(id: string): string {
  if (!id) return '';
  return id.toString().replace(/^(?:vidapi-)?(?:movie|tv)-/, '').split(/[-_sSeE]/)[0].replace(/[^0-9]/g, '') || id;
}

/**
 * Shared Single Source of Truth for Video Source Resolution
 * Used identically by both UniversalPlayer streaming and PulsarDownloader offline engine.
 */
export function resolveVideoSource(params: VideoResolutionParams): ResolvedVideoSource {
  const quality = params.quality || '1080p';
  const cleanId = cleanTmdbId(params.tmdbId || params.mediaId);

  // 1. Movies
  if (params.type === 'movie') {
    const sec = params.resumeAt && params.resumeAt > 2 ? Math.floor(params.resumeAt) : 0;
    const startParam = sec > 0 ? `&startAtNew=${sec}&startAt=${sec}&time=${sec}` : '';
    const embedUrl = `${VIDLINK_BASE}/movie/${cleanId}?primaryColor=FF1838&secondaryColor=170000&iconColor=FF1838&icons=vid&title=false&poster=true&autoplay=true&nextbutton=true${startParam}&muted=false&mute=0&volume=1`;

    return {
      url: embedUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://vidlink.pro/',
      },
      type: 'embed',
      quality,
      title: params.title,
      tmdbId: cleanId,
    };
  }

  // 2. TV Series & Individual Episodes
  if (params.type === 'tv' || params.type === 'episode') {
    const season = params.season || 1;
    const episode = params.episode || 1;
    const sec = params.resumeAt && params.resumeAt > 2 ? Math.floor(params.resumeAt) : 0;
    const startParam = sec > 0 ? `&startAtNew=${sec}&startAt=${sec}&time=${sec}` : '';
    const embedUrl = `${VIDLINK_BASE}/tv/${cleanId}/${season}/${episode}?primaryColor=FF1838&secondaryColor=170000&iconColor=FF1838&icons=vid&title=false&poster=true&autoplay=true&nextbutton=true${startParam}&muted=false&mute=0&volume=1`;

    return {
      url: embedUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://vidlink.pro/',
      },
      type: 'embed',
      quality,
      title: params.title,
      tmdbId: cleanId,
      season,
      episode,
    };
  }

  // 3. Channels and Matches
  const streamUrl = params.directUrl || '';
  const isHls = streamUrl.endsWith('.m3u8') || streamUrl.includes('.m3u8?');
  const isDash = streamUrl.endsWith('.mpd') || streamUrl.includes('.mpd?');

  return {
    url: streamUrl,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    },
    type: isHls ? 'hls' : isDash ? 'dash' : 'mp4',
    quality,
    title: params.title,
  };
}
