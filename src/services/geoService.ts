import { VidApiMovie, VidApiTvShow } from '../types';

export interface UserCountryInfo {
  code: string;       // e.g. "TN", "EG", "DZ"
  nameEn: string;     // e.g. "Tunisia"
  nameAr: string;     // e.g. "تونس"
  flag: string;       // e.g. "🇹🇳"
  railTitleEn: string;
  railTitleAr: string;
  railSubtitleEn: string;
  railSubtitleAr: string;
}

export type LocalizedMediaItem = VidApiMovie | VidApiTvShow;

// Curated Top Cinema & TV Series Catalog by Country
const COUNTRY_CATALOGS: Record<string, { info: UserCountryInfo; items: LocalizedMediaItem[] }> = {
  TN: {
    info: {
      code: 'TN',
      nameEn: 'Tunisia',
      nameAr: 'تونس',
      flag: '🇹🇳',
      railTitleEn: 'Popular in Tunisia',
      railTitleAr: 'أشهر الأعمال والمسلسلات في تونس',
      railSubtitleEn: 'Top-rated Tunisian cinema & binge-worthy series (Harga, Choufli Hal, Dachra...)',
      railSubtitleAr: 'أقوى المسلسلات والأفلام التونسية الأكثر مشاهدة (حرقة، شوفلي حل، دشرة...)',
    },
    items: [
      {
        tmdb_id: '125261',
        title: 'حرقة (Harga)',
        year: '2021',
        rating: '9.4',
        genre: 'Drama • Social • Migration',
        poster_url: 'https://image.tmdb.org/t/p/w500/ilqNrQpkTcTPinlN0zMv66Gl3z.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/5ywzcFAvgiNM0fQYV6yiVLG1Eav.jpg',
        type: 'tv',
        popularity: '99',
        embed_url: '',
      },
      {
        tmdb_id: '74919',
        title: 'شوفلي حل (Choufli Hal)',
        year: '2005',
        rating: '9.8',
        genre: 'Comedy • Family • Cult Classic',
        poster_url: 'https://image.tmdb.org/t/p/w500/d4gDRtKMb4IUnLamU7P2hJiw50s.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/m65ktq3kT4qkgwfsZS8rXuJtD7G.jpg',
        type: 'tv',
        popularity: '100',
        embed_url: '',
      },
      {
        tmdb_id: '540009',
        title: 'دشرة (Dachra)',
        year: '2019',
        rating: '8.6',
        genre: 'Horror • Mystery • Folk Thriller',
        poster_url: 'https://image.tmdb.org/t/p/w500/s6PH8SoCFMbZ4DO9yWYPwqDg70b.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/2IHIZirMVCdh2tp6dNzNZFBYwIP.jpg',
        type: 'movie',
        popularity: '95',
        embed_url: '',
      },
      {
        tmdb_id: '137655',
        title: 'نوبة (Nouba)',
        year: '2019',
        rating: '9.2',
        genre: 'Drama • Mezoued Music • Heritage',
        poster_url: 'https://image.tmdb.org/t/p/w500/euokggH1OLwjLG5EhoqyZvx0h7x.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/2xjxuNUAVZ9vJiajHO6XrKQ5OLk.jpg',
        type: 'tv',
        popularity: '96',
        embed_url: '',
      },
      {
        tmdb_id: '223135',
        title: 'فلوجة (Fallujah)',
        year: '2023',
        rating: '8.9',
        genre: 'Drama • Teen • High Stakes',
        poster_url: 'https://image.tmdb.org/t/p/w500/5x6d2d426ydDiisBVtIuoG5dxSX.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/6o9pzh9nF9GQ3otF5egynBKmm5V.jpg',
        type: 'tv',
        popularity: '98',
        embed_url: '',
      },
      {
        tmdb_id: '155182',
        title: 'كان يا ما كانش (Ken Ya Makenech)',
        year: '2021',
        rating: '8.8',
        genre: 'Comedy • Satire • Historical Fantasy',
        poster_url: 'https://image.tmdb.org/t/p/w500/9VgvJjIbislhCRyXTFaViPs2zs4.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/9VgvJjIbislhCRyXTFaViPs2zs4.jpg',
        type: 'tv',
        popularity: '92',
        embed_url: '',
      },
      {
        tmdb_id: '669363',
        title: 'الرجل الذي باع ظهره (The Man Who Sold His Skin)',
        year: '2021',
        rating: '8.7',
        genre: 'Drama • Oscar Nominee • Art',
        poster_url: 'https://image.tmdb.org/t/p/w500/oQyivgBwqfIp9Bu7LAssj3HQpOz.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/7scSHc2TkKmOUsR9e1RAWIovhNN.jpg',
        type: 'movie',
        popularity: '95',
        embed_url: '',
      },
      {
        tmdb_id: '621730',
        title: 'نورا تحلم (Noura\'s Dream)',
        year: '2019',
        rating: '8.3',
        genre: 'Drama • Hend Sabri • Social',
        poster_url: 'https://image.tmdb.org/t/p/w500/7klgZ6R3wKoOWerEytJq9Wg5dWl.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/uwd6WBwfgeoeYJPffgtMQhp0oAq.jpg',
        type: 'movie',
        popularity: '90',
        embed_url: '',
      },
      {
        tmdb_id: '898360',
        title: 'غدوة (Ghodwa)',
        year: '2022',
        rating: '8.5',
        genre: 'Drama • Political • Dhafer L\'Abidine',
        poster_url: 'https://image.tmdb.org/t/p/w500/8XWX3z1XAqmmXOnc9d4FSjbWVNG.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/72uHSbDpvKzTFNRKjRfnB5C4y95.jpg',
        type: 'movie',
        popularity: '92',
        embed_url: '',
      },
      {
        tmdb_id: '78531',
        title: 'المايسترو (El Maestro)',
        year: '2019',
        rating: '9.1',
        genre: 'Drama • Music • Social Justice',
        poster_url: 'https://image.tmdb.org/t/p/w500/k4V4f6R1D3XIwkuvl3t9qky3er7.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/pNjwSrVCK0TUurB6JREFyoBvZxY.jpg',
        type: 'tv',
        popularity: '93',
        embed_url: '',
      },
    ],
  },
  EG: {
    info: {
      code: 'EG',
      nameEn: 'Egypt',
      nameAr: 'مصر',
      flag: '🇪🇬',
      railTitleEn: '🇪🇬 Popular in Egypt',
      railTitleAr: '🇪🇬 أشهر الأعمال السينمائية والدرامية في مصر',
      railSubtitleEn: 'Blockbuster Egyptian hits & trending Ramadan series',
      railSubtitleAr: 'أقوى المسلسلات والأفلام المصرية الحصرية الأكثر طلباً',
    },
    items: [
      {
        tmdb_id: '224882',
        title: 'الحشاشين (The Assassins)',
        year: '2024',
        rating: '9.4',
        genre: 'Historical • Action • Karim Abdel Aziz',
        poster_url: 'https://image.tmdb.org/t/p/w500/qhnkrV58m9lLUL0BWX4MtKRqpKH.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/original/lxiVSSy62EgJaCqoL4zw13MokXX.jpg',
        type: 'tv',
        popularity: '99',
        embed_url: '',
      },
      {
        tmdb_id: '629040',
        title: 'ولاد رزق 3 (Sons of Rizk 3)',
        year: '2024',
        rating: '8.9',
        genre: 'Action • Crime • Ahmed Ezz',
        poster_url: 'https://image.tmdb.org/t/p/w500/oYwTsy5sNz3TvIeYBWyDRYnTzdu.jpg',
        backdrop_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=85',
        type: 'movie',
        popularity: '98',
        embed_url: '',
      },
      {
        tmdb_id: '362739',
        title: 'ولاد رزق (Sons of Rizk)',
        year: '2015',
        rating: '8.8',
        genre: 'Action • Crime • Heist',
        poster_url: 'https://image.tmdb.org/t/p/w500/e3MQdo2s9MC74k8YtYnJZzfFpef.jpg',
        backdrop_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85',
        type: 'movie',
        popularity: '95',
        embed_url: '',
      },
      {
        tmdb_id: '632702',
        title: 'كيرة والجن (Kira & El Gin)',
        year: '2022',
        rating: '8.8',
        genre: 'Historical • Action • Resistance',
        poster_url: 'https://image.tmdb.org/t/p/w500/4jmKAwiaVRsQCeNAycUryUUfrjS.jpg',
        backdrop_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1200&q=85',
        type: 'movie',
        popularity: '95',
        embed_url: '',
      },
      {
        tmdb_id: '16285',
        title: 'الفيل الأزرق (The Blue Elephant)',
        year: '2014',
        rating: '8.7',
        genre: 'Mystery • Thriller • Horror',
        poster_url: 'https://image.tmdb.org/t/p/w500/dN0CPv7SVySolf7QkkUwaq1H5uL.jpg',
        backdrop_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85',
        type: 'movie',
        popularity: '94',
        embed_url: '',
      },
    ],
  },
  DZ: {
    info: {
      code: 'DZ',
      nameEn: 'Algeria',
      nameAr: 'الجزائر',
      flag: '🇩🇿',
      railTitleEn: '🇩🇿 Popular in Algeria',
      railTitleAr: '🇩🇿 أشهر المسلسلات والأفلام الجزائرية',
      railSubtitleEn: 'Trending Algerian drama, action & social stories',
      railSubtitleAr: 'أقوى إنتاجات الدراما والسينما الجزائرية الأكثر متابعة',
    },
    items: [
      {
        tmdb_id: 'dz-el-dama',
        title: 'الدامة (El Dama)',
        year: '2023',
        rating: '9.3',
        genre: 'Drama • Bab El Oued • Crime',
        poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1200&q=85',
        type: 'tv',
        popularity: '98',
        embed_url: '',
      },
      {
        tmdb_id: 'dz-babour-ellouh',
        title: 'بابور اللوح (Babour Ellouh)',
        year: '2022',
        rating: '9.1',
        genre: 'Drama • Social • Migration',
        poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85',
        type: 'tv',
        popularity: '97',
        embed_url: '',
      },
      {
        tmdb_id: 'dz-ouled-lahlal',
        title: 'أولاد الحلال (Ouled Lahlal)',
        year: '2019',
        rating: '9.4',
        genre: 'Action • Bahia • Family Secret',
        poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85',
        type: 'tv',
        popularity: '96',
        embed_url: '',
      },
      {
        tmdb_id: '207136',
        title: 'السلطان عاشور العاشر (Achour 10)',
        year: '2015',
        rating: '9.4',
        genre: 'Comedy • History • Satire',
        poster_url: 'https://image.tmdb.org/t/p/w500/zXWtbFCy6APPEqPgXpBF6aaJVcm.jpg',
        backdrop_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
        type: 'tv',
        popularity: '98',
        embed_url: '',
      },
    ],
  },
  MA: {
    info: {
      code: 'MA',
      nameEn: 'Morocco',
      nameAr: 'المغرب',
      flag: '🇲🇦',
      railTitleEn: '🇲🇦 Popular in Morocco',
      railTitleAr: '🇲🇦 أشهر الأعمال المغربية',
      railSubtitleEn: 'Top Moroccan series & award-winning cinema',
      railSubtitleAr: 'أقوى المسلسلات والأفلام المغربية الأكثر رواجاً',
    },
    items: [
      {
        tmdb_id: 'ma-al-maktoub',
        title: 'المكتوب (Al Maktoub)',
        year: '2023',
        rating: '9.0',
        genre: 'Drama • Family • Social',
        poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1200&q=85',
        type: 'tv',
        popularity: '96',
        embed_url: '',
      },
      {
        tmdb_id: 'ma-casanegra',
        title: 'كازا نيكرا (Casanegra)',
        year: '2008',
        rating: '8.8',
        genre: 'Crime • Noir • Casablanca',
        poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=85',
        type: 'movie',
        popularity: '94',
        embed_url: '',
      },
      {
        tmdb_id: 'ma-salamat',
        title: 'سلامات أبو البنات (Salamat Abou El Banat)',
        year: '2022',
        rating: '8.9',
        genre: 'Family • Drama • Relationships',
        poster_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85',
        type: 'tv',
        popularity: '93',
        embed_url: '',
      },
    ],
  },
  SA: {
    info: {
      code: 'SA',
      nameEn: 'Saudi Arabia & Gulf',
      nameAr: 'السعودية والخليج',
      flag: '🇸🇦',
      railTitleEn: '🇸🇦 Trending in Saudi & Gulf',
      railTitleAr: '🇸🇦 الأكثر رواجاً في السعودية والخليج',
      railSubtitleEn: 'Top Gulf original series & cinematic productions',
      railSubtitleAr: 'أقوى المسلسلات والأفلام السعودية والخليجية الحصرية',
    },
    items: [
      {
        tmdb_id: 'sa-rashash',
        title: 'رشاش (Rashash)',
        year: '2021',
        rating: '9.3',
        genre: 'Action • Crime • 1980s Heist',
        poster_url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
        type: 'tv',
        popularity: '99',
        embed_url: '',
      },
      {
        tmdb_id: 'sa-shabab-al-bomb',
        title: 'شباب البومب (Shabab Al Bomb)',
        year: '2024',
        rating: '8.8',
        genre: 'Comedy • Youth • Pop Culture',
        poster_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=85',
        type: 'tv',
        popularity: '97',
        embed_url: '',
      },
      {
        tmdb_id: 'sa-alkhallat',
        title: 'الخلاط+ (Alkhallat+)',
        year: '2023',
        rating: '8.5',
        genre: 'Comedy • Anthology • Social Satire',
        poster_url: 'https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=500&q=80',
        backdrop_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85',
        type: 'movie',
        popularity: '95',
        embed_url: '',
      },
    ],
  },
};

