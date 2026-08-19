import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

import topSongsHandler from "./api/top-songs";
import searchHandler from "./api/search";
import searchArtistsHandler from "./api/search-artists";
import artistTracksHandler from "./api/artist-tracks";
import lyricsHandler from "./api/lyrics";
import streamHandler from "./api/stream";
import mediaHandler from "./api/media";
import ytAudioHandler from "./api/yt-audio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.all("/api/top-songs", topSongsHandler);
  app.all("/api/search", searchHandler);
  app.all("/api/search-artists", searchArtistsHandler);
  app.all("/api/artist-tracks", artistTracksHandler);
  app.all("/api/lyrics", lyricsHandler);
  app.all("/api/stream", streamHandler);
  app.all("/api/media", mediaHandler);
  app.all("/api/yt-audio", ytAudioHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
