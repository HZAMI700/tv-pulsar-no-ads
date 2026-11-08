import { MatchItem, MatchServer, MatchStreamSource } from '../types';
import { espnService, EspnMatchResult } from './espnApi';

const STREAMFREE_BASE = 'https://streamfree.top';
const STRMFREE_EMBED_BASE = 'https://strmfree.st';

export interface SportsCategoryInfo {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
}

export const SPORTS_CATEGORIES: SportsCategoryInfo[] = [
  { id: 'all', nameEn: 'All Sports', nameAr: 'All Sports', icon: '🏆' },
  { id: 'soccer', nameEn: 'Soccer', nameAr: 'Soccer', icon: '⚽' },
  { id: 'basketball', nameEn: 'Basketball', nameAr: 'Basketball', icon: '🏀' },
  { id: 'combat', nameEn: 'Combat', nameAr: 'Combat', icon: '🥊' },
  { id: 'football', nameEn: 'Football', nameAr: 'Football', icon: '🏈' },
  { id: 'racing', nameEn: 'Racing', nameAr: 'Racing', icon: '🏎️' },
  { id: 'tennis', nameEn: 'Tennis', nameAr: 'Tennis', icon: '🎾' },
  { id: 'hockey', nameEn: 'Hockey', nameAr: 'Hockey', icon: '🏒' },
  { id: 'baseball', nameEn: 'Baseball', nameAr: 'Baseball', icon: '⚾' },
  { id: 'cricket', nameEn: 'Cricket', nameAr: 'Cricket', icon: '🏏' },
];

// Official high-resolution crests
export const TEAM_LOGO_MAP: Record<string, string> = {
  // Premier League
  'manchester city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'man city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'nottingham forest': 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png',
  'nottingham': 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png',
  arsenal: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
  liverpool: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
  'manchester united': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'man utd': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  chelsea: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
  tottenham: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
  newcastle: 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
  'aston villa': 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png',
  'crystal palace': 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png',
  brentford: 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png',
  brighton: 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
  'brighton & hove albion': 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
  bournemouth: 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png',
  'afc bournemouth': 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png',
  ipswich: 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png',
  'ipswich town': 'https://a.espncdn.com/i/teamlogos/soccer/500/373.png',
  sunderland: 'https://a.espncdn.com/i/teamlogos/soccer/500/366.png',
  'grimsby town': 'https://a.espncdn.com/i/teamlogos/soccer/500/386.png',
  fenerbahce: 'https://a.espncdn.com/i/teamlogos/soccer/500/436.png',
  // Serie A
  bologna: 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png',
  parma: 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png',
  inter: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  milan: 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  'ac milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  juventus: 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
  roma: 'https://a.espncdn.com/i/teamlogos/soccer/500/105.png',
  lazio: 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png',
  napoli: 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png',
  atalanta: 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  fiorentina: 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
  monza: 'https://a.espncdn.com/i/teamlogos/soccer/500/2729.png',
  genoa: 'https://a.espncdn.com/i/teamlogos/soccer/500/3263.png',
  sassuolo: 'https://a.espncdn.com/i/teamlogos/soccer/500/398.png',
  // La Liga
  'real madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
  barcelona: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  'atletico madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
  'real betis': 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png',
  betis: 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png',
  elche: 'https://a.espncdn.com/i/teamlogos/soccer/500/3751.png',
  // Bundesliga / Ligue 1
  'bayern munich': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
  dortmund: 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  psg: 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'paris saint-germain': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  lille: 'https://a.espncdn.com/i/teamlogos/soccer/500/166.png',
  rennes: 'https://a.espncdn.com/i/teamlogos/soccer/500/169.png',
  'stade rennais': 'https://a.espncdn.com/i/teamlogos/soccer/500/169.png',
  // Arab Clubs
  'al hilal': 'https://a.espncdn.com/i/teamlogos/soccer/500/7318.png',
  'al nassr': 'https://a.espncdn.com/i/teamlogos/soccer/500/7322.png',
  'al ahly': 'https://a.espncdn.com/i/teamlogos/soccer/500/3074.png',
  zamalek: 'https://a.espncdn.com/i/teamlogos/soccer/500/3077.png',
  // NBA Teams
  'phoenix suns': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/phx.png',
  'golden state warriors': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/gs.png',
  'toronto raptors': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/tor.png',
  'la clippers': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/lac.png',
  'los angeles lakers': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/lal.png',
  'miami heat': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/mia.png',
  'boston celtics': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/bos.png',
  'milwaukee bucks': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/mil.png',
  'denver nuggets': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/den.png',
  'indiana pacers': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/ind.png',
  'brooklyn nets': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/bkn.png',
  'atlanta hawks': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/atl.png',
  'new york knicks': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/ny.png',
  'cleveland cavaliers': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/cle.png',
  'houston rockets': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/hou.png',
  'san antonio spurs': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/sa.png',
  'portland trail blazers': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/por.png',
  'washington wizards': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/wsh.png',
  'oklahoma city thunder': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/okc.png',
  'orlando magic': 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/orl.png',
};

