import type { Request, Response } from 'express';

const formatDuration = (sec: number) => {
  if (!sec || isNaN(sec)) return '03:30';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const OFFICIAL_FALLBACK_TRACKS = [
];

export default async function handler(req: Request | any, res: Response | any) {
  try {
    const response = await fetch('https://api.deezer.com/chart/0/tracks?limit=50', {
      headers: {
        accept: '*/*',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const data: any = await response.json();

    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return res.status(200).json(OFFICIAL_FALLBACK_TRACKS);
    }

    const fetchedTracks = data.data.map((track: any) => ({
      id: String(track.id),
      title: track.title || 'Untitled',
      artist: track.artist?.name || 'Unknown Artist',
      coverUrl: track.album?.cover_xl || track.album?.cover_big || track.album?.cover_medium || track.album?.cover || 'https://e-cdns-images.dzcdn.net/images/cover/b461aa78a8bc84df58d447a16e78dbf8/500x500-000000-80-0-0.jpg',
      audioUrl: `/api/stream?id=${track.id}`,
      duration: track.duration || 210,
      durationFormatted: formatDuration(track.duration),
    }));

    // Put our curated tracks on top, followed by global chart tracks
    const combined = [
      ...OFFICIAL_FALLBACK_TRACKS,
      ...fetchedTracks.filter((ft: any) => !OFFICIAL_FALLBACK_TRACKS.some(ot => ot.title.toLowerCase() === ft.title.toLowerCase()))
    ];

    res.status(200).json(combined);
  } catch (err) {
    console.error("Top songs fetch error:", err);
    res.status(200).json(OFFICIAL_FALLBACK_TRACKS);
  }
}
