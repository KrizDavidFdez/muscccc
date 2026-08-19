import type { Request, Response } from 'express';

export default async function handler(req: Request | any, res: Response | any) {
  const query = (req.query?.q as string || "").toLowerCase().trim();
  if (!query) {
    return res.json([]);
  }

  try {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=10`;

    const fetchRes = await fetch(url, {
      headers: {
        'accept': '*/*',
        'user-agent': 'Mozilla/5.0'
      }
    });

    const data: any = await fetchRes.json();

    const results = (data?.data || []).map((artist: any) => {
      return {
        id: String(artist.id),
        name: artist.name || '',
        pictureUrl:
          artist.picture_xl ||
          artist.picture_big ||
          artist.picture_medium ||
          null
      };
    });

    res.json(results);

  } catch (err) {
    console.error("Search artists error:", err);
    res.json([]);
  }
}
