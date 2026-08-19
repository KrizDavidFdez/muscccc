import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, Artist, LyricLine, ViewMode, UserProfile } from './types';
import { fetchLyricsFromDB } from './lib/lyrics';
import { LiquidBackground } from './components/LiquidBackground';
import { PlayerHeader } from './components/PlayerHeader';
import { LyricsView } from './components/LyricsView';
import { AlbumView } from './components/AlbumView';
import { PlayerControls } from './components/PlayerControls';
import { AirplayModal } from './components/AirplayModal';
import { QueueModal } from './components/QueueModal';
import { HomeView } from './components/HomeView';

// Curated Top Trending Global Hits with official covers and real durations
const TRENDING_TRACKS: Track[] = [
  {
    id: 'understand-keshi',
    title: 'UNDERSTAND',
    artist: 'keshi',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/b461aa78a8bc84df58d447a16e78dbf8/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 211,
    durationFormatted: '03:31',
  },
  {
    id: 'less-of-you-keshi',
    title: 'Less of you',
    artist: 'keshi',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/9079f97ff1dd1f5c6c21eec465384dfa/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 147,
    durationFormatted: '02:27',
  },
  {
    id: 'golden-huntrx',
    title: 'Golden',
    artist: 'HUNTR/X',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/8f8b8cf47aeeb46a5c13b7b3beff9a7c/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 198,
    durationFormatted: '03:18',
  },
  {
    id: 'untuk-apa-hindia',
    title: 'Untuk apa / untuk apa?',
    artist: 'Hindia',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/8c34f2d718b5b54a260907cae49755f1/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 258,
    durationFormatted: '04:18',
  },
  {
    id: 'coastline-hollow-coves',
    title: 'Coastline',
    artist: 'Hollow Coves',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/15233630f9a2632fe92015df30873ea2/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 235,
    durationFormatted: '03:55',
  },
  {
    id: 'well-be-okay-arash-buana',
    title: "We'll be okay, for today",
    artist: 'Arash Buana',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/4243a75f850d99ef87b0a7dd8ec40ce9/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 174,
    durationFormatted: '02:54',
  },
  {
    id: 'sanctuary-joji',
    title: 'Sanctuary',
    artist: 'Joji',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/1ae9cfebdc2fc7d71aa13049b1ff5345/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 180,
    durationFormatted: '03:00',
  },
  {
    id: 'i-was-never-there-the-weeknd',
    title: 'I Was Never There',
    artist: 'The Weeknd',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/ecff773b06bc9876aa964f434df89e13/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 241,
    durationFormatted: '04:01',
  },
  {
    id: 'stargazing-myles-smith',
    title: 'Stargazing',
    artist: 'Myles Smith',
    coverUrl: 'https://e-cdns-images.dzcdn.net/images/cover/ea81373507d35ce46369c0d12e6802e8/500x500-000000-80-0-0.jpg',
    audioUrl: '',
    duration: 172,
    durationFormatted: '02:52',
  },
];

const DEFAULT_USERS: UserProfile[] = [
  { id: 'user-1', name: 'Usuario 1', photoUrl: '' },
  { id: 'user-2', name: 'Usuario 2', photoUrl: '' },
];

