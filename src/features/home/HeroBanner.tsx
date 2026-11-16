import React from 'react';
import { Play, Check, Info } from 'lucide-react';
import { ActiveMedia } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface HeroBannerProps {
  item?: ActiveMedia | null;
  onPlay?: (item: ActiveMedia) => void;
  onMoreInfo?: (item: ActiveMedia) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ item, onPlay, onMoreInfo }) => {
  const { isFavorite, toggleFavorite } = useAppStore();

  const currentItem: ActiveMedia = item || {
    id: 'hero-featured-match',
    title: 'Real Madrid vs Barcelona',
    subtitle: 'LaLiga EA Sports • El Clásico Top Clash Live in 4K HDR',
    type: 'match',
    streamUrl: 'https://wideiptv.top/player/beINAR',
    poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80',
    badges: ['LIVE', '4K UHD', 'HDR10', 'beIN SPORTS 1'],
    isLive: true,
  };

  const isFav = isFavorite(currentItem.id);

  return (
    <div className="relative w-full h-[430px] sm:h-[460px] overflow-hidden select-none">
      {/* 1. Full-bleed Poster Artwork */}
      <div className="absolute inset-0">
        <img
          src={currentItem.poster}
          alt={currentItem.title}
          className="w-full h-full object-cover object-center transform scale-102"
        />
        {/* Multi-stop vertical gradient fade: transparent at 40% -> rgba(9,10,15,0.85) at 75% -> #090A0F at 100% */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 35%, rgba(9, 10, 15, 0.45) 55%, rgba(9, 10, 15, 0.85) 75%, #090A0F 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090A0F]/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 pb-6 flex flex-col justify-end">
        <div className="max-w-xl space-y-2.5">
          {/* Title (28sp - 32sp, Bold 700, tight tracking) */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#F8FAFC] leading-tight drop-shadow-md">
            {currentItem.title}
          </h1>

          {/* Metadata Row directly under title: 98% Match (#10B981) • 2026 • 16+ • 4K (#94A3B8) */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="text-[#10B981] font-bold">98% Match</span>
            <span className="text-[#94A3B8]">• 2026 • 16+ • 4K UHD</span>
          </div>

          {/* Subtitle */}
          {currentItem.subtitle && (
            <p className="text-xs sm:text-sm text-[#94A3B8] line-clamp-2 font-normal drop-shadow">
              {currentItem.subtitle}
            </p>
          )}

          {/* Action Row: Side-by-side equal-width buttons (height: 46dp, border-radius: 12dp) */}
          <div className="flex items-center gap-3 pt-2 max-w-md">
            {/* Primary Play Button (height: 46dp, #FF2A4B) */}
            <button
              onClick={() => onPlay?.(currentItem)}
              className="flex-1 h-[46px] rounded-xl bg-[#FF2A4B] hover:bg-[#FF4765] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,42,75,0.35)] active:scale-97 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play</span>
            </button>

            {/* Secondary More Info Button (Frosted dark glass with 1px border) */}
            <button
              onClick={() => {
                if (onMoreInfo) {
                  onMoreInfo(currentItem);
                } else {
                  toggleFavorite(currentItem.id);
                }
              }}
              className="flex-1 h-[46px] rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-md text-[#F8FAFC] font-semibold text-sm flex items-center justify-center gap-2 active:scale-97 transition-all cursor-pointer"
            >
              {isFav ? <Check className="w-4 h-4 text-[#10B981]" /> : <Info className="w-4 h-4 text-[#94A3B8]" />}
              <span>{isFav ? 'In My List' : 'More Info'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
