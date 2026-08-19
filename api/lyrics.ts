import type { Request, Response } from 'express';

export default async function handler(req: Request | any, res: Response | any) {
  const query = (req.query?.q as string || '').trim();
  if (!query) {
    return res.json({ lyrics: [] });
  }

  try {
    // Fetch real lyrics from LRCLIB
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const fetchRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const data = await fetchRes.json();

    if (data && Array.isArray(data) && data.length > 0) {
      // Find the first track that has synced lyrics
      const track = data.find((t: any) => t.syncedLyrics);
      
      if (track && track.syncedLyrics) {
        const lines: string[] = track.syncedLyrics.split('\n');
        const parsedLyrics: { time: number; text: string }[] = [];

        for (const line of lines) {
          // Match LRC format like [01:23.45] or [01:23]
          const match = line.match(/\[(\d{2,}):(\d{2}(?:\.\d+)?)\](.*)/);
          if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseFloat(match[2]);
            const text = match[3].trim();
            
            parsedLyrics.push({
              time: minutes * 60 + seconds,
              text: text
            });
          }
        }
        
        return res.json({ lyrics: parsedLyrics });
      }
    }
    
    // Fallback if no synced lyrics found
    return res.json({ lyrics: [] });
  } catch (err) {
    console.error("Lyrics fetch error:", err);
    return res.json({ lyrics: [] });
  }
}
