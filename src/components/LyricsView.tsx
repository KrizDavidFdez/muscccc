import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music2 } from 'lucide-react';
import { LyricLine } from '../types';

interface LyricsViewProps {
  lyrics: LyricLine[];
  currentTime: number;
  isSynced: boolean;
  activeLyricIndex: number;
  onSeek: (time: number) => void;
  isLoading?: boolean;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lyrics,
  currentTime,
  isSynced,
  activeLyricIndex,
  onSeek,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const firstLyricTime = lyrics[0]?.time ?? 0;
  const isIntroInstrumental = isSynced && lyrics.length > 0 && currentTime < firstLyricTime;

  // Ultra smooth centered auto-scroll on active lyric change
  useEffect(() => {
    if (!isSynced) return;

    if (isIntroInstrumental) {
      const introEl = document.getElementById('instrumental-note-intro');
      if (introEl) {
        introEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (activeLyricIndex >= 0) {
      const targetElement = document.getElementById(`lyric-line-${activeLyricIndex}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex, isSynced, isIntroInstrumental]);

  return (
    <div
      id="lyrics-scroll-container"
      className="relative flex-1 w-full h-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1a0505 0%, #3d0a0a 40%, #2a0606 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        // Fade mask: top fades in, bottom fades out — matching the video's vignette
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 68%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 68%, transparent 100%)',
      }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto px-6 sm:px-10 md:px-14 flex flex-col gap-8 sm:gap-10 select-none"
        style={{
          paddingTop: '28vh',
          paddingBottom: '38vh',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Hide scrollbar webkit */}
        <style>{`#lyrics-scroll-container ::-webkit-scrollbar { display: none; }`}</style>

        {/* Loading dots */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-white/60"
                  style={{
                    animation: `bounce 1.2s ease-in-out infinite`,
                    animationDelay: `${i * -0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Instrumental intro note */}
        {isSynced && firstLyricTime > 0 && (
          <motion.div
            id="instrumental-note-intro"
            layout="position"
            className="flex items-start py-1"
            animate={{
              opacity: isIntroInstrumental ? 1 : 0.08,
              filter: isIntroInstrumental ? 'blur(0px)' : 'blur(5px)',
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div
              animate={
                isIntroInstrumental
                  ? { opacity: [0.4, 1, 0.4] }
                  : { opacity: 0.08 }
              }
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-white"
            >
              <Music2 className="w-11 h-11 sm:w-12 sm:h-12" strokeWidth={2.4} />
            </motion.div>
          </motion.div>
        )}

        {/* Lyrics lines — video-accurate depth-of-field system */}
        {lyrics.map((line, index) => {
          const isActive = isSynced && index === activeLyricIndex;
          // Signed distance: negative = above active, positive = below active
          const dist = isSynced && activeLyricIndex >= 0
            ? index - activeLyricIndex
            : 99;

          // ── Visual parameters matching the video ──────────────────────────
          // The video shows:
          //   Active (dist=0):  full white, no blur, large bold
          //   Above -1 (dist=-1): moderate blur, ~30% opacity, slightly smaller
          //   Above -2+:         heavy blur, ~10% opacity
          //   Below +1 (dist=1): mild blur, ~45% opacity (more readable than above)
          //   Below +2 (dist=2): moderate blur, ~25% opacity
          //   Below +3+:         heavy blur, ~8% opacity

          let blurValue = 0;
          let opacityValue = 1;
          let scaleValue = 1;
          let colorValue = 'rgba(255,255,255,1)';

          if (isSynced) {
            if (isActive) {
              // Crisp, full white, slight upscale — exactly as in video
              blurValue = 0;
              opacityValue = 1;
              scaleValue = 1.02;
              colorValue = 'rgba(255,255,255,1)';
            } else if (dist === -1) {
              // One line above: already fading out as it scrolls up
              blurValue = 2;
              opacityValue = 0.28;
              scaleValue = 0.97;
              colorValue = 'rgba(255,255,255,0.28)';
            } else if (dist === 1) {
              // One line below: still somewhat readable — preview of next line
              blurValue = 1.5;
              opacityValue = 0.42;
              scaleValue = 0.98;
              colorValue = 'rgba(255,255,255,0.42)';
            } else if (dist === 2) {
              // Two below: notably softer
              blurValue = 3;
              opacityValue = 0.22;
              scaleValue = 0.96;
              colorValue = 'rgba(255,255,255,0.22)';
            } else if (dist === 3) {
              // Three below or two above
              blurValue = 4.5;
              opacityValue = 0.10;
              scaleValue = 0.94;
              colorValue = 'rgba(255,255,255,0.10)';
            } else {
              // Far away lines — nearly invisible, heavy blur
              blurValue = 6;
              opacityValue = 0.05;
              scaleValue = 0.92;
              colorValue = 'rgba(255,255,255,0.05)';
            }
          } else {
            // Unsynced mode: uniform readable style
            opacityValue = 0.75;
            colorValue = 'rgba(255,255,255,0.75)';
          }

          return (
            <motion.div
              key={`${index}-${line.time}`}
              id={`lyric-line-${index}`}
              onClick={() => onSeek(line.time)}
              layout="position"
              animate={{
                filter: `blur(${blurValue}px)`,
                opacity: opacityValue,
                scale: scaleValue,
              }}
              transition={{
                layout: { type: 'spring', damping: 28, stiffness: 210 },
                filter: { duration: 0.38, ease: 'easeOut' },
                opacity: { duration: 0.38, ease: 'easeOut' },
                scale: { duration: 0.38, ease: 'easeOut' },
              }}
              style={{
                transformOrigin: 'left center',
                color: colorValue,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                maxWidth: '640px',
              }}
              className="group"
            >
              <p
                style={{
                  fontSize: 'clamp(28px, 6vw, 48px)',
                  lineHeight: 1.18,
                  letterSpacing: '-0.02em',
                  fontWeight: 900,
                  // Glow on active line — same halo visible in the video
                  textShadow: isActive
                    ? '0 0 40px rgba(255,255,255,0.25), 0 2px 10px rgba(255,255,255,0.15)'
                    : 'none',
                  transition: 'text-shadow 0.4s ease',
                  // Hover lifts non-active lines slightly
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                {line.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
