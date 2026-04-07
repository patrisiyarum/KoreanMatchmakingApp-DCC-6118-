const TERM_POOLS = {
  Beginner: [
    { korean: '안녕하세요', english: 'Hello', romanization: 'annyeonghaseyo' },
    { korean: '감사합니다', english: 'Thank you', romanization: 'gamsahamnida' },
    { korean: '네', english: 'Yes', romanization: 'ne' },
    { korean: '아니요', english: 'No', romanization: 'aniyo' },
    { korean: '사랑', english: 'Love', romanization: 'sarang' },
    { korean: '물', english: 'Water', romanization: 'mul' },
    { korean: '밥', english: 'Rice/Food', romanization: 'bap' },
    { korean: '집', english: 'House', romanization: 'jip' },
    { korean: '학교', english: 'School', romanization: 'hakgyo' },
    { korean: '친구', english: 'Friend', romanization: 'chingu' },
    { korean: '이름', english: 'Name', romanization: 'ireum' },
    { korean: '가족', english: 'Family', romanization: 'gajok' },
    { korean: '음식', english: 'Food', romanization: 'eumsik' },
    { korean: '시간', english: 'Time', romanization: 'sigan' },
    { korean: '오늘', english: 'Today', romanization: 'oneul' },
    { korean: '내일', english: 'Tomorrow', romanization: 'naeil' },
    { korean: '어제', english: 'Yesterday', romanization: 'eoje' },
    { korean: '고양이', english: 'Cat', romanization: 'goyangi' },
    { korean: '강아지', english: 'Puppy', romanization: 'gangaji' },
    { korean: '책', english: 'Book', romanization: 'chaek' },
  ],
  Intermediate: [
    { korean: '경험', english: 'Experience', romanization: 'gyeongheom' },
    { korean: '환경', english: 'Environment', romanization: 'hwangyeong' },
    { korean: '결과', english: 'Result', romanization: 'gyeolgwa' },
    { korean: '문화', english: 'Culture', romanization: 'munhwa' },
    { korean: '경제', english: 'Economy', romanization: 'gyeongje' },
    { korean: '사회', english: 'Society', romanization: 'sahoe' },
    { korean: '교육', english: 'Education', romanization: 'gyoyuk' },
    { korean: '건강', english: 'Health', romanization: 'geongang' },
    { korean: '기술', english: 'Technology', romanization: 'gisul' },
    { korean: '역사', english: 'History', romanization: 'yeoksa' },
    { korean: '정치', english: 'Politics', romanization: 'jeongchi' },
    { korean: '과학', english: 'Science', romanization: 'gwahak' },
    { korean: '자연', english: 'Nature', romanization: 'jayeon' },
    { korean: '약속', english: 'Promise', romanization: 'yaksok' },
    { korean: '여행', english: 'Travel', romanization: 'yeohaeng' },
    { korean: '연습', english: 'Practice', romanization: 'yeonseup' },
    { korean: '준비', english: 'Preparation', romanization: 'junbi' },
    { korean: '의견', english: 'Opinion', romanization: 'uigyeon' },
    { korean: '관계', english: 'Relationship', romanization: 'gwangye' },
    { korean: '성공', english: 'Success', romanization: 'seonggong' },
  ],
  Advanced: [
    { korean: '인공지능', english: 'Artificial Intelligence', romanization: 'ingongjineung' },
    { korean: '지속가능성', english: 'Sustainability', romanization: 'jisokganeungseong' },
    { korean: '민주주의', english: 'Democracy', romanization: 'minjujuui' },
    { korean: '세계화', english: 'Globalization', romanization: 'segyehwa' },
    { korean: '다양성', english: 'Diversity', romanization: 'dayangseong' },
    { korean: '철학', english: 'Philosophy', romanization: 'cheolhak' },
    { korean: '우주', english: 'Universe', romanization: 'uju' },
    { korean: '혁신', english: 'Innovation', romanization: 'hyeoksin' },
    { korean: '협력', english: 'Cooperation', romanization: 'hyeomnyeok' },
    { korean: '갈등', english: 'Conflict', romanization: 'galdeung' },
    { korean: '편견', english: 'Prejudice', romanization: 'pyeongyeon' },
    { korean: '번영', english: 'Prosperity', romanization: 'beonyeong' },
    { korean: '소통', english: 'Communication', romanization: 'sotong' },
    { korean: '통찰력', english: 'Insight', romanization: 'tongchallyeok' },
    { korean: '창의성', english: 'Creativity', romanization: 'changuiseong' },
    { korean: '책임감', english: 'Responsibility', romanization: 'chaegimgam' },
    { korean: '정의', english: 'Justice', romanization: 'jeongui' },
    { korean: '자율성', english: 'Autonomy', romanization: 'jayulseong' },
    { korean: '윤리', english: 'Ethics', romanization: 'yulli' },
    { korean: '인류', english: 'Humanity', romanization: 'illyu' },
  ],
};

