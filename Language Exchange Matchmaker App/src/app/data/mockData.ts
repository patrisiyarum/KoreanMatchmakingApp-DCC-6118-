import { User, Match, Message, ConversationPromptCategory } from '../types';

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
  {
    user: potentialPartners[1],
    matchedAt: new Date('2026-04-25'),
    compatibility: 88,
  },
];

export const conversationPromptCategories: ConversationPromptCategory[] = [
  {
    id: 'icebreakers',
    label: 'Icebreakers',
    emoji: '👋',
    prompts: [
      {
        id: 'ice-1',
        english: "Hi! Nice to meet you. How's your day going?",
        korean: '안녕하세요! 만나서 반가워요. 오늘 하루 어때요?',
        emoji: '😊',
      },
      {
        id: 'ice-2',
        english: 'What made you want to learn this language?',
        korean: '이 언어를 배우고 싶은 이유가 뭐예요?',
        emoji: '💭',
      },
      {
        id: 'ice-3',
        english: 'How long have you been studying?',
        korean: '얼마나 오래 공부했어요?',
        emoji: '📚',
      },
      {
        id: 'ice-4',
        english: 'Where are you from?',
        korean: '어디에서 왔어요?',
        emoji: '🌍',
      },
    ],
  },
  {
    id: 'hobbies',
    label: 'Hobbies',
    emoji: '🎨',
    prompts: [
      {
        id: 'hob-1',
        english: 'What do you like to do in your free time?',
        korean: '여가 시간에 뭐 하는 걸 좋아해요?',
        emoji: '⏰',
      },
      {
        id: 'hob-2',
        english: 'Do you have any favorite K-pop groups?',
        korean: '좋아하는 케이팝 그룹이 있어요?',
        emoji: '🎤',
      },
      {
        id: 'hob-3',
        english: 'What kind of movies do you enjoy?',
        korean: '어떤 영화를 좋아해요?',
        emoji: '🎬',
      },
      {
        id: 'hob-4',
        english: 'Have you played any good games recently?',
        korean: '최근에 재미있는 게임 했어요?',
        emoji: '🎮',
      },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    emoji: '🍜',
    prompts: [
      {
        id: 'food-1',
        english: "What's your favorite Korean dish?",
        korean: '가장 좋아하는 한국 음식이 뭐예요?',
        emoji: '🥘',
      },
      {
        id: 'food-2',
        english: 'Do you like spicy food?',
        korean: '매운 음식 좋아해요?',
        emoji: '🌶️',
      },
      {
        id: 'food-3',
        english: 'Have you tried cooking any Korean recipes?',
        korean: '한국 요리 만들어 본 적 있어요?',
        emoji: '👩‍🍳',
      },
      {
        id: 'food-4',
        english: "What did you have for lunch today?",
        korean: '오늘 점심으로 뭐 먹었어요?',
        emoji: '🍱',
      },
    ],
  },
  {
    id: 'culture',
    label: 'Culture',
    emoji: '🌸',
    prompts: [
      {
        id: 'cul-1',
        english: 'Have you ever traveled to Korea?',
        korean: '한국에 가본 적 있어요?',
        emoji: '✈️',
      },
      {
        id: 'cul-2',
        english: 'Whats one tradition from your country you love?',
        korean: '당신 나라의 사랑하는 전통이 뭐예요?',
        emoji: '🎎',
      },
      {
        id: 'cul-3',
        english: "Do you celebrate any holidays we don't have?",
        korean: '저희 나라엔 없는 명절을 지내요?',
        emoji: '🎉',
      },
      {
        id: 'cul-4',
        english: 'Whats a phrase you wish you knew earlier?',
        korean: '더 일찍 알았으면 좋았을 표현이 있어요?',
        emoji: '💡',
      },
    ],
  },
  {
    id: 'practice',
    label: 'Practice',
    emoji: '🗣️',
    prompts: [
      {
        id: 'prac-1',
        english: 'Can we practice introductions today?',
        korean: '오늘 자기소개 연습할까요?',
        emoji: '🤝',
      },
      {
        id: 'prac-2',
        english: 'Could you correct my mistakes when I write?',
        korean: '제가 쓸 때 실수를 고쳐줄 수 있어요?',
        emoji: '✏️',
      },
      {
        id: 'prac-3',
        english: 'How do you say this naturally?',
        korean: '이걸 자연스럽게 어떻게 말해요?',
        emoji: '💬',
      },
      {
        id: 'prac-4',
        english: 'Want to do a 10-minute voice chat sometime?',
        korean: '10분 정도 음성 채팅 해볼래요?',
        emoji: '🎙️',
      },
    ],
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
