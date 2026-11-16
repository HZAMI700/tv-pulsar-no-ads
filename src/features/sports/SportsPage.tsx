import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { MatchItem, ActiveMedia } from '../../types';
import { streamFreeService } from '../../services/streamFreeApi';
import { useAppStore } from '../../store/useAppStore';

interface MatchCardDisplay {
  id: string;
  title: string;
  league: string;
  category: string;
  status: 'LIVE' | 'ENDED';
  count: string;
  badge?: string;
  img: string;
  rawMatch?: MatchItem;
}

const sampleMatches: MatchCardDisplay[] = [
  {
    id: 'm1',
    title: 'Sky Sports F1',
    league: 'F1',
    category: 'racing',
    status: 'ENDED',
    count: '12',
    badge: 'sky sports F1',
    img: 'https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm2',
    title: 'Willow',
    league: 'Cricket',
    category: 'cricket',
    status: 'LIVE',
    count: '552',
    badge: 'WILLOW',
    img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm3',
    title: 'RedZone',
    league: 'NFL',
    category: 'football',
    status: 'ENDED',
    count: '2',
    badge: 'NFL REDZONE',
    img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm4',
    title: 'Sky Sports Cricket',
    league: 'Cricket',
    category: 'cricket',
    status: 'LIVE',
    count: '6',
    badge: 'sky sports cricket',
    img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm5',
    title: 'RedZone F1',
    league: 'F1',
    category: 'racing',
    status: 'ENDED',
    count: '2',
    badge: 'REDZONE',
    img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm6',
    title: 'Sky Sports Cricket HD',
    league: 'Cricket',
    category: 'cricket',
    status: 'LIVE',
    count: '6',
    badge: 'sky sports',
    img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm7',
    title: 'beIN Sports 1',
    league: 'Football',
    category: 'soccer',
    status: 'LIVE',
    count: '48',
    badge: 'beIN SPORTS',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'm8',
    title: 'TNT Sports 1',
    league: 'Football',
    category: 'soccer',
    status: 'LIVE',
    count: '19',
    badge: 'TNT SPORTS',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
  },
];

const ITEMS_PER_PAGE = 24;

