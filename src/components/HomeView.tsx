import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Search,
  Home as HomeIcon,
  Music2,
  Camera,
  Star,
  UserPlus,
  Users,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, Artist, UserProfile } from '../types';

interface HomeViewProps {
  tracks: Track[];
  recommendedTrack: Track | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onOpenPlayer: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Track[];
  artistResults: Artist[];
  isSearching: boolean;
  onSelectArtist: (artist: Artist) => void;
  favoriteTracks: Track[];
  onToggleFavorite: (track: Track) => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onCreateUser: (name: string, photoUrl?: string) => void;
  onUpdateUserPhoto: (photoUrl: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tracks,
  recommendedTrack,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onPlayTrack,
  onOpenPlayer,
  searchQuery,
  onSearchChange,
  searchResults,
  artistResults,
  isSearching,
  onSelectArtist,
  favoriteTracks,
  onToggleFavorite,
  currentUser,
  users,
  onSelectUser,
  onCreateUser,
  onUpdateUserPhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'favorites' | 'search'>('home');
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        if (res) onUpdateUserPhoto(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    onCreateUser(newUserName.trim());
    setNewUserName('');
    setShowUserModal(false);
  };

  const handleTabChange = (tab: 'home' | 'favorites' | 'search') => {
    setActiveTab(tab);
    if (tab === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeRec = recommendedTrack || tracks[0] || null;
  const isRecPlaying = currentTrack?.id === activeRec?.id && isPlaying;
  const isRecActive = currentTrack?.id === activeRec?.id;

  // Real timestamps for the Recommended Track
  const recCurrentTimeFormatted = isRecActive ? formatTime(currentTime) : '00:00';
  const recDurationFormatted =
    isRecActive && duration > 0
      ? formatTime(duration)
      : activeRec?.durationFormatted ||
        (activeRec?.duration ? formatTime(activeRec.duration) : '03:31');

  const recProgressPercent =
    isRecActive && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const isRecFavorite = Boolean(
    activeRec && favoriteTracks.some((t) => t.id === activeRec.id || t.title === activeRec.title)
  );

  // List of all trending hits (excluding currently featured recommended track)
  const trendingTracks = tracks.filter((t) => t.id !== activeRec?.id);

  // Filtered favorites if user searches while on favorites tab
  const displayedFavorites = searchQuery.trim()
    ? favoriteTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : favoriteTracks;

  return (
    <div className="relative w-full h-full min-h-screen bg-white text-zinc-950 flex font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] select-none overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════
          MAIN CONTENT AREA (Left & Center) with Diagonal Split
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 sm:pb-8 relative bg-white">
        
        {/* TOP DIAGONAL HERO SECTION (Vivid Artwork, Not Black) */}
        <div className="relative w-full min-h-[380px] sm:min-h-[440px] overflow-hidden">
          {/* Background Image with Diagonal Cut at Bottom */}
          <div
            className="absolute inset-0 z-0 bg-[#2b221a]"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 68%, 0 100%)',
            }}
          >
            {activeRec && (
              <img
                src={activeRec.coverUrl}
                alt={activeRec.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-90 scale-105 filter saturate-110 brightness-90 transition-all duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/50" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between h-full min-h-[340px] text-white">
            {/* Header: Recommended For You & Design By vintan with generous user badge gap (6-7) */}
            <div className="flex items-center justify-between pt-2 pr-6 sm:pr-8">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['SF_Pro_Display',sans-serif]">
                  Recommended For You
                </h2>
                <p className="text-xs text-white/80 font-black tracking-wide">
                  Design by vintan
                </p>
              </div>

              {/* Current Active User Badge (Spaced away by 6-7 margin/gap) */}
              <div className="ml-6 sm:ml-7 shrink-0">
                <button
                  onClick={() => setShowUserModal(true)}
                  className="flex items-center gap-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/25 transition-all text-xs font-black shadow-sm"
                  title="Cambiar usuario de favoritos"
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-white/40">
                    {currentUser.photoUrl ? (
                      <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-[9px] font-black">{currentUser.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="truncate max-w-[85px]">{currentUser.name}</span>
                </button>
              </div>
            </div>

            {/* Middle: Artist & Big Bold Title */}
            {activeRec && (
              <div className="flex flex-col gap-1.5 my-auto pt-6 pb-2">
                <span className="text-base sm:text-lg font-black text-white/90 tracking-wide font-['SF_Pro_Display',sans-serif]">
                  {activeRec.artist}
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] font-['SF_Pro_Display',sans-serif] max-w-md drop-shadow-md">
                  {activeRec.title}
                </h1>

                {/* Progress Bar with Real Dynamic Timestamps */}
                <div className="flex items-center gap-3 pt-4 max-w-xs sm:max-w-sm">
                  <span className="text-xs font-black text-white/90 tabular-nums">
                    {recCurrentTimeFormatted}
                  </span>
                  <div className="relative flex-1 flex items-center h-4">
                    <div className="w-full h-[3px] bg-white/35 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-100"
                        style={{ width: `${Math.max(4, recProgressPercent)}%` }}
                      />
                    </div>
                    {/* Circle Knob */}
                    <div
                      className="absolute -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      style={{ left: `${Math.max(4, recProgressPercent)}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-white/90 tabular-nums">
                    {recDurationFormatted}
                  </span>
                </div>

                {/* Controls: Round Play Button & White Heart */}
                <div className="flex items-center gap-5 pt-3">
                  {/* Play Button */}
                  <button
                    onClick={() => {
                      onPlayTrack(activeRec, tracks);
                      onOpenPlayer();
                    }}
                    className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-white hover:text-black transition-all active:scale-95 shadow-lg group"
                    aria-label="Reproducir recomendada"
                  >
                    {isRecPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Heart Button (Pure White) */}
                  <button
                    onClick={() => onToggleFavorite(activeRec)}
                    className="p-2 text-white hover:scale-110 active:scale-90 transition-all"
                    aria-label="Favorito"
                  >
                    <Heart
                      className="w-8 h-8 text-white transition-all"
                      fill={isRecFavorite ? '#ffffff' : 'none'}
                      strokeWidth={2.4}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SEARCH BAR DIRECTLY UNDER RECOMMENDED SONG */}
        <div className="px-5 sm:px-8 pt-3 pb-2 bg-white">
          <div className="relative w-full max-w-md mx-auto">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                activeTab === 'favorites'
                  ? `Buscar en favoritos de ${currentUser.name}`
                  : 'Search Music'
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#f1f3f5] text-zinc-950 placeholder-[#8f969d] text-sm font-black rounded-full py-3.5 pl-11 pr-10 outline-none focus:ring-2 focus:ring-zinc-400 transition-all font-['SF_Pro_Display',sans-serif] shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f969d] pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 p-1"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM WHITE SECTION: Trending Tracks OR Liked Songs OR Search Results */}
        <div className="flex-1 bg-white px-5 sm:px-8 pt-2 pb-6 flex flex-col justify-between">
          
          {/* Active Global Search Results */}
          {searchQuery.trim() && activeTab !== 'favorites' ? (
            <div className="w-full flex-1 z-20 py-2">
              <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-200 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black text-zinc-950 font-['SF_Pro_Display',sans-serif]">
                    Resultados para &quot;{searchQuery}&quot;
                  </h3>
                  <button
                    onClick={() => onSearchChange('')}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-black p-1"
                  >
                    Limpiar
                  </button>
                </div>

                {/* ANIMATED LOADING SPINNER (No raw debug text) */}
                {isSearching && (
                  <div className="py-10 flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 animate-bounce" />
                    </div>
                  </div>
                )}

                {/* Artists Results */}
                {artistResults.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                      Artistas
                    </span>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pt-2 pb-1">
                      {artistResults.map((artist) => (
                        <div
                          key={artist.id}
                          onClick={() => onSelectArtist(artist)}
                          className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
                        >
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-200 border-2 border-zinc-300 group-hover:scale-105 transition-all shadow-sm">
                            {artist.pictureUrl && (
                              <img
                                src={artist.pictureUrl}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span className="text-xs font-black text-zinc-900 max-w-[75px] truncate text-center">
                            {artist.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tracks Results */}
                <div className="flex flex-col gap-2">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => {
                        onPlayTrack(track, searchResults);
                        onOpenPlayer();
                      }}
                      className="flex items-center gap-3.5 p-3 hover:bg-zinc-200/70 rounded-2xl cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded-xl object-cover shadow-sm bg-zinc-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-zinc-950 truncate font-['SF_Pro_Display',sans-serif]">
                          {track.title}
                        </p>
                        <p className="text-xs text-zinc-600 font-black truncate font-['SF_Pro_Display',sans-serif] mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                      <span className="text-xs font-black text-zinc-500 tabular-nums font-['SF_Pro_Display',sans-serif]">
                        {track.durationFormatted || (track.duration ? formatTime(track.duration) : '03:30')}
                      </span>
                    </div>
                  ))}
                </div>

                {!isSearching && searchResults.length === 0 && artistResults.length === 0 && (
                  <p className="text-center text-zinc-500 text-sm py-6 font-black">No se encontraron resultados.</p>
                )}
              </div>
            </div>
          ) : activeTab === 'favorites' ? (
            /* ══════════════════════════════════════════════════════════════
               LIKED / FAVORITE SONGS VIEW
               ══════════════════════════════════════════════════════════════ */
            <div className="flex-1 flex flex-col gap-4 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                    <Music2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-950 font-['SF_Pro_Display',sans-serif] leading-tight">
                      Canciones de {currentUser.name}
                    </h3>
                    <p className="text-xs font-black text-zinc-500">
                      Favoritos guardados para este usuario
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                  {favoriteTracks.length} canciones
                </span>
              </div>

              {displayedFavorites.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2 bg-zinc-50 rounded-3xl border border-zinc-200 p-6">
                  <Star className="w-10 h-10 text-zinc-300" />
                  <p className="text-sm font-black text-zinc-800">
                    {searchQuery.trim()
                      ? 'No hay canciones que coincidan con la búsqueda'
                      : `Aún no tienes canciones favoritas para ${currentUser.name}`}
                  </p>
                  <p className="text-xs font-black text-zinc-500 max-w-xs">
                    Toca la estrella blanca en el reproductor para guardar tus canciones favoritas en este perfil.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {displayedFavorites.map((track) => {
                    const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                    const durationDisplay =
                      track.durationFormatted ||
                      (track.duration ? formatTime(track.duration) : '03:30');

                    return (
                      <motion.div
                        key={track.id}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          onPlayTrack(track, favoriteTracks);
                          onOpenPlayer();
                        }}
                        className="flex items-center gap-4 py-2 px-1 rounded-2xl cursor-pointer group hover:bg-zinc-100 transition-all"
                      >
                        <div className="relative w-15 h-15 shrink-0 rounded-2xl overflow-hidden shadow-md bg-zinc-200 border border-zinc-100">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-black text-[16px] text-zinc-950 truncate leading-tight font-['SF_Pro_Display',sans-serif]">
                            {track.title}
                          </h4>
                          <p className="text-[13px] font-black text-zinc-500 truncate leading-tight mt-1 font-['SF_Pro_Display',sans-serif]">
                            {track.artist}
                          </p>
                        </div>
                        <div className="text-right pr-2 flex items-center gap-3">
                          <span className="text-xs font-black text-zinc-600 tabular-nums font-['SF_Pro_Display',sans-serif]">
                            {durationDisplay}
                          </span>
                          <Star className="w-4 h-4 text-zinc-900 fill-zinc-900" />
                        </div>
                        {isThisPlaying && (
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 animate-pulse mr-1" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               STANDARD TRENDING SONGS LIST (All Real Covers & Accurate Durations)
               ══════════════════════════════════════════════════════════════ */
            <div className="flex flex-col gap-3.5 pt-1">
              {trendingTracks.map((track) => {
                const isThisPlaying = currentTrack?.id === track.id && isPlaying;
                const durationDisplay =
                  track.durationFormatted ||
                  (track.duration ? formatTime(track.duration) : '03:18');

                return (
                  <motion.div
                    key={track.id}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      onPlayTrack(track, tracks);
                      onOpenPlayer();
                    }}
                    className="flex items-center gap-4 py-2 px-1 rounded-2xl cursor-pointer group hover:bg-zinc-100 transition-all"
                  >
                    {/* Album Art with square frame & drop shadow */}
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 rounded-2xl overflow-hidden shadow-md bg-zinc-200 border border-zinc-100">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Title & Artist in SF Pro Bold */}
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="font-black text-[16px] sm:text-[17px] text-zinc-950 truncate leading-tight group-hover:text-black font-['SF_Pro_Display',sans-serif]">
                        {track.title}
                      </h3>
                      <p className="text-[13px] sm:text-[14px] font-black text-zinc-500 truncate leading-tight mt-1 font-['SF_Pro_Display',sans-serif]">
                        {track.artist}
                      </p>
                    </div>

                    {/* Accurate Real Duration in SF Pro Bold */}
                    <div className="text-right pr-2">
                      <span className="text-xs sm:text-sm font-black text-zinc-900 tabular-nums font-['SF_Pro_Display',sans-serif]">
                        {durationDisplay}
                      </span>
                    </div>

                    {/* Active pulse */}
                    {isThisPlaying && (
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 animate-pulse mr-1" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RIGHT VERTICAL SIDEBAR: Top Songs, Home, Favorites, Search, Avatar
         ══════════════════════════════════════════════════════════════ */}
      <aside className="w-16 sm:w-20 bg-white border-l border-zinc-100 flex flex-col justify-between items-center py-7 shrink-0 z-30 select-none">
        
        {/* Top: 'Top Songs' Vertical Text */}
        <div className="pt-4">
          <span className="rotate-90 origin-center block text-xs font-black tracking-wider text-zinc-950 uppercase whitespace-nowrap font-['SF_Pro_Display',sans-serif]">
            Top Songs
          </span>
        </div>

        {/* Center: Action Icons (Home, Music Note for Favorites, Search) */}
        <div className="flex flex-col items-center gap-7 py-6">
          {/* 1. Home Icon with bottom indicator dot */}
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'home' ? 'text-zinc-950 scale-105' : 'text-zinc-400 hover:text-zinc-900'
            }`}
            title="Inicio"
            aria-label="Home"
          >
            <HomeIcon className="w-6 h-6" strokeWidth={2.6} />
            {activeTab === 'home' && (
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            )}
          </button>

          {/* 2. Music Note Icon (Opens Liked / Favorite Songs of current user) */}
          <button
            onClick={() => handleTabChange('favorites')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'favorites' ? 'text-zinc-950 scale-105' : 'text-zinc-400 hover:text-zinc-900'
            }`}
            title={`Canciones favoritas de ${currentUser.name}`}
            aria-label="Canciones favoritas"
          >
            <Music2 className="w-6 h-6" strokeWidth={2.6} />
            {activeTab === 'favorites' && (
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            )}
          </button>

          {/* 3. Search Icon in the sidebar */}
          <button
            onClick={() => handleTabChange('search')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'search' ? 'text-zinc-950 scale-105' : 'text-zinc-400 hover:text-zinc-900'
            }`}
            title="Buscar música"
            aria-label="Buscar"
          >
            <Search className="w-6 h-6" strokeWidth={2.6} />
            {activeTab === 'search' && (
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            )}
          </button>
        </div>

        {/* Bottom: Circular Profile Avatar (Clickable to switch user or upload photo) */}
        <div className="pb-2 flex flex-col items-center gap-1">
          <div
            onClick={() => setShowUserModal(true)}
            className="relative group cursor-pointer"
            title={`Usuario: ${currentUser.name} (Toca para cambiar de usuario o foto)`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-900 bg-zinc-900 shadow-md flex items-center justify-center relative">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-950 flex items-center justify-center text-white text-xs font-black font-['SF_Pro_Display',sans-serif]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black text-zinc-600 max-w-[56px] truncate text-center">
            {currentUser.name}
          </span>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════
          USER PROFILE SWITCHER / CREATOR MODAL
         ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 text-zinc-950 font-['SF_Pro_Display',sans-serif]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-900" />
                  <h3 className="text-lg font-black text-zinc-950">Perfiles de Usuario</h3>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-1 rounded-full hover:bg-zinc-100 text-zinc-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs font-black text-zinc-500 mb-4">
                Cada usuario tiene su propia lista de canciones favoritas guardadas.
              </p>

              {/* User List */}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 mb-5">
                {users.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowUserModal(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center text-xs font-black shrink-0">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{user.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-black text-sm">{user.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  );
                })}
              </div>

              {/* Upload photo for current user */}
              <div className="mb-4 pt-2 border-t border-zinc-100">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-black transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Subir foto para {currentUser.name}</span>
                </button>
              </div>

              {/* Create new profile form */}
              <form onSubmit={handleCreateNewUser} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de nuevo usuario"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="flex-1 bg-[#f1f3f5] text-zinc-900 placeholder-zinc-400 text-xs font-black rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!newUserName.trim()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50 text-xs font-black transition-all shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
