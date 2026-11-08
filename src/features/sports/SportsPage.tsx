import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  RefreshCw,
  Shield,
  ShieldCheck,
  Search,
  X,
  Radio,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MatchItem, ActiveMedia } from '../../types';
import {
  streamFreeService,
  SPORTS_CATEGORIES,
  testAndSelectBestServer,
} from '../../services/streamFreeApi';
import { MatchCard } from './MatchCard';
import { useAppStore } from '../../store/useAppStore';

export const SportsPage: React.FC = () => {
  const { setActiveMedia, noSpoilerMode, toggleNoSpoiler } = useAppStore();
  const [allMatches, setAllMatches] = useState<MatchItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [testingMatchId, setTestingMatchId] = useState<string | null>(null);

  const fetchMatches = async (cat: string = selectedCategory) => {
    setIsLoading(true);
    try {
      const data = await streamFreeService.getLiveMatches(cat === 'all' ? undefined : cat);
      setAllMatches(data);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(selectedCategory);
  }, [selectedCategory]);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allMatches.length };
    SPORTS_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = allMatches.filter((m) => m.category.toLowerCase() === cat.id).length;
      }
    });
    return counts;
  }, [allMatches]);

  // Available leagues within current view
  const categoryFiltered = useMemo(() => {
    if (selectedCategory === 'all') return allMatches;
    return allMatches.filter((m) => m.category.toLowerCase() === selectedCategory);
  }, [allMatches, selectedCategory]);

  const availableLeagues = useMemo(() => {
    const leagues = Array.from(new Set(categoryFiltered.map((m) => m.league).filter(Boolean)));
    return leagues.slice(0, 15);
  }, [categoryFiltered]);

  // Final matches to display after category, league, and search filters
  const displayedMatches = useMemo(() => {
    let result = categoryFiltered;

    if (selectedLeague !== 'all') {
      result = result.filter((m) =>
        m.league.toLowerCase().includes(selectedLeague.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q) ||
          m.team1?.name.toLowerCase().includes(q) ||
          (m.team2?.name && m.team2.name.toLowerCase().includes(q))
      );
    }

    // Sort: Live matches first, then upcoming
    return [...result].sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.matchTimestamp - b.matchTimestamp;
    });
  }, [categoryFiltered, selectedLeague, searchQuery]);

  const handlePlayMatch = async (match: MatchItem) => {
    setTestingMatchId(match.id);

    // Auto-test all available servers in parallel to find the lowest latency & live server
    let bestUrl = match.playableUrl;
    let servers = match.servers || [];
    let bestIndex = 0;

    try {
      if (servers.length > 0) {
        const testRes = await testAndSelectBestServer(servers);
        bestUrl = testRes.bestServer.url;
        servers = testRes.testedServers;
        bestIndex = servers.findIndex((s) => s.id === testRes.bestServer.id);
        if (bestIndex === -1) bestIndex = 0;
      }
    } catch (_) {
      // Graceful fallback to default source
    } finally {
      setTestingMatchId(null);
    }

    const activeItem: ActiveMedia = {
      id: match.id,
      title: match.name,
      subtitle: `${match.league} • Live Stream`,
      type: 'match',
      streamUrl: bestUrl,
      poster: match.thumbnailUrl,
      isLive: true,
      matchMeta: {
        category: match.category,
        streamKey: match.streamKey,
        servers,
        activeServerIndex: bestIndex,
      },
    };

    setActiveMedia(activeItem);
  };

  const sectionTitle = useMemo(() => {
    if (selectedCategory === 'all') return 'Popular Streams';
    if (selectedCategory === 'basketball') return 'NBA & Basketball';
    if (selectedCategory === 'soccer') return 'Soccer & Football';
    if (selectedCategory === 'combat') return 'Combat Sports & UFC';
    if (selectedCategory === 'racing') return 'Motorsports & Formula 1';
    if (selectedCategory === 'football') return 'NFL & American Football';
    if (selectedCategory === 'tennis') return 'Tennis World Tour';
    if (selectedCategory === 'hockey') return 'Hockey League';
    return `${selectedCategory.toUpperCase()} Streams`;
  }, [selectedCategory]);

  return (
    <div className="px-3 sm:px-6 md:px-8 py-3 space-y-4 max-w-6xl mx-auto select-none motion-page pb-24">
      {/* Featured Header Card */}
      <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-[#17192C] via-[#111322] to-[#0D0E18] border border-purple-500/25 shadow-2xl">
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-64 h-64 bg-[#FF1838]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF1838] to-[#990014] flex items-center justify-center shadow-[0_0_15px_rgba(255,24,56,0.5)] text-white">
                <Trophy className="w-5 h-5 drop-shadow" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  Live Sports Hub • StreamFree
                </h1>
                <p className="text-xs text-white/60 mt-0.5">
                  Free live sports streaming without popunder ads in FHD 1080p
                </p>
              </div>
            </div>

            {/* Controls: Refresh & No Spoiler */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => fetchMatches(selectedCategory)}
                disabled={isLoading}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                title="Refresh streams"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FF1838]' : ''}`} />
              </button>

              <button
                type="button"
                onClick={toggleNoSpoiler}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                  noSpoilerMode
                    ? 'bg-purple-950/40 border-purple-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                <div
                  className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                    noSpoilerMode ? 'bg-[#00E676] justify-end' : 'bg-white/20 justify-start'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-white shadow-md transform transition-transform" />
                </div>
                <span className="text-[11px] font-bold whitespace-nowrap">No Spoilers</span>
                {noSpoilerMode ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-white/50 shrink-0" />
                )}
              </button>

              <span className="text-[11px] font-bold text-white/50 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5 font-mono">
                {displayedMatches.length} streams live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* In-Section Matches Search */}
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search matches, teams, or leagues (Man City, Lakers, UFC, F1, Arsenal...)"
          className="w-full h-10 pr-9 pl-9 rounded-2xl bg-[#141624]/90 border border-white/10 focus:border-[#7C3AED] text-xs text-white placeholder-white/40 focus:outline-none transition-all shadow-md"
        />
        <Search className="absolute right-3 top-3 w-4 h-4 text-white/40 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-2.5 p-0.5 rounded-full text-white/50 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sports Categories Filter Rail (Matching Screenshot 2 benchmark style) */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 scroll-smooth" dir="ltr">
        {SPORTS_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] ?? 0;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedLeague('all');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-[#7C3AED] text-white shadow-[0_0_18px_rgba(124,58,237,0.55)] scale-102'
                  : 'bg-[#181A26] text-white/70 hover:text-white border border-white/10 hover:border-white/20 hover:bg-[#202232]'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.nameEn}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary League Filter Chips (if more than 1 league available) */}
      {availableLeagues.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5" dir="ltr">
          <button
            onClick={() => setSelectedLeague('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedLeague === 'all'
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
            }`}
          >
            All Leagues
          </button>
          {availableLeagues.map((lg) => {
            const isSel = selectedLeague === lg;
            return (
              <button
                key={lg}
                onClick={() => setSelectedLeague(lg)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                }`}
              >
                {lg}
              </button>
            );
          })}
        </div>
      )}

      {/* Section Header (Matching Screenshot 2 benchmark: e.g. "Popular Streams", "NBA") */}
      <div className="flex items-center justify-between pt-2 px-1" dir="ltr">
        <h2 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>{sectionTitle}</span>
          <span className="text-xs text-white/40 font-mono">({displayedMatches.length})</span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchMatches(selectedCategory)}
            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh streams"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => fetchMatches(selectedCategory)}
            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh streams"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MATCH CARDS: EXACTLY 2 CARDS PER LINE IN COLUMNS (Requirement: "mobile view 2 line 2 colones matches cards") */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/11] rounded-2xl bg-white/5 border border-white/5 animate-pulse p-3 flex flex-col justify-between"
            >
              <div className="aspect-[16/9.5] w-full bg-white/10 rounded-xl" />
              <div className="space-y-1 mt-2">
                <div className="h-3 w-3/4 bg-white/10 rounded-md" />
                <div className="h-2.5 w-1/3 bg-white/10 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedMatches.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {displayedMatches.map((match) => (
            <div key={match.id} className="relative">
              <MatchCard match={match} onPlay={handlePlayMatch} className="w-full" />
              {testingMatchId === match.id && (
                <div className="absolute inset-0 rounded-2xl bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 z-20 pointer-events-none">
                  <div className="w-6 h-6 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold text-white">Testing server speeds...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3 bg-[#12131D]/60 rounded-3xl border border-white/5 p-6">
          <Radio className="w-10 h-10 text-white/30 mx-auto" />
          <h3 className="text-sm font-bold text-white">No streams currently available in this category</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            You can select another sport category or click refresh to check for active broadcasts.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedLeague('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[#6D28D9] transition-all"
          >
            View All Sports
          </button>
        </div>
      )}
    </div>
  );
};
