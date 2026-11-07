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

const ESPN_SOCCER_LEAGUES = [
  { key: 'eng.1', name: 'الدوري الإنجليزي الممتاز' },
  { key: 'esp.1', name: 'الدوري الإسباني (LaLiga)' },
  { key: 'ita.1', name: 'الدوري الإيطالي (Serie A)' },
  { key: 'ger.1', name: 'الدوري الألماني (Bundesliga)' },
  { key: 'fra.1', name: 'الدوري الفرنسي (Ligue 1)' },
  { key: 'uefa.champions', name: 'دوري أبطال أوروبا' },
  { key: 'sau.1', name: 'دوري روشن السعودي' },
];

let cachedResults: Record<string, EspnMatchResult> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60s cache

export const espnService = {
  async getScoreboards(): Promise<Record<string, EspnMatchResult>> {
    const now = Date.now();
    if (now - lastFetchTime < CACHE_TTL_MS && Object.keys(cachedResults).length > 0) {
      return cachedResults;
    }

    const results: Record<string, EspnMatchResult> = {};

    const fetchLeague = async (url: string, leagueName: string) => {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        const events: any[] = data.events || [];

        for (const ev of events) {
          const comp = (ev.competitions && ev.competitions[0]) || {};
          const competitors: any[] = comp.competitors || [];
          if (competitors.length < 2) continue;

          // Competitor 0 is usually home, 1 is away
          const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
          const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];

          const state = ev.status?.type?.state; // 'in', 'pre', 'post'
          const isLive = state === 'in';
          const statusText = ev.status?.type?.detail || (isLive ? 'مباشر الآن' : 'قريباً');

          const t1Name = home.team?.name || home.team?.displayName || '';
          const t2Name = away.team?.name || away.team?.displayName || '';

          const matchObj: EspnMatchResult = {
            id: ev.id,
            name: `${t1Name} vs ${t2Name}`,
            league: leagueName,
            isLive,
            statusText,
            clock: ev.status?.displayClock,
            team1: {
              name: t1Name,
              score: parseInt(home.score || '0', 10),
              logo: home.team?.logo,
            },
            team2: {
              name: t2Name,
              score: parseInt(away.score || '0', 10),
              logo: away.team?.logo,
            },
          };

          // Index by normalized names for fast fuzzy match
          const key1 = `${t1Name.toLowerCase()} vs ${t2Name.toLowerCase()}`;
          const key2 = `${t2Name.toLowerCase()} vs ${t1Name.toLowerCase()}`;
          results[key1] = matchObj;
          results[key2] = matchObj;
          results[t1Name.toLowerCase()] = matchObj;
          results[t2Name.toLowerCase()] = matchObj;
        }
      } catch (e) {
        // Ignore individual network errors
      }
    };

    // Parallel fetch soccer leagues and NBA
    const promises: Promise<void>[] = [];

    for (const l of ESPN_SOCCER_LEAGUES) {
      promises.push(
        fetchLeague(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${l.key}/scoreboard`,
          l.name
        )
      );
    }

    promises.push(
      fetchLeague(
        'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
        'NBA'
      )
    );

    await Promise.allSettled(promises);

    cachedResults = results;
    lastFetchTime = now;
    return results;
  },

  async matchWithEspn(matchName: string, team1Name?: string, team2Name?: string): Promise<EspnMatchResult | null> {
    const scores = await this.getScoreboards();

    const clean = matchName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    if (scores[clean]) return scores[clean];

    if (team1Name) {
      const t1 = team1Name.toLowerCase().trim();
      if (scores[t1]) return scores[t1];
    }
    if (team2Name) {
      const t2 = team2Name.toLowerCase().trim();
      if (scores[t2]) return scores[t2];
    }

    // Fuzzy check against keys
    for (const [k, v] of Object.entries(scores)) {
      if (team1Name && k.includes(team1Name.toLowerCase())) return v;
      if (team2Name && k.includes(team2Name.toLowerCase())) return v;
    }

    return null;
  },
};
