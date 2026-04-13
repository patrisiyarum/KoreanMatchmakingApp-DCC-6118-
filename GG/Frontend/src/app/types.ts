export type Language = 'Korean' | 'English';

export interface User {
  id: string;
  name: string;
  nativeLanguage: Language;
  learningLanguage: Language;
  interests: string[];
  bio: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Emoji or short fallback when no photo */
  avatar: string;
  /** Server path or URL for profile photo (Discover uses this first). */
  profileImage?: string | null;
}

export interface Match {
  user: User;
  matchedAt: Date;
  compatibility: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface GameScore {
  gameType: string;
  score: number;
  playedAt: Date;
}
