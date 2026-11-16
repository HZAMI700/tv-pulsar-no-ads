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
    <section className={`py-3 space-y-2.5 select-none ${className}`}>
      {/* Rail Header (18sp-20sp SemiBold #F8FAFC, paired with 13sp #94A3B8 action) */}
      <div className="flex items-end justify-between px-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 rounded-full bg-[#FF2A4B]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-[#F8FAFC]">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-[#94A3B8] font-normal mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Action button & Carousel arrows */}
        <div className="flex items-center gap-2">
          {actionText && (
            <button
              onClick={onAction}
              className="text-[13px] font-normal text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer px-2 py-1"
            >
              {actionText}
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              className="w-7 h-7 rounded-full bg-[#1E2230] border border-white/8 text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/20 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              className="w-7 h-7 rounded-full bg-[#1E2230] border border-white/8 text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/20 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrolling Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-none px-4 md:px-8 scroll-smooth py-1"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
        }}
      >
        {children}
      </div>
    </section>
  );
};
