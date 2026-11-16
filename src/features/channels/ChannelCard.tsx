import React, { useState } from 'react';
import { Play, Heart, Tv } from 'lucide-react';
import { ChannelItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface ChannelCardProps {
  channel: ChannelItem;
  onPlay: (channel: ChannelItem) => void;
  className?: string;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onPlay, className = '' }) => {
  const { isFavorite, toggleFavorite } = useAppStore();
  const [logoError, setLogoError] = useState(false);
  const isFav = isFavorite(channel.id);

  const displaySubtitle = channel.program || (
    channel.name.toLowerCase().includes('bein')
      ? 'Live Matchday Coverage'
      : `${channel.category || 'Live TV'} • HD 1080p`
  );

  return (
    <div
      onClick={() => onPlay(channel)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(channel);
        }
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl bg-[#232323] border border-white/8 hover:border-[#e50914]/50 transition-all duration-300 ease-out cursor-pointer hover:scale-105 hover:z-20 hover:shadow-[0_16px_36px_#000000] p-4 select-none shrink-0 ${className}`}
      style={{
        minHeight: '155px',
        scrollSnapAlign: 'start',
        ...(className.includes('w-full') ? {} : { width: 'calc(50vw - 24px)', maxWidth: '200px', minWidth: '155px' }),
      }}
    >
      {/* Top Row: Channel Logo + LIVE badge + Favorite */}
      <div className="flex items-center justify-between z-10 w-full mb-3">
        {/* Dark Frosted Logo Container */}
        <div className="w-12 h-12 rounded-lg bg-[#2d2d2d] border border-white/5 flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300 shadow-md">
          {channel.resolvedLogo && !logoError ? (
            <img
              src={channel.resolvedLogo}
              alt={channel.name}
              loading="lazy"
              onError={() => setLogoError(true)}
              className="max-w-full max-h-full object-contain filter drop-shadow"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/60">
              <Tv className="w-5 h-5 text-[#e50914]" />
              <span className="text-[8px] font-black uppercase tracking-tight text-white/70 truncate max-w-[42px] mt-0.5">
                {channel.name.slice(0, 5)}
              </span>
            </div>
          )}
        </div>

        {/* Right Actions: Red LIVE Pill + Favorite Heart */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#e50914] text-white shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>

          <button
            type="button"
            aria-label="Add to favorites"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(channel.id);
            }}
            className="w-7 h-7 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-white/10 text-white/60 hover:text-[#e50914] transition-colors cursor-pointer flex items-center justify-center active:scale-95"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isFav ? 'fill-[#e50914] text-[#e50914]' : 'text-white/60'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Middle: Channel Name & Subtitle */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-end py-1">
        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate group-hover:text-[#e50914] transition-colors">
          {channel.name}
        </h3>
        <p className="text-xs text-white/60 truncate font-normal mt-0.5">
          {displaySubtitle}
        </p>
      </div>

      {/* Hover Play Button Glow (Netflix Style) */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-xl transform scale-80 group-hover:scale-100 transition-transform duration-300">
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom Crimson Edge Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-[#e50914] transition-colors duration-300" />
    </div>
  );
};
