import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Track } from '../types';

interface LiquidBackgroundProps {
  currentTrack: Track | null;
}

interface PaletteTheme {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  base: string;
}

// Preset dynamic Apple Music color atmospheres
const PRESET_PALETTES: Record<string, PaletteTheme> = {
  understand: {
    c1: 'rgba(235, 30, 75, 0.85)',
    c2: 'rgba(180, 20, 60, 0.8)',
    c3: 'rgba(110, 15, 45, 0.9)',
    c4: 'rgba(255, 100, 130, 0.65)',
    base: '#1a040b',
  },
  keshi: {
    c1: 'rgba(225, 29, 72, 0.85)',
    c2: 'rgba(159, 18, 57, 0.8)',
    c3: 'rgba(88, 28, 135, 0.9)',
    c4: 'rgba(251, 113, 133, 0.6)',
    base: '#18030b',
  },
  golden: {
    c1: 'rgba(245, 158, 11, 0.85)',
    c2: 'rgba(217, 119, 6, 0.8)',
    c3: 'rgba(146, 64, 14, 0.9)',
    c4: 'rgba(253, 224, 71, 0.6)',
    base: '#190e02',
  },
  hindia: {
    c1: 'rgba(239, 68, 68, 0.85)',
    c2: 'rgba(185, 28, 28, 0.8)',
    c3: 'rgba(69, 10, 10, 0.9)',
    c4: 'rgba(248, 113, 113, 0.6)',
    base: '#140303',
  },
  coastline: {
    c1: 'rgba(56, 189, 248, 0.8)',
    c2: 'rgba(14, 165, 233, 0.75)',
    c3: 'rgba(3, 105, 161, 0.85)',
    c4: 'rgba(186, 230, 253, 0.6)',
    base: '#031726',
  },
  weeknd: {
    c1: 'rgba(220, 38, 38, 0.85)',
    c2: 'rgba(153, 27, 27, 0.8)',
    c3: 'rgba(69, 10, 10, 0.92)',
    c4: 'rgba(252, 165, 165, 0.55)',
    base: '#160404',
  },
};

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({ currentTrack }) => {
  const [extractedTheme, setExtractedTheme] = useState<PaletteTheme | null>(null);

  // Dynamic color extraction from album cover image
  useEffect(() => {
    if (!currentTrack?.coverUrl) return;

    const key = Object.keys(PRESET_PALETTES).find(
      (k) =>
        currentTrack.title.toLowerCase().includes(k) ||
        currentTrack.artist.toLowerCase().includes(k)
    );

    if (key) {
      setExtractedTheme(PRESET_PALETTES[key]);
      return;
    }

    // Canvas extraction fallback
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentTrack.coverUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;

        const r1 = data[0], g1 = data[1], b1 = data[2];
        const r2 = data[128 * 4], g2 = data[128 * 4 + 1], b2 = data[128 * 4 + 2];
        const r3 = data[240 * 4], g3 = data[240 * 4 + 1], b3 = data[240 * 4 + 2];

        setExtractedTheme({
          c1: `rgba(${r1}, ${g1}, ${b1}, 0.85)`,
          c2: `rgba(${r2}, ${g2}, ${b2}, 0.8)`,
          c3: `rgba(${Math.floor(r3 * 0.4)}, ${Math.floor(g3 * 0.4)}, ${Math.floor(b3 * 0.4)}, 0.9)`,
          c4: `rgba(${Math.min(255, r1 + 60)}, ${Math.min(255, g1 + 60)}, ${Math.min(255, b1 + 60)}, 0.65)`,
          base: `rgb(${Math.floor(r3 * 0.12)}, ${Math.floor(g3 * 0.12)}, ${Math.floor(b3 * 0.12)})`,
        });
      } catch {
        setExtractedTheme(null);
      }
    };
  }, [currentTrack?.coverUrl, currentTrack?.title, currentTrack?.artist]);

  // Deterministic fallback theme if image extraction fails
  const theme = useMemo(() => {
    if (extractedTheme) return extractedTheme;

    if (!currentTrack) {
      return {
        c1: 'rgba(225, 29, 72, 0.85)',
        c2: 'rgba(159, 18, 57, 0.8)',
        c3: 'rgba(88, 28, 135, 0.9)',
        c4: 'rgba(251, 113, 133, 0.6)',
        base: '#17030a',
      };
    }

    const hash = (currentTrack.title + currentTrack.artist)
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    const hue2 = (hue + 40) % 360;
    const hue3 = (hue + 110) % 360;
    const hue4 = (hue + 170) % 360;

    return {
      c1: `hsla(${hue}, 85%, 46%, 0.85)`,
      c2: `hsla(${hue2}, 85%, 36%, 0.8)`,
      c3: `hsla(${hue3}, 90%, 18%, 0.92)`,
      c4: `hsla(${hue4}, 80%, 65%, 0.65)`,
      base: `hsl(${hue}, 45%, 5%)`,
    };
  }, [extractedTheme, currentTrack?.title, currentTrack?.artist]);

  return (
    <div
      id="liquid-background"
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none transition-colors duration-1000"
      style={{ backgroundColor: theme.base }}
    >
      {/* 1. REAL ALBUM COVER ANIMATED FLUID BACKDROP */}
      {currentTrack?.coverUrl && (
        <motion.div
          animate={{
            scale: [1.15, 1.35, 1.18, 1.32, 1.15],
            rotate: [0, 8, -6, 5, 0],
            x: [0, 25, -25, 15, 0],
            y: [0, -30, 25, -15, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-[-35%] w-[170%] h-[170%] bg-cover bg-center blur-[90px] opacity-75 saturate-200"
          style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
        />
      )}

      {/* 2. Primary Fluid Orb 1 (Top Left) */}
      <motion.div
        animate={{
          x: [0, 70, -60, 40, 0],
          y: [0, -80, 60, -45, 0],
          scale: [1, 1.35, 0.9, 1.25, 1],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-[25%] -left-[15%] w-[110vw] h-[110vw] max-w-[1100px] max-h-[1100px] rounded-full blur-[90px] opacity-90"
        style={{
          background: `radial-gradient(circle, ${theme.c1} 0%, transparent 70%)`,
        }}
      />

      {/* 3. Fluid Orb 2 (Center Right) */}
      <motion.div
        animate={{
          x: [0, -90, 50, -70, 0],
          y: [0, 70, -80, 45, 0],
          scale: [1.1, 0.85, 1.4, 1.05, 1.1],
          rotate: [360, 270, 180, 90, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[18%] -right-[20%] w-[100vw] h-[100vw] max-w-[1000px] max-h-[1000px] rounded-full blur-[95px] opacity-85"
        style={{
          background: `radial-gradient(circle, ${theme.c2} 0%, transparent 70%)`,
        }}
      />

      {/* 4. Fluid Orb 3 (Bottom Left Depth) */}
      <motion.div
        animate={{
          x: [0, 80, -50, 60, 0],
          y: [0, -60, 70, -35, 0],
          scale: [0.95, 1.3, 0.85, 1.25, 0.95],
          rotate: [0, 120, 240, 360],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-[25%] left-[5%] w-[110vw] h-[110vw] max-w-[1100px] max-h-[1100px] rounded-full blur-[95px] opacity-80"
        style={{
          background: `radial-gradient(circle, ${theme.c3} 0%, transparent 70%)`,
        }}
      />

      {/* 5. Fluid Highlight Center Bloom */}
      <motion.div
        animate={{
          x: [0, -40, 50, -25, 0],
          y: [0, 35, -45, 50, 0],
          scale: [1, 1.25, 0.85, 1.3, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[12%] left-[20%] w-[75vw] h-[75vw] max-w-[750px] max-h-[750px] rounded-full blur-[75px] opacity-70"
        style={{
          background: `radial-gradient(circle, ${theme.c4} 0%, transparent 65%)`,
        }}
      />

      {/* 6. Soft Apple Music Darkening Tint for maximum text contrast */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[6px]" />
    </div>
  );
};
