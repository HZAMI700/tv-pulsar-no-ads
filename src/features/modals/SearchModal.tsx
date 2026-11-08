import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, Trophy, Tv, Film, Play, Sparkles, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ChannelItem, MatchItem, VidApiMovie, VidApiTvShow, ActiveMedia } from '../../types';
import { channelsService } from '../../services/channelsApi';
import { streamFreeService } from '../../services/streamFreeApi';
import { tmdbService } from '../../services/tmdbApi';
import { MovieDetailModal } from '../discover/MovieDetailModal';
import { SeriesDetailModal } from '../discover/SeriesDetailModal';

const QUICK_TAGS = [
  'beIN SPORTS',
  'Real Madrid',
  'Barcelona',
  'Premier League',
  'Champions League',
  'Movies 2026',
  'TV Series',
  'Sky Sports',
];

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setActiveMedia } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'matches' | 'channels' | 'movies' | 'tv'>('all');
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [movies, setMovies] = useState<VidApiMovie[]>([]);
  const [tvShows, setTvShows] = useState<VidApiTvShow[]>([]);

  const [selectedMovie, setSelectedMovie] = useState<VidApiMovie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<VidApiTvShow | null>(null);

  useEffect(() => {
    if (!isSearchOpen) return;

    channelsService.getAllChannels().then(setChannels).catch(() => {});
    streamFreeService.getLiveMatches('soccer').then(setMatches).catch(() => {});
    
    // Load trending movies and TV shows from TMDB
    tmdbService.getTrendingMovies().then(setMovies).catch(() => {});
    tmdbService.getTrendingTvShows().then(setTvShows).catch(() => {});
  }, [isSearchOpen]);

  // Live TMDB Search for query
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(() => {
      tmdbService.searchCatalog(query.trim()).then((results) => {
        const mList = results.filter((r) => r.type === 'movie') as VidApiMovie[];
        const tList = results.filter((r) => r.type === 'tv') as VidApiTvShow[];
        if (mList.length > 0) setMovies(mList);
        if (tList.length > 0) setTvShows(tList);
      }).catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  const cleanQuery = query.trim().toLowerCase();

  const filteredChannels = useMemo(() => {
    if (!cleanQuery) return [];
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanQuery) ||
        (c.category && c.category.toLowerCase().includes(cleanQuery)) ||
        (c.program && c.program.toLowerCase().includes(cleanQuery))
    ).slice(0, 10);
  }, [channels, cleanQuery]);

  const filteredMatches = useMemo(() => {
    if (!cleanQuery) return [];
    return matches.filter(
      (m) =>
        m.name.toLowerCase().includes(cleanQuery) ||
        m.league.toLowerCase().includes(cleanQuery) ||
        (m.team1?.name && m.team1.name.toLowerCase().includes(cleanQuery)) ||
        (m.team2?.name && m.team2.name.toLowerCase().includes(cleanQuery))
    ).slice(0, 6);
  }, [matches, cleanQuery]);

  const filteredMovies = useMemo(() => {
    if (!cleanQuery) return [];
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(cleanQuery) ||
        (m.genre && m.genre.toLowerCase().includes(cleanQuery)) ||
        (m.year && m.year.includes(cleanQuery))
    ).slice(0, 10);
  }, [movies, cleanQuery]);

  const filteredTvShows = useMemo(() => {
    if (!cleanQuery) return [];
    return tvShows.filter(
      (t) =>
        t.title.toLowerCase().includes(cleanQuery) ||
        (t.genre && t.genre.toLowerCase().includes(cleanQuery)) ||
        (t.year && t.year.includes(cleanQuery))
    ).slice(0, 8);
  }, [tvShows, cleanQuery]);

  const totalResultsCount =
    filteredChannels.length +
    filteredMatches.length +
    filteredMovies.length +
    filteredTvShows.length;

  const handlePlayChannel = (c: ChannelItem) => {
    setIsSearchOpen(false);
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

  const handlePlayMatch = (m: MatchItem) => {
    setIsSearchOpen(false);
    setActiveMedia({
      id: m.id,
      title: m.name,
      subtitle: `${m.league} • Live Stream`,
      type: 'match',
      streamUrl: m.playableUrl,
      poster: m.thumbnailUrl,
      isLive: true,
    });
  };

  if (!isSearchOpen) return null;

  return (
    <div
      onClick={() => setIsSearchOpen(false)}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center pt-8 sm:pt-16 px-3.5 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-[#0E1018] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#12131D]">
          <Search className="w-5 h-5 text-[#FF1838]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search matches, clubs, channels, movies or series..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-xl hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-xs text-white/50 hover:text-white px-2 py-1 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Quick Search Tag Chips */}
        {!cleanQuery && (
          <div className="p-4 space-y-3 bg-[#0A0C14]">
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <TrendingUp className="w-4 h-4 text-[#FF1838]" />
              <span>Trending Searches:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#FF1838]/20 border border-white/10 hover:border-[#FF1838]/50 text-xs text-white/70 hover:text-white transition-all cursor-pointer select-none active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter Pills (When search query exists) */}
        {cleanQuery && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-[#0A0C14] border-b border-white/5 overflow-x-auto scrollbar-none text-xs">
            {[
              { id: 'all', label: `All (${totalResultsCount})` },
              { id: 'matches', label: `Matches (${filteredMatches.length})` },
              { id: 'channels', label: `Channels (${filteredChannels.length})` },
              { id: 'movies', label: `Movies (${filteredMovies.length})` },
              { id: 'tv', label: `Series (${filteredTvShows.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-[#FF1838] text-white shadow-md'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cleanQuery && totalResultsCount === 0 && (
            <div className="p-12 text-center text-white/50 space-y-2">
              <Search className="w-10 h-10 mx-auto text-white/20" />
              <p className="text-xs">No matching results found for "{query}"</p>
              <p className="text-[11px] text-white/30">Check your spelling or try another keyword.</p>
            </div>
          )}

          {/* 1. MATCHES */}
          {(activeFilter === 'all' || activeFilter === 'matches') && filteredMatches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/70">
                <Trophy className="w-3.5 h-3.5 text-[#FF1838]" />
                <span>Live Matches:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMatches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handlePlayMatch(m)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#FF1838]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF1838] to-[#990014] text-white flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate group-hover:text-[#FF1838]">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-white/50">{m.league}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E676]/20 text-[#00E676] shrink-0">
                      LIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. CHANNELS */}
          {(activeFilter === 'all' || activeFilter === 'channels') && filteredChannels.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/70">
                <Tv className="w-3.5 h-3.5 text-[#00F2FE]" />
                <span>TV Channels:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredChannels.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handlePlayChannel(c)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#00F2FE]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-xl bg-[#00F2FE]/20 text-[#00F2FE] flex items-center justify-center shrink-0">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate group-hover:text-[#00F2FE]">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-white/50 truncate">
                          {c.program || c.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#00F2FE]">Play ▶</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MOVIES */}
          {(activeFilter === 'all' || activeFilter === 'movies') && filteredMovies.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/70">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>Movies:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredMovies.map((m) => (
                  <div
                    key={m.tmdb_id}
                    onClick={() => setSelectedMovie(m)}
                    className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/40 transition-all cursor-pointer group"
                  >
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      className="w-10 h-14 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate group-hover:text-purple-400">
                        {m.title}
                      </h4>
                      <p className="text-[10px] text-white/50">{m.year} • {m.genre || 'Movie'}</p>
                      <span className="text-[10px] text-yellow-400 font-bold">★ {m.rating || '6.0'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. TV SHOWS */}
          {(activeFilter === 'all' || activeFilter === 'tv') && filteredTvShows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/70">
                <Tv className="w-3.5 h-3.5 text-emerald-400" />
                <span>TV Series:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredTvShows.map((t) => (
                  <div
                    key={t.tmdb_id}
                    onClick={() => setSelectedSeries(t)}
                    className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer group"
                  >
                    <img
                      src={t.poster_url}
                      alt={t.title}
                      className="w-10 h-14 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate group-hover:text-emerald-400">
                        {t.title}
                      </h4>
                      <p className="text-[10px] text-white/50">{t.year} • {t.genre || 'Series'}</p>
                      <span className="text-[10px] text-yellow-400 font-bold">★ {t.rating || '7.5'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={(media) => {
            setSelectedMovie(null);
            setIsSearchOpen(false);
            setActiveMedia(media);
          }}
        />
      )}

      {/* Dedicated Series Detail Modal */}
      {selectedSeries && (
        <SeriesDetailModal
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
          onPlay={(media) => {
            setSelectedSeries(null);
            setIsSearchOpen(false);
            setActiveMedia(media);
          }}
        />
      )}
    </div>
  );
};
