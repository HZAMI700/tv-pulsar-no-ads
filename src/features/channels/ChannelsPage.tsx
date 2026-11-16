import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Search, User, Loader2 } from 'lucide-react';
import { ChannelItem } from '../../types';
import { channelsService } from '../../services/channelsApi';
import { useAppStore } from '../../store/useAppStore';

interface NetworkDesign {
  bgClass: string;
  logoHtml: React.ReactNode;
}

function getNetworkDesign(name: string): NetworkDesign {
  const n = name.toLowerCase();

  if (n.includes('bein') || n.includes('be in')) {
    return {
      bgClass: 'bg-gradient-to-br from-[#4A1D7A] to-[#230B3D]',
      logoHtml: (
        <div className="text-center select-none">
          <div className="text-2xl font-black tracking-tight leading-none text-white">beIN</div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-purple-200 mt-0.5">SPORTS</div>
        </div>
      ),
    };
  }

  if (n.includes('sky')) {
    return {
      bgClass: 'bg-gradient-to-b from-[#003399] via-[#002266] to-[#B80C24]',
      logoHtml: (
        <div className="text-center select-none">
          <div className="text-2xl font-extrabold leading-none text-white">sky</div>
          <div className="text-base font-semibold leading-none mt-0.5 text-white/90">sports</div>
        </div>
      ),
    };
  }

  if (n.includes('espn')) {
    return {
      bgClass: 'bg-gradient-to-br from-[#D00000] to-[#7A0000]',
      logoHtml: <div className="text-2xl font-black italic tracking-tighter text-white select-none">ESPN</div>,
    };
  }

  if (n.includes('eurosport')) {
    return {
      bgClass: 'bg-gradient-to-br from-[#0A1E46] to-[#050D21]',
      logoHtml: <div className="text-sm font-black tracking-widest text-white select-none">★EUROSPORT</div>,
    };
  }

  if (n.includes('canal')) {
    return {
      bgClass: 'bg-black',
      logoHtml: <div className="text-base font-black tracking-wider text-white select-none">CANAL+</div>,
    };
  }

  if (n.includes('dazn')) {
    return {
      bgClass: 'bg-[#0F0F10]',
      logoHtml: (
        <div className="border-2 border-white px-2 py-0.5 text-xs font-black leading-none tracking-tighter text-white text-center select-none">
          DA<br />ZN
        </div>
      ),
    };
  }

  if (n.includes('ssc') || n.includes('saudi')) {
    return {
      bgClass: 'bg-gradient-to-br from-[#0B2518] to-[#04120A]',
      logoHtml: <div className="text-xl font-black tracking-tight text-emerald-300 select-none">SSC</div>,
    };
  }

  // Dynamic fallback
  return {
    bgClass: 'bg-gradient-to-br from-[#1C1C1E] to-[#121214]',
    logoHtml: (
      <div className="text-sm font-black tracking-wide text-white uppercase truncate px-2 text-center select-none">
        {name.slice(0, 14)}
      </div>
    ),
  };
}

const BATCH_SIZE = 40;

