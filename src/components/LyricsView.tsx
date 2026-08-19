import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
        introEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
      return;
    }

    if (activeLyricIndex >= 0) {
      const targetElement = document.getElementById(`lyric-line-${activeLyricIndex}`);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeLyricIndex, isSynced, isIntroInstrumental]);

  return (
    <div
      id="lyrics-scroll-container"
      className="relative flex-1 w-full h-full overflow-hidden mask-image-fade font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]"
    >
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto no-scrollbar px-6 sm:px-12 md:px-20 py-[26vh] sm:py-[30vh] flex flex-col gap-7 sm:gap-9 select-none"
      >
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/70 animate-bounce" />
            </div>
          </div>
        )}

        {/* Single Musical Note for Instrumental Intro */}
        {isSynced && firstLyricTime > 0 && (
          <motion.div
            id="instrumental-note-intro"
            layout="position"
            className="flex items-center py-2"
            animate={{
              opacity: isIntroInstrumental ? 1 : 0.15,
              filter: isIntroInstrumental ? 'blur(0px)' : 'blur(4px)',
            }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              animate={
                isIntroInstrumental
                  ? {
                      opacity: [0.3, 1, 0.3],
                    }
                  : { opacity: 0.15 }
              }
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-white flex items-center justify-center cursor-default"
            >
              <Music2 className="w-11 h-11 sm:w-12 sm:h-12" strokeWidth={2.6} />
            </motion.div>
          </motion.div>
        )}

        {/* Lyrics Lines with Apple Music Optics & Depth-of-Field Blur from Video */}
        {lyrics.map((line, index) => {
          const isActive = isSynced && index === activeLyricIndex;
          const dist = isSynced && activeLyricIndex >= 0 ? Math.abs(index - activeLyricIndex) : 1;

          let blurValue = 0;
          let opacityValue = 1;
          let scaleValue = 1;

          if (isSynced) {
            if (isActive) {
              blurValue = 0;
              opacityValue = 1;
              scaleValue = 1.03;
            } else if (dist === 1) {
              blurValue = 1.5;
              opacityValue = 0.32;
              scaleValue = 0.98;
            } else if (dist === 2) {
              blurValue = 3;
              opacityValue = 0.18;
              scaleValue = 0.96;
            } else {
              blurValue = 4.5;
              opacityValue = 0.08;
              scaleValue = 0.93;
            }
          } else {
            opacityValue = 0.8;
          }

          return (
            <motion.div
              key={`${index}-${line.time}`}
              id={`lyric-line-${index}`}
              onClick={() => onSeek(line.time)}
              layout="position"
              transition={{
                layout: { type: 'spring', damping: 26, stiffness: 200 },
                opacity: { duration: 0.35, ease: 'easeOut' },
                filter: { duration: 0.35, ease: 'easeOut' },
                scale: { duration: 0.35, ease: 'easeOut' },
              }}
              style={{
                filter: `blur(${blurValue}px)`,
                opacity: opacityValue,
                transform: `scale(${scaleValue})`,
                transformOrigin: 'left center',
              }}
              className={`group transition-all duration-300 ease-out cursor-pointer text-left w-full max-w-2xl py-1 ${
                isActive
                  ? 'text-white font-black'
                  : 'text-white/80 font-black hover:!opacity-90 hover:!filter-none'
              }`}
            >
              <p
                className={`text-[32px] sm:text-[40px] md:text-[48px] leading-[1.18] tracking-tight font-black transition-colors duration-300 font-['SF_Pro_Display',sans-serif] ${
                  isActive ? 'text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]' : 'text-white/70'
                }`}
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
