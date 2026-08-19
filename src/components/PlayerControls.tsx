import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Airplay,
  List,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ViewMode } from '../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  viewMode: ViewMode;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleLyrics: () => void;
  onOpenAirplay: () => void;
  onOpenQueue: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

// Exact Apple Music Quotes/Lyrics Icon (Speech Bubble with quotation marks)
export const AppleQuotesIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.5 4A2.5 2.5 0 002 6.5v10A2.5 2.5 0 004.5 19h2.25v2.25a.75.75 0 001.28.53L11.56 19h7.94a2.5 2.5 0 002.5-2.5v-10A2.5 2.5 0 0019.5 4h-15zm4.75 6.75c0 .966-.784 1.75-1.75 1.75h-.5v.5a.75.75 0 01-1.5 0v-2.25c0-1.519 1.231-2.75 2.75-2.75h.5a.75.75 0 01.75.75v1.25a.75.75 0 01-.75.75h-.5c-.138 0-.25.112-.25.25v.5h.75c.966 0 1.75.784 1.75 1.75zm6.5 0c0 .966-.784 1.75-1.75 1.75h-.5v.5a.75.75 0 01-1.5 0v-2.25c0-1.519 1.231-2.75 2.75-2.75h.5a.75.75 0 01.75.75v1.25a.75.75 0 01-.75.75h-.5c-.138 0-.25.112-.25.25v.5h.75c.966 0 1.75.784 1.75 1.75z"
    />
  </svg>
);

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  viewMode,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleLyrics,
  onOpenAirplay,
  onOpenQueue,
  audioRef,
}) => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume || 0.8);
    } else {
      if (audioRef.current) audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const remainingTime = Math.max(0, duration - currentTime);

  return (
    <div
      id="player-controls-container"
      className="relative z-30 w-full max-w-md sm:max-w-lg mx-auto px-6 sm:px-8 pb-8 pt-1 flex flex-col gap-4 select-none"
    >
      {/* 1. Progress Scrub Bar & Timestamps */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="relative flex items-center h-4 group cursor-pointer">
          <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden transition-all backdrop-blur-sm">
            <div
              className="h-full bg-white rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            id="audio-scrub-slider"
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek track position"
          />
        </div>

        {/* Timestamps */}
        <div className="flex justify-between items-center px-0.5">
          <span className="text-xs md:text-sm font-medium text-zinc-400 w-10 tabular-nums font-['SF_Pro_Display',sans-serif]">
            {formatTime(currentTime)}
          </span>

          <span className="text-xs md:text-sm font-medium text-zinc-400 w-10 tabular-nums text-right font-['SF_Pro_Display',sans-serif]">
            -{formatTime(duration - currentTime)}
          </span>
        </div>
      </div>

      {/* 2. Main Transport Controls (<<, ❚❚ / ▶, >>) */}
      <div className="flex items-center justify-center gap-12 sm:gap-16 py-1">
        {/* Skip Back */}
        <button
          id="skip-prev-btn"
          onClick={onPrev}
          className="text-white/90 hover:text-white hover:scale-110 active:scale-90 transition-all p-2"
          aria-label="Previous Track"
        >
          <SkipBack className="w-9 h-9 sm:w-10 sm:h-10 fill-current" />
        </button>

        {/* Play / Pause */}
        <button
          id="play-pause-btn"
          onClick={onTogglePlay}
          className="text-white hover:scale-105 active:scale-95 transition-all p-2 flex items-center justify-center"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <motion.div
            key={isPlaying ? 'pause' : 'play'}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 sm:w-14 sm:h-14 fill-current" />
            ) : (
              <Play className="w-12 h-12 sm:w-14 sm:h-14 fill-current translate-x-1" />
            )}
          </motion.div>
        </button>

        {/* Skip Forward */}
        <button
          id="skip-next-btn"
          onClick={onNext}
          className="text-white/90 hover:text-white hover:scale-110 active:scale-90 transition-all p-2"
          aria-label="Next Track"
        >
          <SkipForward className="w-9 h-9 sm:w-10 sm:h-10 fill-current" />
        </button>
      </div>

      {/* 3. Bottom Volume Slider */}
      <div className="flex items-center gap-3 px-2 mt-1">
        <button
          onClick={toggleMute}
          className="text-white/40 hover:text-white transition-colors p-1"
          aria-label="Mute / Unmute"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume1 className="w-4 h-4" />
          )}
        </button>
        <div className="relative flex-1 flex items-center h-3 group cursor-pointer">
          <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden transition-all">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
          </div>
          <input
            id="volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Volume Slider"
          />
        </div>
        <button
          onClick={() => handleVolumeChange(1)}
          className="text-white/40 hover:text-white transition-colors p-1"
          aria-label="Max Volume"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Bottom 3 Apple Music Icons (Quotes / Lyrics, Airplay, Queue) */}
      <div className="flex items-center justify-between px-6 pt-2">
        {/* 1. Botón de Comillas (Lyrics Toggle) */}
        <button
          id="apple-music-lyrics-quote-btn"
          onClick={onToggleLyrics}
          className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center ${
            viewMode === 'lyrics'
              ? 'bg-white/25 text-white shadow-lg backdrop-blur-md ring-1 ring-white/20'
              : 'text-white/40 hover:text-white hover:bg-white/10'
          }`}
          title="Ver letras sincronizadas"
          aria-label="Toggle Lyrics View"
        >
          <AppleQuotesIcon className="w-5 h-5" />
        </button>

        {/* 2. Airplay Button */}
        <button
          id="apple-music-airplay-btn"
          onClick={onOpenAirplay}
          className="p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 flex items-center justify-center"
          title="Dispositivos de audio"
          aria-label="AirPlay Devices"
        >
          <Airplay className="w-5 h-5" />
        </button>

        {/* 3. Queue List Button */}
        <button
          id="apple-music-queue-btn"
          onClick={onOpenQueue}
          className="p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 flex items-center justify-center"
          title="A continuación"
          aria-label="Queue list"
        >
          <List className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
