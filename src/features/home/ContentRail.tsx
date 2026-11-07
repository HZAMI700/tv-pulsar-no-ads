import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface ContentRailProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ContentRail: React.FC<ContentRailProps> = ({
  title,
  subtitle,
  badge,
  actionText,
  onAction,
  children,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className={`py-4 space-y-3 select-none ${className}`}>
      {/* Rail Header */}
      <div className="flex items-end justify-between px-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full bg-[#FF1838]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-white/50 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Action button & Carousel arrows */}
        <div className="flex items-center gap-2">
          {actionText && (
            <button
              onClick={onAction}
              className="text-xs font-semibold text-[#FF1838] hover:text-[#FF3853] transition-colors cursor-pointer px-2 py-1"
            >
              {actionText}
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrolling Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-none px-4 md:px-8 scroll-smooth"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </section>
  );
};
