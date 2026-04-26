export type Language = 'Korean' | 'English';

export interface User {
  id: string;
  name: string;
  nativeLanguage: Language;
  learningLanguage: Language;
  interests: string[];
  bio: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  avatar: string;
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

export interface ConversationPrompt {
  id: string;
  english: string;
  korean: string;
  emoji: string;
}

export interface ConversationPromptCategory {
  id: string;
  label: string;
  emoji: string;
  prompts: ConversationPrompt[];
}