export default function App() {
  // Multi-User Profile Management
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('app_user_profiles');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedId = localStorage.getItem('app_current_user_id');
      const found = users.find((u) => u.id === savedId);
      return found || users[0] || DEFAULT_USERS[0];
    } catch {
      return DEFAULT_USERS[0];
    }
  });

  // User-Specific Favorites Tracks State
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(`user_favorite_tracks_${currentUser.id}`);
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem('user_favorite_tracks');
      return legacy ? JSON.parse(legacy) : [];
    } catch {
      return [];
    }
  });

  // Reload favorites when currentUser changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`user_favorite_tracks_${currentUser.id}`);
      setFavorites(saved ? JSON.parse(saved) : []);
    } catch {
      setFavorites([]);
    }
  }, [currentUser.id]);

  // Recommended Track: Pick the top song and rotate dynamically on each load/restart
  const [recommendedTrack, setRecommendedTrack] = useState<Track>(() => {
    const randomIndex = Math.floor(Math.random() * TRENDING_TRACKS.length);
    return TRENDING_TRACKS[randomIndex] || TRENDING_TRACKS[0];
  });

  // Search & List State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(TRENDING_TRACKS);

  // Player State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(TRENDING_TRACKS[0]);
  const [queue, setQueue] = useState<Track[]>(TRENDING_TRACKS);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('album');

  // Modals
  const [isAirplayOpen, setIsAirplayOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Lyrics State
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isSynced, setIsSynced] = useState(true);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // RACE CONDITION & AUDIO STALE PREVENTION REFS
  const activeRequestIdRef = useRef(0);
  const currentTrackIdRef = useRef<string | null>(TRENDING_TRACKS[0].id);

  // Profile functions
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('app_current_user_id', user.id);
  };

  const handleCreateUser = (name: string, photoUrl = '') => {
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name,
      photoUrl,
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('app_user_profiles', JSON.stringify(updated));
    handleSelectUser(newUser);
  };

  const handleUpdateUserPhoto = (photoUrl: string) => {
    const updatedUser = { ...currentUser, photoUrl };
    setCurrentUser(updatedUser);
    const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    localStorage.setItem('app_user_profiles', JSON.stringify(updatedUsers));
  };

  // Toggle Favorite for Current User
  const toggleFavorite = (trackToToggle?: Track) => {
    const track = trackToToggle || currentTrack;
    if (!track) return;

    setFavorites((prev) => {
      const exists = prev.some((t) => t.id === track.id || (t.title === track.title && t.artist === track.artist));
      let updated: Track[];
      if (exists) {
        updated = prev.filter((t) => !(t.id === track.id || (t.title === track.title && t.artist === track.artist)));
      } else {
        updated = [track, ...prev];
      }
      localStorage.setItem(`user_favorite_tracks_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const isCurrentFavorite = Boolean(
    currentTrack &&
      favorites.some(
        (t) => t.id === currentTrack.id || (t.title === currentTrack.title && t.artist === currentTrack.artist)
      )
  );

  // High precision animation loop (60 FPS)
  const updateLoop = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      rafRef.current = requestAnimationFrame(updateLoop);
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateLoop);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, updateLoop]);

  // Fetch top songs dynamically from backend
  useEffect(() => {
    fetch('/api/top-songs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const combined = [
            ...TRENDING_TRACKS,
            ...data.filter(
              (d: Track) => !TRENDING_TRACKS.some((st) => st.title.toLowerCase() === d.title.toLowerCase())
            ),
          ];
          setTrendingTracks(combined);
          setQueue(combined);
          // Rotate recommended track dynamically
          const randomIndex = Math.floor(Math.random() * combined.length);
          setRecommendedTrack(combined[randomIndex] || combined[0]);
        }
      })
      .catch(() => {
        setTrendingTracks(TRENDING_TRACKS);
        setQueue(TRENDING_TRACKS);
      });
  }, []);

  // Handle URL song parameters for Direct Shared URLs (?track=... or ?title=...&artist=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const trackId = urlParams.get('track');
      const songTitle = urlParams.get('title');
      const songArtist = urlParams.get('artist');

      if (trackId || songTitle) {
        const found = TRENDING_TRACKS.find(
          (t) =>
            (trackId && t.id === trackId) ||
            (songTitle && t.title.toLowerCase() === songTitle.toLowerCase())
        );

        if (found) {
          playTrack(found);
          setIsPlayerOpen(true);
        } else if (songTitle) {
          const q = songArtist ? `${songArtist} ${songTitle}` : songTitle;
          fetch(`/api/search?q=${encodeURIComponent(q)}`)
            .then((r) => r.json())
            .then((resTracks) => {
              if (Array.isArray(resTracks) && resTracks.length > 0) {
                playTrack(resTracks[0]);
                setIsPlayerOpen(true);
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Preload lyrics for initial track
  useEffect(() => {
    if (currentTrack) {
      fetchLyricsFromDB(currentTrack.artist, currentTrack.title).then((res) => {
        if (res && res.lyrics.length > 0) {
          setLyrics(res.lyrics);
          setIsSynced(res.isSynced);
        }
      });
    }
  }, []);

  // Live Search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setArtistResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delay = setTimeout(() => {
      Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`).then((r) => r.json()).catch(() => []),
        fetch(`/api/search-artists?q=${encodeURIComponent(searchQuery.trim())}`).then((r) => r.json()).catch(() => []),
      ])
        .then(([tracks, artists]) => {
          if (Array.isArray(tracks)) setSearchResults(tracks);
          if (Array.isArray(artists)) setArtistResults(artists);
          setIsSearching(false);
        })
        .catch(() => {
          setIsSearching(false);
        });
    }, 350);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Play track with complete full audio resolution via iguro-ytdl, zero stale playback
  const playTrack = async (track: Track, newQueue?: Track[]) => {
    const requestId = ++activeRequestIdRef.current;
    currentTrackIdRef.current = track.id;

    setCurrentTrack(track);
    if (newQueue) setQueue(newQueue);
    setViewMode('album');
    setIsPlaying(true);
    setCurrentTime(0);
    if (track.duration) {
      setDuration(track.duration);
    }
    setIsLoadingLyrics(true);

    // CRUCIAL: Immediately stop, clear source and flush old audio so it never plays the previous track
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    // Call iguro-ytdl to fetch full complete audio stream
    const targetQuery = `${track.artist} ${track.title}`;
    fetch(`/api/yt-audio?q=${encodeURIComponent(targetQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (requestId !== activeRequestIdRef.current || currentTrackIdRef.current !== track.id) {
          return;
        }

        if (data?.status && data?.result?.url) {
          const fullAudioUrl = data.result.url;
          setCurrentTrack((prev) => (prev && prev.id === track.id ? { ...prev, audioUrl: fullAudioUrl } : prev));
          if (audioRef.current) {
            audioRef.current.src = fullAudioUrl;
            audioRef.current.play().catch(() => {});
          }
        } else if (track.audioUrl && audioRef.current) {
          // Fallback to track audio url if available
          audioRef.current.src = track.audioUrl;
          audioRef.current.play().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('iguro-ytdl notice:', err);
        if (track.audioUrl && audioRef.current && requestId === activeRequestIdRef.current) {
          audioRef.current.src = track.audioUrl;
          audioRef.current.play().catch(() => {});
        }
      });

    try {
      const result = await fetchLyricsFromDB(track.artist, track.title);
      if (requestId === activeRequestIdRef.current && currentTrackIdRef.current === track.id) {
        if (result && result.lyrics.length > 0) {
          setLyrics(result.lyrics);
          setIsSynced(result.isSynced);
        } else {
          setLyrics([]);
          setIsSynced(false);
        }
      }
    } catch (e) {
      console.error(e);
      if (requestId === activeRequestIdRef.current) {
        setLyrics([]);
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsLoadingLyrics(false);
      }
    }
  };

  const selectArtist = (artist: Artist) => {
    fetch(`/api/artist-tracks?id=${encodeURIComponent(artist.id)}`)
      .then((res) => res.json())
      .then((tracks) => {
        if (Array.isArray(tracks) && tracks.length > 0) {
          setSearchResults(tracks);
        }
      })
      .catch(() => {});
  };

  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (audioRef.current.src) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        } else if (currentTrack) {
          // Re-trigger playTrack if audio url is being resolved
          playTrack(currentTrack);
        }
      }
    }
  };

  const playNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentTrack || queue.length === 0) return;

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = queue[(currentIndex + 1) % queue.length];
    playTrack(nextTrack);
  };

  const playPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentTrack || queue.length === 0) return;

    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const prevTrack = queue[(currentIndex - 1 + queue.length) % queue.length];
    playTrack(prevTrack);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Toggle Lyrics when clicking the Quotes button
  const toggleLyricsView = () => {
    setViewMode((prev) => (prev === 'lyrics' ? 'album' : 'lyrics'));
  };

  // Active lyric index for lyrics animation
  const activeLyricIndex = isSynced
    ? lyrics.findIndex((lyric, index) => {
        const nextLyric = lyrics[index + 1];
        return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
      })
    : -1;

  // MediaSession API integration
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) audioRef.current.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    }
  }, [currentTrack, queue]);

  return (
    <div className="h-[100dvh] w-full bg-white text-zinc-950 overflow-hidden flex flex-col font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] relative select-none">
      {/* 1. Main Home View matching reference image */}
      <div className="flex-1 overflow-y-auto">
        <HomeView
          tracks={trendingTracks}
          recommendedTrack={recommendedTrack}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayTrack={playTrack}
          onOpenPlayer={() => setIsPlayerOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          artistResults={artistResults}
          isSearching={isSearching}
          onSelectArtist={selectArtist}
          favoriteTracks={favorites}
          onToggleFavorite={toggleFavorite}
          currentUser={currentUser}
          users={users}
          onSelectUser={handleSelectUser}
          onCreateUser={handleCreateUser}
          onUpdateUserPhoto={handleUpdateUserPhoto}
        />
      </div>

      {/* 2. Floating Mini Player Bar (When player is minimized) */}
      <AnimatePresence>
        {currentTrack && !isPlayerOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setIsPlayerOpen(true)}
            className="fixed bottom-4 left-4 right-20 sm:left-auto sm:right-24 sm:w-96 bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-40 hover:bg-zinc-900 transition-all text-white font-['SF_Pro_Display',sans-serif]"
          >
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover shadow-md shrink-0 border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-sm truncate text-white leading-tight font-['SF_Pro_Display',sans-serif]">
                {currentTrack.title}
              </h4>
              <p className="text-zinc-300 text-xs font-black truncate leading-tight mt-0.5 font-['SF_Pro_Display',sans-serif]">
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="p-2.5 text-white hover:scale-110 active:scale-95 transition-all"
              aria-label="Play/Pause"
            >
              {isPlaying ? (
                <div className="w-5 h-5 flex items-center justify-center font-black">❚❚</div>
              ) : (
                <div className="w-5 h-5 flex items-center justify-center font-black">▶</div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Full Screen Apple Music Player with Fluid Background & Synchronized Lyrics */}
      <AnimatePresence>
        {isPlayerOpen && currentTrack && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]"
          >
            {/* Fluid Ambient Mesh Background with live cover motion */}
            <LiquidBackground currentTrack={currentTrack} />

            {/* Apple Music Header (with White Star when active) */}
            <PlayerHeader
              currentTrack={currentTrack}
              viewMode={viewMode}
              onClose={() => setIsPlayerOpen(false)}
              isFavorite={isCurrentFavorite}
              onToggleFavorite={() => toggleFavorite()}
            />

            {/* Main Stage: Alternates between Album View and Lyrics View */}
            <div className="relative z-10 flex-1 flex flex-col justify-between overflow-hidden h-full">
              <AnimatePresence mode="wait">
                {viewMode === 'lyrics' ? (
                  <motion.div
                    key="lyrics-view"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 w-full h-full overflow-hidden flex flex-col"
                  >
                    <LyricsView
                      lyrics={lyrics}
                      currentTime={currentTime}
                      isSynced={isSynced}
                      activeLyricIndex={activeLyricIndex}
                      onSeek={handleSeek}
                      isLoading={isLoadingLyrics}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="album-view"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 w-full h-full overflow-hidden flex flex-col justify-center"
                  >
                    <AlbumView
                      currentTrack={currentTrack}
                      isPlaying={isPlaying}
                      isFavorite={isCurrentFavorite}
                      onToggleFavorite={() => toggleFavorite()}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Apple Music Player Controls */}
              <PlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                viewMode={viewMode}
                onTogglePlay={togglePlayPause}
                onNext={playNext}
                onPrev={playPrev}
                onSeek={handleSeek}
                onToggleLyrics={toggleLyricsView}
                onOpenAirplay={() => setIsAirplayOpen(true)}
                onOpenQueue={() => setIsQueueOpen(true)}
                audioRef={audioRef}
              />
            </div>

            {/* Modals for Airplay & Queue */}
            <AirplayModal isOpen={isAirplayOpen} onClose={() => setIsAirplayOpen(false)} />
            <QueueModal
              isOpen={isQueueOpen}
              onClose={() => setIsQueueOpen(false)}
              queue={queue}
              currentTrack={currentTrack}
              onSelectTrack={(t) => playTrack(t)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        autoPlay
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const mediaDuration = audioRef.current.duration;
            if (currentTrack?.duration && currentTrack.duration > 0) {
              // Align with official studio track duration for exact lyrics synchronization
              setDuration(currentTrack.duration);
            } else if (mediaDuration && !isNaN(mediaDuration)) {
              setDuration(mediaDuration);
            }
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const cur = audioRef.current.currentTime;
            setCurrentTime(cur);
            // If audio goes beyond official studio duration by extra silence/outro, finish track smoothly
            if (currentTrack?.duration && cur >= currentTrack.duration + 0.5) {
              playNext();
            }
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => playNext()}
        onError={(e) => {
          console.error('Audio playback event', e);
        }}
      />
    </div>
  );
}
