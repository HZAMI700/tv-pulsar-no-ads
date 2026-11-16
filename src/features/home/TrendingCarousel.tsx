import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { VidApiMovie, VidApiTvShow } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface TrendingCarouselProps {
  items: (VidApiMovie | VidApiTvShow)[];
  onSelectItem: (item: VidApiMovie | VidApiTvShow) => void;
}

export const TrendingCarousel: React.FC<TrendingCarouselProps> = ({ items, onSelectItem }) => {
  const { language } = useAppStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const isRTL = language === 'ar';

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return;
    const factor = dir === 'left' ? -1 : 1;
    trackRef.current.scrollBy({ left: factor * 400, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1920px] px-4 md:px-9 py-6 select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Title & Scroll Controls */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          {isRTL ? 'الأكثر رواجاً الآن' : 'Trending Now'}
        </h2>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll(isRTL ? 'right' : 'left')}
            className="p-1.5 rounded-md bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white transition-colors cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(isRTL ? 'left' : 'right')}
            className="p-1.5 rounded-md bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white transition-colors cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Numbered Posters Carousel (Matching Screenshot 7) */}
      <div
        ref={trackRef}
        className="flex items-start gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.slice(0, 10).map((item, index) => {
          const title = (item as any)?.title || (item as any)?.name || 'Title';
          const poster = item?.poster_url || (item as any)?.backdrop_url || '';
          const year = item?.year || '2026';
          const genre = item?.genre || 'Trending';
          const rating = item?.rating || ((item as any)?.vote_average ? `${Number((item as any).vote_average).toFixed(1)} ★` : '16+');

          return (
            <div
              key={(item as any).tmdb_id || index}
              onClick={() => onSelectItem(item)}
              className="group relative w-[160px] sm:w-[190px] md:w-[210px] shrink-0 cursor-pointer select-none transition-transform"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Card Container with Hover Scale */}
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#232323] border border-white/5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_16px_36px_#000000] group-hover:border-white/20">
                {poster ? (
                  <img
                    src={poster}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#232323] to-black flex items-center justify-center p-3 text-center text-xs text-white/60">
                    {title}
                  </div>
                )}

                {/* Number Rank Badge (1, 2, 3...) in top-left (Matching Screenshot 7) */}
                <span className="absolute left-2 top-2 rounded-md bg-black/80 backdrop-blur-sm px-2.5 py-0.5 text-sm sm:text-base font-black text-white shadow-md border border-white/10">
                  {index + 1}
                </span>

                {/* Subtle Hover Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title & Metadata directly below poster (Matching Screenshot 7) */}
              <div className="mt-2.5 px-0.5 space-y-0.5">
                <p className="truncate text-sm font-semibold text-white group-hover:text-[#e50914] transition-colors">
                  {title}
                </p>
                <p className="truncate text-xs text-white/60 font-medium">
                  <span>{genre}</span>
                  <span className="mx-1">·</span>
                  <span>{year}</span>
                  <span className="mx-1">·</span>
                  <span className="rounded px-1 py-0.2 border border-white/30 text-[10px] font-mono">
                    {rating}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};