// Official League Badges for center of card
export const LEAGUE_BADGE_MAP: Record<string, string> = {
  'premier league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
  'epl': 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
  'uefa champions league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
  'champions league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
  'la liga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
  'laliga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
  'serie a': 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
  'bundesliga': 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
  'ligue 1': 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
  'nba': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'nfl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  'ncaaf': 'https://a.espncdn.com/i/teamlogos/ncaa/500/scoreboard/ncaa.png',
  'ncaa': 'https://a.espncdn.com/i/teamlogos/ncaa/500/scoreboard/ncaa.png',
  'fa cup': 'https://a.espncdn.com/i/leaguelogos/soccer/500/1000.png',
  'facup': 'https://a.espncdn.com/i/leaguelogos/soccer/500/1000.png',
  'ufc': 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-mma.png&w=100&h=100',
  'f1': 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-f1.png&w=100&h=100',
};

export function resolveLeagueBadge(leagueName?: string, category?: string): string | undefined {
  const clean = (leagueName || '').toLowerCase().trim();
  if (!clean) return undefined;
  for (const [key, url] of Object.entries(LEAGUE_BADGE_MAP)) {
    if (clean === key || clean.includes(key)) {
      return url;
    }
  }
  if (category === 'basketball') return LEAGUE_BADGE_MAP['nba'];
  if (category === 'racing') return LEAGUE_BADGE_MAP['f1'];
  if (category === 'combat') return LEAGUE_BADGE_MAP['ufc'];
  if (category === 'football') return LEAGUE_BADGE_MAP['nfl'];
  return undefined;
}

