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

function getInitials(name?: string): string {
  if (!name) return 'VS';
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 3).toUpperCase();
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPlay, className = '' }) => {
  const timeInfo = formatMatchTime(match.matchTimestamp);
  const [thumbError, setThumbError] = useState(false);
  const [badgeError, setBadgeError] = useState(false);
  const [team1Error, setTeam1Error] = useState(false);
  const [team2Error, setTeam2Error] = useState(false);

  const isIndividualEvent =
    match.category === 'combat' ||
    match.category === 'racing' ||
    match.category === 'tennis' ||
    match.category === 'cricket' ||
    (!match.team1?.logo && !match.team2?.logo);

  const hasTwoTeams = !isIndividualEvent && Boolean(
    match.team1?.name &&
    match.team2?.name &&
    match.team2.name.trim().length > 0
  );

  const colorLeft = getTeamColor(match.team1?.name, false);
  const colorRight = getTeamColor(match.team2?.name, true);
  const leagueBadge = resolveLeagueBadge(match.league, match.category);

  // Network badge (e.g. beIN SPORTS, Sky Sports)
  const networkName = match.servers?.[0]?.name || match.category?.toUpperCase() || 'LIVE';

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
        ...(className.includes('w-full')
          ? {}
          : { width: '260px', minWidth: '240px', maxWidth: '300px' }),
      }}
    >
      {/* 1. Main 16:9 Banner Card */}
      <div className="relative w-full aspect-[16/9] rounded-[14px] overflow-hidden bg-[#131620] border border-white/8 group-hover:border-white/25 transition-all duration-300 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.85)] group-hover:-translate-y-1 active:scale-97">
        {hasTwoTeams ? (
          <div className="absolute inset-0 flex" dir="ltr">
            {/* Left Team Half */}
            <div
              className="w-1/2 h-full flex items-center justify-center p-2.5 sm:p-4 relative"
              style={{
                background: `radial-gradient(circle at 35% 50%, ${colorLeft} 0%, #090A0F 100%)`,
              }}
            >
              {match.team1?.logo && !team1Error ? (
                <img
                  src={match.team1.logo}
                  alt={match.team1.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    setTeam1Error(true);
                  }}
                  className="w-10 h-10 sm:w-13 sm:h-13 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-xs sm:text-sm font-black text-white/90 shadow-md">
                  {getInitials(match.team1?.name)}
                </div>
              )}
            </div>

            {/* Right Team Half */}
            <div
              className="w-1/2 h-full flex items-center justify-center p-2.5 sm:p-4 relative"
              style={{
                background: `radial-gradient(circle at 65% 50%, ${colorRight} 0%, #090A0F 100%)`,
              }}
            >
              {match.team2?.logo && !team2Error ? (
                <img
                  src={match.team2.logo}
                  alt={match.team2.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    setTeam2Error(true);
                  }}
                  className="w-10 h-10 sm:w-13 sm:h-13 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-xs sm:text-sm font-black text-white/90 shadow-md">
                  {getInitials(match.team2?.name)}
                </div>
              )}
            </div>

            {/* Center Official League Badge or VS Pill */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {leagueBadge && !badgeError ? (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 p-1 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg">
                  <img
                    src={leagueBadge}
                    alt={match.league}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      setBadgeError(true);
                    }}
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
              ) : (
                <div className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[8px] sm:text-[9px] font-black text-white/80 font-mono shadow-lg">
                  VS
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Single Event / Combat / F1 / Tennis Full Thumbnail Photo */
          <div className="absolute inset-0 bg-[#131620]">
            {match.thumbnailUrl && !thumbError ? (
              <img
                src={match.thumbnailUrl}
                alt={match.name}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  setThumbError(true);
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#1E2230] to-[#090A0F] flex items-center justify-center text-white/40">
                <span className="text-xl font-black">{match.category.toUpperCase()}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F]/90 via-[#090A0F]/30 to-transparent" />
          </div>
        )}

        {/* Top-Left Network Badge in dark frosted pill */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-[rgba(22,26,37,0.85)] backdrop-blur-md border border-white/8 text-[10px] font-semibold text-[#94A3B8] shadow-sm">
            {networkName}
          </span>
        </div>

        {/* Top-Right Badge: • LIVE 14.2K in #10B981 or start time */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10">
          {timeInfo.isLive ? (
            <span className="px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[#10B981]/25 text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>LIVE {match.viewers ? `${Math.round(match.viewers / 100) / 10}K` : ''}</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-[rgba(22,26,37,0.85)] backdrop-blur-md text-[#94A3B8] text-[10px] font-semibold border border-white/8 shadow-sm">
              {timeInfo.statusBadge}
            </span>
          )}
        </div>
      </div>

      {/* 2. Metadata Below Thumbnail */}
      <div className="mt-2 space-y-0.5 px-0.5 text-left" dir="ltr">
        <h3
          className="text-[14px] font-semibold text-[#F8FAFC] group-hover:text-[#FF2A4B] transition-colors truncate tracking-tight"
          title={match.name}
        >
          {match.name}
        </h3>
        <p className="text-[12px] text-[#94A3B8] truncate font-normal">
          {match.league}
        </p>
      </div>
    </div>
  );
};
