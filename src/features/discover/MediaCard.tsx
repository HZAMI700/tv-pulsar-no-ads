import React, { useState } from 'react';
import { Play, Star, Bookmark, Film } from 'lucide-react';
import { VidApiMovie, VidApiTvShow } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface MediaCardProps {
  item: VidApiMovie | VidApiTvShow;
  onSelect: (item: VidApiMovie | VidApiTvShow) => void;
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onSelect, className = '' }) => {
  const { isFavorite, toggleFavorite } = useAppStore();
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const mediaId = `vidapi-${item.type}-${item.tmdb_id}`;
  const isFav = isFavorite(mediaId);

  const formattedRating =
    item.rating && parseFloat(item.rating) > 0
      ? parseFloat(item.rating).toFixed(1)
      : '6.0';

  const genreText = item.genre || (item.type === 'tv' ? 'Series' : 'Cinema');
  const yearText = item.year || '2026';

  return (
    <div
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-[#0E1018] border border-white/10 hover:border-[#FF1838]/60 transition-all duration-300 ease-out cursor-pointer hover:shadow-[0_16px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(255,24,56,0.25)] hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1838] select-none shrink-0 t-card active:scale-96 ${className}`}
      style={{
        aspectRatio: '2/3',
        scrollSnapAlign: 'start',
        ...(className.includes('w-full') ? {} : { width: 'calc(50vw - 24px)', maxWidth: '180px', minWidth: '150px' }),
      }}
    >
      {/* Background Poster Image with smooth fade-in */}
      {item.poster_url && !imageError ? (
        <img
          src={item.poster_url}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-img ${
            isLoaded ? 'loaded' : ''
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#141624] to-[#0A0C16] p-3 text-center">
          <Film className="w-8 h-8 text-white/30 mb-1.5" />
          <span className="text-xs font-bold text-white/70 line-clamp-2">{item.title}</span>
          <span className="text-[10px] text-[#FF1838] font-bold mt-1">{yearText}</span>
        </div>
      )}

      {/* Cinematic Dark Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95 group-hover:opacity-85 transition-opacity" />

      {/* Top Header: Bookmark on Left, Yellow Star Rating on Right (in RTL) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
        {/* Bookmark Button */}
        <button
          type="button"
          aria-label="Add to favorites"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(mediaId);
          }}
          className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/70 hover:text-[#FF1838] hover:bg-black/80 transition-colors cursor-pointer flex items-center justify-center active:scale-95"
        >
          <Bookmark
            className={`w-3.5 h-3.5 ${isFav ? 'fill-[#FF1838] text-[#FF1838]' : ''}`}
          />
        </button>

        {/* Yellow Star Rating Pill matching Screenshot */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-yellow-500/40 text-yellow-400 text-xs font-bold shadow-md">
          <span>{formattedRating}</span>
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        </div>
      </div>

      {/* Center Hover Play Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
        <div className="w-11 h-11 rounded-full bg-[#FF1838] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,24,56,0.8)] transform scale-75 group-hover:scale-100 transition-transform">
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom Metadata */}
      <div className="relative z-10 p-3 space-y-0.5 bg-gradient-to-t from-black via-black/90 to-transparent">
        <h3 className="text-xs font-bold text-white tracking-tight line-clamp-1 group-hover:text-[#FF1838] transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-[10px] text-white/50 font-medium pt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-black shrink-0 ${
                item.type === 'tv' ? 'bg-purple-600/90 text-white' : 'bg-[#E50914]/90 text-white'
              }`}
            >
              {item.type === 'tv' ? 'مسلسل' : 'فيلم'}
            </span>
            <span className="truncate max-w-[70px]">{genreText}</span>
          </div>
          <span>{yearText}</span>
        </div>
      </div>
    </div>
  );
};
