import React, { useState } from 'react';
import { MoreHorizontal, Check, Heart, Share2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, ViewMode } from '../types';

interface PlayerHeaderProps {
  currentTrack: Track;
  viewMode: ViewMode;
  onClose: () => void;
  onToggleViewMode?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  currentTrack,
  viewMode,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: currentTrack.title,
          text: `Escuchando ${currentTrack.title} de ${currentTrack.artist}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${currentTrack.title} - ${currentTrack.artist}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  if (viewMode === 'album') {
    // Album View Top Grab Bar (Exact to iOS Apple Music image)
    return (
      <div className="relative z-20 w-full pt-3 pb-1 flex flex-col items-center justify-center select-none">
        <button
          onClick={onClose}
          className="w-12 h-5 flex items-center justify-center group cursor-pointer"
          aria-label="Cerrar reproductor"
        >
          <div className="w-9 h-1.5 bg-white/35 group-hover:bg-white/60 rounded-full transition-colors" />
        </button>
      </div>
    );
  }

  // Lyrics View Header (Exact to User's Uploaded iOS Screenshot)
  return (
    <div className="relative z-20 flex flex-col w-full px-6 sm:px-10 pt-2 pb-1 select-none">
      {/* Top Center Grab Bar */}
      <div className="w-full flex items-center justify-center pb-2.5">
        <button
          onClick={onClose}
          className="w-12 h-4 flex items-center justify-center group cursor-pointer"
          aria-label="Minimizar"
        >
          <div className="w-10 h-1.5 bg-white/35 group-hover:bg-white/60 rounded-full transition-colors" />
        </button>
      </div>

      {/* Track Artwork, Large Title & Artist, and Options Button */}
      <div className="flex items-center justify-between w-full">
        {/* Left: Generous Album Artwork & Info */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1 pr-3">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            referrerPolicy="no-referrer"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-[0_4px_16px_rgba(0,0,0,0.5)] shrink-0 border border-white/10"
          />
          <div className="min-w-0 flex flex-col text-left">
            <span className="font-extrabold text-[17px] sm:text-[20px] text-white truncate leading-tight tracking-tight">
              {currentTrack.title}
            </span>
            <span className="text-[14px] sm:text-[16px] text-white/70 font-semibold truncate leading-tight mt-0.5">
              {currentTrack.artist}
            </span>
          </div>
        </div>

        {/* Right: Options Button & Star */}
        <div className="flex items-center gap-2 relative shrink-0">
          {/* Favorite Star Button (White when active) */}
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`w-10 h-10 rounded-full backdrop-blur-md transition-all flex items-center justify-center active:scale-90 ${
                isFavorite
                  ? 'bg-white/30 text-white shadow-[0_0_14px_rgba(255,255,255,0.6)] ring-1 ring-white/50'
                  : 'bg-white/15 hover:bg-white/25 text-white/70 hover:text-white'
              }`}
              aria-label="Favorito"
            >
              <Star
                className="w-4 h-4"
                fill={isFavorite ? '#ffffff' : 'none'}
                color="#ffffff"
                strokeWidth={isFavorite ? 0 : 2}
              />
            </button>
          )}

          <button
            id="player-options-btn"
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white/90 hover:text-white backdrop-blur-md"
            aria-label="Más opciones"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Options Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
                className="absolute right-0 top-12 w-52 py-1.5 bg-zinc-900/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl z-50 flex flex-col text-sm text-white overflow-hidden"
              >
                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 hover:bg-white/10 text-left transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 opacity-70" />
                    <span>Compartir canción</span>
                  </div>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                </button>
                {onToggleFavorite && (
                  <button
                    onClick={() => {
                      onToggleFavorite();
                      setShowMenu(false);
                    }}
                    className="px-4 py-2.5 hover:bg-white/10 text-left transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className={`w-4 h-4 ${isFavorite ? 'text-rose-400 fill-rose-400' : 'opacity-70'}`} />
                      <span>{isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}</span>
                    </div>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