// Fallback to Tunisia if location detection is completely unavailable or generic
const DEFAULT_COUNTRY_CODE = 'TN';

class GeoLocationService {
  private cachedCountryCode: string | null = null;
  private isDetecting: boolean = false;

  constructor() {
    this.initFromCache();
  }

  private initFromCache() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('pulsar_user_country');
      const storedTime = localStorage.getItem('pulsar_user_country_time');
      if (stored && storedTime) {
        const ageHours = (Date.now() - parseInt(storedTime, 10)) / (1000 * 60 * 60);
        if (ageHours < 48) {
          this.cachedCountryCode = stored;
        }
      }
    } catch (_) {}
  }

  public detectUserCountryCode(): string {
    if (this.cachedCountryCode) {
      return this.cachedCountryCode;
    }

    // Secondary fallback: inspect browser timezone
    let detectedCode = DEFAULT_COUNTRY_CODE;
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const tzLower = timeZone.toLowerCase();

      if (tzLower.includes('tunis')) {
        detectedCode = 'TN';
      } else if (tzLower.includes('algiers')) {
        detectedCode = 'DZ';
      } else if (tzLower.includes('cairo')) {
        detectedCode = 'EG';
      } else if (tzLower.includes('casablanca')) {
        detectedCode = 'MA';
      } else if (tzLower.includes('riyadh') || tzLower.includes('dubai') || tzLower.includes('kuwait') || tzLower.includes('qatar')) {
        detectedCode = 'SA';
      } else if (tzLower.includes('paris')) {
        detectedCode = 'TN'; // Many Maghreb diaspora in France prefer Tunisian/MENA catalog
      } else {
        detectedCode = DEFAULT_COUNTRY_CODE;
      }
    } catch (_) {
      detectedCode = DEFAULT_COUNTRY_CODE;
    }

    this.cachedCountryCode = detectedCode;

    // Asynchronously refine via Geo-IP lookup
    this.refineWithGeoIp();

    return detectedCode;
  }

  private async refineWithGeoIp(): Promise<string | null> {
    if (this.isDetecting || typeof window === 'undefined') return this.cachedCountryCode;
    this.isDetecting = true;

    try {
      // 1. Try api.country.is (ultra-fast, zero CORS, high reliability)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch('https://api.country.is/', { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const code = (data.country || '').toUpperCase();
          if (code) {
            this.setCountry(code);
            return code;
          }
        }
      } catch (_) {}

      // 2. Try ipwho.is
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch('https://ipwho.is/', { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const code = (data.country_code || '').toUpperCase();
          if (code) {
            this.setCountry(code);
            return code;
          }
        }
      } catch (_) {}

      // 3. Try ipapi.co
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const code = (data.country_code || '').toUpperCase();
          if (code) {
            this.setCountry(code);
            return code;
          }
        }
      } catch (_) {}
    } catch (_) {
      // Quietly retain timezone/default
    } finally {
      this.isDetecting = false;
    }
    return this.cachedCountryCode;
  }

  public setCountry(code: string): { info: UserCountryInfo; items: LocalizedMediaItem[] } {
    const normalized = (code || '').toUpperCase();
    if (COUNTRY_CATALOGS[normalized]) {
      this.cachedCountryCode = normalized;
      try {
        localStorage.setItem('pulsar_user_country', normalized);
        localStorage.setItem('pulsar_user_country_time', Date.now().toString());
      } catch (_) {}
    }
    return this.getLocalizedRailData(this.cachedCountryCode || DEFAULT_COUNTRY_CODE);
  }

  public getAvailableCountries(): Array<{ code: string; flag: string; nameEn: string; nameAr: string }> {
    return Object.keys(COUNTRY_CATALOGS).map((code) => ({
      code,
      flag: COUNTRY_CATALOGS[code].info.flag,
      nameEn: COUNTRY_CATALOGS[code].info.nameEn,
      nameAr: COUNTRY_CATALOGS[code].info.nameAr,
    }));
  }

  public getLocalizedRailData(overrideCode?: string): { info: UserCountryInfo; items: LocalizedMediaItem[] } {
    const code = overrideCode || this.detectUserCountryCode();
    return COUNTRY_CATALOGS[code] || COUNTRY_CATALOGS[DEFAULT_COUNTRY_CODE];
  }

  public async detectCountryAsync(): Promise<{ info: UserCountryInfo; items: LocalizedMediaItem[] }> {
    await this.refineWithGeoIp();
    return this.getLocalizedRailData();
  }
}

export const geoService = new GeoLocationService();
