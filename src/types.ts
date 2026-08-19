export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration?: number;
  durationFormatted?: string;
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
  };
}

export interface Artist {
  id: string;
  name: string;
  pictureUrl: string;
}

export interface LyricLine {
  text: string;
  time: number;
  words?: {
    text: string;
    start: number;
    end: number;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  photoUrl: string;
}

export type ViewMode = 'album' | 'lyrics' | 'queue';
export type PlayMode = 'normal' | 'repeat' | 'shuffle';
