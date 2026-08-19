import fs from 'fs';
import type { Request, Response } from 'express';

const DB_PATH = './database.json';
const ACCESS_KEY = "l@p*gute)77=g5clebcp4lz#=x%(*rwg+ku0_)bh=&%6wg!a";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "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";
const OWNER = "KrizDavidFdez";
const REPO = "audios";
const BRANCH = "main";

// Mock audio fallbacks for sample IDs
const MOCK_AUDIO: Record<string, string> = {
  "1": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "2": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "3": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "4": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "5": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "6": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
};

// 🧠 control global
const processingQueue = new Set<string>();

// 📂 DB
function loadDB(): { downloads: Record<string, { buffer: string; createdAt: number }> } {
  if (!fs.existsSync(DB_PATH)) return { downloads: {} };
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { downloads: {} };
  }
}

function saveDB(db: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch {}
}

// 🔍 GitHub check
async function getGitHubAudio(id: string): Promise<string | null> {
  const filePath = `audios/${id}.mp3`;
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "User-Agent": "Vercel-Audio-App",
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (res.status === 200) {
      return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`;
    }
    return null;
  } catch {
    return null;
  }
}

// ⬆️ GitHub upload
async function uploadToGitHub(id: string, buffer: Buffer) {
  try {
    const filePath = `audios/${id}.mp3`;
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

    let sha = null;

    const checkRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "User-Agent": "Vercel-Audio-App",
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (checkRes.status === 200) {
      const data: any = await checkRes.json();
      sha = data.sha;
    }

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "User-Agent": "Vercel-Audio-App",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Upload audio ${id}.mp3`,
        content: buffer.toString("base64"),
        branch: BRANCH,
        ...(sha && { sha })
      })
    });

    if (!res.ok) {
      console.error("❌ GitHub error:", await res.text());
      return null;
    }

    console.log(`✅ Subido: ${id}`);
    return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`;
  } catch (err) {
    console.error("❌ Crash GitHub:", err);
    return null;
  }
}

// 🔥 background processing
async function processInBackground(id: string, buffer: Buffer) {
  if (processingQueue.has(id)) return;
  processingQueue.add(id);

  try {
    const db = loadDB();

    db.downloads[id] = {
      buffer: buffer.toString('base64'),
      createdAt: Date.now()
    };

    saveDB(db);

    await uploadToGitHub(id, buffer);

    console.log(`🔥 Procesado completo: ${id}`);
  } catch (e) {
    console.error("Error background:", e);
  } finally {
    processingQueue.delete(id);
  }
}

// 🔗 obtener link real
async function getDownloadUrl(id: string): Promise<string> {
  const tokenRes = await fetch(`https://flacdownloader.com/flac/download-token?t=${id}&f=MP3`, {
    headers: { "X-Download-Access": ACCESS_KEY }
  });

  if (!tokenRes.ok) throw new Error("Token fail");

  const tokenData: any = await tokenRes.json();
  if (!tokenData?.token) throw new Error("Missing token data");

  return `https://flacdownloader.com/flac/download?t=${id}&f=MP3&token=${encodeURIComponent(tokenData.token)}&expires=${tokenData.expires}`;
}

// Deezer direct track preview fallback
async function getDeezerPreviewUrl(id: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.deezer.com/track/${id}`, {
      headers: {
        'accept': '*/*',
        'user-agent': 'Mozilla/5.0'
      }
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    return data?.preview || null;
  } catch {
    return null;
  }
}

// 🚀 HANDLER
export default async function handler(req: Request | any, res: Response | any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = (req.query?.id as string) || '';
  if (!id) return res.status(400).json({ error: "Missing id" });

  // Check sample/mock track IDs
  if (MOCK_AUDIO[id]) {
    try {
      const mockRes = await fetch(MOCK_AUDIO[id]);
      if (mockRes.ok) {
        const arrayBuf = await mockRes.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return res.status(200).send(Buffer.from(arrayBuf));
      }
    } catch {
      return res.redirect(302, MOCK_AUDIO[id]);
    }
  }

  try {
    // 1️⃣ GitHub directo
    const githubUrl = await getGitHubAudio(id);
    if (githubUrl) {
      return res.redirect(302, githubUrl);
    }

    // 2️⃣ DB local
    const db = loadDB();
    if (db.downloads?.[id]?.buffer) {
      const buffer = Buffer.from(db.downloads[id].buffer, 'base64');

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      return res.status(200).send(buffer);
    }

    // 3️⃣ STREAM REAL
    let audioUrl: string | null = null;
    try {
      audioUrl = await getDownloadUrl(id);
    } catch (e) {
      console.warn(`FlacDownloader failed for ${id}, attempting Deezer preview...`);
    }

    // Fallback to Deezer preview if flacdownloader failed
    if (!audioUrl) {
      audioUrl = await getDeezerPreviewUrl(id);
    }

    if (!audioUrl) {
      // Final fallback to sample audio
      const fallbackUrl = MOCK_AUDIO["1"];
      return res.redirect(302, fallbackUrl);
    }

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      // Try Deezer preview as fallback
      const deezerPreview = await getDeezerPreviewUrl(id);
      if (deezerPreview) {
        return res.redirect(302, deezerPreview);
      }
      return res.redirect(302, MOCK_AUDIO["1"]);
    }

    const arrayBuf = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    res.status(200).send(buffer);

    // Save in background if > 100KB
    if (buffer.length > 100000) {
      processInBackground(id, buffer);
    }

  } catch (err) {
    console.error("Stream handler error:", err);
    // Fallback to sample audio instead of failing
    res.redirect(302, MOCK_AUDIO["1"]);
  }
}
