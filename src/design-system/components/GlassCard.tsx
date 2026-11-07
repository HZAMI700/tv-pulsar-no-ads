import React, { useState } from 'react';
import { Play, Heart } from 'lucide-react';
import { MetaBadge } from './MetaBadge';

interface GlassCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  fallbackIcon?: React.ReactNode;
  aspect?: '16/9' | '2/3';
  isLive?: boolean;
  qualityBadge?: string;
  rating?: string | number;
  timeBadge?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  className?: string;
  overlayBadge?: React.ReactNode;
  children?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  title,
  subtitle,
  imageUrl,
  fallbackIcon,
  aspect = '16/9',
  isLive = false,
  qualityBadge,
  rating,
  timeBadge,
  isFavorite,
  onFavoriteToggle,
  onClick,
  className = '',
  overlayBadge,
  children,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-xl bg-[#0E1018] border border-white/8 transition-all duration-300 ease-out cursor-pointer hover:border-[#FF1838]/60 hover:shadow-[0_12px_28px_rgba(0,0,0,0.7),0_0_20px_rgba(255,24,56,0.22)] hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1838] select-none ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {/* Background Poster / Image */}
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
            isLoaded ? 'opacity-90' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#121420] to-[#0A0C13] text-white/20">
          {fallbackIcon || <span className="text-2xl font-bold">{title.slice(0, 2).toUpperCase()}</span>}
        </div>
      )}

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/40 to-transparent opacity-85 group-hover:opacity-75 transition-opacity" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

      {/* Top Badges Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isLive && <MetaBadge type="live" />}
          {qualityBadge && <MetaBadge type="uhd" label={qualityBadge} />}
          {rating && <MetaBadge type="rating" label={rating} />}
          {timeBadge && <MetaBadge type="time" label={timeBadge} />}
          {overlayBadge}
        </div>

        {/* Favorite Button */}
        {onFavoriteToggle && (
          <button
            type="button"
            aria-label="Add to favorites"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(e);
            }}
            className="pointer-events-auto p-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-[#FF1838] hover:bg-black/80 transition-colors"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isFavorite ? 'fill-[#FF1838] text-[#FF1838]' : 'text-white/70'
              }`}
            />
          </button>
        )}
      </div>

      {/* Hover Play Button Trigger */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
        <div className="w-12 h-12 rounded-full bg-[#FF1838] text-white flex items-center justify-center shadow-[0_0_24px_rgba(255,24,56,0.8)] transform scale-75 group-hover:scale-100 transition-transform">
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </div>
      </div>

      {/* Custom Body / Content (e.g. Teams VS) */}
      {children && <div className="relative z-10 p-3">{children}</div>}

      {/* Bottom Metadata */}
      {!children && (
        <div className="relative z-10 p-3 flex flex-col justify-end">
          <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-white/60 line-clamp-1 mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
