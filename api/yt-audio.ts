import type { Request, Response } from 'express';

async function getYTDL() {
  try {
    const mod: any = await import('iguro-ytdl');
    return mod.default || mod;
  } catch (e) {
    console.error('Failed to import iguro-ytdl:', e);
    return null;
  }
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawQuery = (req.query?.q as string) || (req.query?.url as string) || '';
  if (!rawQuery) {
    return res.status(400).json({ error: 'Missing query or url parameter' });
  }

  try {
    const ytdl = await getYTDL();
    if (!ytdl) {
      return res.status(503).json({ status: false, error: 'Audio service temporarily unavailable' });
    }

    const { ytmp3, ytplay } = ytdl;
    let result: any = null;

    // 1. If direct YouTube URL provided
    if ((rawQuery.startsWith('http://') || rawQuery.startsWith('https://')) && typeof ytmp3 === 'function') {
      try {
        const ytmp3Res = await ytmp3(rawQuery);
        if (ytmp3Res?.status && ytmp3Res?.result?.url) {
          result = ytmp3Res.result;
        }
      } catch (e) {
        console.warn('ytmp3 direct call failed, falling back to search...', e);
      }
    }

    // 2. Search query: Search studio versions with official lyrics audio
    if (!result && typeof ytplay === 'function') {
      const cleanQ = rawQuery.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
      
      // Strategy A: Official Audio / Studio Audio (matches lyrics LRC sync precisely)
      const studioQueries = [
        `${cleanQ} (Official Audio)`,
        `${cleanQ} Audio`,
        `${cleanQ} Topic`,
        rawQuery,
      ];

      for (const query of studioQueries) {
        if (result) break;
        try {
          const ytplayRes = await ytplay(query);
          if (ytplayRes?.status && ytplayRes?.result) {
            const mp3Url = ytplayRes.result.download?.mp3 || ytplayRes.result.url;
            if (mp3Url) {
              result = {
                title: ytplayRes.result.title,
                channel: ytplayRes.result.channel,
                thumbnail: ytplayRes.result.thumbnail,
                duration: ytplayRes.result.duration,
                url: mp3Url,
              };
              break;
            }
          }
        } catch (err) {
          console.warn(`Query "${query}" failed, trying next...`);
        }
      }
    }

    if (result && result.url) {
      if (req.query?.redirect === 'true') {
        return res.redirect(302, result.url);
      }
      return res.json({ status: true, result });
    }

    return res.status(404).json({ status: false, error: 'Audio not found' });
  } catch (err: any) {
    console.error('iguro-ytdl error:', err);
    return res.status(500).json({ status: false, error: err?.message || 'Error processing audio' });
  }
}
