import type { Request, Response } from 'express';

const formatDuration = (sec: number) => {
  if (!sec || isNaN(sec)) return '03:30';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default async function handler(req: Request | any, res: Response | any) {
  const query = (req.query?.q as string || "").toLowerCase().trim();

  if (!query) {
    return res.json([]);
  }

  try {
    const limit = 40;
    const totalNeeded = 60;

    const urls = [
      `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=${limit}&index=0`,
      `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=${limit}&index=25`
    ];

    const responses = await Promise.all(
      urls.map(url =>
        fetch(url, {
          headers: {
            accept: '*/*',
            'user-agent': 'Mozilla/5.0'
          }
        }).then(r => r.json()).catch(() => ({ data: [] }))
      )
    );

    // Combine results
    const combinedRaw = [
      ...(responses[0]?.data || []),
      ...(responses[1]?.data || [])
    ];

    // Remove duplicates
    const seen = new Set();
    const combined = combinedRaw.filter((track: any) => {
      if (!track?.id || seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    });

    // Map output with cover and duration
    const results = combined.slice(0, totalNeeded).map((track: any) => {
      return {
        id: String(track.id),
        title: track.title || '',
        artist: track.artist?.name || '',
        coverUrl:
          track.album?.cover_xl ||
          track.album?.cover_big ||
          track.album?.cover_medium ||
          track.artist?.picture_xl ||
          track.artist?.picture_big ||
          null,
        audioUrl: `/api/stream?id=${track.id}`,
        duration: track.duration || 210,
        durationFormatted: formatDuration(track.duration),
        url: track.link || `https://www.deezer.com/track/${track.id}`
      };
    });

    return res.json(results);

  } catch (err) {
    console.error("Search handler error:", err);
    return res.json([]);
  }
}
