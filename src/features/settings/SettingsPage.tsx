import React, { useEffect, useId, useState, useMemo } from 'react';
import {
  Heart,
  Bookmark,
  Play,
  Tv,
  Film,
  Trophy,
  Trash2,
  Globe,
  Sliders,
  Bell,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { VidApiMovie, VidApiTvShow, ChannelItem, MatchItem } from '../../types';
import { vidApiService } from '../../services/vidApi';
import { channelsService } from '../../services/channelsApi';
import { streamFreeService } from '../../services/streamFreeApi';

type Prefs = {
  language: string;
  quality: 'auto' | 'low' | 'medium' | 'high';
  autoplayNext: boolean;
  autoplayPreviews: boolean;
  subtitleSize: 'small' | 'medium' | 'large';
  kickoffAlerts: boolean;
  goalAlerts: boolean;
  newReleaseAlerts: boolean;
  maturity: '7+' | '13+' | '16+' | '18+';
  profileLock: boolean;
};

const defaults: Prefs = {
  language: 'English',
  quality: 'auto',
  autoplayNext: true,
  autoplayPreviews: false,
  subtitleSize: 'medium',
  kickoffAlerts: true,
  goalAlerts: true,
  newReleaseAlerts: false,
  maturity: '18+',
  profileLock: false,
};

const KEY = 'pulsar.settings';

const sections = [
  { id: 'favorites', label: 'Favorites & Saved', labelAr: 'المفضلة والمحتوى المحفوظ', icon: Heart },
  { id: 'playback', label: 'Playback & Language', labelAr: 'التشغيل واللغة', icon: Sliders },
  { id: 'notifications', label: 'Notifications', labelAr: 'الإشعارات', icon: Bell },
  { id: 'parental', label: 'Parental controls', labelAr: 'الرقابة الأبوية', icon: Lock },
];

function Toggle({
  label,
  description,
  checked,
  onChange,
  isRTL,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  isRTL?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p id={id} className="text-sm md:text-base font-bold text-white">
          {label}
        </p>
        {description && <p className="text-xs md:text-sm text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 sm:h-8 sm:w-14 shrink-0 rounded-full transition-colors duration-300 cursor-pointer shadow-inner ${
          checked ? 'bg-[#E50914]' : 'bg-[#262629]'
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-1 size-5 sm:size-6 rounded-full bg-white shadow-md transition-all duration-300 ${
            checked
              ? isRTL
                ? 'right-6 sm:right-7'
                : 'left-6 sm:left-7'
              : isRTL
              ? 'right-1'
              : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2 py-4">
      <label htmlFor={id} className="text-sm md:text-base font-bold text-white">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

const inputCls =
  'min-h-12 w-full rounded-xl border border-white/10 bg-[#1C1C1E] px-4 text-sm md:text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-colors';

function Card({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-32 rounded-2xl bg-[#141414] p-5 md:p-6 border border-[#232323] shadow-lg"
    >
      <h2 id={`${id}-title`} className="text-base md:text-lg font-black text-white tracking-tight">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-[#1C1C1E]">{children}</div>
    </section>
  );
}

export const SettingsPage: React.FC = () => {
  const {
    language,
    setLanguage,
    noSpoilerMode,
    toggleNoSpoiler,
    favorites,
    toggleFavorite,
    watchLater,
    toggleWatchLater,
    openMovieDetail,
    openSeriesDetail,
    setActiveMedia,
  } = useAppStore();

  const [movies, setMovies] = useState<VidApiMovie[]>([]);
  const [series, setSeries] = useState<VidApiTvShow[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);

  useEffect(() => {
    vidApiService.getLatestMovies(1).then((res) => setMovies(res.items || [])).catch(() => {});
    vidApiService.getLatestTvShows(1).then((res) => setSeries(res.items || [])).catch(() => {});
    channelsService.getAllChannels().then((res: ChannelItem[]) => setChannels(res || [])).catch(() => {});
    streamFreeService.getLiveMatches().then((res: MatchItem[]) => setMatches(res || [])).catch(() => {});
  }, []);

  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [activeSection, setActiveSection] = useState('favorites');
  const [favFilter, setFavFilter] = useState<'all' | 'movies' | 'channels' | 'matches'>('all');

  const isRTL = language === 'ar';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs({ ...defaults, ...parsed });
      }
    } catch {}
  }, []);

  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    setStatus('idle');
  };

  function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    }
  }

  // Combine favorite & saved items
  const combinedSavedItems = useMemo(() => {
    const allIds = Array.from(new Set([...favorites, ...watchLater]));
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      poster: string;
      type: 'movie' | 'tv' | 'channel' | 'match';
      rawItem: VidApiMovie | VidApiTvShow | ChannelItem | MatchItem;
      isFav: boolean;
      isSaved: boolean;
    }> = [];

    // Match movies
    for (const id of allIds) {
      const movie = movies.find((m) => m.tmdb_id === id);
      if (movie) {
        items.push({
          id,
          title: movie.title,
          subtitle: `${movie.year} • ${movie.genre}`,
          poster: movie.poster_url || movie.backdrop_url || '',
          type: 'movie',
          rawItem: movie,
          isFav: favorites.includes(id),
          isSaved: watchLater.includes(id),
        });
        continue;
      }

      // Match series
      const show = series.find((s) => s.tmdb_id === id);
      if (show) {
        items.push({
          id,
          title: show.title,
          subtitle: `${show.year} • Series`,
          poster: show.poster_url || show.backdrop_url || '',
          type: 'tv',
          rawItem: show,
          isFav: favorites.includes(id),
          isSaved: watchLater.includes(id),
        });
        continue;
      }

      // Match channels
      const chan = channels.find((c) => c.id === id);
      if (chan) {
        items.push({
          id,
          title: chan.name,
          subtitle: chan.category ? chan.category.toUpperCase() : 'TV Channel',
          poster: chan.resolvedLogo || chan.logoAsset || '',
          type: 'channel',
          rawItem: chan,
          isFav: favorites.includes(id),
          isSaved: watchLater.includes(id),
        });
        continue;
      }

      // Match matches
      const match = matches.find((m) => m.id === id);
      if (match) {
        items.push({
          id,
          title: match.name,
          subtitle: match.league || 'Live Match',
          poster: match.thumbnailUrl || '',
          type: 'match',
          rawItem: match,
          isFav: favorites.includes(id),
          isSaved: watchLater.includes(id),
        });
        continue;
      }
    }

    return items;
  }, [favorites, watchLater, movies, series, channels, matches]);

  const filteredSavedItems = useMemo(() => {
    if (favFilter === 'movies') {
      return combinedSavedItems.filter((i) => i.type === 'movie' || i.type === 'tv');
    }
    if (favFilter === 'channels') {
      return combinedSavedItems.filter((i) => i.type === 'channel');
    }
    if (favFilter === 'matches') {
      return combinedSavedItems.filter((i) => i.type === 'match');
    }
    return combinedSavedItems;
  }, [combinedSavedItems, favFilter]);

  const handleOpenItem = (item: (typeof combinedSavedItems)[0]) => {
    if (item.type === 'movie') {
      openMovieDetail(item.rawItem as VidApiMovie, 'settings');
    } else if (item.type === 'tv') {
      openSeriesDetail(item.rawItem as VidApiTvShow, 1, 'settings');
    } else if (item.type === 'channel') {
      const c = item.rawItem as ChannelItem;
      setActiveMedia({
        id: c.id,
        title: c.name,
        type: 'channel',
        streamUrl: c.src,
        poster: c.resolvedLogo || c.logoAsset,
        isLive: true,
      });
    } else if (item.type === 'match') {
      const m = item.rawItem as MatchItem;
      setActiveMedia({
        id: m.id,
        title: m.name,
        type: 'match',
        streamUrl: m.playableUrl,
        poster: m.thumbnailUrl,
        isLive: true,
      });
    }
  };

  const handleRemove = (id: string, isFav: boolean, isSaved: boolean) => {
    if (isFav) toggleFavorite(id);
    if (isSaved) toggleWatchLater(id);
  };

  return (
    <main
      className="min-h-screen bg-[#0B0B0B] text-white pb-32 select-none"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <section className="relative overflow-hidden border-b border-[#232323] bg-gradient-to-b from-[#181818] to-[#141414]">
        <div className="relative mx-auto max-w-[1200px] px-6 pb-6 pt-8 md:pt-10 md:px-9">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#E50914] bg-[#E50914]/15 px-2.5 py-0.5 rounded-full border border-[#E50914]/30">
              PULSAR TV
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-2">
            {isRTL ? 'الإعدادات والمفضلة' : 'Settings & Favorites'}
          </h1>
          <p className="mt-1.5 max-w-[640px] text-xs sm:text-sm text-neutral-400">
            {isRTL
              ? 'إدارة محتواك المحفوظ والمفضل، إعدادات المشغل، واللغة المفضلة.'
              : 'Access your saved favorites, configure video player preferences, and toggle alerts.'}
          </p>
        </div>
      </section>

      {/* Settings Grid */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 sm:px-6 py-6 md:grid-cols-[240px_minmax(0,1fr)] md:px-9">
        {/* Navigation Slider */}
        <nav aria-label="Settings sections" className="min-w-0 md:sticky md:top-20 md:self-start">
          <div className="flex gap-2 overflow-x-auto no-scrollbar md:flex-col md:gap-1.5 pb-2">
            {sections.map((s) => {
              const isActive = activeSection === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(s.id);
                    const el = document.getElementById(s.id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`px-4 py-2.5 rounded-full md:rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#E50914] text-white shadow-[0_2px_12px_rgba(229,9,20,0.4)]'
                      : 'bg-[#1C1C1E] text-neutral-400 hover:text-white hover:bg-[#232323] border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{isRTL ? s.labelAr : s.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white hidden md:block" />}
                </button>
              );
            })}
          </div>
        </nav>

        <form onSubmit={save} noValidate className="flex flex-col gap-6">
          {/* 1. FAVORITES & SAVED CONTENT SECTION */}
          <section
            id="favorites"
            className="scroll-mt-32 rounded-2xl bg-[#141414] p-5 md:p-6 border border-[#232323] shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#E50914] fill-[#E50914]" />
                  <span>{isRTL ? 'المفضلة والمحتوى المحفوظ' : 'Favorites & Saved Content'}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {isRTL
                    ? 'جميع الأفلام، المسلسلات، القنوات والمباريات التي أضفتها لقائمتك.'
                    : 'Titles, channels, and matches you have liked or saved to your list.'}
                </p>
              </div>

              {/* Sub-filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: isRTL ? 'الكل' : 'All' },
                  { id: 'movies', label: isRTL ? 'أفلام ومسلسلات' : 'Movies & Series' },
                  { id: 'channels', label: isRTL ? 'قنوات' : 'Channels' },
                  { id: 'matches', label: isRTL ? 'مباريات' : 'Matches' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFavFilter(f.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      favFilter === f.id
                        ? 'bg-[#E50914] text-white shadow'
                        : 'bg-[#1C1C1E] text-neutral-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Saved Items */}
            <div className="mt-4">
              {filteredSavedItems.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#1C1C1E] flex items-center justify-center text-neutral-500 mb-3 border border-white/5">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {isRTL ? 'لا يوجد محتوى في المفضلة بعد' : 'No favorites saved yet'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                    {isRTL
                      ? 'اضغط على زر المفضلة أو الإشارة المرجعية على أي فيلم، مسلسل، أو قناة ليظهر هنا للوصول السريع.'
                      : 'Tap the heart or bookmark icon on any movie, series, or live channel to save it for quick access here.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSavedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#1C1C1E] border border-white/5 rounded-xl p-3 flex items-center gap-3 hover:border-white/15 transition group"
                    >
                      {/* Thumbnail with quick play */}
                      <div
                        onClick={() => handleOpenItem(item)}
                        className="relative w-16 h-20 rounded-lg overflow-hidden bg-black shrink-0 cursor-pointer group-hover:scale-102 transition shadow"
                      >
                        {item.poster ? (
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
                            <Tv className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Play className="w-5 h-5 fill-white text-white" />
                        </div>
                      </div>

                      {/* Info & Type Badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                            {item.type}
                          </span>
                        </div>
                        <h4
                          onClick={() => handleOpenItem(item)}
                          className="font-bold text-xs sm:text-sm text-white truncate hover:text-[#E50914] cursor-pointer mt-1"
                        >
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenItem(item)}
                            className="bg-[#E50914] hover:bg-[#F40612] text-white text-[10px] font-bold px-3 py-1 rounded-full transition active:scale-95 shadow cursor-pointer flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>{isRTL ? 'تشغيل' : 'Play'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemove(item.id, item.isFav, item.isSaved)}
                            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            title={isRTL ? 'إزالة من المفضلة' : 'Remove from Favorites'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 2. PLAYBACK & LANGUAGE SECTION */}
          <Card id="playback" title={isRTL ? 'التشغيل واللغة' : 'Playback & Language'}>
            <Field label={isRTL ? 'لغة التطبيق والواجهة' : 'App Language'}>
              {(id) => (
                <select
                  id={id}
                  value={language === 'ar' ? 'العربية' : 'English'}
                  onChange={(e) => {
                    const next = e.target.value === 'العربية' ? 'ar' : 'en';
                    setLanguage(next);
                  }}
                  className={inputCls}
                >
                  <option value="English">English</option>
                  <option value="العربية">العربية</option>
                </select>
              )}
            </Field>

            <Field label={isRTL ? 'جودة البث الافتراضية' : 'Streaming quality'}>
              {(id) => (
                <select
                  id={id}
                  value={prefs.quality}
                  onChange={(e) => set('quality', e.target.value as Prefs['quality'])}
                  className={inputCls}
                >
                  <option value="auto">{isRTL ? 'تلقائي (موصى به)' : 'Auto (recommended)'}</option>
                  <option value="low">{isRTL ? 'منخفض · موفر للبيانات' : 'Low · saves data'}</option>
                  <option value="medium">{isRTL ? 'متوسط · SD' : 'Medium · SD'}</option>
                  <option value="high">{isRTL ? 'عالي · HD و 4K' : 'High · HD and 4K'}</option>
                </select>
              )}
            </Field>

            <Toggle
              label={isRTL ? 'تشغيل الحلقة التالية تلقائياً' : 'Autoplay next episode'}
              checked={prefs.autoplayNext}
              onChange={(v) => set('autoplayNext', v)}
              isRTL={isRTL}
            />

            <Toggle
              label={isRTL ? 'إخفاء نتائج المباريات (وضع عدم الحرق)' : 'Hide Match Scores (No-Spoiler)'}
              description={
                isRTL
                  ? 'إخفاء الأهداف والنتائج المباشرة حتى لا تحرق الحماس.'
                  : 'Hide live scores and spoilers for maximum excitement.'
              }
              checked={noSpoilerMode}
              onChange={() => toggleNoSpoiler()}
              isRTL={isRTL}
            />

            <fieldset className="py-4">
              <legend className="text-sm md:text-base font-bold text-white mb-2">
                {isRTL ? 'حجم الخط في الترجمة' : 'Subtitle Size'}
              </legend>
              <div className="inline-flex rounded-xl bg-[#1C1C1E] p-1 border border-white/10 gap-1">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('subtitleSize', s)}
                    className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs sm:text-sm font-bold capitalize transition-all ${
                      prefs.subtitleSize === s
                        ? 'bg-[#E50914] text-white shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s === 'small'
                      ? isRTL
                        ? 'صغير'
                        : 'Small'
                      : s === 'medium'
                      ? isRTL
                        ? 'متوسط'
                        : 'Medium'
                      : isRTL
                      ? 'كبير'
                      : 'Large'}
                  </button>
                ))}
              </div>
            </fieldset>
          </Card>

          {/* 3. NOTIFICATIONS SECTION */}
          <Card id="notifications" title={isRTL ? 'الإشعارات' : 'Notifications'}>
            <Toggle
              label={isRTL ? 'تنبيهات انطلاق المباريات' : 'Kickoff alerts'}
              description={isRTL ? 'إشعار فوري عند بدء مباراة تتابعها.' : 'When a match you follow starts.'}
              checked={prefs.kickoffAlerts}
              onChange={(v) => set('kickoffAlerts', v)}
              isRTL={isRTL}
            />
            <Toggle
              label={isRTL ? 'تنبيهات الأهداف' : 'Goal alerts'}
              checked={prefs.goalAlerts}
              onChange={(v) => set('goalAlerts', v)}
              isRTL={isRTL}
            />
            <Toggle
              label={isRTL ? 'إصدارات جديدة' : 'New releases'}
              description={isRTL ? 'ترشيحات أسبوعية لأقوى الأفلام والمسلسلات الجديدة.' : 'Weekly picks of new series and films.'}
              checked={prefs.newReleaseAlerts}
              onChange={(v) => set('newReleaseAlerts', v)}
              isRTL={isRTL}
            />
          </Card>

          {/* 4. PARENTAL CONTROLS SECTION */}
          <Card id="parental" title={isRTL ? 'الرقابة الأبوية' : 'Parental controls'}>
            <Field label={isRTL ? 'التصنيف العمري الأقصى' : 'Maturity rating'}>
              {(id) => (
                <select
                  id={id}
                  value={prefs.maturity}
                  onChange={(e) => set('maturity', e.target.value as Prefs['maturity'])}
                  className={inputCls}
                >
                  <option value="7+">7+ · {isRTL ? 'أطفال أكبر' : 'Older kids'}</option>
                  <option value="13+">13+ · {isRTL ? 'مراهقون' : 'Teens'}</option>
                  <option value="16+">16+ · {isRTL ? 'شباب' : 'Young adults'}</option>
                  <option value="18+">18+ · {isRTL ? 'جميع المحتويات' : 'All titles'}</option>
                </select>
              )}
            </Field>
            <Toggle
              label={isRTL ? 'قفل الملف الشخصي برمز PIN' : 'Lock this profile with a PIN'}
              description={isRTL ? 'طلب رمز PIN قبل فتح هذا الملف الشخصي.' : 'A PIN is asked for before this profile opens.'}
              checked={prefs.profileLock}
              onChange={(v) => set('profileLock', v)}
              isRTL={isRTL}
            />
          </Card>

          {/* Bottom Save Bar */}
          <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 bg-[#000000]/95 backdrop-blur-md px-6 py-4 md:mx-0 md:px-0 border-t border-white/10 rounded-b-2xl">
            <p role="status" className="text-xs sm:text-sm">
              {status === 'saved' && (
                <span className="text-emerald-400 font-semibold">
                  {isRTL ? 'تم حفظ التعديلات بنجاح' : 'Settings saved'}
                </span>
              )}
              {status === 'error' && (
                <span className="text-[#e50914] font-semibold">
                  {isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings'}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setPrefs(defaults);
                setStatus('idle');
              }}
              className="rounded-md bg-[#2d2d2d] hover:bg-[#3d3d3d] px-5 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              {isRTL ? 'استعادة الافتراضي' : 'Reset'}
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#e50914] hover:bg-[#f40612] px-6 py-2 text-sm font-bold text-white transition-all cursor-pointer shadow-lg active:scale-98"
            >
              {isRTL ? 'حفظ التغييرات' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
