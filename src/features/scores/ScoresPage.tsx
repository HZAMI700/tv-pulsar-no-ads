import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  RotateCw,
  BarChart2,
  ChevronRight,
  Shield,
  Play,
  Flame,
  Award,
  Layers,
  Search,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  espnService,
  ESPN_SPORTS_CATALOG,
  EspnSportCategory,
  EspnLeagueConfig,
} from '../../services/espnApi';
import { channelsService } from '../../services/channelsApi';
import { streamFreeService } from '../../services/streamFreeApi';
import { EspnEvent, EspnStandingTable, ChannelItem, MatchItem } from '../../types';
import { GameAnalyticsModal } from './GameAnalyticsModal';

export const ScoresPage: React.FC = () => {
  const { language, setActiveMedia } = useAppStore();
  const isRTL = language === 'ar';

  const sportsCatalog = useMemo(() => espnService.getSports(), []);
  const [selectedSport, setSelectedSport] = useState<EspnSportCategory>(sportsCatalog[0]);
  const [selectedLeague, setSelectedLeague] = useState<EspnLeagueConfig>(sportsCatalog[0].leagues[0]);
  const [viewMode, setViewMode] = useState<'matches' | 'standings'>('matches');
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0); // -1 = yesterday, 0 = today, 1 = tomorrow

  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [events, setEvents] = useState<EspnEvent[]>([]);
  const [standings, setStandings] = useState<EspnStandingTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEventForAnalytics, setSelectedEventForAnalytics] = useState<EspnEvent | null>(null);

  // When sport changes, auto-select its first league
  const handleSelectSport = (sport: EspnSportCategory) => {
    setSelectedSport(sport);
    if (sport.leagues && sport.leagues.length > 0) {
      setSelectedLeague(sport.leagues[0]);
    }
  };

  // Load real channels and matches for instant live stream playback
  useEffect(() => {
    channelsService.getAllChannels().then((data: ChannelItem[]) => setChannels(data || [])).catch(() => {});
    streamFreeService.getLiveMatches().then((data: MatchItem[]) => setMatches(data || [])).catch(() => {});
  }, []);

  // Compute YYYYMMDD date string based on offset
  const currentDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDateOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }, [selectedDateOffset]);

  // Load Scoreboard or Standings
  const loadData = async () => {
    setLoading(true);
    if (viewMode === 'matches') {
      const data = await espnService.getScoreboard(
        selectedLeague.sport,
        selectedLeague.league,
        currentDateStr
      );
      setEvents(data);
    } else {
      const data = await espnService.getStandings(
        selectedLeague.sport,
        selectedLeague.league
      );
      setStandings(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedLeague.id, viewMode, currentDateStr]);

  // Periodic polling for live scores every 25 seconds
  useEffect(() => {
    if (viewMode === 'matches') {
      const interval = setInterval(() => {
        espnService
          .getScoreboard(selectedLeague.sport, selectedLeague.league, currentDateStr)
          .then((data) => {
            if (data && data.length > 0) setEvents(data);
          });
      }, 25000);
      return () => clearInterval(interval);
    }
  }, [selectedLeague.id, viewMode, currentDateStr]);

  // Helper to find a matching live stream in user channels or matches
  const findMatchingStream = (ev: EspnEvent) => {
    const homeName = ev.home.name.toLowerCase();
    const awayName = ev.away.name.toLowerCase();

    // Check matches
    const foundMatch = (matches || []).find((m) => {
      const mName = m.name.toLowerCase();
      return mName.includes(homeName) || mName.includes(awayName);
    });

    if (foundMatch && foundMatch.playableUrl) {
      return {
        id: foundMatch.id,
        title: foundMatch.name,
        type: 'match' as const,
        streamUrl: foundMatch.playableUrl,
        poster: foundMatch.thumbnailUrl || ev.home.logo,
        isLive: true,
      };
    }

    // Check channels by league or name
    const foundChannel = (channels || []).find((c) => {
      const cName = c.name.toLowerCase();
      return (
        cName.includes(selectedLeague.name.toLowerCase()) ||
        cName.includes('bein sports') ||
        cName.includes('ssc') ||
        cName.includes('sky sports')
      );
    });

    if (foundChannel && foundChannel.src) {
      return {
        id: foundChannel.id,
        title: `${foundChannel.name} • ${ev.home.displayName} vs ${ev.away.displayName}`,
        type: 'channel' as const,
        streamUrl: foundChannel.src,
        poster: foundChannel.resolvedLogo || foundChannel.logoAsset || ev.home.logo,
        isLive: true,
      };
    }

    return null;
  };

  const handleWatchStream = (ev: EspnEvent) => {
    const stream = findMatchingStream(ev);
    if (stream) {
      setActiveMedia(stream);
    } else {
      const firstSportsChan = (channels || []).find(
        (c) => c.category === 'sports' || c.name.toLowerCase().includes('bein')
      );
      if (firstSportsChan) {
        setActiveMedia({
          id: firstSportsChan.id,
          title: firstSportsChan.name,
          type: 'channel',
          streamUrl: firstSportsChan.src,
          poster: firstSportsChan.resolvedLogo || firstSportsChan.logoAsset,
          isLive: true,
        });
      }
    }
  };

  const liveEvents = events.filter((e) => e.isLive);
  const otherEvents = events.filter((e) => !e.isLive);

  return (
    <main
      className="min-h-screen bg-[#0B0B0B] text-white pb-32 select-none"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. Header Banner with Obsidian Red Glow */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#181818] to-[#0B0B0B] border-b border-[#232323] px-4 sm:px-6 pt-6 pb-5 md:pt-8 md:px-9">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-[#E50914]" />
                  <span>{isRTL ? 'مركز النتائج المباشرة والتحليلات' : 'Live Scores & Analytics'}</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-bold bg-[#1C1C1E] px-2 py-0.5 rounded-md border border-white/5">
                  ESPN Free API Multi-Sport
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight mt-2">
                {isRTL ? 'متابعة المباريات وجداول الترتيب' : 'Match Telemetry & Standings'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                {isRTL
                  ? 'اختر الرياضة ثم البطولة لمتابعة النتائج الحية، جداول الترتيب، والإحصائيات الفورية.'
                  : 'Select your sport and league to track live scores, standing tables, and game telemetry.'}
              </p>
            </div>

            {/* Refresh Action */}
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 bg-[#1C1C1E] hover:bg-[#262629] border border-white/10 px-4 py-2 rounded-full text-xs font-bold text-white transition active:scale-95 shadow cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E50914]' : ''}`} />
              <span>{isRTL ? 'تحديث النتائج' : 'Refresh Data'}</span>
            </button>
          </div>

          {/* 2. TIER 1: Choose Sport (Horizontal Pill Bar) */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#E50914]" />
                {isRTL ? '1. اختر الرياضة:' : '1. Select Sport:'}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {sportsCatalog.map((sport) => {
                const isActive = selectedSport.id === sport.id;
                return (
                  <button
                    key={sport.id}
                    onClick={() => handleSelectSport(sport)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#E50914] text-white shadow-[0_2px_14px_rgba(229,9,20,0.5)] scale-102 font-black ring-1 ring-white/30'
                        : 'bg-[#1C1C1E] text-neutral-400 hover:text-white hover:bg-[#262629] border border-white/5'
                    }`}
                  >
                    <span className="text-sm">{sport.icon}</span>
                    <span>{isRTL ? sport.nameAr : sport.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({sport.leagues.length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. TIER 2: Choose League within the Selected Sport */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-[#E50914]" />
                {isRTL ? '2. اختر الدوري أو البطولة:' : '2. Select League:'}
              </span>
              <span className="text-[10px] text-neutral-500 font-semibold">
                {selectedSport.leagues.length} {isRTL ? 'بطولات متوفرة' : 'competitions available'}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {selectedSport.leagues.map((l) => {
                const active = selectedLeague.id === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLeague(l)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-white text-black shadow-lg font-black scale-102'
                        : 'bg-[#1C1C1E] text-neutral-300 hover:text-white hover:bg-[#262629] border border-white/5'
                    }`}
                  >
                    <span className="text-xs">{l.icon}</span>
                    <span>{isRTL ? l.nameAr : l.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Sub-Mode Switcher: Matches vs Standings */}
          <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
            <button
              onClick={() => setViewMode('matches')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                viewMode === 'matches'
                  ? 'bg-[#E50914] text-white shadow'
                  : 'bg-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{isRTL ? 'المباريات والنتائج' : 'Matches & Scores'}</span>
            </button>

            <button
              onClick={() => setViewMode('standings')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                viewMode === 'standings'
                  ? 'bg-[#E50914] text-white shadow'
                  : 'bg-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isRTL ? 'جدول الترتيب' : 'League Standings'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Date Filter Bar (When in Matches Mode) */}
      {viewMode === 'matches' && (
        <div className="bg-[#141414] border-b border-[#232323] px-4 sm:px-6 py-2.5">
          <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { offset: -1, label: isRTL ? 'الأمس' : 'Yesterday' },
                { offset: 0, label: isRTL ? 'اليوم' : 'Today' },
                { offset: 1, label: isRTL ? 'الغد' : 'Tomorrow' },
              ].map((d) => {
                const active = selectedDateOffset === d.offset;
                return (
                  <button
                    key={d.offset}
                    onClick={() => setSelectedDateOffset(d.offset)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-[#E50914] text-white shadow'
                        : 'bg-[#1C1C1E] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#E50914]" />
              <span>{currentDateStr}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Main Content Area */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 md:px-9">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full border-3 border-[#E50914] border-t-transparent animate-spin" />
            <p className="text-xs text-neutral-400 font-semibold">
              {isRTL ? 'جاري جلب أحدث البيانات من ESPN...' : 'Fetching telemetry from ESPN...'}
            </p>
          </div>
        ) : viewMode === 'matches' ? (
          /* MATCHES VIEW */
          <div className="space-y-6">
            {events.length === 0 ? (
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 text-center max-w-lg mx-auto">
                <Trophy className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">
                  {isRTL ? 'لا توجد مباريات مسجلة لهذا التاريخ' : 'No Matches Scheduled for this Date'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {isRTL
                    ? `لا توجد مباريات في ${selectedLeague.nameAr} في هذا التاريخ. جرب تغيير اليوم أو اختيار بطولة أخرى.`
                    : `No matches scheduled in ${selectedLeague.name} for this date. Select another date or choose a different league above.`}
                </p>
                <button
                  onClick={() => setSelectedDateOffset(0)}
                  className="mt-4 bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold px-4 py-2 rounded-full shadow transition"
                >
                  {isRTL ? 'العودة لمباريات اليوم' : "Return to Today's Matches"}
                </button>
              </div>
            ) : (
              <>
                {/* Live Matches Section */}
                {liveEvents.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-ping" />
                      <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                        {isRTL ? 'مباشر الآن' : 'Live Matches Now'} ({liveEvents.length})
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {liveEvents.map((ev) => (
                        <MatchScoreCard
                          key={ev.id}
                          event={ev}
                          isRTL={isRTL}
                          onOpenAnalytics={() => setSelectedEventForAnalytics(ev)}
                          onWatchStream={() => handleWatchStream(ev)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduled / Finished Matches */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm sm:text-base font-black text-neutral-300 uppercase tracking-wider">
                      {isRTL ? 'جدول المباريات والنتائج' : 'Match Schedule & Results'} ({otherEvents.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherEvents.map((ev) => (
                      <MatchScoreCard
                        key={ev.id}
                        event={ev}
                        isRTL={isRTL}
                        onOpenAnalytics={() => setSelectedEventForAnalytics(ev)}
                        onWatchStream={() => handleWatchStream(ev)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* STANDINGS VIEW */
          <div className="space-y-6">
            {standings.length === 0 ? (
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 text-center max-w-lg mx-auto">
                <Award className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">
                  {isRTL ? 'جدول الترتيب غير متوفر حالياً لهذه البطولة' : 'Standings data currently unavailable for this league'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {isRTL ? 'يرجى المحاولة لاحقاً أو اختيار بطولة دوري دوري أخرى.' : 'Please try again later or select another domestic league.'}
                </p>
              </div>
            ) : (
              standings.map((table, tIdx) => (
                <div
                  key={tIdx}
                  className="bg-[#141414] border border-[#232323] rounded-2xl p-4 sm:p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedLeague.icon}</span>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        {isRTL ? selectedLeague.nameAr : table.name}
                      </h2>
                    </div>
                    <span className="text-xs text-neutral-400 font-semibold">
                      {selectedLeague.country ? `${selectedLeague.country} • ` : ''}{isRTL ? 'الموسم الحالي' : 'Current Season'}
                    </span>
                  </div>

                  {/* Table with responsive horizontal scroll */}
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left sm:text-sm text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="border-b border-white/10 text-neutral-400 font-bold uppercase text-[10px] sm:text-xs">
                          <th className="py-2.5 px-2 w-8 text-center">#</th>
                          <th className="py-2.5 px-3">{isRTL ? 'الفريق' : 'Team'}</th>
                          <th className="py-2.5 px-2 text-center">{isRTL ? 'لعب' : 'P'}</th>
                          <th className="py-2.5 px-2 text-center">{isRTL ? 'فاز' : 'W'}</th>
                          <th className="py-2.5 px-2 text-center">{isRTL ? 'تعادل' : 'D'}</th>
                          <th className="py-2.5 px-2 text-center">{isRTL ? 'خسر' : 'L'}</th>
                          <th className="py-2.5 px-2 text-center">{isRTL ? 'فارق' : 'GD'}</th>
                          <th className="py-2.5 px-3 text-center font-black text-white">{isRTL ? 'نقاط' : 'PTS'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {table.rows.map((row, rIdx) => {
                          const isTopFour = row.rank <= 4;
                          const isRelegation = row.rank >= table.rows.length - 2;

                          return (
                            <tr
                              key={row.team.id || rIdx}
                              className="hover:bg-white/5 transition-colors group"
                            >
                              {/* Rank with qualification accent */}
                              <td className="py-3 px-2 text-center font-bold">
                                <span
                                  className={`inline-block w-5 h-5 rounded-md text-xs leading-5 text-center ${
                                    isTopFour
                                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30 font-black'
                                      : isRelegation
                                      ? 'bg-red-600/30 text-red-400 border border-red-500/30'
                                      : 'text-neutral-400'
                                  }`}
                                >
                                  {row.rank}
                                </span>
                              </td>

                              {/* Team */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  {row.team.logo ? (
                                    <img
                                      src={row.team.logo}
                                      alt={row.team.displayName}
                                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Shield className="w-5 h-5 text-neutral-500" />
                                  )}
                                  <span className="font-bold text-white group-hover:text-[#E50914] transition truncate max-w-[150px] sm:max-w-none">
                                    {row.team.displayName}
                                  </span>
                                </div>
                              </td>

                              {/* Stats */}
                              <td className="py-3 px-2 text-center text-neutral-300 font-medium">
                                {row.gamesPlayed}
                              </td>
                              <td className="py-3 px-2 text-center text-neutral-300 font-medium">
                                {row.wins}
                              </td>
                              <td className="py-3 px-2 text-center text-neutral-300 font-medium">
                                {row.ties}
                              </td>
                              <td className="py-3 px-2 text-center text-neutral-300 font-medium">
                                {row.losses}
                              </td>
                              <td className="py-3 px-2 text-center text-neutral-300 font-mono text-xs">
                                {row.goalDifferential}
                              </td>
                              <td className="py-3 px-3 text-center font-black text-sm text-[#E50914]">
                                {row.points}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Footnote for qualification tags */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-4 text-[10px] text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                      <span>{isRTL ? 'التأهل للبطولات القارية' : 'Continental Qualification'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-red-500" />
                      <span>{isRTL ? 'منطقة الهبوط' : 'Relegation Zone'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 7. Game Analytics & Summary Modal */}
      {selectedEventForAnalytics && (
        <GameAnalyticsModal
          event={selectedEventForAnalytics}
          onClose={() => setSelectedEventForAnalytics(null)}
          onWatchStream={() => handleWatchStream(selectedEventForAnalytics)}
        />
      )}
    </main>
  );
};

/**
 * Individual Match Score Card in Netflix Obsidian Style with 60 FPS Micro-Interactions
 */
interface MatchScoreCardProps {
  event: EspnEvent;
  isRTL: boolean;
  onOpenAnalytics: () => void;
  onWatchStream: () => void;
}

const MatchScoreCard: React.FC<MatchScoreCardProps> = ({
  event,
  isRTL,
  onOpenAnalytics,
  onWatchStream,
}) => {
  return (
    <div className="bg-[#1C1C1E] border border-white/5 hover:border-white/20 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex flex-col justify-between group active:scale-98">
      {/* Top Card Info Row */}
      <div className="flex items-center justify-between text-[11px] mb-3 pb-2 border-b border-white/5">
        <span className="font-bold text-neutral-400 truncate max-w-[140px]">
          {event.leagueName}
        </span>

        {event.isLive ? (
          <span className="flex items-center gap-1 bg-[#E50914] text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {event.clock ? `${event.clock}'` : 'LIVE'}
          </span>
        ) : event.state === 'post' ? (
          <span className="text-neutral-400 font-bold bg-[#262629] px-2 py-0.5 rounded text-[10px]">
            {event.statusDetail}
          </span>
        ) : (
          <div className="flex items-center gap-1 text-neutral-400 font-semibold">
            <Clock className="w-3 h-3 text-[#E50914]" />
            <span>
              {new Date(event.date).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Competitors & Scores */}
      <div className="space-y-3 my-1">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {event.home.logo ? (
              <img
                src={event.home.logo}
                alt={event.home.displayName}
                className="w-6 h-6 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <Shield className="w-6 h-6 text-neutral-500 shrink-0" />
            )}
            <span
              className={`text-xs sm:text-sm font-black truncate ${
                event.home.winner ? 'text-white' : 'text-neutral-200'
              }`}
            >
              {event.home.displayName}
            </span>
          </div>

          <span
            className={`text-lg sm:text-xl font-black font-mono shrink-0 ${
              event.isLive
                ? 'text-[#E50914]'
                : event.home.score > event.away.score
                ? 'text-white font-black'
                : 'text-neutral-400'
            }`}
          >
            {event.state === 'pre' ? '-' : event.home.score}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {event.away.logo ? (
              <img
                src={event.away.logo}
                alt={event.away.displayName}
                className="w-6 h-6 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <Shield className="w-6 h-6 text-neutral-500 shrink-0" />
            )}
            <span
              className={`text-xs sm:text-sm font-black truncate ${
                event.away.winner ? 'text-white' : 'text-neutral-200'
              }`}
            >
              {event.away.displayName}
            </span>
          </div>

          <span
            className={`text-lg sm:text-xl font-black font-mono shrink-0 ${
              event.isLive
                ? 'text-[#E50914]'
                : event.away.score > event.home.score
                ? 'text-white font-black'
                : 'text-neutral-400'
            }`}
          >
            {event.state === 'pre' ? '-' : event.away.score}
          </span>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <button
          onClick={onOpenAnalytics}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#262629] hover:bg-[#323236] text-white/90 hover:text-white text-xs font-bold py-1.5 px-3 rounded-xl transition cursor-pointer active:scale-95"
        >
          <BarChart2 className="w-3.5 h-3.5 text-[#E50914]" />
          <span>{isRTL ? 'التحليلات والإحصائيات' : 'Analytics & Stats'}</span>
        </button>

        {event.isLive && (
          <button
            onClick={onWatchStream}
            className="flex items-center gap-1 bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow transition cursor-pointer active:scale-95"
            title={isRTL ? 'مشاهدة البث المباشر' : 'Watch Live Stream'}
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{isRTL ? 'بث' : 'Stream'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