export const SportsPage: React.FC = () => {
  const { setActiveMedia, language } = useAppStore();
  const [realMatches, setRealMatches] = useState<MatchItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const isRTL = language === 'ar';

  useEffect(() => {
    async function fetchMatches() {
      setIsLoading(true);
      try {
        // Fetch ALL matches from the API across all sports (soccer, cricket, racing, basketball, etc.)
        const data = await streamFreeService.getLiveMatches('all');
        setRealMatches(data || []);
      } catch (err) {
        console.error('Failed to load matches', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMatches();
  }, []);

  const displayMatches: MatchCardDisplay[] = useMemo(() => {
    if (realMatches.length > 0) {
      const mapped: MatchCardDisplay[] = realMatches.map((m, idx) => {
        const isLive = m.isLive;
        const count = ((idx * 23 + 12) % 600).toString();
        const poster =
          m.thumbnailUrl ||
          (m.team1?.logo ? m.team1.logo : undefined) ||
          sampleMatches[idx % sampleMatches.length].img;

        return {
          id: m.id,
          title: m.name,
          league: m.league || m.category?.toUpperCase() || 'SPORTS',
          category: (m.category || 'all').toLowerCase(),
          status: isLive ? 'LIVE' : 'ENDED',
          count,
          badge: m.servers?.[0]?.name
            ? (isRTL ? m.servers[0].name.replace(/Server/i, 'سيرفر') : m.servers[0].name)
            : m.league,
          img: poster,
          rawMatch: m,
        };
      });

      return mapped;
    }

    return sampleMatches;
  }, [realMatches]);

  const categories = [
    { id: 'all', label: 'Live Now', labelAr: 'مباشر الآن' },
    { id: 'soccer', label: 'Football', labelAr: 'كرة القدم' },
    { id: 'racing', label: 'F1', labelAr: 'فورمولا 1' },
    { id: 'cricket', label: 'Cricket', labelAr: 'كريكت' },
    { id: 'tennis', label: 'Tennis', labelAr: 'تنس' },
    { id: 'basketball', label: 'Basketball', labelAr: 'كرة السلة' },
    { id: 'combat', label: 'Combat / UFC', labelAr: 'قتال / UFC' },
    { id: 'football', label: 'NFL', labelAr: 'كرة أمريكية' },
  ];

  const filteredMatches = useMemo(() => {
    if (filter === 'all') return displayMatches;
    const f = filter.toLowerCase();
    return displayMatches.filter(
      (m) =>
        m.category === f ||
        m.league.toLowerCase().includes(f) ||
        m.title.toLowerCase().includes(f)
    );
  }, [displayMatches, filter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE) || 1;
  const currentPage = Math.min(page, totalPages);
  const pagedMatches = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMatches.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMatches, currentPage]);

  const handlePlay = (m: MatchCardDisplay) => {
    if (m.rawMatch) {
      const raw = m.rawMatch;
      const servers = raw.servers || [];
      const liveIndex = servers.findIndex((s) => s.isLive);
      const bestIndex = liveIndex !== -1 ? liveIndex : 0;
      const bestUrl = (servers[bestIndex] && servers[bestIndex].url) || raw.playableUrl;

      setActiveMedia({
        id: raw.id,
        title: raw.name,
        subtitle: `${raw.league} • Live Broadcast`,
        type: 'match',
        streamUrl: bestUrl,
        poster: raw.thumbnailUrl,
        isLive: true,
        matchMeta: {
          category: raw.category,
          streamKey: raw.streamKey,
          servers,
          activeServerIndex: bestIndex,
        },
      });
    } else {
      setActiveMedia({
        id: m.id,
        title: m.title,
        subtitle: `${m.league} • Live Broadcast`,
        type: 'match',
        streamUrl: 'https://wideiptv.top/player/beINAR',
        isLive: true,
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white pb-32 pt-3 sm:pt-4 select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-xl md:max-w-6xl mx-auto px-4">
        {/* Title & Popular Streams Header */}
        <div className="pt-1 pb-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
            {isRTL ? 'المباريات' : 'Matches'}
          </h1>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">
                {isRTL ? 'البثوث المباشرة' : 'Popular Streams'}
              </span>
              <span className="text-sm font-semibold text-neutral-400">
                ({filteredMatches.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-7 h-7 rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sport Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 pt-1" aria-label="Match Filters">
          {categories.map((c) => {
            const isActive = filter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setFilter(c.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'bg-[#1C1C1E] text-neutral-300 hover:bg-white/10 border border-white/5 font-semibold'
                }`}
              >
                {isRTL ? c.labelAr : c.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Matches Grid */}
        {isLoading && displayMatches.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-[#141414] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {pagedMatches.map((m) => {
              const isLive = m.status === 'LIVE';
              return (
                <div
                  key={m.id}
                  onClick={() => handlePlay(m)}
                  className="cursor-pointer group flex flex-col justify-between t-card"
                >
                  {/* 16:9 Image container */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1C1C1E] border border-white/10 mb-1.5">
                    <img
                      src={m.img}
                      alt={m.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Right Status Pill (LIVE in Red or ENDED in Dark) */}
                    <span
                      className={`absolute top-2 right-2 ${
                        isLive
                          ? 'bg-[#E50914] text-white shadow'
                          : 'bg-black/75 text-neutral-300 border border-white/15'
                      } text-[9px] font-extrabold px-2 py-0.5 rounded-md tracking-wider`}
                    >
                      {m.status}
                    </span>

                    {/* Bottom Left Red Dot + Counter */}
                    <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
                      <span className="text-[10px] font-bold text-white">{m.count}</span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight truncate group-hover:text-[#E50914] transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-[10px] font-medium text-neutral-400 uppercase mt-0.5 truncate">
                    {m.league}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};