export const ChannelsPage: React.FC = () => {
  const { setActiveMedia, setIsSearchOpen, setCurrentTab, language } = useAppStore();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const [isLoading, setIsLoading] = useState(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isRTL = language === 'ar';

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await channelsService.getAllChannels();
        setChannels(data);
      } catch (err) {
        console.error('Failed to load channels', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filterTabs = [
    { id: 'all', label: `All (${channels.length || 478})`, labelAr: `الكل (${channels.length || 478})` },
    { id: 'bein', label: 'beIN Sports', labelAr: 'بي إن سبورت' },
    { id: 'sports-us', label: 'Sports US', labelAr: 'رياضة أمريكا' },
    { id: 'sports-uk', label: 'Sports UK', labelAr: 'رياضة بريطانيا' },
    { id: 'sports-int', label: 'International Sports', labelAr: 'رياضة عالمية' },
    { id: 'entertainment', label: 'Entertainment', labelAr: 'ترفيه وأفلام' },
    { id: 'news', label: 'News', labelAr: 'أخبار' },
    { id: 'france', label: 'France', labelAr: 'فرنسا' },
    { id: 'germany', label: 'Germany', labelAr: 'ألمانيا' },
    { id: 'spain', label: 'Spain', labelAr: 'إسبانيا' },
  ];

  const filteredChannels = useMemo(() => {
    let list = channels;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q));
    }

    if (filter === 'all') return list;

    const f = filter.toLowerCase();
    return list.filter((c) => {
      const name = c.name.toLowerCase();
      const cat = (c.category || '').toLowerCase();

      if (f === 'bein') return name.includes('bein') || cat.includes('bein');
      if (f === 'sports-us') return cat.includes('us') && cat.includes('sport');
      if (f === 'sports-uk') return cat.includes('uk') && cat.includes('sport');
      if (f === 'sports-int') return cat.includes('international') || (cat.includes('sport') && !cat.includes('us') && !cat.includes('uk'));
      if (f === 'entertainment') return cat.includes('entertainment') || cat.includes('movie') || cat.includes('cinema');
      if (f === 'news') return cat.includes('news') || name.includes('news') || name.includes('jazeera') || name.includes('arabia');
      if (f === 'france') return cat.includes('france') || name.includes('canal');
      if (f === 'germany') return cat.includes('germany') || cat.includes('deutsch');
      if (f === 'spain') return cat.includes('spain') || name.includes('laliga');

      return cat.includes(f) || name.includes(f);
    });
  }, [channels, filter, searchQuery]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [filter, searchQuery]);

  // Infinite Scroll Sentinel for Channels
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredChannels.length));
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredChannels.length]);

  const pagedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const handlePlayChannel = (c: ChannelItem) => {
    setActiveMedia({
      id: c.id,
      title: c.name,
      subtitle: c.program || `${c.category} • Live HD Stream`,
      type: 'channel',
      streamUrl: c.src,
      poster: c.resolvedLogo,
      isLive: true,
    });
  };

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white pb-32 pt-3 sm:pt-4 select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-xl md:max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-1 pb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isRTL ? 'القنوات' : 'Channels'}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {filteredChannels.length} {isRTL ? 'قناة متوفرة بدقة عالية' : 'channels available in HD'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-neutral-300">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              title="Profile / Settings"
            >
              <User className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 pt-1" aria-label="Channel Filters">
          {filterTabs.map((t) => {
            const isActive = filter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'bg-[#1C1C1E] text-neutral-300 hover:bg-white/10 border border-white/5 font-semibold'
                }`}
              >
                {isRTL ? t.labelAr : t.label}
              </button>
            );
          })}
        </div>

        {/* Channels Grid */}
        {isLoading && channels.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[#141414] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pagedChannels.map((ch, idx) => {
              const design = getNetworkDesign(ch.name);
              const viewersCount = (300 + ((idx * 37) % 550)).toString() + 'K watching';

              return (
                <div
                  key={ch.id}
                  className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:border-white/25 group t-card"
                >
                  {/* Top Network Logo Banner (h-24) */}
                  <div
                    onClick={() => handlePlayChannel(ch)}
                    className={`h-24 ${design.bgClass} flex items-center justify-center p-3 relative cursor-pointer group-hover:brightness-110 transition-all`}
                  >
                    {ch.resolvedLogo ? (
                      <img
                        src={ch.resolvedLogo}
                        alt={ch.name}
                        loading="lazy"
                        className="max-h-14 max-w-[85%] object-contain drop-shadow-md group-hover:scale-105 transition duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      design.logoHtml
                    )}

                    {/* Red • LIVE badge with animated ping dot */}
                    <span className="absolute bottom-2 left-2 bg-[#E50914] text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE
                    </span>
                  </div>

                  {/* Channel Details */}
                  <div className="p-3">
                    <h3
                      onClick={() => handlePlayChannel(ch)}
                      className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#E50914] transition-colors cursor-pointer"
                    >
                      {ch.name}
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                      {viewersCount}
                    </p>

                    {/* Red Watch Button */}
                    <button
                      type="button"
                      onClick={() => handlePlayChannel(ch)}
                      className="w-full mt-2.5 bg-[#E50914] hover:bg-[#F40612] text-white font-bold text-xs py-1.5 rounded-lg transition-all active:scale-95 shadow cursor-pointer t-btn-press"
                    >
                      {isRTL ? 'مشاهدة' : 'Watch'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sentinel for infinite loading of all 478 channels */}
        <div ref={sentinelRef} className="py-4 text-center">
          {visibleCount < filteredChannels.length && (
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
              <span>{isRTL ? 'جاري عرض المزيد من القنوات...' : 'Loading more channels...'}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
