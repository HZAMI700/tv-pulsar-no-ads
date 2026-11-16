import { EspnEvent, EspnStandingTable, EspnGameAnalytics, EspnCompetitor, EspnStandingRow } from '../types';

export interface EspnMatchResult {
  id: string;
  name: string;
  league: string;
  isLive: boolean;
  statusText: string;
  clock?: string;
  team1: {
    name: string;
    score: number;
    logo?: string;
  };
  team2: {
    name: string;
    score: number;
    logo?: string;
  };
}

export interface EspnLeagueConfig {
  id: string;
  name: string;
  nameAr: string;
  sport: string;
  league: string;
  icon: string;
  color: string;
  country?: string;
}

export interface EspnSportCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  sportSlug: string;
  leagues: EspnLeagueConfig[];
}

export const ESPN_SPORTS_CATALOG: EspnSportCategory[] = [
  {
    id: 'soccer',
    name: 'Football (Soccer)',
    nameAr: 'كرة القدم',
    icon: '⚽',
    sportSlug: 'soccer',
    leagues: [
      {
        id: 'pl',
        name: 'Premier League',
        nameAr: 'الدوري الإنجليزي الممتاز',
        sport: 'soccer',
        league: 'eng.1',
        icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        color: '#3D195B',
        country: 'England',
      },
      {
        id: 'laliga',
        name: 'LaLiga',
        nameAr: 'الدوري الإسباني',
        sport: 'soccer',
        league: 'esp.1',
        icon: '🇪🇸',
        color: '#EE8707',
        country: 'Spain',
      },
      {
        id: 'ucl',
        name: 'UEFA Champions League',
        nameAr: 'دوري أبطال أوروبا',
        sport: 'soccer',
        league: 'uefa.champions',
        icon: '🏆',
        color: '#001438',
        country: 'Europe',
      },
      {
        id: 'uel',
        name: 'UEFA Europa League',
        nameAr: 'الدوري الأوروبي',
        sport: 'soccer',
        league: 'uefa.europa',
        icon: '🥈',
        color: '#F36F21',
        country: 'Europe',
      },
      {
        id: 'uecl',
        name: 'UEFA Conference League',
        nameAr: 'دوري المؤتمر الأوروبي',
        sport: 'soccer',
        league: 'uefa.europa.conf',
        icon: '🥉',
        color: '#009845',
        country: 'Europe',
      },
      {
        id: 'seriea',
        name: 'Serie A',
        nameAr: 'الدوري الإيطالي',
        sport: 'soccer',
        league: 'ita.1',
        icon: '🇮🇹',
        color: '#024494',
        country: 'Italy',
      },
      {
        id: 'bundesliga',
        name: 'Bundesliga',
        nameAr: 'الدوري الألماني',
        sport: 'soccer',
        league: 'ger.1',
        icon: '🇩🇪',
        color: '#D20515',
        country: 'Germany',
      },
      {
        id: 'ligue1',
        name: 'Ligue 1',
        nameAr: 'الدوري الفرنسي',
        sport: 'soccer',
        league: 'fra.1',
        icon: '🇫🇷',
        color: '#091C3E',
        country: 'France',
      },
      {
        id: 'spl',
        name: 'Saudi Pro League',
        nameAr: 'دوري روشن السعودي',
        sport: 'soccer',
        league: 'ksa.1',
        icon: '🇸🇦',
        color: '#006C35',
        country: 'Saudi Arabia',
      },
      {
        id: 'egy',
        name: 'Egyptian Premier League',
        nameAr: 'الدوري المصري الممتاز',
        sport: 'soccer',
        league: 'egy.1',
        icon: '🇪🇬',
        color: '#C8102E',
        country: 'Egypt',
      },
      {
        id: 'mor',
        name: 'Moroccan Botola Pro',
        nameAr: 'الدوري المغربي (البطولة الاحترافية)',
        sport: 'soccer',
        league: 'mar.1',
        icon: '🇲🇦',
        color: '#006233',
        country: 'Morocco',
      },
      {
        id: 'mls',
        name: 'Major League Soccer (MLS)',
        nameAr: 'الدوري الأمريكي (MLS)',
        sport: 'soccer',
        league: 'usa.1',
        icon: '🇺🇸',
        color: '#002B49',
        country: 'USA',
      },
      {
        id: 'eredivisie',
        name: 'Dutch Eredivisie',
        nameAr: 'الدوري الهولندي الممتاز',
        sport: 'soccer',
        league: 'ned.1',
        icon: '🇳🇱',
        color: '#1B4079',
        country: 'Netherlands',
      },
      {
        id: 'primeira',
        name: 'Liga Portugal',
        nameAr: 'الدوري البرتغالي الممتاز',
        sport: 'soccer',
        league: 'por.1',
        icon: '🇵🇹',
        color: '#006600',
        country: 'Portugal',
      },
      {
        id: 'libertadores',
        name: 'Copa Libertadores',
        nameAr: 'كوبا ليبرتادوريس',
        sport: 'soccer',
        league: 'conmebol.libertadores',
        icon: '🌎',
        color: '#E5A823',
        country: 'South America',
      },
      {
        id: 'caf',
        name: 'CAF Champions League',
        nameAr: 'دوري أبطال أفريقيا',
        sport: 'soccer',
        league: 'caf.champions',
        icon: '🌍',
        color: '#F4B223',
        country: 'Africa',
      },
      {
        id: 'afc',
        name: 'AFC Champions League',
        nameAr: 'دوري أبطال آسيا للنخبة',
        sport: 'soccer',
        league: 'afc.champions',
        icon: '🌏',
        color: '#002B66',
        country: 'Asia',
      },
      {
        id: 'facup',
        name: 'English FA Cup',
        nameAr: 'كأس الاتحاد الإنجليزي',
        sport: 'soccer',
        league: 'eng.fa',
        icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        color: '#C8102E',
        country: 'England',
      },
      {
        id: 'copadelrey',
        name: 'Copa del Rey',
        nameAr: 'كأس ملك إسبانيا',
        sport: 'soccer',
        league: 'esp.copa_del_rey',
        icon: '🇪🇸',
        color: '#AA151B',
        country: 'Spain',
      },
      {
        id: 'worldcup',
        name: 'FIFA World Cup',
        nameAr: 'كأس العالم FIFA',
        sport: 'soccer',
        league: 'fifa.world',
        icon: '🌍',
        color: '#8A1538',
        country: 'International',
      },
    ],
  },
  {
    id: 'basketball',
    name: 'Basketball',
    nameAr: 'كرة السلة',
    icon: '🏀',
    sportSlug: 'basketball',
    leagues: [
      {
        id: 'nba',
        name: 'NBA',
        nameAr: 'دوري كرة السلة الأمريكي للمحترفين (NBA)',
        sport: 'basketball',
        league: 'nba',
        icon: '🏀',
        color: '#1D428A',
        country: 'USA',
      },
      {
        id: 'wnba',
        name: 'WNBA',
        nameAr: 'دوري السلة النسائي (WNBA)',
        sport: 'basketball',
        league: 'wnba',
        icon: '🏀',
        color: '#FF671B',
        country: 'USA',
      },
      {
        id: 'ncaamb',
        name: "NCAA Men's College Basketball",
        nameAr: 'دوري الجامعات الأمريكي (NCAA)',
        sport: 'basketball',
        league: 'mens-college-basketball',
        icon: '🎓',
        color: '#00539B',
        country: 'USA',
      },
      {
        id: 'gleague',
        name: 'NBA G League',
        nameAr: 'دوري التطوير (G League)',
        sport: 'basketball',
        league: 'nba-development',
        icon: '🏀',
        color: '#000000',
        country: 'USA',
      },
    ],
  },
  {
    id: 'football',
    name: 'American Football',
    nameAr: 'كرة القدم الأمريكية',
    icon: '🏈',
    sportSlug: 'football',
    leagues: [
      {
        id: 'nfl',
        name: 'NFL',
        nameAr: 'دوري كرة القدم الأمريكية (NFL)',
        sport: 'football',
        league: 'nfl',
        icon: '🏈',
        color: '#013369',
        country: 'USA',
      },
      {
        id: 'ncaafb',
        name: 'NCAA College Football',
        nameAr: 'دوري الجامعات (College Football)',
        sport: 'football',
        league: 'college-football',
        icon: '🎓',
        color: '#D9381E',
        country: 'USA',
      },
      {
        id: 'ufl',
        name: 'UFL',
        nameAr: 'دوري (UFL)',
        sport: 'football',
        league: 'ufl',
        icon: '🏈',
        color: '#FFCC00',
        country: 'USA',
      },
      {
        id: 'cfl',
        name: 'CFL (Canadian Football)',
        nameAr: 'الدوري الكندي (CFL)',
        sport: 'football',
        league: 'cfl',
        icon: '🇨🇦',
        color: '#C8102E',
        country: 'Canada',
      },
    ],
  },
  {
    id: 'baseball',
    name: 'Baseball',
    nameAr: 'البيسبول',
    icon: '⚾',
    sportSlug: 'baseball',
    leagues: [
      {
        id: 'mlb',
        name: 'Major League Baseball (MLB)',
        nameAr: 'الدوري الأمريكي للبيسبول (MLB)',
        sport: 'baseball',
        league: 'mlb',
        icon: '⚾',
        color: '#002D72',
        country: 'USA',
      },
      {
        id: 'college-baseball',
        name: 'NCAA College Baseball',
        nameAr: 'دوري الجامعات للبيسبول',
        sport: 'baseball',
        league: 'college-baseball',
        icon: '🎓',
        color: '#BA0C2F',
        country: 'USA',
      },
    ],
  },
  {
    id: 'hockey',
    name: 'Ice Hockey',
    nameAr: 'هوكي الجليد',
    icon: '🏒',
    sportSlug: 'hockey',
    leagues: [
      {
        id: 'nhl',
        name: 'NHL',
        nameAr: 'دوري الهوكي الوطني (NHL)',
        sport: 'hockey',
        league: 'nhl',
        icon: '🏒',
        color: '#000000',
        country: 'North America',
      },
      {
        id: 'college-hockey',
        name: 'NCAA College Hockey',
        nameAr: 'دوري الجامعات للهوكي',
        sport: 'hockey',
        league: 'mens-college-hockey',
        icon: '🎓',
        color: '#154734',
        country: 'USA',
      },
    ],
  },
  {
    id: 'racing',
    name: 'Racing & Motorsport',
    nameAr: 'سباقات السيارات والمحركات',
    icon: '🏎️',
    sportSlug: 'racing',
    leagues: [
      {
        id: 'f1',
        name: 'Formula 1',
        nameAr: 'بطولة العالم للفورمولا 1',
        sport: 'racing',
        league: 'f1',
        icon: '🏎️',
        color: '#E10600',
        country: 'Global',
      },
      {
        id: 'nascar',
        name: 'NASCAR Cup Series',
        nameAr: 'سباقات ناسكار (NASCAR)',
        sport: 'racing',
        league: 'nascar-cup',
        icon: '🏁',
        color: '#FEDB00',
        country: 'USA',
      },
      {
        id: 'indycar',
        name: 'IndyCar Series',
        nameAr: 'سلسلة إندي كار',
        sport: 'racing',
        league: 'indycar',
        icon: '🏎️',
        color: '#00205B',
        country: 'USA',
      },
    ],
  },
  {
    id: 'tennis',
    name: 'Tennis',
    nameAr: 'كرة المضرب (التنس)',
    icon: '🎾',
    sportSlug: 'tennis',
    leagues: [
      {
        id: 'atp',
        name: 'ATP Tour',
        nameAr: 'رابطة محترفي التنس (ATP)',
        sport: 'tennis',
        league: 'atp',
        icon: '🎾',
        color: '#002855',
        country: 'Global',
      },
      {
        id: 'wta',
        name: 'WTA Tour',
        nameAr: 'رابطة محترفات التنس (WTA)',
        sport: 'tennis',
        league: 'wta',
        icon: '🎾',
        color: '#782F40',
        country: 'Global',
      },
    ],
  },
  {
    id: 'mma',
    name: 'MMA & Combat',
    nameAr: 'فنون القتال المختلطة (MMA)',
    icon: '🥊',
    sportSlug: 'mma',
    leagues: [
      {
        id: 'ufc',
        name: 'UFC',
        nameAr: 'بطولة القتال النهائي (UFC)',
        sport: 'mma',
        league: 'ufc',
        icon: '🥊',
        color: '#D20A11',
        country: 'Global',
      },
    ],
  },
  {
    id: 'cricket',
    name: 'Cricket',
    nameAr: 'الكريكيت',
    icon: '🏏',
    sportSlug: 'cricket',
    leagues: [
      {
        id: 'ipl',
        name: 'Indian Premier League (IPL)',
        nameAr: 'الدوري الهندي للكريكيت (IPL)',
        sport: 'cricket',
        league: 'ipl',
        icon: '🏏',
        color: '#183884',
        country: 'India',
      },
    ],
  },
  {
    id: 'golf',
    name: 'Golf',
    nameAr: 'الجولف',
    icon: '⛳',
    sportSlug: 'golf',
    leagues: [
      {
        id: 'pga',
        name: 'PGA Tour',
        nameAr: 'جولة لاعبي الجولف المحترفين (PGA)',
        sport: 'golf',
        league: 'pga',
        icon: '⛳',
        color: '#002F6C',
        country: 'Global',
      },
    ],
  },
  {
    id: 'rugby',
    name: 'Rugby',
    nameAr: 'الرغبي',
    icon: '🏉',
    sportSlug: 'rugby',
    leagues: [
      {
        id: 'six-nations',
        name: 'Six Nations Championship',
        nameAr: 'بطولة الأمم الست للرغبي',
        sport: 'rugby',
        league: 'six-nations',
        icon: '🏉',
        color: '#0A2540',
        country: 'Europe',
      },
    ],
  },
];

