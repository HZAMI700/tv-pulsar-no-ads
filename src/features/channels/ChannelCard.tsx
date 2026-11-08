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

  // Subtitle generation tailored for sports & entertainment
  const displaySubtitle = channel.program || (
    channel.name.toLowerCase().includes('bein')
      ? 'French Premier League Live'
      : `${channel.category} • HD Live`
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-[#141628] to-[#0A0C16] border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 ease-out cursor-pointer hover:shadow-[0_12px_28px_rgba(0,0,0,0.8),0_0_20px_rgba(147,51,234,0.25)] hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1838] p-3 select-none shrink-0 ${className}`}
      style={{
        minHeight: '160px',
        scrollSnapAlign: 'start',
        ...(className.includes('w-full') ? {} : { width: 'calc(50vw - 24px)', maxWidth: '180px', minWidth: '150px' }),
      }}
    >
      {/* Subtle Purple Atmosphere */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-xl pointer-events-none group-hover:bg-purple-600/20 transition-all" />

      {/* Top Header: Favorite Heart on Left, Green LIVE Badge on Right (in RTL) */}
      <div className="flex items-center justify-between z-10 w-full mb-1">
        {/* Favorite Button */}
        <button
          type="button"
          aria-label="Add to favorites"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(channel.id);
          }}
          className="w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-white/50 hover:text-[#FF1838] transition-colors cursor-pointer flex items-center justify-center active:scale-95"
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isFav ? 'fill-[#FF1838] text-[#FF1838]' : 'text-white/50'
            }`}
          />
        </button>

        {/* Green LIVE Pill Badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#00E676] text-black shadow-[0_0_8px_rgba(0,230,118,0.4)]">
          LIVE •
        </span>
      </div>

      {/* Center: Channel Logo inside White Rounded Box matching Screenshot */}
      <div className="relative z-10 flex items-center justify-center my-auto py-1.5">
        <div className="w-16 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 border border-purple-400/40 shadow-[0_0_15px_rgba(147,51,234,0.3)] group-hover:scale-105 transition-transform">
          {channel.resolvedLogo && !logoError ? (
            <img
              src={channel.resolvedLogo}
              alt={channel.name}
              loading="lazy"
              onError={() => setLogoError(true)}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-800">
              <Tv className="w-5 h-5 text-purple-700" />
              <span className="text-[9px] font-black uppercase tracking-tight text-slate-900 truncate max-w-[48px]">
                {channel.name.slice(0, 5)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Purple Circular Play Button + Titles */}
      <div className="relative z-10 flex items-center gap-2 pt-2 border-t border-white/5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_10px_rgba(147,51,234,0.5)] shrink-0 group-hover:scale-110 transition-transform">
          <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-white tracking-tight truncate group-hover:text-white">
            {channel.name}
          </h3>
          <p className="text-[10px] text-white/50 truncate font-medium">
            {displaySubtitle}
          </p>
        </div>
      </div>
    </div>
  );
};
