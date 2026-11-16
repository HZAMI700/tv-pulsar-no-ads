/**
 * Subtitle Parser and Processor for Pulsar App
 * Handles WebVTT, raw SRT, and GZIPPED OpenSubtitles files (.gz)
 * Supports Windows-1256 (Arabic legacy) and UTF-8 encodings.
 */

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export function parseTimestamp(ts: string): number {
  if (!ts) return 0;
  const clean = ts.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(clean) || 0;
}

export function formatVttTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function parseSubtitlesToCues(rawText: string): SubtitleCue[] {
  if (!rawText) return [];
  const clean = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = clean.split(/\n\n+/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIdx === -1) continue;

    const [startStr, endStr] = lines[timeLineIdx].split('-->');
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);

    const textLines = lines.slice(timeLineIdx + 1).filter((l) => l.trim().length > 0);
    const text = textLines
      .join('\n')
      .replace(/<[^>]+>/g, '') // strip HTML/formatting tags
      .replace(/\{[^}]+\}/g, '') // strip ASS/SSA style tags
      .trim();

    if (text && end > start) {
      cues.push({ start, end, text });
    }
  }

  return cues;
}

export function cuesToWebVtt(cues: SubtitleCue[]): string {
  let vtt = 'WEBVTT\n\n';
  cues.forEach((cue, index) => {
    vtt += `${index + 1}\n`;
    vtt += `${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}\n`;
    vtt += `${cue.text}\n\n`;
  });
  return vtt;
}

/**
 * Searches OpenSubtitles REST API for direct download link (.srt.gz or .srt)
 */
export async function searchOpenSubtitles(
  title: string,
  season?: number,
  episode?: number,
  lang: string = 'ara'
): Promise<string | null> {
  try {
    const cleanTitle = (title || '')
      .replace(/\(.*?\)/g, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(s\d+e\d+|season \d+|episode \d+)\b/gi, '')
      .trim();
    if (!cleanTitle) return null;

    const langCode = lang === 'en' ? 'eng' : lang === 'fr' ? 'fre' : lang === 'es' ? 'spa' : 'ara';

    const urlsToTry: string[] = [];
    if (season && episode && season > 0 && episode > 0) {
      urlsToTry.push(
        `https://rest.opensubtitles.org/search/episode-${episode}/query-${encodeURIComponent(
          cleanTitle
        )}/season-${season}/sublanguageid-${langCode}`
      );
    }
    urlsToTry.push(
      `https://rest.opensubtitles.org/search/query-${encodeURIComponent(cleanTitle)}/sublanguageid-${langCode}`
    );

    for (const url of urlsToTry) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Subloader v1',
            Accept: 'application/json',
          },
          signal: controller?.signal,
        });
        if (timer) clearTimeout(timer);

        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const matched = list.find((item: any) => item?.SubDownloadLink) || list[0];
            if (matched?.SubDownloadLink) {
              return matched.SubDownloadLink;
            }
          }
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('[SubtitleHelper] searchOpenSubtitles notice:', err);
  }
  return null;
}

/**
 * Loads subtitle content from URL (supporting .gz gzip decompression, .srt, .vtt,
 * windows-1256 Arabic encoding, and UTF-8).
 */
export async function loadSubtitleFromUrl(url: string, preferredLang: string = 'ar'): Promise<{
  cues: SubtitleCue[];
  vttBlobUrl: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Subloader v1',
      },
    });

    if (!res.ok) {
      console.warn('[SubtitleHelper] Failed to fetch subtitle:', res.status, url);
      return null;
    }

    const rawBuffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(rawBuffer);

    let textBytes = uint8;
    // Check if gzipped (magic bytes 0x1f, 0x8b)
    if (uint8.length >= 2 && uint8[0] === 0x1f && uint8[1] === 0x8b) {
      try {
        if (typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('gzip');
          const writer = ds.writable.getWriter();
          writer.write(uint8);
          writer.close();

          const reader = ds.readable.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }

          const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
          textBytes = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            textBytes.set(chunk, offset);
            offset += chunk.length;
          }
        }
      } catch (gzipErr) {
        console.warn('[SubtitleHelper] Decompression failed:', gzipErr);
      }
    }

    // Decode bytes to text: try UTF-8 first, fallback to windows-1256 for Arabic
    let text = '';
    try {
      text = new TextDecoder('utf-8', { fatal: false }).decode(textBytes);
      // Check if text has replacement chars (\uFFFD) indicating legacy Windows-1256 Arabic encoding
      if (preferredLang === 'ar' && text.includes('\uFFFD')) {
        try {
          const winText = new TextDecoder('windows-1256').decode(textBytes);
          if (winText && !winText.includes('\uFFFD')) {
            text = winText;
          }
        } catch (_) {}
      }
    } catch (_) {
      try {
        text = new TextDecoder(preferredLang === 'ar' ? 'windows-1256' : 'iso-8859-1').decode(textBytes);
      } catch (decErr) {
        text = new TextDecoder().decode(textBytes);
      }
    }

    if (!text.trim()) return null;

    const cues = parseSubtitlesToCues(text);
    if (cues.length === 0) return null;

    const vttString = cuesToWebVtt(cues);
    const blob = new Blob([vttString], { type: 'text/vtt' });
    const vttBlobUrl = URL.createObjectURL(blob);

    return { cues, vttBlobUrl };
  } catch (err) {
    console.warn('[SubtitleHelper] Error loading subtitle:', err);
    return null;
  }
}
