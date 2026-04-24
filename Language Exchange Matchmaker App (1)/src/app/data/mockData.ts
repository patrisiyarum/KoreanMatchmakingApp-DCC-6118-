import { User, Match, Message } from '../types';

export const currentUser: User = {
  id: 'user-1',
  name: 'You',
  nativeLanguage: 'English',
  learningLanguage: 'Korean',
  interests: ['K-pop', 'Gaming', 'Cooking'],
  bio: 'Looking for a fun language partner!',
  level: 'Intermediate',
  avatar: '🙋',
};

export const potentialPartners: User[] = [
  {
    id: 'user-2',
    name: '지우 (Jiwoo)',
    nativeLanguage: 'Korean',
    learningLanguage: 'English',
    interests: ['K-pop', 'Movies', 'Cooking'],
    bio: '안녕하세요! I love learning through conversation 😊',
    level: 'Intermediate',
    avatar: '👩',
  },
  {
    id: 'user-3',
    name: '민준 (Minjun)',
    nativeLanguage: 'Korean',
    learningLanguage: 'English',
    interests: ['Gaming', 'Sports', 'Technology'],
    bio: 'Let\'s practice together! 같이 공부해요!',
    level: 'Beginner',
    avatar: '👨',
  },
  {
    id: 'user-4',
    name: '수진 (Sujin)',
    nativeLanguage: 'Korean',
    learningLanguage: 'English',
    interests: ['Art', 'Cooking', 'Music'],
    bio: 'I want to improve my English conversation skills!',
    level: 'Advanced',
    avatar: '👩‍🎨',
  },
  {
    id: 'user-5',
    name: '현우 (Hyunwoo)',
    nativeLanguage: 'Korean',
    learningLanguage: 'English',
    interests: ['Gaming', 'K-pop', 'Anime'],
    bio: 'Looking for a study buddy to practice daily!',
    level: 'Intermediate',
    avatar: '🎮',
  },
];

export const initialMatches: Match[] = [
  {
    user: potentialPartners[0],
    matchedAt: new Date('2026-04-08'),
    compatibility: 95,
  },
];

export const mockMessages: Record<string, Message[]> = {
  'user-2': [
    {
      id: 'msg-1',
      senderId: 'user-2',
      text: '안녕하세요! Nice to meet you!',
      timestamp: new Date('2026-04-08T10:00:00'),
    },
    {
      id: 'msg-2',
      senderId: 'user-1',
      text: 'Hi! 만나서 반가워요!',
      timestamp: new Date('2026-04-08T10:05:00'),
    },
    {
      id: 'msg-3',
      senderId: 'user-2',
      text: 'Should we practice together today? 오늘 같이 연습할까요?',
      timestamp: new Date('2026-04-08T10:10:00'),
    },
  ],
};
