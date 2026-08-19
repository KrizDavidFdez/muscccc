import type { Request, Response } from 'express';

export default async function handler(req: Request | any, res: Response | any) {
  const id = req.query?.id as string;
  if (!id) {
    return res.json([]);
  }

  try {
    const url = `https://api.deezer.com/artist/${encodeURIComponent(id)}/top?limit=50`;

    const fetchRes = await fetch(url, {
      headers: {
        'accept': '*/*',
        'user-agent': 'Mozilla/5.0'
      }
    });

    const data: any = await fetchRes.json();

    const results = (data?.data || []).map((track: any) => {
      return {
        id: String(track.id),
        title: track.title || '',
        artist: track.artist?.name || '',
        coverUrl:
          track.album?.cover_xl ||
          track.album?.cover_big ||
          track.album?.cover_medium ||
          null,
        audioUrl: `/api/stream?id=${track.id}`
      };
    });

    res.json(results);

  } catch (err) {
    console.error("Artist tracks error:", err);
    res.json([]);
  }
}
