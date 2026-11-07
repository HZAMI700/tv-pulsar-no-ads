import React, { useState } from 'react';
import { MatchItem } from '../../types';
import {
  formatMatchTime,
  getTeamColor,
  resolveLeagueBadge,
} from '../../services/streamFreeApi';

interface MatchCardProps {
  match: MatchItem;
  onPlay: (match: MatchItem) => void;
  className?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPlay, className = '' }) => {
  const timeInfo = formatMatchTime(match.matchTimestamp);
  const [thumbError, setThumbError] = useState(false);

  const hasTwoTeams = Boolean(
    match.team1?.name &&
    match.team2?.name &&
    match.team2.name.trim().length > 0
  );

  const colorLeft = getTeamColor(match.team1?.name, false);
  const colorRight = getTeamColor(match.team2?.name, true);
  const leagueBadge = resolveLeagueBadge(match.league, match.category);

  return (
    <div
      onClick={() => onPlay(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(match);
        }
      }}
      className={`group relative flex flex-col cursor-pointer select-none shrink-0 transition-all ${
        className ? className : 'w-[250px] sm:w-[285px]'
      }`}
      style={{
        scrollSnapAlign: 'start',
        flexShrink: 0,
      }}
    >
      {/* 1. Main 16:9 Banner Card (Matching Screenshot 2 benchmark) */}
      <div className="relative w-full aspect-[16/9.5] rounded-2xl overflow-hidden bg-[#0c0d15] border border-white/10 group-hover:border-white/30 transition-all duration-300 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.85)] group-hover:-translate-y-1 active:scale-97">
        {hasTwoTeams ? (
          /* Split Team Gradient Background with Team Crests & Center League Badge */
          <div className="absolute inset-0 flex">
            {/* Left Team Half */}
            <div
              className="w-1/2 h-full flex items-center justify-center p-2.5 sm:p-4 relative"
              style={{
                background: `radial-gradient(circle at 35% 50%, ${colorLeft} 0%, #06070d 100%)`,
              }}
            >
              {match.team1?.logo ? (
                <img
                  src={match.team1.logo}
                  alt={match.team1.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      match.team1?.name || 'T1'
                    )}&background=141628&color=fff&size=96`;
                  }}
                  className="w-10 h-10 sm:w-14 sm:h-14 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black text-white/80">
                  {match.team1?.name?.slice(0, 3)}
                </div>
              )}
            </div>

            {/* Right Team Half */}
            <div
              className="w-1/2 h-full flex items-center justify-center p-2.5 sm:p-4 relative"
              style={{
                background: `radial-gradient(circle at 65% 50%, ${colorRight} 0%, #06070d 100%)`,
              }}
            >
              {match.team2?.logo ? (
                <img
                  src={match.team2.logo}
                  alt={match.team2.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      match.team2?.name || 'T2'
                    )}&background=141628&color=fff&size=96`;
                  }}
                  className="w-10 h-10 sm:w-14 sm:h-14 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black text-white/80">
                  {match.team2?.name?.slice(0, 3)}
                </div>
              )}
            </div>

            {/* Center Official League Badge or VS Pill */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {leagueBadge ? (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 p-1 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg">
                  <img
                    src={leagueBadge}
                    alt={match.league}
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
              ) : (
                <div className="px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[8px] sm:text-[9px] font-black text-white/70 font-mono shadow-lg">
                  VS
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Single Event / Combat / F1 / Tennis Full Thumbnail Photo */
          <div className="absolute inset-0 bg-[#121422]">
            {match.thumbnailUrl && !thumbError ? (
              <img
                src={match.thumbnailUrl}
                alt={match.name}
                loading="lazy"
                onError={() => setThumbError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-900/40 via-blue-900/30 to-black flex items-center justify-center text-white/40">
                <span className="text-2xl font-black">{match.category.toUpperCase()}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          </div>
        )}

        {/* Top-Right Badge: LIVE in Red or Time remaining (14m, 4h 44m) */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10">
          {timeInfo.isLive ? (
            <span className="px-2 py-0.5 rounded-md bg-[#E50914] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white/90 text-[9px] sm:text-[10px] font-bold border border-white/15 shadow-md">
              {timeInfo.statusBadge}
            </span>
          )}
        </div>

        {/* Bottom-Left Badge: Viewers count (• 782) */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10">
          <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[9px] sm:text-[10px] font-mono font-bold text-white/90 flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]" />
            <span>{match.viewers || 342}</span>
          </span>
        </div>
      </div>

      {/* 2. Metadata Below Banner (Matching Screenshot 2 benchmark) */}
      <div className="mt-1.5 sm:mt-2 space-y-0.5 px-0.5 text-right" dir="ltr">
        <h3
          className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF1838] transition-colors truncate tracking-tight"
          title={match.name}
        >
          {match.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-white/50 truncate font-medium">
          {match.league}
        </p>
      </div>
    </div>
  );
};
