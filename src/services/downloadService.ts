import { DownloadTask, DownloadStatus, VidApiMovie, VidApiTvShow } from '../types';
import { resolveVideoSource } from './videoSourceResolver';

export type DownloadListener = (task: DownloadTask) => void;

export interface DirectDownloadParams {
  title: string;
  type: 'movie' | 'episode';
  season?: number;
  episode?: number;
  quality?: string;
  tmdbId?: string;
}

export interface DirectDownloadResult {
  success: boolean;
  downloadUrl: string;
  fileName: string;
  sizeBytes?: number;
  quality?: string;
}

interface NativePulsarDownloader {
  startDownload(url: String, headersJson: String, fileName: String, mediaId: String, mediaType: String): string;
  startMediaDownload(
    url: String,
    headersJson: String,
    title: String,
    mediaId: String,
    mediaType: String,
    quality: String,
    season: number,
    episode: number,
    posterUrl: String
  ): string;
  pauseDownload(downloadId: String): void;
  resumeDownload(downloadId: String): void;
  cancelDownload(downloadId: String): void;
  deleteDownload(downloadId: String, deleteFile: boolean): void;
  getDownloadStatus(downloadId: String): string;
  getAllDownloads(): string;
  getPlayableUri(downloadId: String): string;
  getPlayableSubtitleUri?(downloadId: String): string;
  getAvailableStorageBytes(): number;
  resolveAndDownloadMovieBox?(detailPath: string, type: string, season: number, episode: number, quality: string, title: string, posterUrl: string, mediaId: string): string;
  saveToGallery?(downloadId: String): string;
  playOfflineMedia?(downloadId: String, title?: string, subtitleUrl?: string): void;
  isNativeDownloaderSupported(): boolean;
}

declare global {
  interface Window {
    PulsarDownloader?: NativePulsarDownloader;
    __pulsarDownloadUpdate?: (payload: any) => void;
    __pulsarInitDownloads?: (payload: any) => void;
  }
}

class DownloadService {
  private listeners: Set<DownloadListener> = new Set();
  private mockTasks: Map<string, DownloadTask> = new Map();

  constructor() {
    this.setupGlobalListener();
  }

