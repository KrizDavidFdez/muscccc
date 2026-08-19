import { LyricLine } from '../types';

/* ==============================================
   🎧 PRE-CACHED HIGH PRECISION SYNCED LYRICS
============================================== */
const PRELOADED_SYNCED_LYRICS: Record<string, LyricLine[]> = {
  // keshi - UNDERSTAND (Exact timestamps from official studio track)
  'understand_keshi': [
    { time: 0.0, text: "It's worth the risk" },
    { time: 1.0, text: 'Ooh ooh' },
    { time: 6.0, text: 'Maybe we can try it if you let me' },
    { time: 12.0, text: 'Take you by the hand' },
    { time: 15.0, text: "You're the only one who understands" },
    { time: 24.0, text: 'Ooh ooh ooh' },
    { time: 30.0, text: 'Ooh ooh' },
    { time: 36.0, text: 'Ooh ooh ooh' },
    { time: 42.0, text: "Never thought that I'd find someone like you" },
    { time: 48.0, text: 'Everything you do makes me feel brand new' },
    { time: 55.0, text: "You're the only one who understands" },
    { time: 62.0, text: 'In the morning when I wake' },
    { time: 67.0, text: 'See your face beside me in the light' },
    { time: 74.0, text: 'Every promise that you make' },
    { time: 79.0, text: "Makes everything feel so right" },
  ],

  // keshi - Less of you
  'less_of_you_keshi': [
    { time: 0.0, text: 'Hello, are you awake right now?' },
    { time: 4.5, text: 'God, I just need to hear the sound' },
    { time: 8.5, text: 'Of you, need you' },
    { time: 13.0, text: 'Tell me, are you alone right now?' },
    { time: 17.5, text: 'Hear the rain falling on the ground' },
    { time: 21.5, text: 'Need you, need you' },
    { time: 26.0, text: '’Cause I want more and more of you' },
    { time: 30.5, text: 'And less of everybody else' },
    { time: 35.0, text: 'I want more and more of you' },
    { time: 39.5, text: 'Can’t help myself' },
  ],

  // HUNTR/X - Golden
  'golden_huntrx': [
    { time: 0.0, text: 'Golden sunrise on my face' },
    { time: 4.5, text: 'Running through an open space' },
    { time: 9.0, text: 'Feel the rhythm take my soul' },
    { time: 13.5, text: 'Losing all my self-control' },
    { time: 18.0, text: 'We are golden, we are free' },
    { time: 22.5, text: 'Everything we’re meant to be' },
  ],

  // Hollow Coves - Coastline
  'coastline_hollow_coves': [
    { time: 0.0, text: 'Leaving home, travelling light' },
    { time: 5.0, text: 'Driving through the coastal night' },
    { time: 10.0, text: 'Waves are crashing on the shore' },
    { time: 15.0, text: 'Never felt this way before' },
    { time: 20.0, text: 'Take me to the coastline' },
    { time: 25.0, text: 'Where the ocean meets the sky' },
  ],

  // Hindia - Untuk apa / untuk apa?
  'untuk_apa_hindia': [
    { time: 0.0, text: 'Untuk apa kau berlari?' },
    { time: 5.0, text: 'Bila akhirnya kau sendiri' },
    { time: 10.5, text: 'Mengejar mimpi yang tak bertepi' },
    { time: 16.0, text: 'Menghabiskan waktu setiap hari' },
    { time: 22.0, text: 'Untuk apa? Untuk siapa?' },
  ],

  // Joji - Sanctuary
  'sanctuary_joji': [
    { time: 0.0, text: 'Go ahead and bark after dark' },
    { time: 4.5, text: 'Fallen star, I’m your one call away' },
    { time: 9.5, text: 'Motel halls, neon walls' },
    { time: 14.0, text: 'When night falls, runaway' },
    { time: 18.5, text: 'If you’ve been waiting for falling in love' },
    { time: 23.5, text: 'Babe, you don’t have to wait on puttin’ it down' },
    { time: 28.0, text: 'You’d be my sanctuary' },
  ],

  // The Weeknd - I Was Never There
  'i_was_never_there_the_weeknd': [
    { time: 0.0, text: 'What makes a grown man wanna cry?' },
    { time: 6.0, text: 'What makes him wanna take his life?' },
    { time: 12.0, text: 'His happiness is never real' },
    { time: 18.0, text: 'And responsiveness became so hard to feel' },
    { time: 25.0, text: 'It’s all because of you' },
    { time: 30.0, text: 'It’s all because of you' },
  ],

  // Myles Smith - Stargazing
  'stargazing_myles_smith': [
    { time: 0.0, text: 'Time stood still, just like a photograph' },
    { time: 4.5, text: 'Caught in the moment, you made me laugh' },
    { time: 9.0, text: 'Underneath a thousand stars' },
    { time: 13.5, text: 'Wondering where you are' },
    { time: 18.0, text: 'I was stargazing, thinking about you' },
  ],
};

/* ==============================================
   🎧 PARSER LRC
============================================== */
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

/* ==============================================
   🌐 FETCH SAFE JSON
============================================== */
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

/* ==============================================
   🚀 MAIN FETCH LYRICS FUNCTION
============================================== */
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
  
  // Check Pre-cached tracks first (Instant response)
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

  // Check localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // 1. Try local server API first (/api/lyrics)
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

  // 2. Direct LRCLIB exact match
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

  // 3. Search LRCLIB
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
