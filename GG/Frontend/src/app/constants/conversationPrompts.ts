export interface ConversationPrompt {
  id: string;
  english: string;
  korean: string;
  emoji: string;
}

export interface ConversationPromptCategory {
  id: string;
  labelEn: string;
  labelKo: string;
  emoji: string;
  prompts: ConversationPrompt[];
}

export const CONVERSATION_PROMPT_CATEGORIES: ConversationPromptCategory[] = [
  {
    id: 'icebreakers',
    labelEn: 'Icebreakers',
    labelKo: '대화 시작',
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
    labelEn: 'Hobbies',
    labelKo: '취미',
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
    labelEn: 'Food',
    labelKo: '음식',
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
        english: 'What did you have for lunch today?',
        korean: '오늘 점심으로 뭐 먹었어요?',
        emoji: '🍱',
      },
    ],
  },
  {
    id: 'culture',
    labelEn: 'Culture',
    labelKo: '문화',
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
        english: "What's one tradition from your country you love?",
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
        english: "What's a phrase you wish you knew earlier?",
        korean: '더 일찍 알았으면 좋았을 표현이 있어요?',
        emoji: '💡',
      },
    ],
  },
  {
    id: 'practice',
    labelEn: 'Practice',
    labelKo: '연습',
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
