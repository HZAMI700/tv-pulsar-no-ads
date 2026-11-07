import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface SpoilerToggleProps {
  active: boolean;
  onChange: (active: boolean) => void;
  className?: string;
}

export const SpoilerToggle: React.FC<SpoilerToggleProps> = ({ active, onChange, className = '' }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      title={active ? 'No-Spoiler Mode Active (Scores Hidden)' : 'Show Live Scores'}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1838] ${
        active
          ? 'bg-[#FF1838]/15 border-[#FF1838]/50 text-white shadow-[0_0_12px_rgba(255,24,56,0.3)]'
          : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
      } ${className}`}
    >
      {active ? (
        <ShieldCheck className="w-3.5 h-3.5 text-[#FF1838]" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5 text-white/40" />
      )}
      <span>{active ? 'حجب النتائج مفعل' : 'وضع حجب النتائج'}</span>
      
      {/* UIverse Switch track */}
      <span
        className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-200 ${
          active ? 'bg-[#FF1838]' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
            active ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
};
