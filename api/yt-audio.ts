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

// 🚀 Función para descargar por chunks en paralelo
async function downloadWithChunks(url: string, numChunks: number = 8): Promise<Buffer> {
  try {
    // Obtener el tamaño del archivo
    const headRes = await fetch(url, { method: 'HEAD' });
    if (!headRes.ok) throw new Error(`Failed to get file size: ${headRes.status}`);
    
    const contentLength = headRes.headers.get('content-length');
    if (!contentLength) throw new Error('No content-length header');
    
    const fileSize = parseInt(contentLength, 10);
    const chunkSize = Math.ceil(fileSize / numChunks);
    
    console.log(`📦 Descargando ${fileSize} bytes en ${numChunks} chunks de ~${chunkSize} bytes`);
    
    // Crear array de promesas para cada chunk
    const chunkPromises: Promise<{ index: number; data: Buffer }>[] = [];
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize - 1, fileSize - 1);
      
      if (start >= fileSize) break;
      
      const promise = fetch(url, {
        headers: {
          'Range': `bytes=${start}-${end}`
        }
      }).then(async res => {
        if (!res.ok) throw new Error(`Chunk ${i} failed: ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        return { index: i, data: Buffer.from(arrayBuffer) };
      });
      
      chunkPromises.push(promise);
    }
    
    // Esperar todas las descargas en paralelo
    const chunks = await Promise.all(chunkPromises);
    
    // Ordenar chunks por índice y concatenar
    chunks.sort((a, b) => a.index - b.index);
    return Buffer.concat(chunks.map(c => c.data));
  } catch (error) {
    console.warn('Chunk download failed, falling back to single download:', error);
    // Fallback a descarga simple si falla el chunk
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
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

  // Verificar si el cliente quiere el audio directo o solo metadata
  const wantAudio = req.query?.audio === 'true' || req.query?.download === 'true';

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

    // 2. Search query: Buscar SOLO VERSIONES NO OFICIALES (covers, remixes, alternativas)
    if (!result && typeof ytplay === 'function') {
      const cleanQ = rawQuery.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
      
      // 🎵 Estrategia: SOLO versiones no oficiales
      const unofficialQueries = [
        // Covers y versiones alternativas
        `${cleanQ} cover`,
        `${cleanQ} version`,
        `${cleanQ} remix`,
        `${cleanQ} alternative`,
        `${cleanQ} instrumental`,
        `${cleanQ} acoustic`,
        `${cleanQ} piano`,
        `${cleanQ} lofi`,
        `${cleanQ} slowed`,
        `${cleanQ} reverb`,
        `${cleanQ} 8d`,
        `${cleanQ} nightcore`,
        `${cleanQ} live`,
        `${cleanQ} session`,
        `${cleanQ} reimagined`,
        `${cleanQ} reinterpretation`,
        // Sin términos oficiales
        cleanQ,
      ];

      // Palabras a EXCLUIR (oficiales)
      const excludeTerms = [
        'official', 'official audio', 'official music video', 
        'topic', 'vevo', 'remastered', 'remaster',
        'deluxe', 'explicit', 'clean version'
      ];

      for (const query of unofficialQueries) {
        if (result) break;
        try {
          const ytplayRes = await ytplay(query);
          if (ytplayRes?.status && ytplayRes?.result) {
            const title = ytplayRes.result.title?.toLowerCase() || '';
            const channel = ytplayRes.result.channel?.toLowerCase() || '';
            
            // Verificar que NO sea oficial
            const isOfficial = excludeTerms.some(term => 
              title.includes(term) || channel.includes(term)
            );
            
            if (!isOfficial) {
              const mp3Url = ytplayRes.result.download?.mp3 || ytplayRes.result.url;
              if (mp3Url) {
                result = {
                  title: ytplayRes.result.title,
                  channel: ytplayRes.result.channel,
                  thumbnail: ytplayRes.result.thumbnail,
                  duration: ytplayRes.result.duration,
                  url: mp3Url,
                  type: 'unofficial' // Marcar como no oficial
                };
                break;
              }
            }
          }
        } catch (err) {
          console.warn(`Query "${query}" failed, trying next...`);
        }
      }
    }

    if (!result || !result.url) {
      return res.status(404).json({ 
        status: false, 
        error: 'No unofficial audio found. Try different search terms.' 
      });
    }

    // Si el cliente quiere el audio directamente (descarga con chunks)
    if (wantAudio) {
      try {
        console.log(`🚀 Descargando audio NO OFICIAL con 8 chunks paralelos...`);
        const audioBuffer = await downloadWithChunks(result.url, 8);
        
        // Determinar el tipo de contenido
        const contentType = result.url.endsWith('.mp3') ? 'audio/mpeg' : 
                           result.url.endsWith('.m4a') ? 'audio/mp4' : 
                           'audio/mpeg';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', audioBuffer.length.toString());
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Content-Disposition', `attachment; filename="${result.title || 'audio'}-unofficial.mp3"`);
        
        return res.status(200).send(audioBuffer);
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        // Si falla la descarga con chunks, intentar redirección
        if (req.query?.redirect === 'true') {
          return res.redirect(302, result.url);
        }
        return res.status(500).json({ 
          status: false, 
          error: 'Download failed, use redirect=true to get direct URL' 
        });
      }
    }

    // Si solo quiere metadata o redirección
    if (req.query?.redirect === 'true') {
      return res.redirect(302, result.url);
    }

    return res.json({ 
      status: true, 
      result: {
        ...result,
        note: 'This is an unofficial version (cover, remix, or alternative)'
      }
    });

  } catch (err: any) {
    console.error('iguro-ytdl error:', err);
    return res.status(500).json({ status: false, error: err?.message || 'Error processing audio' });
  }
}
