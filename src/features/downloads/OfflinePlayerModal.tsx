import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowRight,
  Subtitles,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { DownloadTask } from '../../types';
import { loadSubtitleFromUrl, SubtitleCue } from '../../utils/subtitleHelper';

interface OfflinePlayerModalProps {
  task: DownloadTask;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const OfflinePlayerModal: React.FC<OfflinePlayerModalProps> = ({ task, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [currentCueText, setCurrentCueText] = useState('');
  const [aspectMode, setAspectMode] = useState<'contain' | 'cover' | 'fill'>('contain');

  const streamUrl = task.playableUri || task.filePath || '';
  const subLang = task.subtitleLanguage || 'ar';

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
      setShowSpeedMenu(false);
    }, 4000);
  }, []);

  // Suppress any native text tracks to prevent duplicate subtitles
  const disableNativeTracks = useCallback(() => {
    const v = videoRef.current;
    if (v && v.textTracks) {
      for (let i = 0; i < v.textTracks.length; i++) {
        v.textTracks[i].mode = 'disabled';
      }
    }
  }, []);

  // Load subtitles
  useEffect(() => {
    let subUrl = task.subtitleUrl;
    if (!subUrl && task.downloadId) {
      subUrl = `https://appassets.androidplatform.net/downloads/${task.downloadId}.srt`;
    }
    if (!subUrl) return;

    let cancelled = false;
    loadSubtitleFromUrl(subUrl, subLang).then((res) => {
      if (!cancelled && res) {
        setSubtitleCues(res.cues);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [task.subtitleUrl, task.downloadId, subLang]);

  // Sync subtitle cues
  useEffect(() => {
    if (!showSubtitles || subtitleCues.length === 0) {
      setCurrentCueText('');
      return;
    }
    const cue = subtitleCues.find((c) => currentTime >= c.start && currentTime <= c.end);
    setCurrentCueText(cue ? cue.text : '');
  }, [currentTime, subtitleCues, showSubtitles]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
    resetControlsTimeout();
  };

  const handleSkip = (deltaSec: number) => {
    const v = videoRef.current;
    if (!v) return;
    const target = Math.max(0, Math.min(v.duration || 0, v.currentTime + deltaSec));
    v.currentTime = target;
    setCurrentTime(target);
    resetControlsTimeout();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    v.currentTime = target;
    resetControlsTimeout();
  };

  const handleSpeedSelect = (speed: number) => {
    const v = videoRef.current;
    if (v) {
      v.playbackRate = speed;
    }
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return createPortal(
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className="fixed inset-0 w-screen h-screen z-[999999] bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Hide native cues to prevent duplicate subtitles */}
      <style>{`
        video::cue {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `}</style>

      {/* Main Video Surface */}
      <video
        ref={videoRef}
        src={streamUrl}
        className={`w-full h-full bg-black transition-all duration-200 ${
          aspectMode === 'cover'
            ? 'object-cover'
            : aspectMode === 'fill'
            ? 'object-fill'
            : 'object-contain'
        }`}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) {
            setDuration(v.duration || 0);
            v.playbackRate = playbackSpeed;
            disableNativeTracks();
            // Restore position
            try {
              const saved = localStorage.getItem(`pulsar_pos_${task.mediaId}`) || localStorage.getItem(`pulsar_pos_${task.downloadId}`);
              if (saved) {
                const pos = parseFloat(saved);
                if (pos > 2 && pos < (v.duration || 0) - 10) {
                  v.currentTime = pos;
                  setCurrentTime(pos);
                }
              }
            } catch (_) {}
          }
        }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v && !isSeeking) {
            setCurrentTime(v.currentTime);
            // Save progress
            if (v.currentTime > 2) {
              try {
                localStorage.setItem(`pulsar_pos_${task.mediaId}`, v.currentTime.toString());
                localStorage.setItem(`pulsar_pos_${task.downloadId}`, v.currentTime.toString());
              } catch (_) {}
            }
          }
        }}
        onClick={handleTogglePlay}
      />

      {/* Subtitles Overlay - Placed strictly down at the bottom */}
      {showSubtitles && currentCueText && (
        <div
          className={`absolute ${
            showControls ? 'bottom-14 sm:bottom-16' : 'bottom-2.5 sm:bottom-3.5 pb-safe'
          } left-3 right-3 z-40 pointer-events-none flex justify-center text-center transition-all duration-200`}
        >
          <div
            dir={subLang === 'ar' ? 'rtl' : 'ltr'}
            className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-2xl leading-normal select-none"
            style={{
              textShadow: '0 1px 3px #000, 0 0 2px #000',
            }}
          >
            {currentCueText}
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-all duration-200 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF1838] hover:bg-[#ff3350] text-white font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="ml-2">
            <h2 className="text-sm sm:text-base font-bold text-white drop-shadow truncate max-w-xs sm:max-w-md">
              {task.title}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-white/60">
              <span className="px-1.5 py-0.2 rounded bg-white/10 text-white font-mono">
                {task.quality || '1080p'}
              </span>
              <span>Offline Video</span>
            </div>
          </div>
        </div>

        {/* Top Actions: Aspect Ratio */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAspectMode((prev) => (prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain'));
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all"
            title="Aspect Mode"
          >
            {aspectMode === 'contain' ? 'Fit' : aspectMode === 'cover' ? 'Fill' : 'Stretch'}
          </button>
        </div>
      </div>

      {/* Center Big Play/Pause Button when Paused */}
      {!isPlaying && (
        <button
          onClick={handleTogglePlay}
          className="absolute z-30 w-16 h-16 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center shadow-2xl backdrop-blur hover:scale-110 active:scale-95 transition-all"
          aria-label="Play"
        >
          <Play className="w-8 h-8 fill-white ml-1" />
        </button>
      )}

      {/* Bottom HUD Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2 transition-all duration-200 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/80 min-w-[44px]">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              onTouchStart={() => setIsSeeking(true)}
              onTouchEnd={() => setIsSeeking(false)}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF1838] focus:outline-none"
            />
          </div>
          <span className="text-xs font-mono text-white/80 min-w-[44px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-1">
          {/* Left Controls: Play/Pause, Rewind, Forward */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => handleSkip(-10)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
              title="Rewind 10s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-10s</span>
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
              title="Forward 10s"
            >
              <span>+10s</span>
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Controls: Subtitles, Speed Acceleration, Mute, Fullscreen */}
          <div className="flex items-center gap-2 relative">
            {/* Speed Acceleration Chip */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                  playbackSpeed !== 1
                    ? 'bg-[#FF1838]/20 border-[#FF1838] text-white shadow-[0_0_10px_rgba(255,24,56,0.4)]'
                    : 'bg-white/10 border-white/15 text-white/80 hover:text-white'
                }`}
                title="Playback Speed"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{playbackSpeed}x</span>
              </button>

              {/* Speed Preset Popover Menu */}
              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-[#121422] border border-white/15 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[110px] z-50">
                  <span className="text-[10px] font-bold text-white/50 px-2 py-1 uppercase tracking-wider">
                    Speed
                  </span>
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedSelect(speed)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold text-left transition-all ${
                        playbackSpeed === speed
                          ? 'bg-[#FF1838] text-white shadow-md'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {speed === 1 ? '1.0x (Normal)' : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles Toggle */}
            <button
              onClick={() => setShowSubtitles((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                showSubtitles
                  ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676]'
                  : 'bg-white/10 border-white/15 text-white/50'
              }`}
              title="Toggle Subtitles"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>CC</span>
            </button>

            {/* Mute */}
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) {
                  v.muted = !v.muted;
                  setIsMuted(v.muted);
                }
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              aria-label="Mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              aria-label="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
