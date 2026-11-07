import React from 'react';
import { Star, Clock, ShieldCheck, Flame } from 'lucide-react';

interface MetaBadgeProps {
  type: 'live' | 'uhd' | 'hdr' | 'rating' | 'category' | 'time' | 'verified';
  label?: string | number;
  className?: string;
}

export const MetaBadge: React.FC<MetaBadgeProps> = ({ type, label, className = '' }) => {
  if (type === 'live') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-sm select-none ${className}`}
        style={{
          background: 'linear-gradient(135deg, #00E676 0%, #00B358 100%)',
          boxShadow: '0 0 12px rgba(0, 230, 118, 0.45)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        {label || 'LIVE'}
      </span>
    );
  }

  if (type === 'uhd') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase text-[#00F2FE] border border-[#00F2FE]/40 bg-[#00F2FE]/10 select-none shadow-[0_0_8px_rgba(0,242,254,0.2)] ${className}`}
      >
        {label || '4K UHD'}
      </span>
    );
  }

  if (type === 'hdr') {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase text-[#D946EF] border border-[#D946EF]/30 bg-[#D946EF]/10 select-none ${className}`}
      >
        {label || 'HDR10'}
      </span>
    );
  }

  if (type === 'rating') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold text-[#FFB800] bg-[#FFB800]/15 border border-[#FFB800]/30 select-none ${className}`}
      >
        <Star className="w-3 h-3 fill-[#FFB800] text-[#FFB800]" />
        {label}
      </span>
    );
  }

  if (type === 'time') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-white/80 bg-black/40 backdrop-blur-md border border-white/10 select-none ${className}`}
      >
        <Clock className="w-3 h-3 text-white/60" />
        {label}
      </span>
    );
  }

  if (type === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-[#00E676] bg-[#00E676]/10 border border-[#00E676]/20 select-none ${className}`}
      >
        <ShieldCheck className="w-3 h-3" />
        {label || 'HD Verified'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium text-white/70 bg-white/5 border border-white/10 select-none ${className}`}
    >
      {label}
    </span>
  );
};
