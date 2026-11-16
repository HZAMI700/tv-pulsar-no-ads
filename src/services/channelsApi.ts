import { ChannelItem } from '../types';

let cachedChannels: ChannelItem[] | null = null;
let cachedCatalog: Record<string, string> | null = null;

export const channelsService = {
  async getLogosCatalog(): Promise<Record<string, string>> {
    if (cachedCatalog) return cachedCatalog;
    try {
      const res = await fetch('/logos_catalog.json');
      if (res.ok) {
        cachedCatalog = await res.json();
        return cachedCatalog || {};
      }
    } catch {
      // ignore
    }
    return {};
  },

  resolveLogo(name: string, logoAsset?: string, catalog: Record<string, string> = {}): string | undefined {
    if (logoAsset) {
      if (logoAsset.startsWith('http://') || logoAsset.startsWith('https://')) {
        return logoAsset;
      }
      return `/${logoAsset.replace(/^\//, '')}`;
    }

    const cleanKey = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    if (catalog[cleanKey]) {
      return catalog[cleanKey];
    }

    if (cleanKey.includes('skysport') || cleanKey.includes('skysports')) {
      return '/logos/sky-sports-main-event-uk.png';
    }

    return undefined;
  },

  sanitizeStreamUrl(src: string): string {
    const clean = src.trim();
    const match = clean.match(/embed\/([a-zA-Z0-9_-]+)\.php/);
    if (match) {
      return `https://wideiptv.top/player/index.php?id=${match[1]}&token=freeshot`;
    }
    return clean;
  },

  async getAllChannels(): Promise<ChannelItem[]> {
    if (cachedChannels) return cachedChannels;

    try {
      const [channelsRes, catalog] = await Promise.all([
        fetch('/assets/channels.json').then((r) => (r.ok ? r.json() : [])),
        this.getLogosCatalog(),
      ]);

      const rawList: any[] = Array.isArray(channelsRes) ? channelsRes : [];

      cachedChannels = rawList.map((ch, idx) => ({
        id: ch.id || `channel-${idx}`,
        name: ch.name || `Channel ${idx + 1}`,
        src: this.sanitizeStreamUrl(ch.src || ''),
        category: ch.category || 'General',
        country: ch.country || 'AR',
        program: ch.program || 'HD Live Broadcast',
        isFeatured: Boolean(ch.isFeatured),
        logoAsset: ch.logoAsset,
        resolvedLogo: this.resolveLogo(ch.name, ch.logoAsset, catalog),
        viewers: ch.viewers || Math.floor(Math.random() * 3200) + 400,
      }));

      return cachedChannels;
    } catch (e) {
      console.warn('Could not load channels.json, using fallback channels', e);
      return this.getFallbackChannels();
    }
  },

  async getChannelsByCategory(category: string): Promise<ChannelItem[]> {
    const all = await this.getAllChannels();
    if (!category || category === 'all') return all;
    return all.filter((c) => c.category.toLowerCase() === category.toLowerCase());
  },

  async getSportsChannels(): Promise<ChannelItem[]> {
    const all = await this.getAllChannels();
    return all.filter(
      (c) =>
        c.category.toLowerCase().includes('bein') ||
        c.category.toLowerCase().includes('sport') ||
        c.name.toLowerCase().includes('sport') ||
        c.name.toLowerCase().includes('bein') ||
        c.name.toLowerCase().includes('ssc') ||
        c.name.toLowerCase().includes('alkass')
    );
  },

  getFallbackChannels(): ChannelItem[] {
    return [
      {
        id: 'bein_sports_ar1',
        name: 'beIN SPORTS AR 1',
        src: 'https://wideiptv.top/player/beINAR',
        category: 'beIN Sports',
        country: 'AR',
        program: 'UEFA Champions League Live',
        isFeatured: true,
        resolvedLogo: '/logos/bein-sports-1.png',
        viewers: 12450,
      },
      {
        id: 'bein_sports_ar2',
        name: 'beIN SPORTS AR 2',
        src: 'https://wideiptv.top/player/beINAR2',
        category: 'beIN Sports',
        country: 'AR',
        program: 'Premier League Live',
        isFeatured: true,
        resolvedLogo: '/logos/bein-sports-2.png',
        viewers: 9320,
      },
      {
        id: 'bein_sports_ar3',
        name: 'beIN SPORTS AR 3',
        src: 'https://wideiptv.top/player/beINAR3',
        category: 'beIN Sports',
        country: 'AR',
        program: 'LaLiga Live',
        isFeatured: true,
        resolvedLogo: '/logos/bein-sports-3.png',
        viewers: 8100,
      },
    ];
  },
};