// Flattened list of all leagues across all sports
export const ESPN_FEATURED_LEAGUES: EspnLeagueConfig[] = ESPN_SPORTS_CATALOG.flatMap(
  (s) => s.leagues
);

// In-memory cache structures with TTL
const scoreboardCache = new Map<string, { timestamp: number; data: EspnEvent[] }>();
const standingsCache = new Map<string, { timestamp: number; data: EspnStandingTable[] }>();
const summaryCache = new Map<string, { timestamp: number; data: EspnGameAnalytics }>();
let globalScoresCache: Record<string, EspnMatchResult> = {};
let lastGlobalFetch = 0;

const SCOREBOARD_TTL = 20 * 1000; // 20s
const STANDINGS_TTL = 5 * 60 * 1000; // 5m
const SUMMARY_TTL = 30 * 1000; // 30s

export const espnService = {
  getSports(): EspnSportCategory[] {
    return ESPN_SPORTS_CATALOG;
  },

  getLeagues(): EspnLeagueConfig[] {
    return ESPN_FEATURED_LEAGUES;
  },

  getLeaguesBySport(sportId: string): EspnLeagueConfig[] {
    const sport = ESPN_SPORTS_CATALOG.find((s) => s.id === sportId || s.sportSlug === sportId);
    return sport ? sport.leagues : ESPN_SPORTS_CATALOG[0].leagues;
  },

  /**
   * Fetch scoreboard for a specific sport & league (and optional YYYYMMDD date)
   */
  async getScoreboard(
    sport: string,
    league: string,
    dateStr?: string
  ): Promise<EspnEvent[]> {
    const cacheKey = `${sport}_${league}_${dateStr || 'today'}`;
    const cached = scoreboardCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < SCOREBOARD_TTL) {
      return cached.data;
    }

    try {
      let url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
      if (dateStr) {
        url += `?dates=${dateStr}`;
      }

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        return cached ? cached.data : [];
      }

      const data = await res.json();
      const events: any[] = data.events || [];
      const parsedEvents: EspnEvent[] = [];

      const leagueName = data.leagues?.[0]?.name || league.toUpperCase();

      for (const ev of events) {
        const comp = ev.competitions?.[0] || {};
        const competitors: any[] = comp.competitors || [];

        // Flexible competitor resolution: works for teams, athletes, and individual sports
        const homeRaw = competitors.find((c) => c.homeAway === 'home') || competitors[0] || {};
        const awayRaw = competitors.find((c) => c.homeAway === 'away') || competitors[1] || competitors[0] || {};

        const state: 'pre' | 'in' | 'post' = ev.status?.type?.state || 'pre';
        const isLive = state === 'in';
        const statusDetail = ev.status?.type?.detail || (isLive ? 'LIVE' : 'Scheduled');

        const venue = comp.venue?.fullName || comp.venue?.address?.city;
        const broadcast = comp.broadcasts?.[0]?.names?.[0];

        const homeName =
          homeRaw.team?.displayName ||
          homeRaw.team?.name ||
          homeRaw.athlete?.displayName ||
          homeRaw.athlete?.name ||
          (competitors.length > 0 ? 'Home Participant' : ev.name || 'Event');

        const awayName =
          awayRaw.team?.displayName ||
          awayRaw.team?.name ||
          awayRaw.athlete?.displayName ||
          awayRaw.athlete?.name ||
          (competitors.length > 1 ? 'Away Participant' : 'Opponent');

        const home: EspnCompetitor = {
          id: homeRaw.id || homeRaw.team?.id || homeRaw.athlete?.id || 'home',
          name: homeName,
          displayName: homeName,
          abbreviation:
            homeRaw.team?.abbreviation ||
            homeRaw.team?.shortDisplayName ||
            homeRaw.athlete?.shortName ||
            'HOM',
          score: parseInt(homeRaw.score || '0', 10),
          homeAway: 'home',
          logo: homeRaw.team?.logo || homeRaw.athlete?.headshot?.href || homeRaw.athlete?.headshot,
          record: homeRaw.records?.[0]?.summary,
          winner: homeRaw.winner,
        };

        const away: EspnCompetitor = {
          id: awayRaw.id || awayRaw.team?.id || awayRaw.athlete?.id || 'away',
          name: awayName,
          displayName: awayName,
          abbreviation:
            awayRaw.team?.abbreviation ||
            awayRaw.team?.shortDisplayName ||
            awayRaw.athlete?.shortName ||
            'AWY',
          score: parseInt(awayRaw.score || '0', 10),
          homeAway: 'away',
          logo: awayRaw.team?.logo || awayRaw.athlete?.headshot?.href || awayRaw.athlete?.headshot,
          record: awayRaw.records?.[0]?.summary,
          winner: awayRaw.winner,
        };

        parsedEvents.push({
          id: ev.id,
          name: ev.name || `${home.displayName} vs ${away.displayName}`,
          shortName: ev.shortName || `${home.abbreviation} vs ${away.abbreviation}`,
          date: ev.date || comp.date || new Date().toISOString(),
          sport,
          league,
          leagueName,
          state,
          statusDetail,
          isLive,
          clock: ev.status?.displayClock,
          period: ev.status?.period,
          venue,
          broadcast,
          home,
          away,
        });
      }

      scoreboardCache.set(cacheKey, { timestamp: now, data: parsedEvents });
      return parsedEvents;
    } catch (err) {
      console.warn(`[ESPN] Failed to fetch scoreboard for ${sport}/${league}:`, err);
      return cached ? cached.data : [];
    }
  },

  /**
   * Fetch Standings using the critical `/apis/v2/` path!
   */
  async getStandings(
    sport: string,
    league: string,
    season?: number
  ): Promise<EspnStandingTable[]> {
    const cacheKey = `${sport}_${league}_${season || 'current'}`;
    const cached = standingsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < STANDINGS_TTL) {
      return cached.data;
    }

    try {
      let url = `https://site.api.espn.com/apis/v2/sports/${sport}/${league}/standings`;
      if (season) {
        url += `?season=${season}`;
      }

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        return cached ? cached.data : [];
      }

      const data = await res.json();
      const tables: EspnStandingTable[] = [];

      // Standings can be in data.children (e.g. Conferences / Divisions) or directly data.standings
      const groups = data.children && data.children.length > 0 ? data.children : [data];

      for (const group of groups) {
        const entries: any[] = group.standings?.entries || [];
        const rows: EspnStandingRow[] = [];

        for (const entry of entries) {
          const statsMap: Record<string, string> = {};
          if (Array.isArray(entry.stats)) {
            for (const s of entry.stats) {
              if (s.name) {
                statsMap[s.name] = s.displayValue ?? String(s.value ?? '');
              }
            }
          }

          const rank = parseInt(statsMap.rank || statsMap.playoffSeed || '0', 10) || rows.length + 1;
          const points = parseInt(statsMap.points || '0', 10);
          const gamesPlayed = parseInt(statsMap.gamesPlayed || statsMap.games || '0', 10);
          const wins = parseInt(statsMap.wins || '0', 10);
          const losses = parseInt(statsMap.losses || '0', 10);
          const ties = parseInt(statsMap.ties || statsMap.tiesOT || '0', 10);
          const goalDifferential = statsMap.pointDifferential || statsMap.differential || '0';

          rows.push({
            rank,
            team: {
              id: entry.team?.id || '',
              name: entry.team?.name || entry.team?.displayName || 'Team',
              displayName: entry.team?.displayName || entry.team?.name || 'Team',
              abbreviation: entry.team?.abbreviation || 'TM',
              logo: entry.team?.logos?.[0]?.href || entry.team?.logo,
            },
            stats: statsMap,
            points,
            gamesPlayed,
            wins,
            losses,
            ties,
            goalDifferential,
          });
        }

        // Sort by rank or points
        rows.sort((a, b) => {
          if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
          return b.points - a.points;
        });

        tables.push({
          name: group.name || group.abbreviation || 'League Table',
          abbreviation: group.abbreviation || 'TBL',
          rows,
        });
      }

      standingsCache.set(cacheKey, { timestamp: now, data: tables });
      return tables;
    } catch (err) {
      console.warn(`[ESPN] Failed to fetch standings for ${sport}/${league}:`, err);
      return cached ? cached.data : [];
    }
  },

  /**
   * Fetch Game Summary & Deep Analytics for a specific event
   */
  async getGameSummary(
    sport: string,
    league: string,
    eventId: string
  ): Promise<EspnGameAnalytics | null> {
    const cacheKey = `${sport}_${league}_${eventId}`;
    const cached = summaryCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < SUMMARY_TTL) {
      return cached.data;
    }

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return cached ? cached.data : null;

      const data = await res.json();
      const box = data.boxscore || {};
      const teams: any[] = box.teams || [];

      const homeStats: Record<string, string> = {};
      const awayStats: Record<string, string> = {};

      if (teams.length >= 2) {
        const team0 = teams[0];
        const team1 = teams[1];

        const is0Home = team0.homeAway === 'home';
        const homeTeam = is0Home ? team0 : team1;
        const awayTeam = is0Home ? team1 : team0;

        for (const s of homeTeam.statistics || []) {
          if (s.name) homeStats[s.name] = s.displayValue ?? String(s.value ?? '');
        }
        for (const s of awayTeam.statistics || []) {
          if (s.name) awayStats[s.name] = s.displayValue ?? String(s.value ?? '');
        }
      }

      // Win Predictor
      let predictor: EspnGameAnalytics['predictor'];
      if (data.predictor) {
        predictor = {
          homeWinPercentage: parseFloat(
            data.predictor.homeTeam?.gameProjection || data.predictor.awayTeam?.gameProjection
              ? data.predictor.homeTeam?.gameProjection
              : '50'
          ),
          awayWinPercentage: parseFloat(data.predictor.awayTeam?.gameProjection || '50'),
        };
      }

      // Plays / Highlights
      const plays: EspnGameAnalytics['plays'] = [];
      const rawPlays: any[] = data.plays || [];
      for (const p of rawPlays.slice(-15)) {
        plays.push({
          id: p.id || Math.random().toString(),
          text: p.text || p.alternativeText || '',
          clock: p.clock?.displayValue,
          type: p.type?.text,
          teamId: p.team?.id,
          scoringPlay: p.scoringPlay,
        });
      }

      // Leaders
      const leaders: EspnGameAnalytics['leaders'] = [];
      for (const l of data.leaders || []) {
        leaders.push({
          name: l.name || '',
          displayName: l.displayName || '',
          leaders: (l.leaders || []).map((lead: any) => ({
            displayValue: lead.displayValue || '',
            athlete: {
              id: lead.athlete?.id || '',
              displayName: lead.athlete?.displayName || lead.athlete?.name || 'Player',
              headshot: lead.athlete?.headshot?.href || lead.athlete?.headshot,
              position: lead.athlete?.position?.abbreviation,
              jersey: lead.athlete?.jersey,
            },
          })),
        });
      }

      const analytics: EspnGameAnalytics = {
        eventId,
        homeStats,
        awayStats,
        predictor,
        plays: plays.reverse(), // most recent first
        leaders,
      };

      summaryCache.set(cacheKey, { timestamp: now, data: analytics });
      return analytics;
    } catch (err) {
      console.warn(`[ESPN] Failed to fetch game summary for ${eventId}:`, err);
      return cached ? cached.data : null;
    }
  },

  /**
   * Legacy method for cross-match scoreboard index
   */
  async getScoreboards(): Promise<Record<string, EspnMatchResult>> {
    const now = Date.now();
    if (now - lastGlobalFetch < SCOREBOARD_TTL && Object.keys(globalScoresCache).length > 0) {
      return globalScoresCache;
    }

    const results: Record<string, EspnMatchResult> = {};

    const fetchSingle = async (cfg: EspnLeagueConfig) => {
      try {
        const events = await this.getScoreboard(cfg.sport, cfg.league);
        for (const ev of events) {
          const matchObj: EspnMatchResult = {
            id: ev.id,
            name: `${ev.home.displayName} vs ${ev.away.displayName}`,
            league: cfg.name,
            isLive: ev.isLive,
            statusText: ev.statusDetail,
            clock: ev.clock,
            team1: {
              name: ev.home.displayName,
              score: ev.home.score,
              logo: ev.home.logo,
            },
            team2: {
              name: ev.away.displayName,
              score: ev.away.score,
              logo: ev.away.logo,
            },
          };

          const key1 = `${ev.home.name.toLowerCase()} vs ${ev.away.name.toLowerCase()}`;
          const key2 = `${ev.away.name.toLowerCase()} vs ${ev.home.name.toLowerCase()}`;
          results[key1] = matchObj;
          results[key2] = matchObj;
        }
      } catch (_) {}
    };

    // Pre-fetch top soccer leagues + NBA
    const topLeagues = ESPN_FEATURED_LEAGUES.slice(0, 10);
    await Promise.allSettled(topLeagues.map((cfg) => fetchSingle(cfg)));

    globalScoresCache = results;
    lastGlobalFetch = now;
    return results;
  },

  async matchWithEspn(
    matchName: string,
    team1Name?: string,
    team2Name?: string
  ): Promise<EspnMatchResult | null> {
    const scores = await this.getScoreboards();

    const clean = matchName.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    if (scores[clean]) return scores[clean];

    const t1 = team1Name?.toLowerCase().trim() || '';
    const t2 = team2Name?.toLowerCase().trim() || '';

    if (t1 && t2) {
      const directKey = `${t1} vs ${t2}`;
      if (scores[directKey]) return scores[directKey];

      for (const [k, v] of Object.entries(scores)) {
        if (k.includes(t1) && k.includes(t2)) {
          return v;
        }
      }
    }

    return null;
  },
};
