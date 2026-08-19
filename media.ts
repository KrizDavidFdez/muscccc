import crypto from "crypto";
import type { Request, Response } from "express";

const OWNER = "KrizDavidFdez";  
const REPO = "media";  
const BRANCH = "main";  
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "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";  
  
const encode = (id: string) => Buffer.from(id).toString("base64");
const decode = (id: string) => Buffer.from(id, "base64").toString();

const generateId = (url: string, format: string, quality: string) => {
  const q = String(quality).toLowerCase();
  return crypto
    .createHash("md5")
    .update(`${url}_${format}_${q}`)
    .digest("hex");
};

// ==============================
// 🎯 TU SCRAPER (COMPLETO)
// ==============================
class VidsSaveScraper {
  api: string;
  auth: string;
  domain: string;
  origin: string;

  constructor() {
    this.api = "https://api.vidssave.com/api/contentsite_api/media/parse";
    this.auth = "20250901majwlqo";
    this.domain = "api-ak.vidssave.com";
    this.origin = "cache";
  }

  formatBytes(bytes: number) {
    if (!bytes || isNaN(bytes)) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = Number(bytes), i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
  }

  formatDuration(seconds: number) {
    if (!seconds || isNaN(seconds)) return "0:00";
    let total = Number(seconds);
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  normalizeQuality(quality: string, type: string) {
    if (!quality) return "unknown";
    const q = String(quality).trim().toUpperCase();
    if (type === "video") return q.replace("P", "p");
    if (type === "audio") return q.replace("KBPS", "kbps");
    return q.toLowerCase();
  }

  async request(link: string) {
    const form = new URLSearchParams();
    form.append("auth", this.auth);
    form.append("domain", this.domain);
    form.append("origin", this.origin);
    form.append("link", link);

    const res = await fetch(this.api, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });

    return res.json();
  }

  buildOutput(data: any) {
    const resources = data?.resources || [];
    const output: any = {
      title: data?.title,
      thumbnail: data?.thumbnail,
      duration: this.formatDuration(data?.duration),
      video: {},
      audio: {}
    };

    for (const item of resources) {
      const type = (item.type || "").toLowerCase();
      const quality = this.normalizeQuality(item.quality, type);

      const parsed = {
        quality,
        format: item.format,
        size: this.formatBytes(item.size),
        url: item.download_url
      };

      if (type === "video") output.video[quality] = parsed;
      if (type === "audio") output.audio[quality] = parsed;
    }

    return output;
  }

  async get(link: string) {
    const json: any = await this.request(link);
    const data = json?.data || json?.result?.data;
    return this.buildOutput(data);
  }

  async ytmp3(link: string, q = "128kbps") {
    const data = await this.get(link);
    return { ...data.audio[q], title: data.title };
  }

  async ytmp4(link: string, q = "720p") {
    const data = await this.get(link);
    return { ...data.video[q], title: data.title };
  }
}

// ==============================
// 🔍 CACHE
// ==============================
async function existsFile(id: string, ext: string) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/files/${id}.${ext}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function saveFile(id: string, ext: string, buffer: Buffer) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/files/${id}.${ext}`;
  try {
    await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `upload ${id}.${ext}`,
        content: buffer.toString("base64"),
        branch: BRANCH
      })
    });
  } catch (err) {
    console.error("Save file error:", err);
  }
}

const downloadBuffer = async (url: string) => {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
};

// ==============================
// 🚀 HANDLER
// ==============================
export default async function handler(req: Request | any, res: Response | any) {
  try {
    const query = req.query || {};
    const { url, format = "mp3", quality, mode, id, ext } = query as Record<string, string>;

    // 🔥 STREAM (ULTRA RÁPIDO)
    if (mode === "file") {
      const realId = decode(id);
      const fileUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/files/${realId}.${ext}`;

      const response = await fetch(fileUrl);
      if (!response.ok) {
        return res.status(404).send("Not found");
      }

      res.setHeader("Content-Type", ext === "mp3" ? "audio/mpeg" : "video/mp4");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

      const arrayBuf = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuf));
    }

    if (!url) return res.status(400).json({ ok: false });

    const q = quality || (format === "mp3" ? "128kbps" : "720p");
    const extension = format === "mp3" ? "mp3" : "mp4";
    const fileId = generateId(url, format, q);

    const cached = await existsFile(fileId, extension);
    if (cached) {
      return res.json({
        ok: true,
        cached: true,
        url: `/api/media?mode=file&id=${encode(fileId)}&ext=${extension}`
      });
    }

    const scraper = new VidsSaveScraper();
    const result =
      format === "mp4"
        ? await scraper.ytmp4(url, q)
        : await scraper.ytmp3(url, q);

    if (!result?.url) {
      return res.status(500).json({ ok: false, error: "Failed to parse media" });
    }

    const buffer = await downloadBuffer(result.url);
    await saveFile(fileId, extension, buffer);

    return res.json({
      ok: true,
      cached: false,
      url: `/api/media?mode=file&id=${encode(fileId)}&ext=${extension}`
    });

  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