const GRAMMAR_POOLS = {
  Beginner: [
    {
      question: 'How do you say "I am a student" in Korean?',
      options: ['저는 학생입니다', '저는 학생이에요', '나는 학생이다', '저는 선생님입니다'],
      correctIndex: 0,
      explanation: '"저는 학생입니다" uses the formal polite form with 입니다.',
    },
    {
      question: 'Which particle marks the subject of a sentence?',
      options: ['을/를', '이/가', '에서', '의'],
      correctIndex: 1,
      explanation: '이/가 is the subject-marking particle. 이 follows consonants, 가 follows vowels.',
    },
    {
      question: 'What is the correct way to say "I go to school"?',
      options: ['학교에 가요', '학교를 가요', '학교이 가요', '학교는 가요'],
      correctIndex: 0,
      explanation: '에 is the destination particle used with movement verbs like 가다.',
    },
    {
      question: 'Choose the correct object particle: "저는 물__ 마셔요"',
      options: ['이', '을', '는', '에'],
      correctIndex: 1,
      explanation: '을 is used after consonant-ending nouns as the object particle. 물 ends in ㄹ.',
    },
    {
      question: 'How do you make a verb past tense? (먹다 → ate)',
      options: ['먹어요', '먹었어요', '먹겠어요', '먹고요'],
      correctIndex: 1,
      explanation: 'Past tense is formed by adding 았/었 to the verb stem. 먹 + 었어요 = 먹었어요.',
    },
    {
      question: 'What does "~고 싶다" express?',
      options: ['Must do', 'Want to do', 'Can do', 'Should do'],
      correctIndex: 1,
      explanation: '~고 싶다 expresses desire or wanting to do something.',
    },
    {
      question: 'Which is the correct negative form of "좋아요" (it\'s good)?',
      options: ['안 좋아요', '못 좋아요', '좋아요 않', '좋지 마세요'],
      correctIndex: 0,
      explanation: '안 is placed before the verb/adjective for simple negation.',
    },
    {
      question: 'What does the particle "도" mean?',
      options: ['Only', 'Also/Too', 'From', 'But'],
      correctIndex: 1,
      explanation: '도 means "also" or "too" and replaces the subject/object particle.',
    },
    {
      question: 'Fill in the blank: "이것__ 뭐예요?" (What is this?)',
      options: ['을', '이', '은', '에'],
      correctIndex: 2,
      explanation: '은/는 is the topic particle. 이것 ends in a consonant, so 은 is used.',
    },
    {
      question: 'How do you say "because" in Korean?',
      options: ['그리고', '하지만', '왜냐하면', '그래서'],
      correctIndex: 2,
      explanation: '왜냐하면 means "because." 그래서 means "so/therefore" (result, not cause).',
    },
  ],
  Intermediate: [
    {
      question: 'What is the difference between "~는 것" and "~기"?',
      options: [
        'Both nominalize verbs but ~기 is more common with emotional expressions',
        'They are exactly the same',
        '~는 것 is informal and ~기 is formal',
        '~기 is only used in questions',
      ],
      correctIndex: 0,
      explanation: '~기 pairs naturally with adjectives of feeling (쉽다, 어렵다, 좋다). ~는 것 is more general.',
    },
    {
      question: 'Choose the correct connective: "비가 오___ 우산을 가져가세요."',
      options: ['면', '고', '지만', '서'],
      correctIndex: 0,
      explanation: '~면 means "if." If it rains, take an umbrella.',
    },
    {
      question: 'What does "~(으)ㄹ 수 있다" express?',
      options: ['Obligation', 'Ability/Possibility', 'Intention', 'Completion'],
      correctIndex: 1,
      explanation: '~(으)ㄹ 수 있다 expresses ability or possibility — "can do."',
    },
    {
      question: '"공부하는 중이에요" means:',
      options: ['I finished studying', 'I am in the middle of studying', 'I will study', 'I like studying'],
      correctIndex: 1,
      explanation: '~는 중이다 means "in the middle of doing."',
    },
    {
      question: 'Which ending expresses a suggestion or "shall we"?',
      options: ['~(으)ㅂ시다', '~(으)세요', '~겠습니다', '~(으)ㄹ게요'],
      correctIndex: 0,
      explanation: '~(으)ㅂ시다 is the formal "let\'s" or "shall we" form.',
    },
    {
      question: 'What does "~아/어 보다" mean?',
      options: ['To look at', 'To try doing', 'To see someone', 'To finish doing'],
      correctIndex: 1,
      explanation: '~아/어 보다 means "to try doing" something as an experience.',
    },
    {
      question: 'Choose the correct honorific: "할머니가 ___."',
      options: ['먹었어요', '드셨어요', '먹었다', '드셨다'],
      correctIndex: 1,
      explanation: '드시다 is the honorific form of 먹다 (to eat), used for elders.',
    },
    {
      question: '"~(으)ㄹ 때" is used to express:',
      options: ['Place', 'Time/When', 'Reason', 'Contrast'],
      correctIndex: 1,
      explanation: '~(으)ㄹ 때 means "when" — it marks a time clause.',
    },
    {
      question: 'What is the difference between "~(으)러 가다" and "~(으)려고 하다"?',
      options: [
        '~(으)러 is purpose with movement verbs; ~(으)려고 is general intention',
        'They are identical',
        '~(으)러 is formal; ~(으)려고 is informal',
        '~(으)려고 requires movement verbs',
      ],
      correctIndex: 0,
      explanation: '~(으)러 only pairs with 가다/오다. ~(으)려고 하다 works with any verb.',
    },
    {
      question: '"날씨가 추워지고 있어요" means:',
      options: [
        'The weather was cold',
        'The weather is getting cold',
        'The weather will be cold',
        'The weather is cold',
      ],
      correctIndex: 1,
      explanation: '~아/어지다 expresses a change of state. + ~고 있다 = ongoing change.',
    },
  ],
  Advanced: [
    {
      question: 'What nuance does "~더라고요" convey?',
      options: [
        'Sharing a personal observation/recollection',
        'Expressing certainty',
        'Making a polite request',
        'Expressing obligation',
      ],
      correctIndex: 0,
      explanation: '~더라고요 reports something the speaker personally witnessed or experienced.',
    },
    {
      question: '"~(으)ㄴ/는 셈이다" means:',
      options: [
        'It\'s like / it amounts to',
        'It must be done',
        'It was completed',
        'It was supposed to be',
      ],
      correctIndex: 0,
      explanation: '~(으)ㄴ/는 셈이다 means "it amounts to" or "you could say it\'s like."',
    },
    {
      question: 'Choose the correct form: "시간이 ___ 만큼 열심히 하세요."',
      options: ['있는', '있을', '있던', '있었는'],
      correctIndex: 0,
      explanation: '~는 만큼 means "as much as." Present tense modifier for 있다 is 있는.',
    },
    {
      question: '"~(으)ㄹ 뻔했다" expresses:',
      options: [
        'Something almost happened but didn\'t',
        'Something will happen soon',
        'Something happened repeatedly',
        'Something must happen',
      ],
      correctIndex: 0,
      explanation: '~(으)ㄹ 뻔했다 means "almost did" — a near-miss.',
    },
    {
      question: 'What is "~기는커녕" used for?',
      options: [
        'Expressing "let alone / far from"',
        'Expressing agreement',
        'Listing similar items',
        'Expressing duration',
      ],
      correctIndex: 0,
      explanation: '~기는커녕 means "far from" or "let alone" — the reality is the opposite.',
    },
    {
      question: '"그 사람이 한국어를 잘 하는 줄 알았어요" means:',
      options: [
        'I knew that person speaks Korean well',
        'I thought that person spoke Korean well (but they don\'t)',
        'That person knows Korean well',
        'I want that person to speak Korean well',
      ],
      correctIndex: 1,
      explanation: '~(으)ㄴ/는 줄 알다 means "to think/assume that..." — often wrong assumptions.',
    },
    {
      question: 'What does the pattern "~(으)ㄹ수록" express?',
      options: [
        'The more ... the more',
        'Even though',
        'Instead of',
        'Regardless of',
      ],
      correctIndex: 0,
      explanation: '~(으)ㄹ수록 means "the more X, the more Y." e.g. 갈수록 = the more you go.',
    },
    {
      question: '"~느라고" is used when:',
      options: [
        'The subject did A, and because of that couldn\'t do B',
        'The subject plans to do something',
        'Something happened unexpectedly',
        'The subject completed a long task',
      ],
      correctIndex: 0,
      explanation: '~느라고 connects cause (an ongoing action) to a negative result.',
    },
    {
      question: 'Which is correct? "회의가 ___ 대로 진행됩시다."',
      options: ['예정한', '예정된', '예정하는', '예정될'],
      correctIndex: 1,
      explanation: '예정되다 is passive. Past participle 예정된 modifies 대로: "as scheduled."',
    },
    {
      question: '"~(으)ㄴ/는 반면에" means:',
      options: [
        'On the other hand / while (contrast)',
        'At the same time',
        'In addition to',
        'Because of',
      ],
      correctIndex: 0,
      explanation: '~(으)ㄴ/는 반면에 introduces a contrasting fact.',
    },
  ],
};