  private setupGlobalListener() {
    if (typeof window === 'undefined') return;

    window.__pulsarDownloadUpdate = (payload: any) => {
      try {
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const existing = this.mockTasks.get(data.downloadId);
        const now = Date.now();
        const timeDiffSec = existing?.updatedAt ? Math.max(0.1, (now - existing.updatedAt) / 1000) : 1;
        const newDownloaded = typeof data.downloadedBytes === 'number' ? data.downloadedBytes : (existing?.downloadedBytes ?? 0);
        const bytesDiff = Math.max(0, newDownloaded - (existing?.downloadedBytes ?? 0));
        
        let speedBytesPerSec = existing?.speedBytesPerSec || (4.5 * 1024 * 1024);
        if (bytesDiff > 0 && timeDiffSec > 0) {
          speedBytesPerSec = Math.round(bytesDiff / timeDiffSec);
        }
        const total = typeof data.totalBytes === 'number' ? data.totalBytes : (existing?.totalBytes ?? 0);
        const remainingBytes = Math.max(0, total - newDownloaded);
        const etaSeconds = speedBytesPerSec > 0 ? Math.round(remainingBytes / speedBytesPerSec) : 0;
        const speedFormatted = `${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;

        const task: DownloadTask = {
          downloadId: data.downloadId,
          mediaId: data.mediaId || existing?.mediaId || '',
          mediaType: data.mediaType || data.type || existing?.mediaType || 'movie',
          title: data.title || existing?.title || '',
          seriesId: data.seriesId || existing?.seriesId || (data.mediaType === 'episode' || data.season ? (data.mediaId || existing?.mediaId) : undefined),
          seriesTitle: data.seriesTitle || existing?.seriesTitle || (data.title ? data.title.split(' • ')[0] : undefined),
          season: data.season ?? existing?.season,
          episode: data.episode ?? existing?.episode,
          quality: data.quality || existing?.quality || '1080p',
          status: (data.status as DownloadStatus) || existing?.status || 'QUEUED',
          progress: typeof data.progress === 'number' ? data.progress : (existing?.progress ?? 0),
          downloadedBytes: newDownloaded,
          totalBytes: total,
          speedBytesPerSec,
          speedFormatted,
          etaSeconds,
          filePath: data.filePath || existing?.filePath,
          fileUri: data.fileUri || existing?.fileUri,
          playableUri: data.playableUri || existing?.playableUri,
          subtitleUrl: data.subtitleUrl || existing?.subtitleUrl || (window.PulsarDownloader?.getPlayableSubtitleUri?.(data.downloadId) || undefined),
          subtitleLanguage: data.subtitleLanguage || existing?.subtitleLanguage || 'ar',
          posterUrl: data.posterUrl || existing?.posterUrl,
          error: data.error !== undefined ? (data.error || undefined) : existing?.error,
          updatedAt: now,
        };

        this.mockTasks.set(data.downloadId, task);
        this.notifyListeners(task);
      } catch (e) {
        console.warn('[DownloadService] Error parsing native download update', e);
      }
    };
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.PulsarDownloader?.isNativeDownloaderSupported);
  }

  public subscribe(listener: DownloadListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(task: DownloadTask) {
    this.listeners.forEach((listener) => {
      try {
        listener(task);
      } catch (err) {
        console.error('[DownloadService] Error in listener callback', err);
      }
    });
  }

  public async getAvailableStorageBytes(): Promise<number> {
    if (this.isSupported()) {
      try {
        return window.PulsarDownloader!.getAvailableStorageBytes();
      } catch (e) {
        console.warn('Failed to get native storage bytes', e);
      }
    }
    return 10 * 1024 * 1024 * 1024; // Default 10GB for web
  }

  public async getAllDownloads(): Promise<DownloadTask[]> {
    if (this.isSupported()) {
      try {
        const rawJson = window.PulsarDownloader!.getAllDownloads();
        if (rawJson && rawJson !== '[]') {
          const list = JSON.parse(rawJson);
          return list.map((item: any) => ({
            downloadId: item.downloadId,
            mediaId: item.mediaId,
            mediaType: item.type || item.mediaType || 'movie',
            title: item.title,
            season: item.season,
            episode: item.episode,
            quality: item.quality || '1080p',
            status: item.status as DownloadStatus,
            progress: item.progress || 0,
            downloadedBytes: item.downloadedBytes || 0,
            totalBytes: item.totalBytes || 0,
            filePath: item.filePath,
            fileUri: item.fileUri,
            playableUri: item.playableUri || window.PulsarDownloader!.getPlayableUri(item.downloadId),
            subtitleUrl: item.subtitleUrl || window.PulsarDownloader?.getPlayableSubtitleUri?.(item.downloadId) || undefined,
            subtitleLanguage: item.subtitleLanguage || 'ar',
            posterUrl: item.posterUrl,
            error: item.error,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
        }
      } catch (e) {
        console.warn('Failed to parse native downloads', e);
      }
    }
    return Array.from(this.mockTasks.values());
  }

  public async startMovieDownload(movie: VidApiMovie, quality: string = '1080p'): Promise<string> {
    const mediaId = `movie-${movie.tmdb_id}`;
    const resolved = resolveVideoSource({
      type: 'movie',
      mediaId,
      tmdbId: movie.tmdb_id,
      title: movie.title,
      quality,
    });

    if (this.isSupported()) {
      if (typeof window.PulsarDownloader!.resolveAndDownloadMovieBox === 'function') {
        const mbId = window.PulsarDownloader!.resolveAndDownloadMovieBox(
          '',
          'movie',
          0,
          0,
          quality,
          movie.title,
          movie.poster_url || '',
          mediaId
        );
        if (mbId) {
          const task: DownloadTask = {
            downloadId: mbId,
            mediaId,
            mediaType: 'movie',
            title: movie.title,
            quality,
            status: 'QUEUED',
            progress: 0,
            downloadedBytes: 0,
            totalBytes: 0,
            posterUrl: movie.poster_url,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          this.mockTasks.set(mbId, task);
          this.notifyListeners(task);
          return mbId;
        }
      }
      const downloadId = window.PulsarDownloader!.startMediaDownload(
        resolved.url,
        JSON.stringify(resolved.headers),
        movie.title,
        mediaId,
        'movie',
        quality,
        0,
        0,
        movie.poster_url || ''
      );
      return downloadId;
    }

    // Mock behavior for desktop browser development & previews
    console.warn('[PulsarDownloader] Downloads are only supported in the Pulsar TV Android App.');
    const mockId = `mock_${mediaId}_${Date.now()}`;
    const mockTask: DownloadTask = {
      downloadId: mockId,
      mediaId,
      mediaType: 'movie',
      title: movie.title,
      quality,
      status: 'DOWNLOADING',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 1024 * 1024 * 750, // 750 MB mock
      posterUrl: movie.poster_url,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.mockTasks.set(mockId, mockTask);
    this.notifyListeners(mockTask);
    this.simulateMockProgress(mockId);
    return mockId;
  }

  public async startEpisodeDownload(
    series: VidApiTvShow,
    season: number,
    episode: number,
    quality: string = '1080p',
    episodeTitle?: string
  ): Promise<string> {
    const mediaId = `tv-${series.tmdb_id}`;
    const formattedTitle = `${series.title} • S${season} E${episode}${episodeTitle ? ` - ${episodeTitle}` : ''}`;
    const resolved = resolveVideoSource({
      type: 'tv',
      mediaId,
      tmdbId: series.tmdb_id,
      season,
      episode,
      title: formattedTitle,
      quality,
    });

    if (this.isSupported()) {
      if (typeof window.PulsarDownloader!.resolveAndDownloadMovieBox === 'function') {
        const mbId = window.PulsarDownloader!.resolveAndDownloadMovieBox(
          '',
          'episode',
          season,
          episode,
          quality,
          series.title,
          series.poster_url || '',
          mediaId
        );
        if (mbId) {
          const task: DownloadTask = {
            downloadId: mbId,
            mediaId,
            mediaType: 'episode',
            title: formattedTitle,
            season,
            episode,
            quality,
            status: 'QUEUED',
            progress: 0,
            downloadedBytes: 0,
            totalBytes: 0,
            posterUrl: series.poster_url,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          this.mockTasks.set(mbId, task);
          this.notifyListeners(task);
          return mbId;
        }
      }
      const downloadId = window.PulsarDownloader!.startMediaDownload(
        resolved.url,
        JSON.stringify(resolved.headers),
        formattedTitle,
        mediaId,
        'episode',
        quality,
        season,
        episode,
        series.poster_url || ''
      );
      return downloadId;
    }

    // Mock behavior for browser
    console.warn('[PulsarDownloader] Downloads are only supported in the Pulsar TV Android App.');
    const mockId = `mock_${mediaId}_s${season}_e${episode}_${Date.now()}`;
    const mockTask: DownloadTask = {
      downloadId: mockId,
      mediaId,
      mediaType: 'episode',
      title: formattedTitle,
      season,
      episode,
      quality,
      status: 'DOWNLOADING',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 1024 * 1024 * 350, // 350 MB mock
      posterUrl: series.poster_url,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.mockTasks.set(mockId, mockTask);
    this.notifyListeners(mockTask);
    this.simulateMockProgress(mockId);
    return mockId;
  }

  public pause(downloadId: string) {
    if (this.isSupported()) {
      window.PulsarDownloader!.pauseDownload(downloadId);
      return;
    }
    const task = this.mockTasks.get(downloadId);
    if (task) {
      task.status = 'PAUSED';
      this.notifyListeners({ ...task });
    }
  }

  public resume(downloadId: string) {
    if (this.isSupported()) {
      window.PulsarDownloader!.resumeDownload(downloadId);
      return;
    }
    const task = this.mockTasks.get(downloadId);
    if (task) {
      task.status = 'DOWNLOADING';
      this.notifyListeners({ ...task });
      this.simulateMockProgress(downloadId);
    }
  }

  public cancel(downloadId: string) {
    if (this.isSupported()) {
      window.PulsarDownloader!.cancelDownload(downloadId);
      return;
    }
    const task = this.mockTasks.get(downloadId);
    if (task) {
      task.status = 'CANCELED';
      this.notifyListeners({ ...task });
    }
  }

  public delete(downloadId: string, deleteFile: boolean = true) {
    if (this.isSupported()) {
      window.PulsarDownloader!.deleteDownload(downloadId, deleteFile);
      return;
    }
    this.mockTasks.delete(downloadId);
    this.notifyListeners({
      downloadId,
      mediaId: '',
      mediaType: 'movie',
      title: '',
      quality: '',
      status: 'DELETED',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    });
  }

  public getPlayableUri(downloadId: string): string {
    if (this.isSupported()) {
      return window.PulsarDownloader!.getPlayableUri(downloadId);
    }
    return '';
  }

  public playOfflineMedia(downloadId: string, title?: string, subtitleUrl?: string): boolean {
    if (this.isSupported() && typeof window.PulsarDownloader?.playOfflineMedia === 'function') {
      try {
        window.PulsarDownloader.playOfflineMedia(downloadId, title, subtitleUrl);
        return true;
      } catch (_) {}
    }
    return false;
  }

  public async saveToGallery(downloadId: string): Promise<{ success: boolean; path?: string; error?: string }> {
    if (this.isSupported() && typeof window.PulsarDownloader?.saveToGallery === 'function') {
      try {
        const res = window.PulsarDownloader.saveToGallery(downloadId);
        return JSON.parse(res);
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    return { success: true, path: 'Movies/PulsarApp' };
  }

  public async resolveDirectDownloadUrl(params: DirectDownloadParams): Promise<DirectDownloadResult> {
    const quality = params.quality || '1080p';
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    const cleanTitle = (params.title || 'video')
      .replace(/[^\w\s\u0600-\u06FF.-]/g, '')
      .replace(/•.*$/g, '')
      .trim();

    const sNum = (params.season || 1).toString().padStart(2, '0');
    const eNum = (params.episode || 1).toString().padStart(2, '0');
    const safeBase = cleanTitle.replace(/\s+/g, '_') || 'video';
    const defaultFileName = params.type === 'episode'
      ? `${safeBase}_S${sNum}E${eNum}.mp4`
      : `${safeBase}.mp4`;

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Prioritize appropriate resolver depending on environment (local vs production HTTPS/HTTP)
    const endpoints = isLocal
      ? [
          'http://localhost:61151/api/moviebox/resolve',
          'https://pulsar-moviebox-api.onrender.com/api/moviebox/resolve',
        ]
      : isHttps
      ? [
          'https://pulsar-moviebox-api.onrender.com/api/moviebox/resolve',
          'http://node19.botkeep.cloud:61151/api/moviebox/resolve',
        ]
      : [
          'https://pulsar-moviebox-api.onrender.com/api/moviebox/resolve',
          'http://node19.botkeep.cloud:61151/api/moviebox/resolve',
        ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            title: cleanTitle,
            query: cleanTitle,
            type: params.type,
            season: params.season || 1,
            episode: params.episode || 1,
            quality,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            const rawFileName = data.fileName || defaultFileName;
            const directStreamUrl = data.url;

            // When hosted on a web server with PHP (like cPanel / streamnaro.online), route through local proxy.php to avoid CDN 429 rate-limiting
            const isWebProduction = typeof window !== 'undefined' && 
              (window.location.hostname.includes('streamnaro.online') || window.location.hostname.includes('streamanro.online') || window.location.port === '');

            let downloadUrl = '';
            if (isWebProduction && directStreamUrl) {
              downloadUrl = `${window.location.origin}/api/proxy.php?url=${encodeURIComponent(directStreamUrl)}&filename=${encodeURIComponent(rawFileName)}`;
            } else {
              let targetUrl = data.proxyUrl || data.url;
              if (isHttps && targetUrl && targetUrl.startsWith('http://node19.botkeep.cloud')) {
                targetUrl = `https://pulsar-moviebox-api.onrender.com/api/moviebox/proxy?url=${encodeURIComponent(directStreamUrl)}`;
              }
              const sep = targetUrl.includes('?') ? '&' : '?';
              downloadUrl = `${targetUrl}${sep}download=1&filename=${encodeURIComponent(rawFileName)}`;
            }

            return {
              success: true,
              downloadUrl,
              fileName: rawFileName,
              sizeBytes: data.sizeBytes,
              quality: data.quality || quality,
            };
          }
        }
      } catch (err) {
        console.warn(`[DownloadService] Endpoint ${endpoint} failed:`, err);
      }
    }

    // Direct proxy fallback with guaranteed attachment disposition
    const fallbackHost = isHttps
      ? 'https://pulsar-moviebox-api.onrender.com'
      : 'http://node19.botkeep.cloud:61151';

    const fallbackUrl = `${fallbackHost}/api/moviebox/proxy?url=${encodeURIComponent(
      `https://streamfree.top/api/stream?query=${encodeURIComponent(cleanTitle)}`
    )}&download=1&filename=${encodeURIComponent(defaultFileName)}`;

    return {
      success: true,
      downloadUrl: fallbackUrl,
      fileName: defaultFileName,
      quality,
    };
  }

  public directDownloadToDevice(url: string, filename?: string) {
    if (!url) return;
    try {
      let finalUrl = url;
      if (filename) {
        const cleanName = filename.replace(/[^\w\u0600-\u06FF.-]/g, '_');
        if (!finalUrl.includes('filename=')) {
          const sep = finalUrl.includes('?') ? '&' : '?';
          finalUrl = `${finalUrl}${sep}download=1&filename=${encodeURIComponent(cleanName)}`;
        }
      }

      // Method 1: Hidden download iframe (strictly delegates to browser native download manager without disrupting the app UI)
      let iframe = document.getElementById('pulsar-silent-downloader') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'pulsar-silent-downloader';
        iframe.style.display = 'none';
        iframe.style.position = 'fixed';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        document.body.appendChild(iframe);
      }
      iframe.src = finalUrl;

      // Method 2: Anchor trigger fallback
      const a = document.createElement('a');
      a.href = finalUrl;
      if (filename) {
        a.setAttribute('download', filename);
      }
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          if (a.parentNode) a.parentNode.removeChild(a);
        } catch (_) {}
      }, 4000);
    } catch (e) {
      console.warn('[DownloadService] Failed direct download trigger:', e);
    }
  }

  private simulateMockProgress(downloadId: string) {
    const interval = setInterval(() => {
      const task = this.mockTasks.get(downloadId);
      if (!task || task.status !== 'DOWNLOADING') {
        clearInterval(interval);
        return;
      }
      // Simulate bandwidth between 3.5 MB/s and 5.5 MB/s
      const jitterSpeedMb = 3.8 + Math.random() * 1.6;
      const speedBytes = Math.floor(jitterSpeedMb * 1024 * 1024);
      task.speedBytesPerSec = speedBytes;
      task.speedFormatted = `${jitterSpeedMb.toFixed(1)} MB/s`;

      const bytesAdded = Math.floor(speedBytes * 0.8);
      task.downloadedBytes = Math.min(task.totalBytes, task.downloadedBytes + bytesAdded);
      task.progress = Math.min(100, Math.round((task.downloadedBytes / Math.max(1, task.totalBytes)) * 100));

      const remainingBytes = Math.max(0, task.totalBytes - task.downloadedBytes);
      task.etaSeconds = speedBytes > 0 ? Math.ceil(remainingBytes / speedBytes) : 0;
      task.updatedAt = Date.now();

      if (task.progress >= 100 || task.downloadedBytes >= task.totalBytes) {
        task.progress = 100;
        task.status = 'COMPLETED';
        task.speedFormatted = undefined;
        task.etaSeconds = 0;
        clearInterval(interval);
      }
      this.notifyListeners({ ...task });
    }, 800);
  }
}

export const downloadService = new DownloadService();
