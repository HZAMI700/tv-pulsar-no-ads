import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Check,
  Film,
  Tv,
  CheckSquare,
  Square,
  Globe,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers,
  Loader2,
} from 'lucide-react';
import { TmdbEpisode, VidApiMovie, VidApiTvShow } from '../../types';
import { useDownloadStore } from '../../store/downloadStore';
import { useAppStore } from '../../store/useAppStore';

export type VideoQuality = '1080p' | '720p' | '480p';

export interface SubtitleOption {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  code: string;
  isRecommended?: boolean;
}

export const AVAILABLE_SUBTITLE_LANGUAGES: SubtitleOption[] = [
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', code: 'ara', isRecommended: true },
  { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', code: 'eng', isRecommended: true },
  { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', code: 'fre' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', code: 'spa' },
  { id: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', code: 'ger' },
  { id: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', code: 'tur' },
  { id: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', code: 'ita' },
];

export async function fetchOpenSubtitles(title: string, languageCode: string = 'ara'): Promise<string | null> {
  try {
    const cleanTitle = (title || '').replace(/\(.*?\)/g, '').trim();
    if (!cleanTitle) return null;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;

    const res = await fetch(
      `https://rest.opensubtitles.org/search/query-${encodeURIComponent(cleanTitle)}/sublanguageid-${languageCode}`,
      {
        headers: {
          'User-Agent': 'Subloader v1',
        },
        signal: controller ? controller.signal : undefined,
      }
    );

    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) return null;

    const list = await res.json();
    if (Array.isArray(list) && list.length > 0) {
      const matched = list.find((item: any) => item?.SubDownloadLink) || list[0];
      return matched?.SubDownloadLink || null;
    }
  } catch (err) {
    console.warn('[DownloadQualityModal] OpenSubtitles fetch notice:', err);
  }
  return null;
}

function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  const gb = mb / 1024;
  if (gb >= 1.0) {
    return `${gb.toFixed(2)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

interface DownloadQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'movie' | 'tv';
  movie?: VidApiMovie | null;
  series?: VidApiTvShow | null;
  season?: number;
  episodes?: TmdbEpisode[];
  initialQuality?: VideoQuality;
  onConfirmMovie?: (
    quality: VideoQuality,
    subtitleUrl?: string,
    subtitleLanguage?: string,
    subtitleLanguages?: string[],
    subtitleUrls?: Record<string, string>
  ) => void;
  onConfirmEpisodes?: (
    episodeNumbers: number[],
    quality: VideoQuality,
    subtitleUrl?: string,
    subtitleLanguage?: string,
    subtitleLanguages?: string[],
    subtitleUrls?: Record<string, string>
  ) => void;
}

export const DownloadQualityModal: React.FC<DownloadQualityModalProps> = ({
  isOpen,
  onClose,
  mediaType,
  movie,
  series,
  season = 1,
  episodes = [],
  initialQuality = '1080p',
  onConfirmMovie,
  onConfirmEpisodes,
}) => {
  const { freeStorageBytes } = useDownloadStore();
  const { language } = useAppStore();
  const isRTL = language === 'ar';

  const safeEpisodes = useMemo(() => {
    return Array.isArray(episodes) ? episodes.filter(Boolean) : [];
  }, [episodes]);

  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>(() => {
    const clean = (initialQuality || '1080p').toString().toLowerCase();
    if (clean.includes('720')) return '720p';
    if (clean.includes('480')) return '480p';
    return '1080p';
  });

  // Multi-select subtitle languages (defaults to Arabic)
  const [selectedSubLanguages, setSelectedSubLanguages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pulsar_user_selected_subs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return ['ar'];
  });

  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEpisodeNumbers, setSelectedEpisodeNumbers] = useState<number[]>(() => {
    return safeEpisodes.length > 0 ? safeEpisodes.map((e) => e?.episodeNumber ?? 1) : [1];
  });

  useEffect(() => {
    if (safeEpisodes.length > 0) {
      setSelectedEpisodeNumbers(safeEpisodes.map((e) => e?.episodeNumber ?? 1));
    }
  }, [safeEpisodes]);

  if (!isOpen) return null;

  const title = mediaType === 'movie' ? movie?.title || 'Movie' : series?.title || 'Series';
  const posterUrl = mediaType === 'movie' ? movie?.poster_url : series?.poster_url;

  const singleItemRuntimeMinutes = Math.max(
    20,
    mediaType === 'movie'
      ? movie?.runtime && movie.runtime > 20
        ? movie.runtime
        : 115
      : (safeEpisodes[0] as any)?.runtime && (safeEpisodes[0] as any).runtime > 10
      ? (safeEpisodes[0] as any).runtime
      : 45
  );

  const getSingleItemBytes = (q: VideoQuality) => {
    if (mediaType === 'movie') {
      if (q === '1080p') return Math.round(1.42 * 1024 * 1024 * 1024);
      if (q === '720p') return 880 * 1024 * 1024;
      return 450 * 1024 * 1024;
    } else {
      if (q === '1080p') return Math.round(1.35 * 1024 * 1024 * 1024);
      if (q === '720p') return 720 * 1024 * 1024;
      return 350 * 1024 * 1024;
    }
  };

  const selectedCount = mediaType === 'tv' ? Math.max(1, selectedEpisodeNumbers.length) : 1;
  const totalCalculatedBytes = getSingleItemBytes(selectedQuality) * selectedCount;
  const isStorageInsufficient = freeStorageBytes > 0 && freeStorageBytes < totalCalculatedBytes;

  const qualityOptions: {
    id: VideoQuality;
    title: string;
    titleAr: string;
    desc: string;
    descAr: string;
    badge: string;
    badgeAr: string;
  }[] = [
    {
      id: '1080p',
      title: '1080p Full HD',
      titleAr: '1080p دقة فائقة (Full HD)',
      desc: 'Crystal clear picture and immersive audio for TV & phone',
      descAr: 'أفضل جودة ووضوح شاشة متكامل مع صوت ستيريو محيطي',
      badge: 'Best Quality',
      badgeAr: 'أعلى دقة',
    },
    {
      id: '720p',
      title: '720p High Definition',
      titleAr: '720p جودة عالية (HD)',
      desc: 'Sharp picture with balanced storage space',
      descAr: 'دقة عالية متوازنة وسرعة تحميل فائقة وتوفير للمساحة',
      badge: 'Recommended',
      badgeAr: 'موصى به',
    },
    {
      id: '480p',
      title: '480p Standard Definition',
      titleAr: '480p جودة قياسية (SD)',
      desc: 'Fastest download and smallest storage footprint',
      descAr: 'تحميل سريع جداً بأقل استهلاك للذاكرة وباقة الإنترنت',
      badge: 'Fast & Compact',
      badgeAr: 'سريع وخفيف',
    },
  ];

  const toggleSubtitleLanguage = (langId: string) => {
    setSelectedSubLanguages((prev) => {
      const exists = prev.includes(langId);
      const next = exists ? prev.filter((id) => id !== langId) : [...prev, langId];
      try {
        localStorage.setItem('pulsar_user_selected_subs', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const handleSelectAllSubtitles = () => {
    const all = AVAILABLE_SUBTITLE_LANGUAGES.map((l) => l.id);
    setSelectedSubLanguages(all);
    try {
      localStorage.setItem('pulsar_user_selected_subs', JSON.stringify(all));
    } catch (_) {}
  };

  const handleClearAllSubtitles = () => {
    setSelectedSubLanguages([]);
    try {
      localStorage.setItem('pulsar_user_selected_subs', JSON.stringify([]));
    } catch (_) {}
  };

  const toggleEpisode = (epNum: number) => {
    setSelectedEpisodeNumbers((prev) =>
      prev.includes(epNum) ? prev.filter((n) => n !== epNum) : [...prev, epNum].sort((a, b) => a - b)
    );
  };

  const toggleSelectAllEpisodes = () => {
    if (selectedEpisodeNumbers.length === safeEpisodes.length) {
      setSelectedEpisodeNumbers([]);
    } else {
      setSelectedEpisodeNumbers(safeEpisodes.map((e) => e?.episodeNumber ?? 1));
    }
  };

  const handleStart = async () => {
    if (isStarting) return;
    setErrorMessage(null);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMessage(
        isRTL
          ? 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة للبدء بالتحميل.'
          : 'No internet connection. Please check your network to start download.'
      );
      return;
    }

    if (isStorageInsufficient) {
      setErrorMessage(
        isRTL
          ? `المساحة المتوفرة غير كافية: تحتاج ${formatBytes(totalCalculatedBytes)} لكن المتوفر ${formatBytes(freeStorageBytes)} فقط.`
          : `Insufficient storage: You need ${formatBytes(totalCalculatedBytes)} free space, but only ${formatBytes(freeStorageBytes)} is available.`
      );
      return;
    }

    if (mediaType === 'tv' && selectedEpisodeNumbers.length === 0) {
      setErrorMessage(
        isRTL ? 'يرجى اختيار حلقة واحدة على الأقل للتحميل.' : 'Please select at least one episode to download.'
      );
      return;
    }

    setIsStarting(true);

    try {
      const subtitleUrls: Record<string, string> = {};
      let primarySubUrl: string | undefined = undefined;

      if (selectedSubLanguages.length > 0) {
        const fetchPromises = selectedSubLanguages.map(async (langId) => {
          const opt = AVAILABLE_SUBTITLE_LANGUAGES.find((l) => l.id === langId);
          if (!opt) return null;
          try {
            const url = await fetchOpenSubtitles(title, opt.code);
            return { langId, url };
          } catch {
            return null;
          }
        });

        const results = await Promise.allSettled(fetchPromises);
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value?.url) {
            subtitleUrls[r.value.langId] = r.value.url;
          }
        });

        primarySubUrl = subtitleUrls['ar'] || Object.values(subtitleUrls)[0];
      }

      const primaryLang = subtitleUrls['ar'] ? 'ar' : selectedSubLanguages[0] || 'ar';

      if (mediaType === 'movie') {
        onConfirmMovie?.(
          selectedQuality,
          primarySubUrl,
          selectedSubLanguages.length > 0 ? primaryLang : undefined,
          selectedSubLanguages,
          subtitleUrls
        );
      } else {
        onConfirmEpisodes?.(
          selectedEpisodeNumbers,
          selectedQuality,
          primarySubUrl,
          selectedSubLanguages.length > 0 ? primaryLang : undefined,
          selectedSubLanguages,
          subtitleUrls
        );
      }

      try {
        if ((window as any).PulsarApp?.showToast) {
          const countTxt =
            mediaType === 'tv' && selectedEpisodeNumbers.length > 1
              ? ` (${selectedEpisodeNumbers.length} eps)`
              : '';
          const subTxt =
            selectedSubLanguages.length > 0 ? ` + ${selectedSubLanguages.length} subtitles` : '';
          (window as any).PulsarApp.showToast(
            `🚀 Started download: ${title}${countTxt} [${selectedQuality}]${subTxt}`
          );
        }
      } catch (_) {}
    } catch (e) {
      console.warn('[DownloadQualityModal] start download error:', e);
    } finally {
      setTimeout(() => {
        setIsStarting(false);
        onClose();
      }, 500);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 text-white max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.95)] animate-in slide-in-from-bottom-6 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Netflix Bottom Sheet Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-3.5 shrink-0" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#232323] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                className="w-12 h-16 rounded-xl object-cover shrink-0 border border-white/15 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-white shrink-0">
                {mediaType === 'movie' ? <Film className="w-5 h-5 text-[#E50914]" /> : <Tv className="w-5 h-5 text-[#E50914]" />}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-black text-white truncate tracking-tight">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-neutral-400 font-medium">
                  {mediaType === 'movie'
                    ? isRTL
                      ? `${singleItemRuntimeMinutes} دقيقة • خيارات الجودة والترجمة`
                      : `${singleItemRuntimeMinutes} min • Quality & Subtitles`
                    : safeEpisodes.length === 1
                    ? isRTL
                      ? `الموسم ${season} • الحلقة ${safeEpisodes[0]?.episodeNumber ?? 1}`
                      : `Season ${season} • Episode ${safeEpisodes[0]?.episodeNumber ?? 1}`
                    : isRTL
                    ? `الموسم ${season} • ${safeEpisodes.length} حلقات`
                    : `Season ${season} • ${safeEpisodes.length} Episodes`}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
                  <ShieldCheck className="w-2.5 h-2.5" /> MP4
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isStarting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer active:scale-95 transition-all shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 py-3.5 no-scrollbar flex-1">
          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 flex items-center gap-2.5 text-xs text-red-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Quality Options (Netflix Cards) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#E50914]" />
                <span>{isRTL ? 'اختر الجودة المطلوبة' : 'Select Video Quality'}</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {formatBytes(getSingleItemBytes(selectedQuality))}
                {mediaType === 'tv' && safeEpisodes.length > 1 ? ' / ep' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {qualityOptions.map((opt) => {
                const isSelected = selectedQuality === opt.id;
                const singleBytes = getSingleItemBytes(opt.id);
                const displaySize = formatBytes(singleBytes);
                const totalBatchSize = formatBytes(singleBytes * selectedCount);

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedQuality(opt.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#1C1C1E] border-[#E50914] ring-1 ring-[#E50914] shadow-[0_0_20px_rgba(229,9,20,0.2)]'
                        : 'bg-[#1C1C1E]/60 border-white/5 hover:bg-[#1C1C1E] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-[#E50914] bg-[#E50914]' : 'border-neutral-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">
                            {isRTL ? opt.titleAr : opt.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                            {isRTL ? opt.badgeAr : opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                          {isRTL ? opt.descAr : opt.desc}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="font-mono text-xs font-black text-white block">
                        {displaySize}
                      </span>
                      {selectedCount > 1 && (
                        <span className="text-[10px] text-emerald-400 font-mono block">
                          Total {totalBatchSize}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Subtitles Selection */}
          <div className="pt-2 border-t border-[#232323] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#E50914]" />
                <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                  {isRTL
                    ? `ملفات الترجمة (${selectedSubLanguages.length} محددة)`
                    : `Subtitles (${selectedSubLanguages.length} Selected)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllSubtitles}
                  className="text-[10px] text-[#E50914] hover:underline font-bold cursor-pointer"
                >
                  {isRTL ? 'تحديد الكل' : 'Select All'}
                </button>
                <span className="text-white/20 text-xs">•</span>
                <button
                  type="button"
                  onClick={handleClearAllSubtitles}
                  className="text-[10px] text-neutral-400 hover:text-white font-bold cursor-pointer"
                >
                  {isRTL ? 'بدون ترجمة' : 'None'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
              {AVAILABLE_SUBTITLE_LANGUAGES.map((sub) => {
                const isSelected = selectedSubLanguages.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubtitleLanguage(sub.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#1C1C1E] border-[#E50914] text-white shadow-sm'
                        : 'bg-[#1C1C1E]/50 border-white/5 text-neutral-400 hover:bg-[#1C1C1E] hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{sub.flag}</span>
                        <span className="text-xs font-black truncate">{sub.nativeName}</span>
                      </div>
                      <span className="text-[9px] text-neutral-500 block truncate mt-0.5">{sub.name}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-[#E50914] bg-[#E50914]' : 'border-neutral-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: TV Series Episode Checkboxes (When multiple episodes exist) */}
          {mediaType === 'tv' && safeEpisodes.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-[#232323]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>
                    {isRTL
                      ? `اختيار الحلقات (${selectedEpisodeNumbers.length}/${safeEpisodes.length})`
                      : `Select Episodes (${selectedEpisodeNumbers.length}/${safeEpisodes.length})`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAllEpisodes}
                  className="text-xs text-[#E50914] hover:text-red-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {selectedEpisodeNumbers.length === safeEpisodes.length ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'إلغاء التحديد' : 'Deselect All'}</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'تحديد كل الموسم' : 'Select All Season'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {safeEpisodes.map((ep) => {
                  const epNum = ep?.episodeNumber ?? 1;
                  const isChecked = selectedEpisodeNumbers.includes(epNum);
                  return (
                    <div
                      key={epNum}
                      onClick={() => toggleEpisode(epNum)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#1C1C1E] text-white font-bold border border-white/20'
                          : 'bg-[#1C1C1E]/50 text-neutral-400 hover:bg-[#1C1C1E] hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isChecked ? 'border-[#E50914] bg-[#E50914]' : 'border-neutral-600'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <span className="font-bold font-mono text-neutral-400 w-6">
                          E{epNum.toString().padStart(2, '0')}
                        </span>
                        <span className="truncate">{ep?.name || `Episode ${epNum}`}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                        {formatBytes(getSingleItemBytes(selectedQuality))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Storage Information */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C1E] border border-white/5 text-xs">
            <span className="text-neutral-400">{isRTL ? 'مساحة الهاتف المتوفرة:' : 'Phone Storage Available:'}</span>
            <span className="font-mono font-bold text-white">
              {formatBytes(freeStorageBytes)} {isRTL ? 'متوفر' : 'available'}
            </span>
          </div>
        </div>

        {/* Netflix Bottom Action Bar */}
        <div className="pt-3 border-t border-[#232323] shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isStarting}
            className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-[#232323] text-neutral-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-white/5"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting || (mediaType === 'tv' && selectedEpisodeNumbers.length === 0)}
            className={`flex-1 py-3 px-5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer ${
              isStarting
                ? 'bg-neutral-800 text-white'
                : 'bg-[#E50914] hover:bg-red-700 text-white shadow-[0_4px_20px_rgba(229,9,20,0.4)]'
            }`}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isRTL ? 'جاري بدء التحميل...' : 'Starting Download...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {mediaType === 'movie'
                    ? isRTL
                      ? `تنزيل الفيلم • ${selectedQuality} (${formatBytes(totalCalculatedBytes)})`
                      : `Download Movie • ${selectedQuality} (${formatBytes(totalCalculatedBytes)})`
                    : safeEpisodes.length === 1
                    ? isRTL
                      ? `تنزيل الحلقة • ${selectedQuality} (${formatBytes(totalCalculatedBytes)})`
                      : `Download Episode • ${selectedQuality} (${formatBytes(totalCalculatedBytes)})`
                    : isRTL
                    ? `تنزيل ${selectedEpisodeNumbers.length} حلقات (${formatBytes(totalCalculatedBytes)})`
                    : `Download ${selectedEpisodeNumbers.length} Episodes (${formatBytes(totalCalculatedBytes)})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