const PRONUNCIATION_POOLS = {
  Beginner: [
    { korean: '안녕하세요', romanization: 'an-nyeong-ha-se-yo', english: 'Hello' },
    { korean: '감사합니다', romanization: 'gam-sa-ham-ni-da', english: 'Thank you' },
    { korean: '죄송합니다', romanization: 'joe-song-ham-ni-da', english: 'I\'m sorry' },
    { korean: '잘 먹겠습니다', romanization: 'jal meok-get-seum-ni-da', english: 'I will eat well (before a meal)' },
    { korean: '만나서 반갑습니다', romanization: 'man-na-seo ban-gap-seum-ni-da', english: 'Nice to meet you' },
    { korean: '좋은 아침이에요', romanization: 'jo-eun a-chi-mi-e-yo', english: 'Good morning' },
    { korean: '잘 자요', romanization: 'jal ja-yo', english: 'Good night' },
    { korean: '어디에요?', romanization: 'eo-di-e-yo', english: 'Where is it?' },
    { korean: '얼마에요?', romanization: 'eol-ma-e-yo', english: 'How much is it?' },
    { korean: '화장실이 어디에요?', romanization: 'hwa-jang-sil-i eo-di-e-yo', english: 'Where is the bathroom?' },
  ],
  Intermediate: [
    { korean: '한국어를 배우고 있어요', romanization: 'han-gu-geo-reul bae-u-go i-sseo-yo', english: 'I am learning Korean' },
    { korean: '주말에 뭐 할 거예요?', romanization: 'ju-mal-e mwo hal geo-ye-yo', english: 'What are you doing this weekend?' },
    { korean: '날씨가 정말 좋네요', romanization: 'nal-ssi-ga jeong-mal jon-ne-yo', english: 'The weather is really nice' },
    { korean: '이것 좀 도와주시겠어요?', romanization: 'i-geot jom do-wa-ju-si-ge-sseo-yo', english: 'Could you help me with this?' },
    { korean: '시간이 있으면 같이 가요', romanization: 'si-ga-ni i-sseu-myeon ga-chi ga-yo', english: 'If you have time, let\'s go together' },
    { korean: '저는 한국 음식을 좋아해요', romanization: 'jeo-neun han-guk eum-si-geul jo-a-hae-yo', english: 'I like Korean food' },
    { korean: '어제 영화를 봤어요', romanization: 'eo-je yeong-hwa-reul bwa-sseo-yo', english: 'I watched a movie yesterday' },
    { korean: '커피 한 잔 주세요', romanization: 'keo-pi han jan ju-se-yo', english: 'One coffee please' },
    { korean: '생일 축하합니다', romanization: 'saeng-il chuk-ha-ham-ni-da', english: 'Happy birthday' },
    { korean: '다음에 또 만나요', romanization: 'da-eu-me tto man-na-yo', english: 'Let\'s meet again next time' },
  ],
  Advanced: [
    { korean: '그 문제에 대해 깊이 생각해 봤어요', romanization: 'geu mun-je-e dae-hae gi-pi saeng-ga-kae bwa-sseo-yo', english: 'I thought deeply about that problem' },
    { korean: '의사소통이 원활하게 이루어져야 합니다', romanization: 'ui-sa-so-tong-i won-hwal-ha-ge i-ru-eo-jyeo-ya ham-ni-da', english: 'Communication must be carried out smoothly' },
    { korean: '경험이 많을수록 자신감이 생깁니다', romanization: 'gyeong-heom-i ma-neul-su-rok ja-sin-ga-mi saeng-gim-ni-da', english: 'The more experience, the more confidence builds' },
    { korean: '서로를 이해하려는 노력이 필요해요', romanization: 'seo-ro-reul i-hae-ha-ryeo-neun no-ryeo-gi pil-yo-hae-yo', english: 'Effort to understand each other is needed' },
    { korean: '한국 문화에 관심이 많아졌어요', romanization: 'han-guk mun-hwa-e gwan-si-mi ma-na-jyeo-sseo-yo', english: 'I\'ve become very interested in Korean culture' },
    { korean: '꾸준히 연습하면 실력이 늘 거예요', romanization: 'kku-jun-hi yeon-seu-pa-myeon sil-lyeo-gi neul geo-ye-yo', english: 'If you practice steadily, your skills will improve' },
    { korean: '그 사건은 사회적으로 큰 영향을 미쳤습니다', romanization: 'geu sa-geo-neun sa-hoe-jeo-geu-ro keun yeong-hyang-eul mi-chyeot-seum-ni-da', english: 'That incident had a large societal impact' },
    { korean: '다문화 가정에 대한 지원이 확대되고 있습니다', romanization: 'da-mun-hwa ga-jeong-e dae-han ji-wo-ni hwak-dae-doe-go it-seum-ni-da', english: 'Support for multicultural families is expanding' },
    { korean: '기후 변화는 전 세계적인 문제입니다', romanization: 'gi-hu byeon-hwa-neun jeon se-gye-jeo-gin mun-je-im-ni-da', english: 'Climate change is a global issue' },
    { korean: '비판적 사고력을 기르는 것이 중요합니다', romanization: 'bi-pan-jeok sa-go-ryeo-geul gi-reu-neun geo-si jung-yo-ham-ni-da', english: 'Cultivating critical thinking is important' },
  ],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getTermMatchingRound(difficulty = 'Beginner', count = 6) {
  const pool = TERM_POOLS[difficulty] || TERM_POOLS.Beginner;
  const selected = shuffle(pool).slice(0, count);
  const pairs = selected.map((t, i) => ({ id: i, korean: t.korean, english: t.english }));
  return {
    pairs,
    shuffledEnglish: shuffle(pairs.map(p => ({ id: p.id, english: p.english }))),
  };
}

export function gradeTermMatching(pairs, answers) {
  let correct = 0;
  for (const answer of answers) {
    const pair = pairs.find(p => p.id === answer.id);
    if (pair && pair.english === answer.english) correct++;
  }
  return { correct, total: pairs.length, score: Math.round((correct / pairs.length) * 100) };
}

export function getGrammarQuizRound(difficulty = 'Beginner', count = 5) {
  const pool = GRAMMAR_POOLS[difficulty] || GRAMMAR_POOLS.Beginner;
  const selected = shuffle(pool).slice(0, count);
  return selected.map((q, i) => ({
    id: i,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
}

export function gradeGrammarQuiz(difficulty, questions, answers) {
  const pool = GRAMMAR_POOLS[difficulty] || GRAMMAR_POOLS.Beginner;
  let correct = 0;
  const results = questions.map((q, i) => {
    const original = pool.find(p => p.question === q.question);
    const userAnswer = answers[i];
    const isCorrect = original && userAnswer === original.correctIndex;
    if (isCorrect) correct++;
    return {
      id: q.id,
      correct: isCorrect,
      correctAnswer: original ? original.correctIndex : null,
      explanation: original ? original.explanation : '',
    };
  });
  return { correct, total: questions.length, score: Math.round((correct / questions.length) * 100), results };
}

export function getPronunciationDrillRound(difficulty = 'Beginner', count = 5) {
  const pool = PRONUNCIATION_POOLS[difficulty] || PRONUNCIATION_POOLS.Beginner;
  const selected = shuffle(pool).slice(0, count);
  return selected.map((p, i) => ({
    id: i,
    korean: p.korean,
    romanization: p.romanization,
    english: p.english,
  }));
}
