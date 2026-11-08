import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Tv, Search, Radio, ChevronDown, Check, Globe } from 'lucide-react';
import { ChannelItem } from '../../types';
import { channelsService } from '../../services/channelsApi';
import { ChannelCard } from './ChannelCard';
import { useAppStore } from '../../store/useAppStore';

interface CountryFilter {
  id: string;
  label: string;
  flag: string;
  matcher?: (c: ChannelItem) => boolean;
}

const COUNTRIES: CountryFilter[] = [
  { id: 'all', label: 'All Channels', flag: '🌍' },
  {
    id: 'qa',
    label: 'Qatar (beIN & Al Kass)',
    flag: '🇶🇦',
    matcher: (c) =>
      Boolean(
        c.country === 'QA' ||
        (c.category && c.category.toLowerCase().includes('bein sports')) ||
        (c.category && c.category.toLowerCase().includes('alkass')) ||
        (!['US', 'FR', 'TR', 'AU'].includes(c.country) &&
          (c.name.toLowerCase().includes('bein sports ar') ||
            c.name.toLowerCase().includes('alkass') ||
            c.name.toLowerCase().includes('al kass') ||
            c.name.toLowerCase().includes('vip bein sports')))
      ),
  },
  {
    id: 'sa',
    label: 'Saudi Arabia (SSC)',
    flag: '🇸🇦',
    matcher: (c) =>
      Boolean(
        c.country === 'SA' ||
        (c.category && c.category.toLowerCase().includes('saudi')) ||
        c.name.toLowerCase().includes('ssc') ||
        c.name.toLowerCase().includes('saudi')
      ),
  },
  {
    id: 'ae',
    label: 'UAE (AD Sports)',
    flag: '🇦🇪',
    matcher: (c) =>
      Boolean(
        c.country === 'UAE' ||
        c.country === 'AE' ||
        (c.category && c.category.toLowerCase().includes('uae')) ||
        c.name.toLowerCase().includes('ad sports') ||
        c.name.toLowerCase().includes('dubai') ||
        c.name.toLowerCase().includes('sharjah') ||
        c.name.toLowerCase().includes('abu dhabi')
      ),
  },
  {
    id: 'eg',
    label: 'Egypt (ON Time)',
    flag: '🇪🇬',
    matcher: (c) =>
      Boolean(
        c.country === 'EG' ||
        (c.category && c.category.toLowerCase().includes('egypt')) ||
        c.name.toLowerCase().includes('on time') ||
        c.name.toLowerCase().includes('dmc') ||
        c.name.toLowerCase().includes('al hayah') ||
        c.name.toLowerCase().includes('mbc masr') ||
        c.name.toLowerCase().includes('al ahly') ||
        c.name.toLowerCase().includes('zamalek')
      ),
  },
  {
    id: 'tn',
    label: 'Tunisia & North Africa',
    flag: '🇹🇳',
    matcher: (c) =>
      Boolean(
        c.country === 'TN' ||
        (c.category && c.category.toLowerCase().includes('tunisia')) ||
        c.name.toLowerCase().includes('watania') ||
        c.name.toLowerCase().includes('mosaique')
      ),
  },
  {
    id: 'uk',
    label: 'United Kingdom (Sky & TNT)',
    flag: '🇬🇧',
    matcher: (c) =>
      Boolean(
        c.country === 'UK' ||
        c.country === 'GB' ||
        c.name.toLowerCase().endsWith(' uk') ||
        (c.category && c.category.toLowerCase().includes('sports uk')) ||
        (c.category && c.category.toLowerCase().includes('united kingdom')) ||
        ((c.name.toLowerCase().includes('sky sport') ||
          c.name.toLowerCase().includes('tnt') ||
          c.name.toLowerCase().includes('bbc')) &&
          !c.name.toLowerCase().includes('de') &&
          !c.name.toLowerCase().includes('it') &&
          !c.name.toLowerCase().includes('at') &&
          !c.name.toLowerCase().includes('nz') &&
          !c.name.toLowerCase().includes('us'))
      ),
  },
  {
    id: 'us',
    label: 'USA (ESPN, NBC, CBS)',
    flag: '🇺🇸',
    matcher: (c) =>
      Boolean(
        c.country === 'US' ||
        c.name.toLowerCase().endsWith(' us') ||
        (c.category && c.category.toLowerCase().includes('united states')) ||
        (c.category && c.category.toLowerCase().includes('sports us')) ||
        c.name.toLowerCase().includes('espn') ||
        c.name.toLowerCase().includes('fox sports') ||
        c.name.toLowerCase().includes('mlb') ||
        c.name.toLowerCase().includes('nba tv') ||
        c.name.toLowerCase().includes('nfl network') ||
        c.name.toLowerCase().includes('nhl network') ||
        c.name.toLowerCase().includes('cbs') ||
        c.name.toLowerCase().includes('nbc') ||
        c.name.toLowerCase().includes('abc')
      ),
  },
  {
    id: 'fr',
    label: 'France (Canal+ & RMC)',
    flag: '🇫🇷',
    matcher: (c) =>
      Boolean(
        c.country === 'FR' ||
        c.name.toLowerCase().endsWith(' fr') ||
        (c.category && c.category.toLowerCase().includes('france')) ||
        c.name.toLowerCase().includes('rmc sport') ||
        (c.name.toLowerCase().includes('canal+') &&
          !c.name.toLowerCase().includes('pl') &&
          !c.name.toLowerCase().includes('af') &&
          !c.name.toLowerCase().includes('pt') &&
          !c.name.toLowerCase().includes('mx'))
      ),
  },
  {
    id: 'es',
    label: 'Spain (Movistar & DAZN)',
    flag: '🇪🇸',
    matcher: (c) =>
      Boolean(
        c.country === 'ES' ||
        c.name.toLowerCase().endsWith(' es') ||
        (c.category && c.category.toLowerCase().includes('spain')) ||
        c.name.toLowerCase().includes('movistar') ||
        c.name.toLowerCase().includes('laliga') ||
        (c.name.toLowerCase().includes('dazn') &&
          (c.name.toLowerCase().includes('es') ||
            c.name.toLowerCase().includes('laliga') ||
            c.name.toLowerCase().includes('f1')))
      ),
  },
  {
    id: 'de',
    label: 'Germany (Sky & DAZN)',
    flag: '🇩🇪',
    matcher: (c) =>
      Boolean(
        c.country === 'DE' ||
        c.name.toLowerCase().endsWith(' de') ||
        (c.category && c.category.toLowerCase().includes('germany')) ||
        c.name.toLowerCase().includes('bundesliga') ||
        (c.name.toLowerCase().includes('sky sport') && c.name.toLowerCase().includes('de')) ||
        (c.name.toLowerCase().includes('dazn') && c.name.toLowerCase().includes('de'))
      ),
  },
  {
    id: 'it',
    label: 'Italy (Sky Sport IT)',
    flag: '🇮🇹',
    matcher: (c) =>
      Boolean(
        c.country === 'IT' ||
        c.name.toLowerCase().endsWith(' it') ||
        (c.category && c.category.toLowerCase().includes('italy')) ||
        c.name.toLowerCase().includes('italia') ||
        (c.name.toLowerCase().includes('sky sport') && c.name.toLowerCase().includes('italia'))
      ),
  },
  {
    id: 'dk',
    label: 'Denmark (Viaplay & TV2)',
    flag: '🇩🇰',
    matcher: (c) =>
      Boolean(
        c.country === 'DK' ||
        c.name.toLowerCase().endsWith(' dk') ||
        (c.category && c.category.toLowerCase().includes('denmark')) ||
        c.name.toLowerCase().includes('tv 2') ||
        c.name.toLowerCase().includes('viaplay') ||
        c.name.toLowerCase().includes('canal 9')
      ),
  },
  {
    id: 'int',
    label: 'International',
    flag: '🌐',
    matcher: (c) =>
      Boolean(
        c.country === 'INT' ||
        (c.category && c.category.toLowerCase().includes('international')) ||
        (c.category && c.category.toLowerCase().includes('sports international'))
      ),
  },
];

