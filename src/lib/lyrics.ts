import { LyricLine } from '../types';

const PRELOADED_SYNCED_LYRICS: Record<string, LyricLine[]> = {
};

export function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc.split('\n');
  const lyrics: LyricLine[] = [];
  const timeRegex = /\[(\d{2,}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    if (matches.length > 0) {
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        for (const match of matches) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const milliseconds =
            parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);

          const time = minutes * 60 + seconds + milliseconds / 1000;
          lyrics.push({ time, text });
        }
      }
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
}

const fetchJson = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (json && json.contents) return JSON.parse(json.contents);
      return json;
    } catch {
      return JSON.parse(text);
    }
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
};

export async function fetchLyricsFromDB(
  artist: string,
  title: string
): Promise<{
  lyrics: LyricLine[];
  source: string;
  isSynced: boolean;
} | null> {
  const cleanTitle = title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  const cleanArtist = artist.toLowerCase().trim();
 
  const exactKey = `${cleanTitle}_${cleanArtist}`.replace(/\s+/g, '_');
  for (const [key, lines] of Object.entries(PRELOADED_SYNCED_LYRICS)) {
    if (exactKey.includes(key) || key.includes(exactKey) || (cleanTitle.includes(key.split('_')[0]) && cleanArtist.includes(key.split('_')[1] || ''))) {
      return {
        lyrics: lines,
        source: 'Pre-cached Synced',
        isSynced: true
      };
    }
  }

  const cacheKey = `lyrics_${cleanArtist}_${cleanTitle}`.replace(/\s+/g, '_');

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  try {
    const serverRes = await fetch(`/api/lyrics?q=${encodeURIComponent(`${artist} ${title}`)}`);
    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data && data.lyrics && data.lyrics.length > 0) {
        const result = {
          lyrics: data.lyrics,
          source: 'Server Synced',
          isSynced: true
        };
        try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
        return result;
      }
    }
  } catch (e) {
    console.warn("Server lyrics fetch failed, falling back to LRCLIB...");
  }
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const data = await fetchJson(url);

    if (data && data.syncedLyrics) {
      const result = {
        lyrics: parseLRC(data.syncedLyrics),
        source: 'LRCLIB',
        isSynced: true
      };
      try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
      return result;
    }
  } catch (e) {}

  try {
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
    const searchData = await fetchJson(searchUrl);

    if (Array.isArray(searchData) && searchData.length > 0) {
      const synced = searchData.find((t: any) => t.syncedLyrics);
      if (synced && synced.syncedLyrics) {
        const result = {
          lyrics: parseLRC(synced.syncedLyrics),
          source: 'LRCLIB Search',
          isSynced: true
        };
        try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
        return result;
      }
    }
  } catch (e) {}

  return null;
}
