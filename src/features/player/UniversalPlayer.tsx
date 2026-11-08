import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  X,
  Maximize,
  Minimize,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Layers,
  Scaling,
  Volume2,
  Radio,
} from 'lucide-react';
import { ActiveMedia, MatchServer } from '../../types';
import { vidApiService } from '../../services/vidApi';
import { testAndSelectBestServer } from '../../services/streamFreeApi';
import { useAppStore } from '../../store/useAppStore';
import { GlowButton } from '../../design-system/components/GlowButton';
import { MetaBadge } from '../../design-system/components/MetaBadge';

interface UniversalPlayerProps {
  media: ActiveMedia;
  onClose: () => void;
  onNextEpisode?: () => void;
}

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({
  media,
  onClose,
  onNextEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isCoverFit, setIsCoverFit] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<number>(media.tvMeta?.season || 1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(media.tvMeta?.episode || 1);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Match Streaming Multi-Server Engine & Auto-Testing
  const [matchServers, setMatchServers] = useState<MatchServer[]>(
    media.matchMeta?.servers || []
  );
  const [activeMatchServerIndex, setActiveMatchServerIndex] = useState<number>(
    media.matchMeta?.activeServerIndex || 0
  );

  // Auto-test servers in the background to ensure fastest server is flagged
  useEffect(() => {
    if (media.type === 'match' && matchServers.length > 1) {
      let cancelled = false;
      testAndSelectBestServer(matchServers)
        .then((res) => {
          if (!cancelled) {
            setMatchServers(res.testedServers);
            const bestIdx = res.testedServers.findIndex((s) => s.isBest);
            if (bestIdx !== -1 && activeMatchServerIndex === 0) {
              setActiveMatchServerIndex(bestIdx);
            }
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [media.id, media.type]);

  // Extract clean numerical TMDB ID for VidLink Pro playback
  const rawMediaId = (media.tvMeta?.tmdbId || media.id)
    .toString()
    .replace(/^vidapi-(?:movie|tv)-/, '')
    .replace(/^(?:movie|tv)-/, '')
    .split(/[-_sSeE]/)[0]
    .replace(/[^0-9]/g, '');

  // Playback Stream URL resolver (VidLink Pro for Movies/TV, Multi-Server for Matches, Direct for Channels)
  const currentStreamUrl = React.useMemo(() => {
    if (media.type === 'movie' && rawMediaId) {
      return vidApiService.buildMovieEmbedUrl(rawMediaId, media.resumeTime);
    }
    if (media.type === 'tv' && rawMediaId) {
      return vidApiService.buildTvEmbedUrl(rawMediaId, currentSeason, currentEpisode, media.resumeTime);
    }
    if (media.type === 'match' && matchServers.length > 0) {
      const activeServer = matchServers[activeMatchServerIndex] || matchServers[0];
      return activeServer?.url || media.streamUrl;
    }
    return media.streamUrl;
  }, [
    media.type,
    media.streamUrl,
    rawMediaId,
    currentSeason,
    currentEpisode,
    media.resumeTime,
    matchServers,
    activeMatchServerIndex,
  ]);

  const isHlsStream =
    currentStreamUrl.endsWith('.m3u8') || currentStreamUrl.includes('.m3u8?');

  // Keep active watch history and resume state synchronized when switching TV episodes
  useEffect(() => {
    if (media.type === 'tv' && rawMediaId) {
      const tvMeta = {
        tmdbId: rawMediaId,
        season: currentSeason,
        episode: currentEpisode,
        showTitle: media.tvMeta?.showTitle || media.title.split(' - S')[0],
      };
      useAppStore.getState().updateWatchProgress(media.id, 0, 0, tvMeta);
    }
  }, [currentSeason, currentEpisode, media.type, rawMediaId]);

  const handleClose = () => {
    try {
      if ((window as any).PulsarApp?.setPlayerState) {
        (window as any).PulsarApp.setPlayerState(false);
      }
      if ((window as any).PulsarApp?.setOrientation) {
        (window as any).PulsarApp.setOrientation('portrait');
      } else if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (_) {}
    onClose();
  };

  // Sync with native layer and handle popstate for clean back navigation
  useEffect(() => {
    try {
      if ((window as any).PulsarApp?.setPlayerState) {
        (window as any).PulsarApp.setPlayerState(true);
      }
    } catch (_) {}

    const handlePopState = () => {
      handleClose();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      try {
        if ((window as any).PulsarApp?.setPlayerState) {
          (window as any).PulsarApp.setPlayerState(false);
        }
      } catch (_) {}
    };
  }, []);

  const resetControlsTimeout = React.useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  // Show controls initially for 4 seconds, then auto-hide
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Fullscreen toggle helper
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen request failed', e);
    }
  };

  // 1. Fast loading timeout: never block UI for more than 250ms on channels/streams
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    const quickTimer = setTimeout(() => {
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(quickTimer);
  }, [currentStreamUrl]);

  // 2. Audio Engine & Auto-Unmute Protocol (Movies, Series, Channels)
  useEffect(() => {
    // Unlock and resume AudioContext immediately on playback start
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
    } catch (_) {}

    // Ensure native video is unmuted
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.defaultMuted = false;
    }

    // Proactively post unmute commands to embedded player iframes (VidLink, etc.)
    const sendUnmuteSignals = () => {
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage({ type: 'UNMUTE' }, '*');
          iframe.contentWindow.postMessage({ type: 'SET_VOLUME', volume: 1.0 }, '*');
          iframe.contentWindow.postMessage({ action: 'unmute' }, '*');
          iframe.contentWindow.postMessage({ action: 'setVolume', value: 100 }, '*');
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
        } catch (_) {}
      }
    };

    sendUnmuteSignals();
    const interval = setInterval(sendUnmuteSignals, 400);
    const stopTimer = setTimeout(() => clearInterval(interval), 3600);

    return () => {
      clearInterval(interval);
      clearTimeout(stopTimer);
    };
  }, [currentStreamUrl]);

  // 3. HLS Stream Initializer
  useEffect(() => {
    if (!isHlsStream || !videoRef.current) return;

    setIsLoading(true);
    setHasError(false);
    const video = videoRef.current;
    video.muted = false;
    video.volume = 1.0;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
      });
      hlsRef.current = hls;

      hls.loadSource(currentStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.muted = false;
        video.volume = 1.0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            const unmuteOnTap = () => {
              video.muted = false;
              video.volume = 1.0;
              video.play().catch(() => {});
              window.removeEventListener('click', unmuteOnTap);
              window.removeEventListener('touchstart', unmuteOnTap);
            };
            window.addEventListener('click', unmuteOnTap, { once: true });
            window.addEventListener('touchstart', unmuteOnTap, { once: true });
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setErrorMessage('Unable to play live stream. Please try another channel.');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentStreamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.muted = false;
        video.volume = 1.0;
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setErrorMessage('Unable to load stream in browser.');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStreamUrl, isHlsStream]);

  // 3. VidLink PostMessage Event Bus + Progress tracking
  useEffect(() => {
    // Automatic Landscape Orientation on Playback
    try {
      if ((window as any).PulsarApp?.setOrientation) {
        (window as any).PulsarApp.setOrientation('landscape');
      } else if (screen.orientation && (screen.orientation as any).lock) {
        (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (e) {
      console.warn('Orientation lock notice:', e);
    }

    const handleMessage = (event: MessageEvent) => {
      let data = event.data;
      if (!data) return;

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (_) {}
      }

      const payload = data?.data || data;
      const eventName = data?.type || data?.event || '';

      if (
        eventName === 'MEDIA_DATA' ||
        eventName === 'PLAYER_EVENT' ||
        eventName === 'timeupdate' ||
        eventName === 'progress' ||
        eventName === 'PLAYER_PROGRESS' ||
        payload?.currentTime !== undefined ||
        payload?.current_time !== undefined
      ) {
        const player_status = payload?.player_status || data?.player_status;
        const player_progress = payload?.player_progress || data?.player_progress;

        if (player_status === 'playing' || eventName === 'playing') {
          setIsLoading(false);
        }

        const currentTime =
          payload?.currentTime ??
          payload?.current_time ??
          player_progress?.current_time ??
          player_progress?.currentTime ??
          data?.currentTime ??
          data?.current_time;

        const duration =
          payload?.duration ??
          payload?.totalDuration ??
          player_progress?.duration ??
          data?.duration ??
          0;

        if (typeof currentTime === 'number' && currentTime > 0) {
          vidApiService.saveProgress(media.id, currentTime, duration);

          const tvMeta =
            media.type === 'tv'
              ? {
                  tmdbId: rawMediaId,
                  season: currentSeason,
                  episode: currentEpisode,
                  showTitle: media.tvMeta?.showTitle || media.title.split(' - S')[0],
                }
              : undefined;

          useAppStore.getState().updateWatchProgress(media.id, currentTime, duration, tvMeta);

          if (media.type === 'tv' && rawMediaId) {
            useAppStore
              .getState()
              .setEpisodeProgress(
                rawMediaId,
                currentSeason,
                currentEpisode,
                currentTime,
                duration,
                player_status === 'completed'
              );
          }
        }

        if (player_status === 'completed' || eventName === 'ended') {
          if (media.type === 'tv') {
            setCurrentEpisode((e) => e + 1);
          } else if (onNextEpisode) {
            onNextEpisode();
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      try {
        if ((window as any).PulsarApp?.setOrientation) {
          (window as any).PulsarApp.setOrientation('portrait');
        } else if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (e) {
        console.warn('Orientation unlock notice:', e);
      }
    };
  }, [media.id, media.type, onNextEpisode]);

  // 4. Pop-under Neutralizer & Window Defuser
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function (...args) {
      console.warn('[PulsarShield] Neutralized popunder window.open attempt:', args);
      return null;
    };

    const handleWindowBlur = () => {
      window.focus();
    };

    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // 5. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      className="fixed inset-0 w-screen h-screen z-50 bg-black flex items-center justify-center select-none overflow-hidden m-0 p-0 transition-all duration-300 ease-in-out"
    >
      {/* Fullscreen Tap Detector: When controls are hidden, tapping anywhere on the screen displays controls for 4 seconds */}
      {!showControls && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            resetControlsTimeout();
          }}
          className="absolute inset-0 z-25 cursor-pointer bg-transparent"
          aria-label="Tap to show controls"
        />
      )}

      {/* Discreet Floating Controls Pill at top edge when controls are auto-hidden */}
      {!showControls && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            resetControlsTimeout();
          }}
          className="absolute top-1.5 right-3 z-40 px-2.5 py-0.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/15 text-white/90 text-[10px] font-bold backdrop-blur-md shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95 animate-in fade-in"
        >
          <ArrowRight className="w-3 h-3 text-[#FF1838]" />
          <span>Controls</span>
        </button>
      )}

      {/* Top HUD Controls - Positioned high at the very top edge */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 pt-1 sm:pt-1.5 pb-1 px-2.5 sm:px-4 min-h-[42px] sm:min-h-[46px] bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between transition-all duration-200 ease-in-out ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF1838] hover:bg-[#ff3350] text-white shadow-[0_0_12px_rgba(255,24,56,0.5)] font-bold text-xs transition-all cursor-pointer active:scale-95 shrink-0"
            aria-label="Back"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-black text-white drop-shadow truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                {media.title}
              </h2>
              {media.isLive && <MetaBadge type="live" label="LIVE" />}
              {(media.type === 'movie' || media.type === 'tv') && (
                <span className="hidden xs:inline-block px-1.5 py-0.2 rounded text-[9px] font-black bg-[#FF1838]/20 text-[#FF1838] border border-[#FF1838]/40">
                  VidLink Pro
                </span>
              )}
            </div>
            {media.subtitle && (
              <p className="text-[9px] sm:text-[10px] text-white/70 drop-shadow line-clamp-1">
                {media.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Controls: TV Episode Switcher, Match Server Switcher, Zoom/Fit, Fullscreen & Close */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Match Streaming Multi-Server Switcher with "Best ⚡" indicator */}
          {media.type === 'match' && matchServers.length > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/60 border border-white/20 text-xs overflow-x-auto max-w-[180px] xs:max-w-[260px] sm:max-w-md scrollbar-none">
              <Radio className="w-3 h-3 text-[#FF1838] shrink-0" />
              {matchServers.map((srv, idx) => {
                const isSelected = idx === activeMatchServerIndex;
                return (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setActiveMatchServerIndex(idx);
                      setIsLoading(true);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-[#FF1838] text-white shadow-[0_0_10px_rgba(255,24,56,0.6)] font-black'
                        : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                    }`}
                    title={`Switch to ${srv.name}`}
                  >
                    <span>{srv.name}</span>
                    {srv.isBest && (
                      <span className="text-[9px] text-[#00E676] font-bold">⚡ Best</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TV Series Episode Switcher placed in Top Bar (Replacing window protection badge to never hide subtitles) */}
          {media.type === 'tv' && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/60 border border-white/20 text-xs">
              <button
                onClick={() => {
                  setCurrentEpisode((e) => Math.max(1, e - 1));
                  setIsLoading(true);
                }}
                disabled={currentEpisode <= 1}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-25 disabled:cursor-not-allowed text-[10px] font-bold text-white transition-all active:scale-95"
                title="Previous Episode"
              >
                Prev
              </button>
              <span className="px-1 text-[10px] sm:text-[11px] font-black text-[#FF1838] tracking-wider whitespace-nowrap">
                S{currentSeason}:E{currentEpisode}
              </span>
              <button
                onClick={() => {
                  setCurrentEpisode((e) => e + 1);
                  setIsLoading(true);
                }}
                className="px-1.5 py-0.5 rounded bg-[#FF1838] hover:bg-[#ff3350] text-white text-[10px] font-bold transition-all active:scale-95 shadow-sm"
                title="Next Episode"
              >
                Next
              </button>
            </div>
          )}

          {/* Quick Sound / Unmute Button */}
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.volume = 1.0;
              }
              const iframe = containerRef.current?.querySelector('iframe');
              if (iframe && iframe.contentWindow) {
                try {
                  iframe.contentWindow.postMessage({ type: 'UNMUTE' }, '*');
                  iframe.contentWindow.postMessage({ type: 'SET_VOLUME', volume: 1.0 }, '*');
                  iframe.contentWindow.postMessage({ action: 'unmute' }, '*');
                  iframe.contentWindow.postMessage({ action: 'setVolume', value: 100 }, '*');
                } catch (_) {}
              }
            }}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            title="Unmute / Audio"
          >
            <Volume2 className="w-3 h-3 text-[#00E676]" />
            <span className="hidden sm:inline">Audio</span>
          </button>

          {/* Aspect Ratio / Zoom Toggle for Full Screen Fill */}
          <button
            onClick={() => setIsCoverFit(!isCoverFit)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
              isCoverFit
                ? 'bg-[#FF1838]/20 border-[#FF1838] text-white shadow-[0_0_8px_rgba(255,24,56,0.4)]'
                : 'bg-white/10 border-white/10 text-white/70 hover:text-white'
            }`}
            title="Toggle Fullscreen Aspect Ratio"
          >
            <Scaling className="w-3 h-3" />
            <span className="hidden md:inline">{isCoverFit ? 'Cover Fill' : 'Original Ratio'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center justify-center active:scale-95"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-[#FF1838] text-white transition-colors cursor-pointer flex items-center justify-center active:scale-95"
            aria-label="Close Player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport - Full bleed with Aspect Ratio Scaling */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute z-20 flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-10 h-10 rounded-full border-3 border-[#FF1838]/20 border-t-[#FF1838] animate-spin shadow-[0_0_20px_#FF1838]" />
          </div>
        )}

        {/* Error Fallback Box */}
        {hasError && (
          <div className="absolute z-20 max-w-md p-6 rounded-2xl bg-[#0E1018]/95 border border-white/15 text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-10 h-10 text-[#FF1838] mx-auto" />
            <h3 className="text-base font-bold text-white">Unable to Load Stream</h3>
            <p className="text-xs text-white/60">
              {errorMessage || 'Please check your connection and tap retry.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <GlowButton
                size="sm"
                variant="primary"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
              >
                Retry
              </GlowButton>
              <GlowButton size="sm" variant="secondary" onClick={onClose}>
                Close
              </GlowButton>
            </div>
          </div>
        )}

        {/* Dual Engine: Native Video vs Clean Embedded Player */}
        {isHlsStream ? (
          <video
            ref={videoRef}
            className={`w-full h-full bg-black transition-transform duration-200 ${
              isCoverFit ? 'object-cover scale-105' : 'object-contain'
            }`}
            playsInline
            autoPlay
            controls
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => {
              setIsLoading(false);
              if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.volume = 1.0;
              }
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                const cur = videoRef.current.currentTime;
                const dur = videoRef.current.duration || 0;
                if (cur > 2 && (media.type === 'movie' || media.type === 'tv')) {
                  vidApiService.saveProgress(media.id, cur, dur);
                  useAppStore.getState().updateWatchProgress(media.id, cur, dur);
                }
              }
            }}
          />
        ) : (
          <iframe
            key={`${currentStreamUrl}-${currentSeason}-${currentEpisode}-${activeMatchServerIndex}`}
            src={currentStreamUrl}
            title={media.title}
            className={`w-full h-full border-0 bg-black absolute inset-0 transition-transform duration-200 ${
              isCoverFit ? 'scale-105' : 'scale-100'
            }`}
            allow="fullscreen *; picture-in-picture *; autoplay *; encrypted-media *; accelerometer; gyroscope; clipboard-write"
            allowFullScreen
            onError={() => {
              if (media.type === 'match' && matchServers.length > 1) {
                setActiveMatchServerIndex((prev) => (prev + 1) % matchServers.length);
              }
            }}
            onLoad={(e) => {
              setIsLoading(false);
              const targetIframe = e.currentTarget;
              if (media.resumeTime && media.resumeTime > 2) {
                const sec = Math.floor(media.resumeTime);
                const postSeek = () => {
                  try {
                    if (targetIframe.contentWindow) {
                      targetIframe.contentWindow.postMessage({ action: 'seek', time: sec }, '*');
                      targetIframe.contentWindow.postMessage({ type: 'SEEK', time: sec }, '*');
                      targetIframe.contentWindow.postMessage({ type: 'SEEK', currentTime: sec }, '*');
                      targetIframe.contentWindow.postMessage(
                        JSON.stringify({ event: 'command', func: 'seekTo', args: [sec, true] }),
                        '*'
                      );
                    }
                  } catch (_) {}
                };
                postSeek();
                setTimeout(postSeek, 800);
                setTimeout(postSeek, 1800);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
