import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  VolumeX,
  Radio,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Subtitles,
} from 'lucide-react';
import { ActiveMedia, MatchServer } from '../../types';
import { vidApiService } from '../../services/vidApi';
import { testAndSelectBestServer } from '../../services/streamFreeApi';
import { useAppStore } from '../../store/useAppStore';
import { useDownloadStore } from '../../store/downloadStore';
import { GlowButton } from '../../design-system/components/GlowButton';
import { MetaBadge } from '../../design-system/components/MetaBadge';
import { loadSubtitleFromUrl, searchOpenSubtitles, SubtitleCue } from '../../utils/subtitleHelper';

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
  const { language } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [aspectMode, setAspectMode] = useState<'cover' | 'contain' | 'fill'>('contain');
  const [currentSeason, setCurrentSeason] = useState<number>(media.tvMeta?.season || 1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(media.tvMeta?.episode || 1);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Direct / Offline Video Playback State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const lastKnownTimeRef = useRef<number>(0);
  const seekTargetRef = useRef<number | null>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  // Playback Stream URL resolver (Offline download check, VidLink Pro for Movies/TV, Multi-Server for Matches, Direct for Channels)
  const currentStreamUrl = React.useMemo(() => {
    // 1. Prioritize explicit local/offline file streamUrl passed from Downloads
    if (
      media.streamUrl &&
      (media.streamUrl.includes('/downloads/') ||
        media.streamUrl.includes('.mp4') ||
        media.streamUrl.startsWith('file:') ||
        media.streamUrl.startsWith('blob:') ||
        media.streamUrl.startsWith('https://appassets.androidplatform.net'))
    ) {
      return media.streamUrl;
    }

    // 2. Check if item has a completed local offline download file in store
    const offlineUri = useDownloadStore.getState().getPlayableOfflineUri(
      media.id,
      media.type === 'tv' ? currentSeason : undefined,
      media.type === 'tv' ? currentEpisode : undefined
    );
    if (offlineUri) {
      return offlineUri;
    }

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
    media.id,
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

  const isDirectVideo =
    isHlsStream ||
    currentStreamUrl.endsWith('.mp4') ||
    currentStreamUrl.includes('.mp4?') ||
    currentStreamUrl.includes('/downloads/') ||
    currentStreamUrl.startsWith('blob:') ||
    currentStreamUrl.startsWith('file:') ||
    currentStreamUrl.includes('appassets.androidplatform.net/downloads');

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

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  const unmuteAll = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      videoRef.current.defaultMuted = false;
      setIsMuted(false);
    }
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
      setIsMuted(false);
    }
  }, []);

  const lastClickTimeRef = useRef<number>(0);
  const togglePlayPause = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 250) return; // Debounce rapid taps
    lastClickTimeRef.current = now;

    const v = videoRef.current;
    if (v) {
      console.log('[UniversalPlayer:DIAG] togglePlayPause called, currently paused:', v.paused, 'currentTime:', v.currentTime);
      if (!v.paused) {
        // Immediate hardware pause - DO NOT recreate or reload media source
        v.pause();
        setIsPlaying(false);
      } else {
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              if (err.name !== 'AbortError') {
                console.warn('Play error:', err);
              }
              setIsPlaying(!v.paused);
            });
        }
      }
    } else {
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        const nextState = !isPlaying;
        const action = nextState ? 'play' : 'pause';
        try {
          iframe.contentWindow.postMessage({ type: nextState ? 'PLAY' : 'PAUSE' }, '*');
          iframe.contentWindow.postMessage({ action }, '*');
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: action }), '*');
        } catch (_) {}
        setIsPlaying(nextState);
      }
    }
    resetControlsTimeout();
  }, [isPlaying, resetControlsTimeout]);

  const lastSeekTimeRef = useRef<number>(0);
  const handleSeekCommit = useCallback((val: number) => {
    const now = Date.now();
    if (now - lastSeekTimeRef.current < 250) return; // Prevent duplicate touchEnd + mouseUp collisions
    lastSeekTimeRef.current = now;

    setIsSeeking(false);
    const target = Math.max(0, val);
    setCurrentTime(target);
    lastKnownTimeRef.current = target;
    seekTargetRef.current = target;

    const v = videoRef.current;
    if (v) {
      console.log('[UniversalPlayer:DIAG] handleSeekCommit target:', target, 'prevCurrentTime:', v.currentTime, 'duration:', v.duration);
      try {
        v.currentTime = target;
      } catch (err) {
        console.warn('Seek error:', err);
      }

      // Keep playing if player was in playing state
      if (isPlaying && v.paused) {
        v.play().catch(() => {});
      }
    }

    setTimeout(() => {
      seekTargetRef.current = null;
    }, 600);

    resetControlsTimeout();
  }, [isPlaying, resetControlsTimeout]);

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

    // Safety timeout: Ensure loader is dismissed within 1.8s so user is never stuck in infinite loading
    const safetyDismiss = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 15,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 4,
        startFragPrefetch: true,
      });
      hlsRef.current = hls;

      hls.loadSource(currentStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(safetyDismiss);
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
        clearTimeout(safetyDismiss);
        setIsLoading(false);
        video.muted = false;
        video.volume = 1.0;
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        clearTimeout(safetyDismiss);
        setHasError(true);
        setErrorMessage('Unable to load stream in browser.');
      });
    }

    return () => {
      clearTimeout(safetyDismiss);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStreamUrl, isHlsStream]);

  // Helper to disable all internal/in-band text tracks so only one clean subtitle is shown
  const disableNativeTextTracks = useCallback(() => {
    try {
      const v = videoRef.current;
      if (v && v.textTracks) {
        for (let i = 0; i < v.textTracks.length; i++) {
          v.textTracks[i].mode = 'disabled';
        }
      }
    } catch (_) {}
  }, []);

  const lastLoadedUrlRef = useRef<string>('');

  // Direct MP4 / Offline File Initializer - ONLY runs when currentStreamUrl changes!
  useEffect(() => {
    if (isHlsStream || !isDirectVideo || !videoRef.current) return;
    const video = videoRef.current;

    // Guard: Prevent destroying and re-preparing media source on re-renders/pause/seek
    if (lastLoadedUrlRef.current !== currentStreamUrl) {
      console.log('[UniversalPlayer:DIAG] Initializing new media source:', currentStreamUrl);
      lastLoadedUrlRef.current = currentStreamUrl;
      setIsLoading(true);
      setHasError(false);
      video.src = currentStreamUrl;
      video.load();
    }

    const onLoaded = () => {
      console.log('[UniversalPlayer:DIAG] loadedmetadata fired, duration:', video.duration);
      setIsLoading(false);
      video.muted = false;
      video.volume = 1.0;
      disableNativeTextTracks();

      // Restore saved offline playback position
      const cleanId = (media.id || '').toString();
      let resumeTarget = (media.resumeTime && media.resumeTime > 2) ? media.resumeTime : 0;
      if (!resumeTarget && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(`pulsar_pos_${cleanId}`) || localStorage.getItem(`pulsar_pos_${media.title}`);
        if (saved) resumeTarget = parseFloat(saved) || 0;
      }
      if (resumeTarget > 2 && video.currentTime < 2) {
        console.log('[UniversalPlayer:DIAG] Restoring saved position to:', resumeTarget);
        try {
          video.currentTime = resumeTarget;
          lastKnownTimeRef.current = resumeTarget;
        } catch (_) {}
      }

      video.play().catch(() => {});
    };

    const onError = () => {
      const err = video.error;
      console.warn('[UniversalPlayer:DIAG] video error event:', err?.code, err?.message);
      // Code 1 is MEDIA_ERR_ABORTED: Normal when seeking or when browser cancels previous byte range
      if (err && err.code === 1) {
        return;
      }
      // If video has already played or is seeking, ignore transient aborted ranges quietly
      if (video.duration && video.duration > 0 && lastKnownTimeRef.current > 0) {
        console.warn('[UniversalPlayer:DIAG] Transient seek range glitch ignored, maintaining playback at', lastKnownTimeRef.current);
        return;
      }

      setIsLoading(false);
      setHasError(true);
      setErrorMessage('Could not load offline media file.');
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    video.addEventListener('canplay', disableNativeTextTracks);

    // Suppress dynamically added text tracks to prevent duplicate subtitles
    const handleAddTrack = (e: any) => {
      try {
        if (e.track) e.track.mode = 'disabled';
      } catch (_) {}
    };
    if (video.textTracks) {
      video.textTracks.addEventListener('addtrack', handleAddTrack);
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', disableNativeTextTracks);
      if (video.textTracks) {
        video.textTracks.removeEventListener('addtrack', handleAddTrack);
      }
    };
  }, [currentStreamUrl, isHlsStream, isDirectVideo, disableNativeTextTracks]);

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
          setCurrentTime(currentTime);
          if (typeof duration === 'number' && duration > 0) {
            setDuration(duration);
          }

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

  // Active subtitle lookup (from media, task, or localStorage)
  const offlineTask = useMemo(() => {
    const tasks = useDownloadStore.getState().tasks;
    const cleanId = (media.id || '').toString().replace(/^(?:movie|tv)-/, '').replace(/[^0-9]/g, '');
    return Object.values(tasks).find((t) => {
      const cleanTId = (t.mediaId || '').toString().replace(/^(?:movie|tv)-/, '').replace(/[^0-9]/g, '');
      const isMatch = t.mediaId === media.id || (cleanId && cleanId === cleanTId);
      if (!isMatch) return false;
      if (media.type === 'tv' && t.season && t.season !== currentSeason) return false;
      if (media.type === 'tv' && t.episode && t.episode !== currentEpisode) return false;
      return true;
    });
  }, [media.id, media.type, currentSeason, currentEpisode]);

  const rawSubtitleUrl = useMemo(() => {
    if (media.subtitleUrl) return media.subtitleUrl;
    if (offlineTask?.subtitleUrl) return offlineTask.subtitleUrl;
    if (typeof localStorage !== 'undefined') {
      try {
        const subData = localStorage.getItem(`pulsar_sub_${offlineTask?.downloadId || media.id}`);
        if (subData) {
          const parsed = JSON.parse(subData);
          if (parsed.url) return parsed.url;
        }
      } catch (_) {}
    }
    return undefined;
  }, [media.subtitleUrl, media.id, offlineTask]);

  const [fetchedSubtitleUrl, setFetchedSubtitleUrl] = useState<string | null>(null);

  // Auto-search subtitles for online movies/series if not already provided
  useEffect(() => {
    if (rawSubtitleUrl) return;
    if (media.type === 'movie' || media.type === 'tv') {
      let cancelled = false;
      searchOpenSubtitles(
        media.title,
        media.type === 'tv' ? currentSeason : undefined,
        media.type === 'tv' ? currentEpisode : undefined,
        'ara'
      ).then((url) => {
        if (!cancelled && url) {
          setFetchedSubtitleUrl(url);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [media.id, media.title, media.type, currentSeason, currentEpisode, rawSubtitleUrl]);

  const effectiveSubtitleUrl = rawSubtitleUrl || fetchedSubtitleUrl;
  const subLang = media.subtitleLanguage || offlineTask?.subtitleLanguage || 'ar';

  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [activeVttBlobUrl, setActiveVttBlobUrl] = useState<string | null>(null);
  const [currentCueText, setCurrentCueText] = useState<string>('');
  const [isSubtitleVisible, setIsSubtitleVisible] = useState<boolean>(true);

  // Load and parse subtitles whenever effectiveSubtitleUrl changes
  useEffect(() => {
    if (!effectiveSubtitleUrl) {
      setSubtitleCues([]);
      setActiveVttBlobUrl(null);
      setCurrentCueText('');
      return;
    }

    let cancelled = false;
    loadSubtitleFromUrl(effectiveSubtitleUrl, subLang).then((res) => {
      if (!cancelled && res) {
        setSubtitleCues(res.cues);
        setActiveVttBlobUrl(res.vttBlobUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [effectiveSubtitleUrl, subLang]);

  // Synchronize active cue text on any time change (Works for both native video and iframe)
  useEffect(() => {
    if (subtitleCues.length === 0 || !isSubtitleVisible) {
      if (currentCueText) setCurrentCueText('');
      return;
    }
    const activeCue = subtitleCues.find((c) => currentTime >= c.start && currentTime <= c.end);
    setCurrentCueText(activeCue ? activeCue.text : '');
  }, [currentTime, subtitleCues, isSubtitleVisible]);

  return createPortal(
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={isDirectVideo ? resetControlsTimeout : undefined}
      onTouchMove={resetControlsTimeout}
      className="fixed inset-0 w-screen h-screen z-[99999] bg-black flex items-center justify-center select-none overflow-hidden m-0 p-0 transition-all duration-300 ease-in-out"
    >
      {/* Suppress all native Chromium/in-band subtitle text tracks so only one clean subtitle is shown */}
      <style>{`
        video::cue {
          display: none !important;
          opacity: 0 !important;
          font-size: 0 !important;
          height: 0 !important;
          visibility: hidden !important;
          background: transparent !important;
          color: transparent !important;
        }
      `}</style>

      {/* For Direct Video Only: Tap to reveal controls when hidden */}
      {!showControls && isDirectVideo && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowControls(true);
            resetControlsTimeout();
          }}
          className="absolute inset-0 z-25 cursor-pointer bg-transparent"
          aria-label="Tap to show controls"
        />
      )}

      {/* For Iframe Embed: Hover/touch detector at top edge to re-show top HUD */}
      {!isDirectVideo && (
        <div
          onMouseEnter={resetControlsTimeout}
          onTouchStart={resetControlsTimeout}
          className="absolute top-0 left-0 right-0 h-14 z-20 pointer-events-auto"
        />
      )}

      {/* Top HUD Controls - Positioned high at the very top edge */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 pt-1 sm:pt-1.5 pb-1 px-2.5 sm:px-4 min-h-[42px] sm:min-h-[46px] bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between transition-all duration-200 ease-in-out pointer-events-none ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
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
                    <span>{language === 'ar' ? `سيرفر ${idx + 1}` : `Server ${idx + 1}`}</span>
                    {srv.isBest && (
                      <span className="text-[9px] text-[#00E676] font-bold">
                        {language === 'ar' ? '⚡ الأسرع' : '⚡ Best'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TV Series Episode Switcher placed in Top Bar */}
          {media.type === 'tv' && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/60 border border-white/20 text-xs">
              <button
                type="button"
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
              <button
                type="button"
                onClick={() => {
                  const state = useAppStore.getState();
                  if (!state.activeDetail && (media.tvMeta?.tmdbId || rawMediaId)) {
                    state.openSeriesDetail(
                      {
                        tmdb_id: String(media.tvMeta?.tmdbId || rawMediaId),
                        title: media.tvMeta?.showTitle || media.title,
                        type: 'tv',
                        poster_url: media.poster || '',
                        year: '2026',
                        rating: '7.8',
                        genre: 'Series',
                        popularity: '100',
                        embed_url: '',
                      },
                      currentSeason
                    );
                  }
                  handleClose();
                }}
                className="px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[10px] sm:text-[11px] font-black text-[#FF1838] tracking-wider whitespace-nowrap cursor-pointer transition-colors active:scale-95"
                title="View Season & Episodes"
              >
                S{currentSeason}:E{currentEpisode} 📋
              </button>
              <button
                type="button"
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
              if (isMuted) {
                unmuteAll();
              } else {
                if (videoRef.current) {
                  videoRef.current.muted = true;
                }
                const iframe = containerRef.current?.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                  try {
                    iframe.contentWindow.postMessage({ type: 'MUTE' }, '*');
                    iframe.contentWindow.postMessage({ action: 'mute' }, '*');
                  } catch (_) {}
                }
                setIsMuted(true);
              }
            }}
            className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
              isMuted
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-[#00E676]/20 border-[#00E676]/40 text-[#00E676]'
            }`}
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-[#00E676]" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          {/* Subtitles (CC) Toggle Button - Available for both online and offline media */}
          <button
            onClick={() => setIsSubtitleVisible(!isSubtitleVisible)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
              isSubtitleVisible && (subtitleCues.length > 0 || effectiveSubtitleUrl)
                ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676] shadow-[0_0_8px_rgba(0,230,118,0.3)]'
                : 'bg-white/10 border-white/10 text-white/50 hover:text-white'
            }`}
            title="Toggle Subtitles"
          >
            <Subtitles className="w-3 h-3" />
            <span>
              {isSubtitleVisible
                ? subtitleCues.length > 0 || effectiveSubtitleUrl
                  ? subLang === 'ar'
                    ? 'العربية'
                    : 'CC On'
                  : 'Searching...'
                : 'CC Off'}
            </span>
          </button>

          {/* Aspect Ratio / Zoom Toggle for Full Screen Fill */}
          <button
            onClick={() =>
              setAspectMode((prev) =>
                prev === 'cover' ? 'contain' : prev === 'contain' ? 'fill' : 'cover'
              )
            }
            className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
              aspectMode === 'cover'
                ? 'bg-[#FF1838]/20 border-[#FF1838] text-white shadow-[0_0_8px_rgba(255,24,56,0.4)]'
                : aspectMode === 'fill'
                ? 'bg-[#00E676]/20 border-[#00E676] text-white shadow-[0_0_8px_rgba(0,230,118,0.4)]'
                : 'bg-white/10 border-white/10 text-white/70 hover:text-white'
            }`}
            title="Toggle Fullscreen Aspect Ratio"
          >
            <Scaling className="w-3 h-3" />
            <span className="hidden md:inline">
              {aspectMode === 'cover'
                ? 'Fill Screen'
                : aspectMode === 'contain'
                ? 'Fit Screen'
                : 'Stretch'}
            </span>
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
        {isDirectVideo ? (
          <>
            <video
              ref={videoRef}
              className={`w-full h-full bg-black transition-all duration-300 ${
                aspectMode === 'cover'
                  ? 'object-cover'
                  : aspectMode === 'fill'
                  ? 'object-fill'
                  : 'object-contain'
              }`}
              playsInline
              muted={false}
              onPlay={() => {
                console.log('[UniversalPlayer:DIAG] video onPlay event, currentTime:', videoRef.current?.currentTime);
                setIsPlaying(true);
              }}
              onPause={() => {
                console.log('[UniversalPlayer:DIAG] video onPause event, currentTime:', videoRef.current?.currentTime);
                setIsPlaying(false);
              }}
              onSeeking={() => {
                console.log('[UniversalPlayer:DIAG] video onSeeking event');
                setIsLoading(true);
              }}
              onSeeked={() => {
                console.log('[UniversalPlayer:DIAG] video onSeeked event, currentTime:', videoRef.current?.currentTime);
                setIsLoading(false);
                if (isPlaying && videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(() => {});
                }
              }}
              onWaiting={() => {
                console.log('[UniversalPlayer:DIAG] video onWaiting event');
                setIsLoading(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowControls((prev) => !prev);
                resetControlsTimeout();
              }}
              onPlaying={() => {
                setIsLoading(false);
                setIsPlaying(true);
                if (videoRef.current) {
                  videoRef.current.muted = false;
                  videoRef.current.volume = 1.0;
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration || 0);
                  videoRef.current.muted = false;
                  videoRef.current.volume = 1.0;
                  disableNativeTextTracks();
                  
                  // Restore playback position
                  const cleanId = (media.id || '').toString();
                  let resumeTarget = (media.resumeTime && media.resumeTime > 2) ? media.resumeTime : 0;
                  if (!resumeTarget && typeof localStorage !== 'undefined') {
                    const saved = localStorage.getItem(`pulsar_pos_${cleanId}`) || localStorage.getItem(`pulsar_pos_${media.title}`);
                    if (saved) resumeTarget = parseFloat(saved) || 0;
                  }
                  if (resumeTarget > 2 && videoRef.current.currentTime < 2) {
                    console.log('[UniversalPlayer:DIAG] onLoadedMetadata seeking to resume target:', resumeTarget);
                    try {
                      videoRef.current.currentTime = resumeTarget;
                      lastKnownTimeRef.current = resumeTarget;
                    } catch (_) {}
                  }
                }
              }}
              onTimeUpdate={() => {
                if (videoRef.current && !isSeeking) {
                  const cur = videoRef.current.currentTime;
                  const dur = videoRef.current.duration || 0;
                  setCurrentTime(cur);
                  if (cur > 0) {
                    lastKnownTimeRef.current = cur;
                    // Persist playback position locally for reliable offline restore
                    if (typeof localStorage !== 'undefined') {
                      try {
                        const cleanId = (media.id || '').toString();
                        localStorage.setItem(`pulsar_pos_${cleanId}`, cur.toString());
                        if (media.title) localStorage.setItem(`pulsar_pos_${media.title}`, cur.toString());
                      } catch (_) {}
                    }
                  }
                  if (dur > 0) setDuration(dur);

                  // Update active subtitle cue
                  if (subtitleCues.length > 0) {
                    const activeCue = subtitleCues.find((c) => cur >= c.start && cur <= c.end);
                    setCurrentCueText(activeCue ? activeCue.text : '');
                  }

                  if (cur > 2 && (media.type === 'movie' || media.type === 'tv')) {
                    vidApiService.saveProgress(media.id, cur, dur);
                    useAppStore.getState().updateWatchProgress(media.id, cur, dur);
                  }
                }
              }}
            />
          </>
        ) : (
          <iframe
            key={`${currentStreamUrl}-${currentSeason}-${currentEpisode}-${activeMatchServerIndex}`}
            src={currentStreamUrl}
            title={media.title}
            className={`w-full h-full border-0 bg-black absolute inset-0 transition-transform duration-300 origin-center ${
              aspectMode === 'cover'
                ? 'scale-[1.12]'
                : aspectMode === 'fill'
                ? 'scale-x-[1.08] scale-y-[1.04]'
                : 'scale-100 object-contain'
            }`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
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
              unmuteAll();
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

        {/* Universal High-Visibility Arabic Subtitle Overlay (Positioned close to bottom edge, sleek & never blocks video) */}
        {isSubtitleVisible && currentCueText && (
          <div
            className={`absolute ${
              showControls ? 'bottom-12 sm:bottom-14' : 'bottom-2.5 sm:bottom-3'
            } left-4 right-4 z-40 pointer-events-none flex justify-center text-center transition-all duration-200 pb-[env(safe-area-inset-bottom,2px)]`}
          >
            <div
              dir={subLang === 'ar' ? 'rtl' : 'ltr'}
              className="px-3 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] max-w-xl leading-snug select-none tracking-wide"
              style={{
                fontFamily: subLang === 'ar' ? "'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif" : undefined,
                textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 2px #000',
              }}
            >
              {currentCueText}
            </div>
          </div>
        )}

        {/* Big Center Screen Play / Pause Floating Overlay (Only for Direct Video mode, never blocks embed iframe) */}
        {isDirectVideo && (
          <div
            className={`absolute inset-0 z-30 flex items-center justify-center transition-all duration-300 pointer-events-none ${
              !isPlaying || showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="pointer-events-auto w-20 h-20 rounded-full bg-black/75 hover:bg-[#FF1838] border-2 border-white/30 hover:border-[#FF1838] text-white flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.8)] active:scale-90 transition-all cursor-pointer group"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause Video' : 'Play Video'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-white group-hover:scale-110 transition-transform" />
              ) : (
                <Play className="w-8 h-8 fill-white ml-1 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Timeline Bar for Direct & Offline Media Playback */}
      {isDirectVideo && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 pt-8 pb-3 px-3 sm:px-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-all duration-200 ease-in-out ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Interactive Seek Bar */}
          <div className="relative group/timeline w-full flex items-center py-2 cursor-pointer select-none">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={isSeeking ? seekTime : currentTime}
              onMouseDown={() => {
                setIsSeeking(true);
                setSeekTime(currentTime);
              }}
              onTouchStart={() => {
                setIsSeeking(true);
                setSeekTime(currentTime);
              }}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSeekTime(val);
              }}
              onMouseUp={(e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                handleSeekCommit(val);
              }}
              onTouchEnd={() => {
                handleSeekCommit(seekTime);
              }}
              className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-[#FF1838] hover:h-2.5 transition-all cursor-pointer"
            />
          </div>

          {/* Controls Row: Play/Pause, -10s, +10s, Time, Volume, Fullscreen */}
          <div className="flex items-center justify-between mt-1 text-white text-xs">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Play / Pause Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-[#FF1838] active:scale-90 transition-all cursor-pointer text-white shadow-sm"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              {/* Rewind 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    const next = Math.max(0, videoRef.current.currentTime - 10);
                    seekTargetRef.current = next;
                    lastKnownTimeRef.current = next;
                    videoRef.current.currentTime = next;
                    setCurrentTime(next);
                    setTimeout(() => {
                      seekTargetRef.current = null;
                    }, 800);
                  }
                  resetControlsTimeout();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white/80 hover:text-white flex items-center gap-0.5"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">-10s</span>
              </button>

              {/* Fast Forward 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    const next = Math.min(duration, videoRef.current.currentTime + 10);
                    seekTargetRef.current = next;
                    lastKnownTimeRef.current = next;
                    videoRef.current.currentTime = next;
                    setCurrentTime(next);
                    setTimeout(() => {
                      seekTargetRef.current = null;
                    }, 800);
                  }
                  resetControlsTimeout();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white/80 hover:text-white flex items-center gap-0.5"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">+10s</span>
              </button>

              {/* Time display */}
              <div className="font-mono text-[11px] text-white/90 select-none pl-1">
                <span className="font-bold text-white">{formatTime(isSeeking ? seekTime : currentTime)}</span>
                <span className="text-white/40 mx-1.5">/</span>
                <span className="text-white/60">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mute toggle */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    const next = !videoRef.current.muted;
                    videoRef.current.muted = next;
                    setIsMuted(next);
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white/80 hover:text-white"
                title="Toggle Mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00E676]" />}
              </button>

              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70 border border-white/10">
                Offline Playback
              </span>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all cursor-pointer text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
