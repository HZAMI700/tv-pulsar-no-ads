import React from 'react';

export const ShimmerCard: React.FC<{ aspect?: '16/9' | '2/3'; className?: string }> = ({
  aspect = '16/9',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#0E1018] border border-white/5 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"
        style={{
          backgroundSize: '200% 100%',
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2">
        <div className="h-3 w-3/4 rounded bg-white/10" />
        <div className="h-2.5 w-1/2 rounded bg-white/5" />
      </div>
    </div>
  );
};

export const ShimmerRail: React.FC<{ aspect?: '16/9' | '2/3'; count?: number }> = ({
  aspect = '16/9',
  count = 6,
}) => {
  return (
    <div className="space-y-3 px-4 md:px-8 py-4">
      <div className="h-5 w-48 rounded bg-white/10" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="shrink-0"
            style={{ width: aspect === '16/9' ? '280px' : '180px' }}
          >
            <ShimmerCard aspect={aspect} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShimmerHero: React.FC = () => {
  return (
    <div className="relative w-full h-[60vh] min-h-[440px] max-h-[700px] bg-[#0E1018] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      <div className="absolute bottom-12 left-6 md:left-12 max-w-xl space-y-4">
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded bg-white/15" />
          <div className="h-5 w-16 rounded bg-white/10" />
        </div>
        <div className="h-10 w-3/4 rounded bg-white/15" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-2/3 rounded bg-white/10" />
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-32 rounded-lg bg-[#FF1838]/40" />
          <div className="h-10 w-28 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  );
};
