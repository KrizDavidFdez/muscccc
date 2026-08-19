import React, { useState } from 'react';
import { Star, MoreHorizontal, Check, Heart, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types';

interface AlbumViewProps {
  currentTrack: Track;
  isPlaying: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const AlbumView: React.FC<AlbumViewProps> = ({
  currentTrack,
  isPlaying,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('track', currentTrack.id);
    url.searchParams.set('title', currentTrack.title);
    url.searchParams.set('artist', currentTrack.artist);
    return url.toString();
  };

  const handleShare = () => {
    const shareUrl = getShareUrl();
    if (navigator.share) {
      navigator
        .share({
          title: currentTrack.title,
          text: `Escucha ${currentTrack.title} de ${currentTrack.artist}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  return (
    <div
      id="album-view-stage"
      className="flex-1 flex flex-col justify-center max-w-md sm:max-w-lg mx-auto w-full px-6 sm:px-8 py-2 select-none font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]"
    >
      {/* 1. Big Album Artwork (Exact to iOS Apple Music image) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{
          opacity: 1,
          scale: isPlaying ? 1 : 0.92,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full aspect-square max-h-[44vh] sm:max-h-[48vh] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-zinc-900 mx-auto"
      >
        <img
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* 2. Track Title, Artist, Pure White Star, More Options (Matching Screenshot) */}
      <div className="flex items-center justify-between mt-7 sm:mt-9 mb-1">
        <div className="min-w-0 flex-1 pr-4">
          <h2 className="text-[22px] sm:text-[25px] font-bold text-white tracking-tight truncate leading-[1.2] font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]">
            {currentTrack.title}
          </h2>
          <p className="text-[18px] sm:text-[20px] text-white/90 font-medium tracking-tight truncate mt-1 leading-[1.2] font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]">
            {currentTrack.artist}
          </p>
        </div>

        <div className="flex items-center gap-3 relative shrink-0">
          {/* Favorite Star Button (Pure White when active) */}
          {onToggleFavorite && (
            <button
              id="album-star-btn"
              onClick={onToggleFavorite}
              className={`w-10 h-10 rounded-full transition-all flex items-center justify-center active:scale-90 ${
                isFavorite
                  ? 'bg-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.7)] ring-1 ring-white/60'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
              aria-label="Favorito"
            >
              <Star
                className="w-5 h-5"
                fill={isFavorite ? '#ffffff' : 'none'}
                color="#ffffff"
                strokeWidth={isFavorite ? 0 : 2}
              />
            </button>
          )}

          {/* More Options Button */}
          <button
            id="album-more-btn"
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all flex items-center justify-center active:scale-90"
            aria-label="Más opciones"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute right-0 bottom-12 w-52 py-1.5 bg-zinc-900/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl z-50 flex flex-col text-sm text-white overflow-hidden"
              >
                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 hover:bg-white/10 text-left transition-colors flex items-center gap-2.5 font-bold"
                >
                  <Share2 className="w-4 h-4 opacity-70" />
                  <span>Compartir canción</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" /> : null}
                </button>
                {onToggleFavorite && (
                  <button
                    onClick={() => {
                      onToggleFavorite();
                      setShowMenu(false);
                    }}
                    className="px-4 py-2.5 hover:bg-white/10 text-left transition-colors flex items-center gap-2.5 font-bold"
                  >
                    <Heart
                      className={`w-4 h-4 ${isFavorite ? 'text-rose-400 fill-rose-400' : 'opacity-70'}`}
                    />
                    <span>{isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}</span>
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
