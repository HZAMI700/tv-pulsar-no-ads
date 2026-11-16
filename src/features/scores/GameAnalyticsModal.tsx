import React, { useEffect, useState } from 'react';
import {
  X,
  Activity,
  TrendingUp,
  Clock,
  MapPin,
  Tv,
  Award,
  ChevronRight,
  Shield,
  Play,
  RotateCw,
} from 'lucide-react';
import { EspnEvent, EspnGameAnalytics } from '../../types';
import { espnService } from '../../services/espnApi';
import { useAppStore } from '../../store/useAppStore';

interface GameAnalyticsModalProps {
  event: EspnEvent;
  onClose: () => void;
  onWatchStream?: () => void;
}

export const GameAnalyticsModal: React.FC<GameAnalyticsModalProps> = ({
  event,
  onClose,
  onWatchStream,
}) => {
  const { language } = useAppStore();
  const [analytics, setAnalytics] = useState<EspnGameAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'predictor' | 'plays' | 'leaders'>('stats');

  const isRTL = language === 'ar';

  const loadData = async () => {
    setLoading(true);
    const data = await espnService.getGameSummary(event.sport, event.league, event.id);
    setAnalytics(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Auto refresh if game is live
    if (event.isLive) {
      const timer = setInterval(() => {
        loadData();
      }, 25000);
      return () => clearInterval(timer);
    }
  }, [event.id, event.isLive]);

  // Key stats normalization
  const statLabelsSoccer: Record<string, { en: string; ar: string }> = {
    possessionPct: { en: 'Possession', ar: 'نسبة الاستحواذ' },
    totalShots: { en: 'Total Shots', ar: 'إجمالي التسديدات' },
    shotsOnTarget: { en: 'Shots on Target', ar: 'التسديدات على المرمى' },
    foulsCommitted: { en: 'Fouls', ar: 'الأخطاء المرتكبة' },
    yellowCards: { en: 'Yellow Cards', ar: 'البطاقات الصفراء' },
    redCards: { en: 'Red Cards', ar: 'البطاقات الحمراء' },
    wonCorners: { en: 'Corner Kicks', ar: 'الضربات الركنية' },
    saves: { en: 'Saves', ar: 'التصديات' },
    offsides: { en: 'Offsides', ar: 'التسلل' },
  };

  const statLabelsBasketball: Record<string, { en: string; ar: string }> = {
    fieldGoalPct: { en: 'Field Goal %', ar: 'نسبة التصويب العام' },
    freeThrowPct: { en: 'Free Throw %', ar: 'نسبة الرميات الحرة' },
    threePointFieldGoalPct: { en: '3-Point %', ar: 'نسبة الثلاثيات' },
    rebounds: { en: 'Rebounds', ar: 'المتابعات' },
    assists: { en: 'Assists', ar: 'التمريرات الحاسمة' },
    steals: { en: 'Steals', ar: 'قطع الكرة' },
    blocks: { en: 'Blocks', ar: 'التصدي للكرة' },
    turnovers: { en: 'Turnovers', ar: 'الكرات المفقودة' },
  };

  const statLabels = event.sport === 'basketball' ? statLabelsBasketball : statLabelsSoccer;

  // Extract stat pairs
  const homeStats = analytics?.homeStats || {};
  const awayStats = analytics?.awayStats || {};

  const allStatKeys = Array.from(
    new Set([...Object.keys(homeStats), ...Object.keys(awayStats)])
  ).filter((k) => statLabels[k] || homeStats[k] || awayStats[k]);

  // Predictor values
  const homeWinPct = Math.round(analytics?.predictor?.homeWinPercentage || 50);
  const awayWinPct = 100 - homeWinPct;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[90vh] bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-250"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0B0B0B]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#E50914]">
              {event.leagueName}
            </span>
            <span className="text-white/30">•</span>
            <span className="text-xs text-neutral-400 font-semibold">{event.statusDetail}</span>
            {event.isLive && (
              <span className="flex items-center gap-1 bg-[#E50914] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {event.clock || 'LIVE'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#E50914]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Match Scoreboard Banner */}
        <div className="bg-gradient-to-b from-[#1C1C1E] to-[#141414] px-6 py-6 border-b border-white/10">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#262629] p-2 flex items-center justify-center border border-white/10 shadow-lg">
                {event.home.logo ? (
                  <img
                    src={event.home.logo}
                    alt={event.home.displayName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Shield className="w-8 h-8 text-neutral-500" />
                )}
              </div>
              <h3 className="mt-2 text-sm sm:text-base font-black text-white leading-tight">
                {event.home.displayName}
              </h3>
              {event.home.record && (
                <span className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
                  ({event.home.record})
                </span>
              )}
            </div>

            {/* Score / Status */}
            <div className="flex flex-col items-center">
              {event.state === 'pre' ? (
                <div className="text-center">
                  <span className="text-xl sm:text-2xl font-black text-white/90">VS</span>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400 font-semibold justify-center">
                    <Clock className="w-3 h-3 text-[#E50914]" />
                    <span>
                      {new Date(event.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-3xl sm:text-4xl font-black ${
                        event.home.score > event.away.score ? 'text-white' : 'text-neutral-300'
                      }`}
                    >
                      {event.home.score}
                    </span>
                    <span className="text-xl font-bold text-neutral-500">-</span>
                    <span
                      className={`text-3xl sm:text-4xl font-black ${
                        event.away.score > event.home.score ? 'text-white' : 'text-neutral-300'
                      }`}
                    >
                      {event.away.score}
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-[11px] font-bold text-[#E50914] uppercase tracking-wide">
                    {event.statusDetail}
                  </span>
                </div>
              )}

              {onWatchStream && (
                <button
                  onClick={onWatchStream}
                  className="mt-3 flex items-center gap-1.5 bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isRTL ? 'مشاهدة البث' : 'Watch Live'}</span>
                </button>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#262629] p-2 flex items-center justify-center border border-white/10 shadow-lg">
                {event.away.logo ? (
                  <img
                    src={event.away.logo}
                    alt={event.away.displayName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Shield className="w-8 h-8 text-neutral-500" />
                )}
              </div>
              <h3 className="mt-2 text-sm sm:text-base font-black text-white leading-tight">
                {event.away.displayName}
              </h3>
              {event.away.record && (
                <span className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
                  ({event.away.record})
                </span>
              )}
            </div>
          </div>

          {/* Venue & Broadcast */}
          {(event.venue || event.broadcast) && (
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-neutral-400">
              {event.venue && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>{event.venue}</span>
                </div>
              )}
              {event.broadcast && (
                <div className="flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5 text-neutral-300" />
                  <span>{event.broadcast}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center border-b border-white/10 px-4 bg-[#141414] overflow-x-auto no-scrollbar">
          {[
            { id: 'stats', label: isRTL ? 'الإحصائيات المباشرة' : 'Team Statistics', icon: Activity },
            { id: 'predictor', label: isRTL ? 'توقعات الفوز' : 'Win Predictor', icon: TrendingUp },
            { id: 'plays', label: isRTL ? 'أهم اللحظات' : 'Key Plays', icon: Clock },
            { id: 'leaders', label: isRTL ? 'أبرز النجوم' : 'Leaders', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'border-[#E50914] text-white font-extrabold'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#E50914]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {loading && !analytics ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#E50914] border-t-transparent animate-spin" />
              <p className="text-xs text-neutral-400 font-medium">
                {isRTL ? 'جاري تحميل تحليلات المباراة...' : 'Loading game analytics...'}
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: Team Statistics */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  {allStatKeys.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      {isRTL
                        ? 'إحصائيات الفريقين ستظهر فور انطلاق المباراة.'
                        : 'Team statistics will be available once the match kicks off.'}
                    </div>
                  ) : (
                    allStatKeys.slice(0, 10).map((k) => {
                      const label = statLabels[k]
                        ? isRTL
                          ? statLabels[k].ar
                          : statLabels[k].en
                        : k;

                      const valHome = homeStats[k] || '0';
                      const valAway = awayStats[k] || '0';

                      const numHome = parseFloat(valHome.replace('%', '')) || 0;
                      const numAway = parseFloat(valAway.replace('%', '')) || 0;
                      const sum = numHome + numAway || 1;
                      const homeBarPct = Math.round((numHome / sum) * 100);

                      return (
                        <div key={k} className="bg-[#1C1C1E] p-3 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <span className="text-white">{valHome}</span>
                            <span className="text-neutral-400 font-semibold">{label}</span>
                            <span className="text-white">{valAway}</span>
                          </div>
                          {/* 2-Tone Ratio Bar */}
                          <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#262629]">
                            <div
                              className="bg-[#E50914] transition-all duration-500"
                              style={{ width: `${homeBarPct}%` }}
                            />
                            <div
                              className="bg-neutral-500 transition-all duration-500"
                              style={{ width: `${100 - homeBarPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: Win Predictor */}
              {activeTab === 'predictor' && (
                <div className="space-y-5">
                  <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 text-center">
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider mb-3">
                      {isRTL ? 'احتمالية الفوز المتوقعة (ESPN Analytics)' : 'Win Probability (ESPN Analytics)'}
                    </h4>

                    {/* Ratio Bar */}
                    <div className="w-full h-5 rounded-full overflow-hidden flex bg-[#262629] p-0.5 border border-white/10 shadow-inner">
                      <div
                        className="bg-[#E50914] h-full rounded-l-full flex items-center justify-center text-[10px] font-black text-white transition-all duration-500"
                        style={{ width: `${homeWinPct}%` }}
                      >
                        {homeWinPct > 15 ? `${homeWinPct}%` : ''}
                      </div>
                      <div
                        className="bg-blue-600 h-full rounded-r-full flex items-center justify-center text-[10px] font-black text-white transition-all duration-500"
                        style={{ width: `${awayWinPct}%` }}
                      >
                        {awayWinPct > 15 ? `${awayWinPct}%` : ''}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E50914]" />
                        <span className="text-white">{event.home.displayName}</span>
                        <span className="text-neutral-400">({homeWinPct}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400">({awayWinPct}%)</span>
                        <span className="text-white">{event.away.displayName}</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      </div>
                    </div>

                    <p className="mt-4 text-[11px] text-neutral-400">
                      {isRTL
                        ? 'تُحسب الاحتماليات في الوقت الحقيقي بناءً على الأداء الهجومي، السجل التاريخي، والنتيجة الحالية.'
                        : 'Real-time probability calculated using match telemetry, team strength index, and live momentum.'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: Key Plays */}
              {activeTab === 'plays' && (
                <div className="space-y-2">
                  {!analytics?.plays || analytics.plays.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      {isRTL ? 'لا توجد مجريات مسجلة حتى الآن.' : 'No play-by-play events recorded yet.'}
                    </div>
                  ) : (
                    analytics.plays.map((play, idx) => (
                      <div
                        key={play.id || idx}
                        className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                          play.scoringPlay
                            ? 'bg-[#E50914]/10 border-[#E50914]/30 text-white font-bold'
                            : 'bg-[#1C1C1E] border-white/5 text-neutral-300'
                        }`}
                      >
                        {play.clock && (
                          <span className="shrink-0 font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-neutral-400 border border-white/5">
                            {play.clock}
                          </span>
                        )}
                        <p className="flex-1 leading-snug">{play.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: Leaders */}
              {activeTab === 'leaders' && (
                <div className="space-y-4">
                  {!analytics?.leaders || analytics.leaders.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      {isRTL ? 'بيانات النجوم غير متوفرة لهذه المباراة.' : 'Player leadership data unavailable.'}
                    </div>
                  ) : (
                    analytics.leaders.map((leaderCat, idx) => (
                      <div key={idx} className="bg-[#1C1C1E] p-4 rounded-xl border border-white/5">
                        <h4 className="text-xs font-black text-[#E50914] uppercase tracking-wider mb-3">
                          {leaderCat.displayName || leaderCat.name}
                        </h4>
                        <div className="space-y-2.5">
                          {leaderCat.leaders.map((lead, lIdx) => (
                            <div key={lIdx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2.5">
                                {lead.athlete.headshot ? (
                                  <img
                                    src={lead.athlete.headshot}
                                    alt={lead.athlete.displayName}
                                    className="w-8 h-8 rounded-full object-cover bg-black border border-white/10"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-white">
                                    {lead.athlete.displayName.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-white">{lead.athlete.displayName}</p>
                                  {lead.athlete.position && (
                                    <span className="text-[10px] text-neutral-400">
                                      {lead.athlete.position} {lead.athlete.jersey ? `#${lead.athlete.jersey}` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="font-black text-sm text-white">{lead.displayValue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