export function getTeamColor(name?: string, isRightSide: boolean = false): string {
  if (!name) return isRightSide ? '#241220' : '#12182c';
  const clean = name.toLowerCase().trim();
  if (clean.includes('manchester city') || clean.includes('man city')) return '#0c2e50';
  if (clean.includes('nottingham')) return '#66101c';
  if (clean.includes('arsenal') || clean.includes('liverpool') || clean.includes('bayern')) return '#66101c';
  if (clean.includes('real madrid')) return '#181e33';
  if (clean.includes('barcelona')) return isRightSide ? '#661020' : '#0c2044';
  if (clean.includes('chelsea')) return '#0c2654';
  if (clean.includes('manchester united') || clean.includes('man utd')) return '#66101a';
  if (clean.includes('juventus')) return '#18181a';
  if (clean.includes('inter')) return '#0a1e3d';
  if (clean.includes('milan')) return '#591016';
  if (clean.includes('bologna')) return '#0c1b33';
  if (clean.includes('parma')) return '#473a08';
  if (clean.includes('denver')) return '#0b2038';
  if (clean.includes('indiana') || clean.includes('pacers')) return '#4a3608';
  if (clean.includes('brooklyn') || clean.includes('nets')) return '#141416';
  if (clean.includes('atlanta') || clean.includes('hawks')) return '#541218';
  if (clean.includes('new york') || clean.includes('knicks')) return '#0a2342';
  if (clean.includes('cleveland') || clean.includes('cavaliers')) return '#3d101a';
  if (clean.includes('lakers')) return '#2e0f42';
  if (clean.includes('warriors')) return '#0a274a';
  if (clean.includes('celtics')) return '#082b14';
  if (clean.includes('suns')) return '#472108';
  if (clean.includes('heat')) return '#4f0e16';
  if (clean.includes('bulls')) return '#5c0f16';
  if (clean.includes('spurs')) return '#1e1e20';
  if (clean.includes('rockets')) return '#541218';
  if (clean.includes('thunder')) return '#0a2847';
  if (clean.includes('magic')) return '#08223d';

  // Deterministic dark theme from name hash
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 48%, 14%)`;
}

export function resolveTeamLogo(teamName: string, existingLogo?: string): string | undefined {
  if (
    existingLogo &&
    existingLogo.trim().length > 0 &&
    !existingLogo.includes('default') &&
    !existingLogo.includes('null') &&
    !existingLogo.includes('ui-avatars')
  ) {
    return existingLogo;
  }
  const clean = teamName.toLowerCase().trim();
  if (TEAM_LOGO_MAP[clean]) {
    return TEAM_LOGO_MAP[clean];
  }
  for (const [key, url] of Object.entries(TEAM_LOGO_MAP)) {
    if (clean === key || clean.includes(key)) {
      return url;
    }
  }
  for (const [key, url] of Object.entries(TEAM_LOGO_MAP)) {
    if (key.includes(clean) && clean.length >= 4) {
      return url;
    }
  }
  return undefined;
}

export interface RawStreamFreeSource {
  quality: string;
  url: string;
  live?: boolean;
}

export interface RawStreamFreeItem {
  id?: string;
  name: string;
  category: string;
  league: string;
  stream_key: string;
  match_timestamp: number;
  viewers?: number;
  thumbnail_url?: string;
  sources?: RawStreamFreeSource[];
  live_sources?: RawStreamFreeSource[];
  team1?: { name: string; logo?: string; score?: number };
  team2?: { name: string; logo?: string; score?: number };
}

export function formatMatchTime(timestampSec: number): {
  isLive: boolean;
  statusBadge: string;
  statusText: string;
  formattedTime: string;
} {
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = timestampSec - nowSec;
  const matchDate = new Date(timestampSec * 1000);

  const hoursStr = matchDate.getHours().toString().padStart(2, '0');
  const minutesStr = matchDate.getMinutes().toString().padStart(2, '0');
  const formattedTime = `${hoursStr}:${minutesStr}`;

  // Match is live if within -2.5 hours to +10 mins
  if (diffSec <= 600 && diffSec >= -9000) {
    return {
      isLive: true,
      statusBadge: 'LIVE',
      statusText: 'LIVE NOW',
      formattedTime,
    };
  }

  if (diffSec > 600) {
    const diffHours = Math.floor(diffSec / 3600);
    const diffMinutes = Math.floor((diffSec % 3600) / 60);

    let statusBadge = '';
    let statusText = '';
    if (diffHours === 0) {
      statusBadge = `${diffMinutes}m`;
      statusText = `Starts in ${diffMinutes}m`;
    } else if (diffHours < 24) {
      const remainingMins = diffMinutes % 60;
      statusBadge = remainingMins > 0 ? `${diffHours}h ${remainingMins}m` : `${diffHours}h`;
      statusText = `Starts in ${diffHours}h`;
    } else {
      statusBadge = formattedTime;
      statusText = `Today ${formattedTime}`;
    }

    return {
      isLive: false,
      statusBadge,
      statusText,
      formattedTime,
    };
  }

  return {
    isLive: false,
    statusBadge: 'ENDED',
    statusText: 'Ended',
    formattedTime,
  };
}

/**
 * Builds all streaming servers for a given match:
 * 1. FHD Server (1080p)
 * 2. SD Server (540p)
 * 3. Primary StreamFree CDN Mirror
 * 4. StrmFree Direct Backup Mirror
 */
export function buildMatchServers(
  category: string,
  streamKey: string,
  rawSources?: RawStreamFreeSource[]
): MatchServer[] {
  const cat = category || 'soccer';
  const servers: MatchServer[] = [];

  // 1. Process sources provided by the API
  if (rawSources && rawSources.length > 0) {
    rawSources.forEach((src, idx) => {
      const q = (src.quality || 'HD').toUpperCase();
      const isFHD = q.includes('1080') || q.includes('FHD');
      const isSD = q.includes('540') || q.includes('SD') || q.includes('480');
      
      let serverLabel = `Server ${idx + 1} (${q})`;
      if (isFHD) serverLabel = `Server 1 (FHD 1080p)`;
      else if (isSD) serverLabel = `Server 2 (SD 540p)`;

      servers.push({
        id: `api-src-${idx}`,
        name: serverLabel,
        quality: q,
        url: src.url,
        isLive: Boolean(src.live),
      });
    });
  }

  // 2. Add fallback canonical embeds if not already present
  const hasFhd = servers.some((s) => s.quality.includes('1080') || s.quality.includes('FHD'));
  const hasSd = servers.some((s) => s.quality.includes('540') || s.quality.includes('SD'));

  if (!hasFhd) {
    servers.unshift({
      id: 'fhd-canonical',
      name: `Server 1 (FHD 1080p)`,
      quality: 'FHD',
      url: `${STRMFREE_EMBED_BASE}/embed/${cat}/${streamKey}1080p`,
      isLive: false,
    });
  }

  if (!hasSd) {
    servers.push({
      id: 'sd-canonical',
      name: `Server 2 (SD 540p)`,
      quality: 'SD',
      url: `${STRMFREE_EMBED_BASE}/embed/${cat}/${streamKey}540p`,
      isLive: false,
    });
  }

  // 3. Add High-Stability CDN Mirror
  const cdnMirrorUrl = `${STREAMFREE_BASE}/embed/${cat}/${streamKey}`;
  if (!servers.some((s) => s.url === cdnMirrorUrl)) {
    servers.push({
      id: 'cdn-mirror',
      name: `Server 3 (StreamFree CDN)`,
      quality: 'HD',
      url: cdnMirrorUrl,
      isLive: true,
    });
  }

  // 4. Add Backup Mirror
  const backupMirrorUrl = `${STRMFREE_EMBED_BASE}/embed/${cat}/${streamKey}`;
  if (!servers.some((s) => s.url === backupMirrorUrl)) {
    servers.push({
      id: 'backup-mirror',
      name: `Server 4 (Backup Server)`,
      quality: 'Auto',
      url: backupMirrorUrl,
      isLive: true,
    });
  }

  return servers;
}

/**
 * Automatically tests server latency & availability and designates the best server
 */
export async function testAndSelectBestServer(servers: MatchServer[]): Promise<{
  bestServer: MatchServer;
  testedServers: MatchServer[];
}> {
  if (!servers || servers.length === 0) {
    throw new Error('No servers available to test');
  }

  // Fast latency ping with 1200ms timeout
  const pingPromises = servers.map(async (srv) => {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      await fetch(srv.url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timer);
      const latency = Math.round(performance.now() - start);
      return { ...srv, latencyMs: latency };
    } catch (_) {
      return { ...srv, latencyMs: 9999 };
    }
  });

  const results = await Promise.all(pingPromises);

  const scored = results.map((s) => {
    let score = 0;
    if (s.isLive) score += 1000;
    if (s.quality.includes('1080') || s.quality.includes('FHD')) score += 300;
    else if (s.quality.includes('HD')) score += 200;
    else score += 100;

    if (s.latencyMs && s.latencyMs < 9999) {
      score += Math.max(0, 500 - s.latencyMs);
    }
    return { server: s, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0].server;
  const testedServers = results.map((srv) => ({
    ...srv,
    isBest: srv.id === best.id,
  }));

  const bestWithFlag = testedServers.find((s) => s.id === best.id) || testedServers[0];

  return {
    bestServer: bestWithFlag,
    testedServers,
  };
}

let cachedStreams: MatchItem[] = [];
let lastStreamsFetch = 0;
const STREAMS_CACHE_TTL = 45 * 1000;

export const streamFreeService = {
  getCategories(): SportsCategoryInfo[] {
    return SPORTS_CATEGORIES;
  },

  async getStreamSources(streamKey: string): Promise<RawStreamFreeSource[]> {
    try {
      const res = await fetch(`${STREAMFREE_BASE}/api/v1/sources/${encodeURIComponent(streamKey)}`);
      if (res.ok) {
        const data = await res.json();
        return data.sources || [];
      }
    } catch (e) {
      console.warn(`Failed to fetch fresh sources for stream ${streamKey}`, e);
    }
    return [];
  },

  async getLiveMatches(preferredCategory: string = 'all'): Promise<MatchItem[]> {
    const now = Date.now();
    const useCache =
      preferredCategory === 'all' &&
      now - lastStreamsFetch < STREAMS_CACHE_TTL &&
      cachedStreams.length > 0;

    if (useCache) {
      return cachedStreams;
    }

    try {
      const endpoint =
        preferredCategory && preferredCategory !== 'all'
          ? `${STREAMFREE_BASE}/api/v1/streams?category=${encodeURIComponent(preferredCategory)}`
          : `${STREAMFREE_BASE}/api/v1/streams`;

      const [streamRes, espnScores] = await Promise.all([
        fetch(endpoint, { headers: { Accept: 'application/json' } }),
        espnService.getScoreboards().catch(() => ({} as Record<string, EspnMatchResult>)),
      ]);

      let realMatches: MatchItem[] = [];

      if (streamRes.ok) {
        const data = await streamRes.json();
        const rawStreams: RawStreamFreeItem[] = data.streams || [];

        realMatches = rawStreams.map((s, idx) => {
          const { isLive, statusBadge, statusText, formattedTime } = formatMatchTime(s.match_timestamp);

          const servers = buildMatchServers(s.category, s.stream_key, s.sources);

          const liveServer = servers.find((srv) => srv.isLive);
          const fhdServer = servers.find((srv) => srv.quality.includes('1080') || srv.quality.includes('FHD'));
          const bestInitialServer = liveServer || fhdServer || servers[0];
          bestInitialServer.isBest = true;

          const isIndividualEvent =
            s.category === 'combat' ||
            s.category === 'racing' ||
            s.category === 'tennis' ||
            s.category === 'cricket';

          // Team names resolution
          let team1Name = s.team1?.name;
          let team2Name = s.team2?.name;

          if (!isIndividualEvent && (!team1Name || !team2Name)) {
            const parts = s.name.split(/\s+(?:vs\.?|-)\s+/i);
            if (parts.length >= 2) {
              team1Name = parts[0].trim();
              team2Name = parts[1].trim();
            } else {
              team1Name = s.name;
              team2Name = '';
            }
          }

          const cleanName = s.name.toLowerCase();
          const t1Clean = (team1Name || '').toLowerCase();
          const t2Clean = (team2Name || '').toLowerCase();

          // Only match ESPN scoreboard if BOTH teams match to prevent cross-tournament logo corruption
          const espnMatch =
            espnScores[cleanName] ||
            (t1Clean && t2Clean ? (espnScores[`${t1Clean} vs ${t2Clean}`] || espnScores[`${t2Clean} vs ${t1Clean}`]) : undefined);

          const t1Score = espnMatch ? espnMatch.team1.score : (s.team1?.score ?? (isLive ? 1 : 0));
          const t2Score = espnMatch ? espnMatch.team2.score : (s.team2?.score ?? (isLive ? 0 : 0));

          // StreamFree provides authentic high-res logos (e.g. Lazio 112.png, Napoli 114.png)
          const team1Logo = s.team1?.logo || (team1Name ? resolveTeamLogo(team1Name) : undefined);
          const team2Logo = s.team2?.logo || (team2Name ? resolveTeamLogo(team2Name) : undefined);

          // League priority: StreamFree API is authoritative, ESPN scoreboard is fallback
          let leagueName = s.league || espnMatch?.league;
          if (!leagueName) {
            if (s.category === 'soccer') leagueName = 'Premier League';
            else if (s.category === 'basketball') leagueName = 'NBA';
            else if (s.category === 'combat') leagueName = 'UFC';
            else if (s.category === 'racing') leagueName = 'F1';
            else if (s.category === 'tennis') leagueName = 'SKY';
            else leagueName = s.category.toUpperCase();
          }

          return {
            id: s.id || s.stream_key || `stream-${idx}`,
            name: s.name,
            category: s.category || 'soccer',
            league: leagueName,
            streamKey: s.stream_key,
            matchTimestamp: s.match_timestamp,
            viewers: s.viewers || Math.floor(Math.random() * 800) + 120,
            thumbnailUrl: s.thumbnail_url || `${STREAMFREE_BASE}/thumbnails/${s.category}_${s.stream_key}`,
            sources: (s.sources || []).map((src) => ({ quality: src.quality, url: src.url, live: src.live })),
            liveSources: (s.live_sources || []).map((src) => ({ quality: src.quality, url: src.url, live: src.live })),
            servers,
            team1: team1Name
              ? {
                  name: team1Name,
                  logo: team1Logo,
                  score: t1Score,
                }
              : undefined,
            team2: team2Name
              ? {
                  name: team2Name,
                  logo: team2Logo,
                  score: t2Score,
                }
              : undefined,
            playableUrl: bestInitialServer.url,
            isLive: espnMatch ? espnMatch.isLive : isLive,
          };
        });
      }

      const validMatches = realMatches.filter((rm) => {
        return Boolean(rm.streamKey && rm.streamKey.trim().length > 0 && rm.name && rm.name.trim().length > 1);
      });

      if (preferredCategory === 'all') {
        cachedStreams = validMatches;
        lastStreamsFetch = now;
      }

      return validMatches;
    } catch (err) {
      console.warn('Failed to load StreamFree live streams', err);
      return [];
    }
  },
};
