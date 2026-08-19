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

const TRENDING_TRACKS: Track[] = [
];

const DEFAULT_USERS: UserProfile[] = [
  { id: 'user-1', name: 'Usuario 1', photoUrl: '' },
  { id: 'user-2', name: 'Usuario 2', photoUrl: '' },
];

export default function App() {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>(TRENDING_TRACKS);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(TRENDING_TRACKS[0]);
  const [queue, setQueue] = useState<Track[]>(TRENDING_TRACKS);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('album');

  const [isAirplayOpen, setIsAirplayOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isSynced, setIsSynced] = useState(true);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const activeRequestIdRef = useRef(0);
  const currentTrackIdRef = useRef<string | null>(TRENDING_TRACKS[0].id);

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
          const randomIndex = Math.floor(Math.random() * combined.length);
          setRecommendedTrack(combined[randomIndex] || combined[0]);
        }
      })
      .catch(() => {
        setTrendingTracks(TRENDING_TRACKS);
        setQueue(TRENDING_TRACKS);
      });
  }, []);
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
    }
  }, []);

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

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

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

  const toggleLyricsView = () => {
    setViewMode((prev) => (prev === 'lyrics' ? 'album' : 'lyrics'));
  };

  const activeLyricIndex = isSynced
    ? lyrics.findIndex((lyric, index) => {
        const nextLyric = lyrics[index + 1];
        return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
      })
    : -1;

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

      <AnimatePresence>
        {isPlayerOpen && currentTrack && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif]"
          >
            <LiquidBackground currentTrack={currentTrack} />
            <PlayerHeader
              currentTrack={currentTrack}
              viewMode={viewMode}
              onClose={() => setIsPlayerOpen(false)}
              isFavorite={isCurrentFavorite}
              onToggleFavorite={() => toggleFavorite()}
            />

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
            </div>refresque 
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
      <audio
        ref={audioRef}
        autoPlay
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const mediaDuration = audioRef.current.duration;
            if (currentTrack?.duration && currentTrack.duration > 0) {
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
