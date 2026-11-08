import React, { useState } from 'react';
import { Play, Plus, Check, Info, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { ActiveMedia } from '../../types';
import { GlowButton } from '../../design-system/components/GlowButton';
import { MetaBadge } from '../../design-system/components/MetaBadge';
import { useAppStore } from '../../store/useAppStore';

interface HeroBannerProps {
  item?: ActiveMedia | null;
  onPlay?: (item: ActiveMedia) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ item, onPlay }) => {
  const { isFavorite, toggleFavorite, noSpoilerMode } = useAppStore();
  const [isMuted, setIsMuted] = useState(true);

  // Default featured item if none provided
  const currentItem: ActiveMedia = item || {
    id: 'hero-featured-match',
    title: 'Real Madrid vs Barcelona - El Clásico',
    subtitle: 'LaLiga EA Sports • Top matchday clash live in 4K HDR',
    type: 'match',
    streamUrl: 'https://wideiptv.top/player/beINAR',
    poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80',
    badges: ['LIVE', '4K UHD', 'HDR10', 'beIN SPORTS 1'],
    isLive: true,
  };

  const isFav = isFavorite(currentItem.id);

  return (
    <div className="relative w-full h-[55vh] min-h-[420px] max-h-[620px] overflow-hidden select-none">
      {/* Dynamic Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentItem.poster}
          alt={currentItem.title}
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Cinematic Multi-layered Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080D] via-[#07080D]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#07080D]/80 via-transparent to-transparent" />
      </div>

      {/* Floating Accent Glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FF1838]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 pb-12 flex flex-col justify-end">
        <div className="max-w-2xl space-y-3 md:space-y-4">
          {/* Badges Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentItem.isLive && <MetaBadge type="live" label="LIVE NOW" />}
            <MetaBadge type="uhd" label="4K UHD" />
            <MetaBadge type="hdr" label="HDR10" />
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90 border border-white/15">
              <Sparkles className="w-3 h-3 text-[#FFB800]" />
              Editor's Choice
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            {currentItem.title}
          </h1>

          {/* Subtitle / League */}
          {currentItem.subtitle && (
            <p className="text-xs sm:text-sm md:text-base text-white/80 line-clamp-2 font-medium max-w-xl drop-shadow">
              {currentItem.subtitle}
            </p>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <GlowButton
              size="lg"
              variant="primary"
              icon={<Play className="w-5 h-5 fill-current" />}
              onClick={() => onPlay?.(currentItem)}
            >
              Watch Now
            </GlowButton>

            <GlowButton
              size="lg"
              variant="secondary"
              icon={isFav ? <Check className="w-5 h-5 text-[#00E676]" /> : <Plus className="w-5 h-5" />}
              onClick={() => toggleFavorite(currentItem.id)}
            >
              {isFav ? 'In My List' : 'Add to List'}
            </GlowButton>

            {/* Mute Preview Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