export const ChannelsPage: React.FC = () => {
  const { setActiveMedia } = useAppStore();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);
  const [isLoading, setIsLoading] = useState(true);

  const observerTarget = useRef<HTMLDivElement>(null);

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

  // Filter channels based on selected country and search input
  const filteredChannels = useMemo(() => {
    const activeFilter = COUNTRIES.find((c) => c.id === selectedCountry);

    return channels.filter((c) => {
      let matchesCountry = true;
      if (activeFilter && activeFilter.matcher) {
        matchesCountry = activeFilter.matcher(c);
      }

      const q = searchFilter.trim().toLowerCase();
      const catLower = (c.category || '').toLowerCase();
      const nameLower = (c.name || '').toLowerCase();

      const matchesSearch =
        !q ||
        nameLower.includes(q) ||
        (c.program && c.program.toLowerCase().includes(q)) ||
        catLower.includes(q) ||
        (c.country && c.country.toLowerCase().includes(q));

      return matchesCountry && matchesSearch;
    });
  }, [channels, selectedCountry, searchFilter]);

  // Infinite Scroll IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && visibleCount < filteredChannels.length) {
        setVisibleCount((prev) => Math.min(prev + 24, filteredChannels.length));
      }
    },
    [visibleCount, filteredChannels.length]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '250px',
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handlePlayChannel = (c: ChannelItem) => {
    setActiveMedia({
      id: c.id,
      title: c.name,
      subtitle: c.program || `${c.category} • HD Live Stream`,
      type: 'channel',
      streamUrl: c.src,
      poster: c.resolvedLogo,
      isLive: true,
    });
  };

  const handleCountrySelect = (countryId: string) => {
    setSelectedCountry(countryId);
    setVisibleCount(24);
  };

  const visibleChannels = filteredChannels.slice(0, visibleCount);
  const hasMore = visibleCount < filteredChannels.length;

  return (
    <div className="px-4 md:px-8 py-5 space-y-5 select-none max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-5 md:p-6 bg-gradient-to-r from-[#17192C] via-[#111322] to-[#0D0E18] border border-purple-500/25 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF1838] to-[#990014] flex items-center justify-center shadow-[0_0_20px_rgba(255,24,56,0.55)] text-white shrink-0">
              <Tv className="w-6 h-6 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Live Channels Directory
                </h1>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#FF1838]/20 text-[#FF1838] border border-[#FF1838]/40">
                  {channels.length} Channels Available
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Direct high-definition sports and international television channels categorized by nation
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setVisibleCount(24);
              }}
              placeholder="Search channel (beIN, Sky, SSC, ESPN, Canal...)"
              className="w-full h-10 pr-4 pl-9 rounded-2xl bg-[#090A12] border border-white/10 text-xs text-white placeholder-white/40 focus:border-[#FF1838] focus:outline-none transition-colors"
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-white/40" />
          </div>
        </div>
      </div>

      {/* Country Filter Chips with Flags */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5">
        {COUNTRIES.map((item) => {
          const isSelected = selectedCountry === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleCountrySelect(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-[#FF1838] text-white shadow-[0_0_14px_rgba(255,24,56,0.55)] border border-[#FF1838]'
                  : 'bg-[#12131D] text-white/70 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-sm">{item.flag}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Channels Grid with Infinite Scroll */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredChannels.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {visibleChannels.map((channel) => (
              <div key={channel.id} className="w-full">
                <ChannelCard
                  channel={channel}
                  className="w-full"
                  onPlay={handlePlayChannel}
                />
              </div>
            ))}
          </div>

          {/* Infinite Scroll Bottom Sentinel */}
          <div ref={observerTarget} className="h-12 flex items-center justify-center">
            {hasMore ? (
              <div className="flex items-center gap-2 text-xs text-white/50 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#FF1838]" />
                <span>Loading more channels automatically ({filteredChannels.length - visibleCount} remaining)...</span>
              </div>
            ) : (
              <span className="text-[11px] text-white/30 font-medium">All channels in this category displayed ({filteredChannels.length})</span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[#12131D] border border-white/10 space-y-3">
          <Tv className="w-12 h-12 text-white/30 mx-auto" />
          <h3 className="text-base font-bold text-white">No matching channels found</h3>
          <p className="text-xs text-white/50">Make sure the channel name is spelled correctly or select another country flag.</p>
        </div>
      )}
    </div>
  );
};
