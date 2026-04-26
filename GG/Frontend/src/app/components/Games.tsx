import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  ArrowRight,
  RotateCcw,
  Swords,
  Users,
  Plus,
  Crown,
  Gamepad2,
  BookOpen,
  Loader2,
  FileText,
  Mic,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { initialMatches } from '../data/mockData';
import {
  acceptTeamInvite,
  createTeam,
  declineTeamInvite,
  endTeamMatch,
  fetchMyTeam,
  findTeamMatch,
  getCurrentTeamMatch,
  getPendingTeamInvites,
  leaveTeam,
  sendTeamInvite,
  type TeamInviteRow,
  type TeamRow,
} from '@/api/teamsApi';
import { getTeamVsBoard, incrementTeamQuestProgress, type TeamVsBoard } from '@/api/questsApi';
import { getFriendsList, getFriendsLeaderboard, type FriendRow, type LeaderboardResponse } from '@/api/friendsApi';
import {
  acceptChallengeApi,
  createChallengeApi,
  declineChallengeApi,
  getChallengesForUser,
  submitChallengeScoreApi,
  type ChallengeRow,
} from '@/api/challengesApi';
import { fetchUserGameStats, submitGameResult, type GameType, type SubmitGameResultResponse } from '@/api/profileApi';
import { getUserBadges, type UserBadgeRow } from '@/api/badgesApi';

interface QuizQuestion {
  prompt: string;
  answer: string;
  options: string[];
  hint?: string;
}

type ChallengePartner = {
  id: string;
  name: string;
  level: string;
  avatar: string;
};

function getInviteTeamName(invite: TeamInviteRow, t: (en: string, ko: string) => string) {
  const teamObj = (invite.team ?? invite.Team) as
    | { name?: string; teamName?: string; title?: string }
    | undefined;
  const fromObj = teamObj?.name || teamObj?.teamName || teamObj?.title;
  const fromFlat = (invite as unknown as { teamName?: string; team_title?: string }).teamName
    || (invite as unknown as { teamName?: string; team_title?: string }).team_title;
  return fromObj || fromFlat || `${t('Team', '팀')} #${invite.teamId}`;
}

const termMatchingQuestions: QuizQuestion[] = [
  {
    prompt: '안녕하세요',
    answer: 'Hello',
    options: ['Hello', 'Goodbye', 'Thank you', 'Please']
  },
  {
    prompt: '감사합니다',
    answer: 'Thank you',
    options: ['Sorry', 'Thank you', 'Welcome', 'Excuse me']
  },
  {
    prompt: '사랑해요',
    answer: 'I love you',
    options: ['I love you', 'I like you', 'I miss you', 'I need you']
  },
  {
    prompt: '배고파요',
    answer: 'I\'m hungry',
    options: ['I\'m tired', 'I\'m hungry', 'I\'m thirsty', 'I\'m cold']
  },
  {
    prompt: '물',
    answer: 'Water',
    options: ['Water', 'Fire', 'Earth', 'Air']
  },
  { prompt: '학교', answer: 'School', options: ['School', 'Hospital', 'Station', 'Library'] },
  { prompt: '친구', answer: 'Friend', options: ['Teacher', 'Friend', 'Family', 'Neighbor'] },
  { prompt: '오늘', answer: 'Today', options: ['Yesterday', 'Tomorrow', 'Today', 'Morning'] },
  { prompt: '내일', answer: 'Tomorrow', options: ['Tomorrow', 'Now', 'Tonight', 'Week'] },
  { prompt: '책', answer: 'Book', options: ['Pen', 'Book', 'Notebook', 'Dictionary'] },
  { prompt: '커피', answer: 'Coffee', options: ['Tea', 'Coffee', 'Water', 'Juice'] },
  { prompt: '고양이', answer: 'Cat', options: ['Dog', 'Cat', 'Bird', 'Rabbit'] },
  { prompt: '빨리', answer: 'Quickly', options: ['Slowly', 'Quickly', 'Quietly', 'Brightly'] },
  { prompt: '행복해요', answer: 'I am happy', options: ['I am sad', 'I am happy', 'I am tired', 'I am sick'] },
  { prompt: '왼쪽', answer: 'Left', options: ['Right', 'Center', 'Left', 'Top'] },
  { prompt: '오른쪽', answer: 'Right', options: ['Left', 'Right', 'Front', 'Back'] },
];

const grammarQuizQuestions: QuizQuestion[] = [
  { prompt: '저는 학교___ 가요.', answer: '에', options: ['에', '를', '은', '와'], hint: 'Choose the correct particle.' },
  { prompt: '어제 영화를 ___ 봤어요.', answer: '봤어요', options: ['볼 거예요', '봐요', '봤어요', '봅니다'] },
  { prompt: '한국어가 ___ 어렵지 않아요.', answer: '생각보다', options: ['가장', '아직', '생각보다', '바로'] },
  { prompt: '지금 뭐 ___ 있어요?', answer: '하고', options: ['하다', '하고', '해요', '했어'] },
  { prompt: '오늘은 날씨가 ___ 좋네요.', answer: '정말', options: ['정말', '아직', '혹시', '조금도'] },
  { prompt: '저는 한국어를 ___ 있어요.', answer: '배우고', options: ['배우고', '배우다', '배웠고', '배우면'] },
  { prompt: '친구를 만나___ 카페에 갔어요.', answer: '서', options: ['고', '서', '면', '나'] },
  { prompt: '시간이 없어서 숙제를 못 ___ .', answer: '했어요', options: ['해요', '했어요', '할게요', '하면'] },
  { prompt: '주말마다 운동을 ___ .', answer: '해요', options: ['해요', '했어요', '할 거예요', '하네요'] },
  { prompt: '이 문제는 생각보다 ___ .', answer: '쉬워요', options: ['쉽다', '쉬워요', '쉬웠어요', '쉽고'] },
  { prompt: '배가 아파서 약을 ___ .', answer: '먹었어요', options: ['먹어요', '먹고', '먹었어요', '먹을래요'] },
  { prompt: '지하철을 타___ 회사에 가요.', answer: '고', options: ['고', '서', '면', '다가'] },
];

const pronunciationDrillQuestions: QuizQuestion[] = [
  { prompt: 'Choose the closest sound: "ㅂ" at word start', answer: 'Between B and P', options: ['Between B and P', 'Always P', 'Always B', 'Like F'] },
  { prompt: 'Best Romanization for "안녕"', answer: 'annyeong', options: ['annyeong', 'anyeongh', 'anyoung', 'anniong'] },
  { prompt: 'How is final "ㅅ" usually pronounced in batchim?', answer: 'Like t', options: ['Like s', 'Like d', 'Like t', 'Silent'] },
  { prompt: 'What helps Korean rhythm most?', answer: 'Syllable timing', options: ['Stress timing', 'Syllable timing', 'Random pauses', 'Speaking faster'] },
  { prompt: 'In "감사합니다", stress should be…', answer: 'Even and flowing', options: ['Heavy first syllable', 'Heavy last syllable', 'Even and flowing', 'No pauses at all'] },
  { prompt: 'Which pair is most easily confused by beginners?', answer: 'ㅓ / ㅗ', options: ['ㄱ / ㅋ', 'ㅁ / ㅂ', 'ㅓ / ㅗ', 'ㄴ / ㄷ'] },
  { prompt: 'For clearer Korean vowels, focus on…', answer: 'Mouth shape consistency', options: ['Talking louder', 'Mouth shape consistency', 'Speaking faster', 'Adding English stress'] },
  { prompt: 'Best pacing for beginner pronunciation practice?', answer: 'Slow and steady', options: ['Very fast', 'Random speed', 'Slow and steady', 'Whisper only'] },
  { prompt: 'In final consonants, Korean often reduces sounds to…', answer: 'A small final set', options: ['Full English-like endings', 'A small final set', 'No consonants at all', 'Always voiced endings'] },
  { prompt: 'Most useful feedback loop?', answer: 'Record and compare', options: ['Only read silently', 'Record and compare', 'Skip listening', 'Memorize without speaking'] },
  { prompt: 'Best way to improve intonation quickly?', answer: 'Shadow native audio', options: ['Avoid listening', 'Shadow native audio', 'Only study grammar', 'Speak once a week'] },
  { prompt: 'When unsure about 받침, you should…', answer: 'Check a native sample and repeat', options: ['Ignore it', 'Check a native sample and repeat', 'Replace with English sound', 'Drop final consonants always'] },
];

const QUESTION_SETS: Record<'vocab' | 'grammar' | 'pronunciation', QuizQuestion[]> = {
  vocab: termMatchingQuestions,
  grammar: grammarQuizQuestions,
  pronunciation: pronunciationDrillQuestions,
};

const QUIZ_ROUND_SIZE = 5;

function shuffled<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function makeRoundQuestions(type: 'vocab' | 'grammar' | 'pronunciation') {
  const all = QUESTION_SETS[type];
  return shuffled(all).slice(0, Math.min(QUIZ_ROUND_SIZE, all.length));
}

export function Games() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { userId } = useAuth();
  const [view, setView] = useState<'menu' | 'solo' | 'challenge' | 'teams'>('menu');
  const [gameMode, setGameMode] = useState<'menu' | 'vocab' | 'results'>('menu');
  const [soloGameType, setSoloGameType] = useState<'vocab' | 'grammar' | 'pronunciation'>('vocab');
  const [roundQuestions, setRoundQuestions] = useState<QuizQuestion[]>(() => makeRoundQuestions('vocab'));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengePartners, setChallengePartners] = useState<ChallengePartner[]>([]);
  const [challengePartnersLoading, setChallengePartnersLoading] = useState(false);
  const [selectedChallengePartnerId, setSelectedChallengePartnerId] = useState<string | null>(null);
  const [selectedChallengeGameType, setSelectedChallengeGameType] = useState<'vocab' | 'grammar' | 'pronunciation'>('vocab');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [apiTeam, setApiTeam] = useState<TeamRow | null>(null);
  const [myTeamRole, setMyTeamRole] = useState<string | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamFriendPool, setTeamFriendPool] = useState<FriendRow[]>([]);
  const [teamFriendPoolLoading, setTeamFriendPoolLoading] = useState(false);
  const [invitingFriendId, setInvitingFriendId] = useState<number | null>(null);
  const [pendingInvitedFriendIds, setPendingInvitedFriendIds] = useState<Set<number>>(new Set());
  const [teamInvites, setTeamInvites] = useState<TeamInviteRow[]>([]);
  const [teamInvitesLoading, setTeamInvitesLoading] = useState(false);
  const [actingTeamInviteId, setActingTeamInviteId] = useState<number | null>(null);
  const [challengeNotifCount, setChallengeNotifCount] = useState(0);
  const [teamNotifCount, setTeamNotifCount] = useState(0);
  const [findingMatch, setFindingMatch] = useState(false);
  const [matchedOpponentTeam, setMatchedOpponentTeam] = useState<TeamRow | null>(null);
  const [teamVsBoard, setTeamVsBoard] = useState<TeamVsBoard | null>(null);
  const [teamVsLoading, setTeamVsLoading] = useState(false);
  const [activeTeamQuestGameType, setActiveTeamQuestGameType] = useState<string | null>(null);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [playerXp, setPlayerXp] = useState<number | null>(null);
  const [playerLevel, setPlayerLevel] = useState<number | null>(null);
  const [playerXpToNext, setPlayerXpToNext] = useState<number | null>(null);
  const [playerBadges, setPlayerBadges] = useState<UserBadgeRow[]>([]);
  const [playerActivity, setPlayerActivity] = useState<{
    gamesPlayed: number;
    termMatching: number;
    grammarQuiz: number;
    pronunciation: number;
    perfectRounds: number;
  } | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [newBadges, setNewBadges] = useState<SubmitGameResultResponse['newBadges']>([]);
  const [submittingResult, setSubmittingResult] = useState(false);

  const refreshTeam = useCallback(async () => {
    if (!userId) {
      setApiTeam(null);
      setMyTeamRole(null);
      return;
    }
    setTeamLoading(true);
    try {
      const res = await fetchMyTeam(userId);
      setApiTeam(res?.team ?? null);
      setMyTeamRole(res?.myRole ?? null);
    } catch {
      setApiTeam(null);
      setMyTeamRole(null);
    } finally {
      setTeamLoading(false);
    }
  }, [userId]);

  const loadPlayerGamePanel = useCallback(async () => {
    if (!userId) {
      setPlayerXp(null);
      setPlayerLevel(null);
      setPlayerXpToNext(null);
      setPlayerBadges([]);
      setPlayerActivity(null);
      return;
    }
    setPlayerStatsLoading(true);
    try {
      const [stats, badges, leaderboard] = await Promise.all([
        fetchUserGameStats(userId),
        getUserBadges(userId),
        getFriendsLeaderboard(userId),
      ]);
      setPlayerXp(typeof stats?.xp === 'number' ? stats.xp : null);
      setPlayerLevel(typeof stats?.level === 'number' ? stats.level : null);
      setPlayerXpToNext(typeof stats?.xpToNext === 'number' ? stats.xpToNext : null);
      setPlayerBadges(badges);
      setFriendsLeaderboard(leaderboard);
      setPlayerActivity(
        stats?.gameActivity
          ? {
              gamesPlayed: stats.gameActivity.gamesPlayed || 0,
              termMatching: stats.gameActivity.termMatching || 0,
              grammarQuiz: stats.gameActivity.grammarQuiz || 0,
              pronunciation: stats.gameActivity.pronunciation || 0,
              perfectRounds: stats.gameActivity.perfectRounds || 0,
            }
          : null
      );
    } catch {
      setPlayerXp(null);
      setPlayerLevel(null);
      setPlayerXpToNext(null);
      setPlayerBadges([]);
      setPlayerActivity(null);
      setFriendsLeaderboard(null);
    } finally {
      setPlayerStatsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (view === 'teams') refreshTeam();
  }, [view, refreshTeam]);

  useEffect(() => {
    if (view === 'menu') void loadPlayerGamePanel();
  }, [loadPlayerGamePanel, view]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadPlayerGamePanel();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [loadPlayerGamePanel]);

  useEffect(() => {
    if (view !== 'teams') return;
    const timer = window.setInterval(() => {
      void refreshTeam();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [refreshTeam, view]);

  const [waitingForMatch, setWaitingForMatch] = useState(false);

  const hydrateCurrentMatch = useCallback(async () => {
    if (!userId) return;
    const res = await getCurrentTeamMatch(userId);
    if (!res) return;
    if (res.matched && res.opponent) {
      setMatchedOpponentTeam(res.opponent);
      setWaitingForMatch(false);
    } else {
      setMatchedOpponentTeam((prev) => (prev ? null : prev));
      setWaitingForMatch(Boolean(res.waiting));
    }
  }, [userId]);

  useEffect(() => {
    if (view !== 'teams' || !apiTeam?.id) return;
    void hydrateCurrentMatch();
  }, [view, apiTeam?.id, hydrateCurrentMatch]);

  useEffect(() => {
    if (view !== 'teams' || !apiTeam?.id) return;
    if (!waitingForMatch && matchedOpponentTeam) return;
    const timer = window.setInterval(() => {
      void hydrateCurrentMatch();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [view, apiTeam?.id, waitingForMatch, matchedOpponentTeam, hydrateCurrentMatch]);

  const loadTeamFriendPool = useCallback(async () => {
    if (!userId || !apiTeam) {
      setTeamFriendPool([]);
      return;
    }
    setTeamFriendPoolLoading(true);
    try {
      const friends = await getFriendsList(userId);
      const memberIds = new Set((apiTeam.members ?? []).map((m) => Number(m.userId)));
      setTeamFriendPool(friends.filter((f) => !memberIds.has(Number(f.id))));
    } catch {
      setTeamFriendPool([]);
    } finally {
      setTeamFriendPoolLoading(false);
    }
  }, [userId, apiTeam]);

  useEffect(() => {
    if (view === 'teams') {
      void loadTeamFriendPool();
    }
  }, [view, loadTeamFriendPool]);

  const loadTeamInvites = useCallback(async () => {
    if (!userId) {
      setTeamInvites([]);
      return;
    }
    setTeamInvitesLoading(true);
    try {
      const invites = await getPendingTeamInvites(userId);
      setTeamInvites(invites);
      setTeamNotifCount(invites.length);
    } catch {
      setTeamInvites([]);
      setTeamNotifCount(0);
    } finally {
      setTeamInvitesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (view === 'teams') {
      void loadTeamInvites();
    }
  }, [loadTeamInvites, view]);

  useEffect(() => {
    if (!apiTeam?.id || !matchedOpponentTeam?.id || view !== 'teams') {
      setTeamVsBoard(null);
      return;
    }
    void (async () => {
      setTeamVsLoading(true);
      try {
        const board = await getTeamVsBoard(apiTeam.id, matchedOpponentTeam.id);
        setTeamVsBoard(board);
      } finally {
        setTeamVsLoading(false);
      }
    })();
  }, [apiTeam?.id, matchedOpponentTeam?.id, view]);

  useEffect(() => {
    const requestedView = searchParams.get('view');
    if (requestedView === 'challenge') {
      setView('challenge');
      const preChallenged = searchParams.get('challenged');
      if (preChallenged) {
        setSelectedChallengePartnerId(preChallenged);
        setShowChallengeModal(true);
      }
      return;
    }
    if (requestedView === 'teams') {
      setView('teams');
      return;
    }
    const openBattle = searchParams.get('teamBattle');
    const opponentTeamId = Number(searchParams.get('opponentTeamId') || 0);
    const opponentName = searchParams.get('opponentName') || '';
    if (openBattle !== '1' || !opponentTeamId) return;

    setView('teams');
    setMatchedOpponentTeam({
      id: opponentTeamId,
      name: opponentName || `Team ${opponentTeamId}`,
      members: [],
    });
  }, [searchParams]);

  const loadChallenges = useCallback(async () => {
    if (!userId) {
      setChallenges([]);
      return;
    }
    setChallengesLoading(true);
    try {
      const rows = await getChallengesForUser(userId);
      setChallenges(rows);
      const myTurns = rows.filter((c) => {
        const isChallenger = Number(c.challengerId) === Number(userId);
        if (c.status === 'pending') return !isChallenger;
        if (c.status === 'accepted' || c.status === 'in_progress') {
          return isChallenger ? c.challengerScore == null : c.challengedScore == null;
        }
        return false;
      }).length;
      setChallengeNotifCount(myTurns);
    } catch {
      setChallenges([]);
      setChallengeNotifCount(0);
    } finally {
      setChallengesLoading(false);
    }
  }, [userId]);

  const loadChallengePartners = useCallback(async () => {
    if (!userId) {
      setChallengePartners([]);
      setChallengePartnersLoading(false);
      return;
    }
    setChallengePartnersLoading(true);
    try {
      const rows = await getFriendsList(userId);
      const mapped = rows.map(friendRowToChallengePartner);
      setChallengePartners(mapped);
      setSelectedChallengePartnerId((prev) => prev ?? mapped[0]?.id ?? null);
    } catch {
      setChallengePartners([]);
      setSelectedChallengePartnerId(null);
      toast.error(t('Could not load partners', '파트너를 불러오지 못했습니다'));
    } finally {
      setChallengePartnersLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    if (view === 'challenge' || showChallengeModal) {
      void loadChallengePartners();
    }
  }, [view, showChallengeModal, loadChallengePartners]);

  useEffect(() => {
    if (view === 'challenge') {
      void loadChallenges();
    }
  }, [loadChallenges, view]);

  useEffect(() => {
    if (!userId) return;
    void loadChallenges();
    void loadTeamInvites();
  }, [loadChallenges, loadTeamInvites, userId, view]);

  const activeQuestions = roundQuestions.length ? roundQuestions : makeRoundQuestions(soloGameType);
  const question = activeQuestions[currentQuestion] || activeQuestions[0];

  const startSoloGame = (type: 'vocab' | 'grammar' | 'pronunciation') => {
    setSoloGameType(type);
    setRoundQuestions(makeRoundQuestions(type));
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setGameMode('vocab');
    setView('solo');
  };
  const GAME_TYPE_MAP: Record<'vocab' | 'grammar' | 'pronunciation', GameType> = {
    vocab:         'term-matching',
    grammar:       'grammar-quiz',
    pronunciation: 'pronunciation-drill',
  };
  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowFeedback(true);
    const isCorrect = answer === question.answer;
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore((prev) => prev + 1);
 
  setTimeout(() => {
    console.log('timeout fired', {
      currentQuestion,
      total: activeQuestions.length,
      activeChallengeId,
      activeTeamQuestGameType,
      userId,
    });

    if (currentQuestion < activeQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      return;
    }

    console.log('last question reached');

    if (activeChallengeId && userId) {
      console.log('challenge path');
      // ...
    }

    if (activeTeamQuestGameType && userId) {
      console.log('team quest path');
      // ...
    }

    console.log('solo path - userId:', userId);
    if (userId) {
      console.log('calling submitGameResult');
      // ...
    }

    console.log('fallback - no userId');
    setGameMode('results');

    if (currentQuestion < activeQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      return;
    }
 
    // ── Last question reached ─────────────────────────────────────────────
 
    // Challenge flow: submit score to challenge endpoint
    if (activeChallengeId && userId) {
      void (async () => {
        const ok = await submitChallengeScoreApi(activeChallengeId, userId, nextScore);
        if (ok) {
          toast.success(t('Turn submitted. Now waiting for your partner.', '내 차례를 제출했습니다. 이제 상대 차례입니다.'));
          void loadChallenges();
          void loadPlayerGamePanel();
          setView('challenge');
          setGameMode('menu');
        } else {
          toast.error(t('Could not submit challenge score', '대결 점수를 제출하지 못했습니다'));
          setGameMode('results');
        }
        setActiveChallengeId(null);
      })();
      return;
    }
 
    // Team quest flow: increment quest progress
    if (activeTeamQuestGameType && userId) {
      void (async () => {
        const ok = await incrementTeamQuestProgress(userId, activeTeamQuestGameType);
        if (ok) {
          toast.success(t('Team quest progress updated!', '팀 퀘스트 진행도가 업데이트되었습니다!'));
          void loadPlayerGamePanel();
          if (apiTeam?.id && matchedOpponentTeam?.id) {
            const board = await getTeamVsBoard(apiTeam.id, matchedOpponentTeam.id);
            setTeamVsBoard(board);
          }
        } else {
          toast.error(t('Could not update team quest progress', '팀 퀘스트 진행도를 업데이트하지 못했습니다'));
        }
        setActiveTeamQuestGameType(null);
        setView('teams');
        setGameMode('menu');
      })();
      return;
    }
 
    // Solo flow: submit to backend for XP + badge awards, then show results
    if (userId) {
      setSubmittingResult(true);
      void (async () => {
        try {
          const result = await submitGameResult({
            userId,
            gameType: GAME_TYPE_MAP[soloGameType],
            score: nextScore,
            totalQuestions: activeQuestions.length,
          });
 
          if (result.errorCode === 0) {
            setXpEarned(result.xpAwarded ?? null);
            setNewBadges(result.newBadges ?? []);
            // Refresh the sidebar stats so XP bar & badges update immediately
            void loadPlayerGamePanel();
          } else {
            // Non-fatal: still show results even if submit failed
            setXpEarned(null);
            setNewBadges([]);
          }
        } catch {
          setXpEarned(null);
          setNewBadges([]);
        } finally {
          setSubmittingResult(false);
          setGameMode('results');
        }
      })();
      return;
    }
 
    // Fallback (no userId)
    setGameMode('results');
  }, 600);
};

  const resetGame = () => {
    setGameMode('menu');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setActiveTeamQuestGameType(null);
    setXpEarned(null);
    setNewBadges([]);
    setView('menu');
  };

  if (view === 'menu') {
    return (
      <div className="size-full flex items-center justify-center p-6 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Gamepad2 className="w-9 h-9 text-neutral-400 mx-auto mb-3" strokeWidth={1.5} />
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              {t('Language Games', '언어 게임')}
            </h2>
            <p className="text-neutral-600 text-sm">
              {t('Practice and improve your skills', '연습하고 실력을 향상시키세요')}
            </p>
          </div>

          <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <div className="flex items-center justify-between gap-3">
              {userId && playerLevel != null ? (
                <span className="text-sm font-semibold text-neutral-800">
                  {t('Lv', 'Lv')} {playerLevel}
                  {playerXp != null && playerXpToNext != null ? (
                    <span className="ml-1.5 text-xs font-normal text-neutral-500">
                      · {playerXp}/{playerXpToNext} XP
                    </span>
                  ) : null}
                </span>
              ) : <span />}
              <Link
                to={userId ? `/games/profile/${userId}` : '/games/profile'}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 whitespace-nowrap"
              >
                {t('View profile', '프로필 보기')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {playerStatsLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              </div>
            ) : !userId ? (
              <p className="mt-2 text-xs text-neutral-600">
                {t('Sign in to see your stats.', '통계를 보려면 로그인하세요.')}
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {playerXp != null && playerXpToNext != null && playerXpToNext > 0 ? (
                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((playerXp / playerXpToNext) * 100))}%`,
                      }}
                    />
                  </div>
                ) : null}

                {playerBadges.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {playerBadges.slice(0, 8).map((b) => (
                      <span
                        key={`${b.id}-${b.earnedAt || ''}`}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-700 ring-1 ring-stone-200"
                        title={b.description || b.name}
                      >
                        <span className="text-xs leading-none">{b.icon || '🏅'}</span>
                        <span className="max-w-[6rem] truncate">{b.name}</span>
                      </span>
                    ))}
                  </div>
                ) : null}

                {friendsLeaderboard && friendsLeaderboard.total > 1 && friendsLeaderboard.myRank ? (
                  (() => {
                    const myRank = friendsLeaderboard.myRank;
                    const total = friendsLeaderboard.total;
                    const ahead = friendsLeaderboard.entries.find((e) => e.rank === myRank - 1);
                    const aheadName = ahead ? `${ahead.firstName || 'A friend'}` : null;
                    const aheadGap = ahead ? Math.max(0, ahead.xp - friendsLeaderboard.myXp) : 0;
                    return (
                      <div className="flex items-center justify-between rounded-lg bg-white p-2 ring-1 ring-stone-200">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-[11px] font-semibold text-neutral-800">
                            #{myRank} {t('of', '/')} {total} {t('friends', '친구')}
                          </span>
                        </div>
                        {aheadName && aheadGap > 0 ? (
                          <span className="text-[10px] text-neutral-600">
                            {aheadGap} XP {t('to catch', '차이로')} {aheadName}
                          </span>
                        ) : myRank === 1 ? (
                          <span className="text-[10px] font-semibold text-emerald-600">{t('Top of the leaderboard 👑', '리더보드 1위 👑')}</span>
                        ) : null}
                      </div>
                    );
                  })()
                ) : null}

                {playerActivity ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="rounded-lg bg-white p-2 ring-1 ring-stone-200">
                      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                        <Gamepad2 className="h-3 w-3" />
                        {t('Games / Perfect', '게임 / 퍼펙트')}
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-neutral-900">
                        {playerActivity.gamesPlayed}
                        <span className="mx-1 text-neutral-400">/</span>
                        {playerActivity.perfectRounds}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-2 ring-1 ring-stone-200">
                      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                        <BookOpen className="h-3 w-3" />
                        {t('Terms', '단어')}
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-neutral-900">{playerActivity.termMatching}</div>
                    </div>
                    <div className="rounded-lg bg-white p-2 ring-1 ring-stone-200">
                      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                        <Target className="h-3 w-3" />
                        {t('Grammar', '문법')}
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-neutral-900">{playerActivity.grammarQuiz}</div>
                    </div>
                    <div className="rounded-lg bg-white p-2 ring-1 ring-stone-200">
                      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                        <Mic className="h-3 w-3" />
                        {t('Pron.', '발음')}
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-neutral-900">{playerActivity.pronunciation}</div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setView('solo');
                setGameMode('menu');
              }}
              className="w-full bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-0.5">
                    {t('Games', '게임')}
                  </h3>
                  <p className="text-sm text-green-100">
                    {t('Term matching, grammar quiz, and pronunciation drill', '단어 매칭 · 문법 퀴즈 · 발음 드릴')}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/80 group-hover:text-white transition-colors shrink-0" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setView('challenge')}
              className="relative w-full bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow text-left group"
            >
              {challengeNotifCount > 0 ? (
                <span className="absolute top-3 right-3 min-w-[1.2rem] h-[1.2rem] px-1 rounded-full bg-white text-orange-600 text-[10px] leading-[1.2rem] text-center font-bold">
                  {challengeNotifCount > 9 ? '9+' : challengeNotifCount}
                </span>
              ) : null}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Swords className="w-5 h-5 text-white" />
                    <h3 className="text-xl font-semibold text-white">
                      {t('1v1 Challenges', '1대1 대결')}
                    </h3>
                  </div>
                  <p className="text-sm text-orange-100">
                    {t('Challenge your partners to vocabulary battles', '파트너와 어휘 대결')}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setView('teams')}
              className="relative w-full bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow text-left group"
            >
              {teamNotifCount > 0 ? (
                <span className="absolute top-3 right-3 min-w-[1.2rem] h-[1.2rem] px-1 rounded-full bg-white text-blue-600 text-[10px] leading-[1.2rem] text-center font-bold">
                  {teamNotifCount > 9 ? '9+' : teamNotifCount}
                </span>
              ) : null}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-white" />
                    <h3 className="text-xl font-semibold text-white">
                      {t('Team Battles', '팀 대결')}
                    </h3>
                  </div>
                  <p className="text-sm text-blue-100">
                    {t('Form teams and compete against others', '팀을 만들어 다른 팀과 대결')}
                  </p>
                  {teamInvites.length > 0 ? (
                    <p className="mt-1 text-xs text-blue-100/95">
                      {t('Invites:', '초대:')}{' '}
                      {teamInvites
                        .slice(0, 2)
                        .map((invite) => getInviteTeamName(invite, t))
                        .join(', ')}
                      {teamInvites.length > 2 ? ` +${teamInvites.length - 2}` : ''}
                    </p>
                  ) : null}
                </div>
                <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'challenge') {
    return (
      <div className="size-full overflow-y-auto bg-gradient-to-b from-orange-50 to-neutral-50">
        <div className="max-w-2xl mx-auto p-6">
          <button
            onClick={() => setView('menu')}
            className="mb-6 text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
          >
            ← {t('Back', '뒤로')}
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">
              {t('1v1 Challenges', '1대1 대결')}
            </h2>
            <p className="text-neutral-600">
              {t('Challenge your partners to compete', '파트너와 경쟁하세요')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowChallengeModal(true)}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 flex items-center justify-center gap-2 mb-6 shadow-sm"
          >
            <span aria-hidden>⚔️</span>
            {t('New Challenge', '새 대결')}
          </button>

          <div className="space-y-4">
            {challengesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              </div>
            ) : null}
            {challenges.map(challenge => {
              const isChallenger = Number(challenge.challengerId) === Number(userId);
              const opponentName = isChallenger
                ? `${challenge.challenged?.firstName || ''} ${challenge.challenged?.lastName || ''}`.trim() || `User ${challenge.challengedId}`
                : `${challenge.challenger?.firstName || ''} ${challenge.challenger?.lastName || ''}`.trim() || `User ${challenge.challengerId}`;
              const myScore = isChallenger ? challenge.challengerScore : challenge.challengedScore;
              const opponentScore = isChallenger ? challenge.challengedScore : challenge.challengerScore;
              const myTurn =
                challenge.status === 'pending'
                  ? !isChallenger
                  : challenge.status === 'accepted' || challenge.status === 'in_progress'
                    ? myScore == null
                    : false;
              const statusLabel =
                challenge.status === 'pending'
                  ? myTurn ? t('My turn', '내 차례') : ''
                  : challenge.status === 'accepted' || challenge.status === 'in_progress'
                    ? myTurn ? t('My turn', '내 차례') : ''
                    : challenge.status === 'completed'
                      ? t('Completed', '완료')
                      : t('Ended', '종료');
              return (
              <div
                key={challenge.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('VS', '대')} {opponentName}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      challenge.status === 'in_progress' || challenge.status === 'accepted' ? 'bg-orange-100 text-orange-700' :
                      challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {statusLabel || t('In progress', '진행 중')}
                    </span>
                  </div>
                  <Swords className="w-6 h-6 text-orange-600" />
                </div>

                {challenge.status !== 'completed' && challenge.status !== 'declined' && challenge.status !== 'expired' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-600">{t('Your Score', '내 점수')}</span>
                      <span className="text-2xl font-bold text-blue-600">{myScore ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-neutral-600">{t('Opponent Score', '상대 점수')}</span>
                      <span className="text-2xl font-bold text-orange-600">{opponentScore ?? 0}</span>
                    </div>
                    {challenge.status === 'pending' && myTurn ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!userId) return;
                            const ok = await declineChallengeApi(String(challenge.id), userId);
                            if (ok) {
                              toast.success(t('Challenge declined', '대결을 거절했습니다'));
                              void loadChallenges();
                            }
                          }}
                          className="flex-1 bg-neutral-200 text-neutral-900 py-3 rounded-lg font-medium"
                        >
                          {t('Decline', '거절')}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!userId) return;
                            const ok = await acceptChallengeApi(String(challenge.id), userId);
                            if (ok) {
                              toast.success(t('Challenge accepted', '대결을 수락했습니다'));
                              void loadChallenges();
                            }
                          }}
                          className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700"
                        >
                          {t('Accept', '수락')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!myTurn) {
                            toast.message(t("It's your partner's turn", '상대 차례입니다'));
                            return;
                          }
                          setActiveChallengeId(String(challenge.id));
                          startSoloGame('vocab');
                        }}
                        disabled={!myTurn}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
                      >
                        {myTurn ? t('Continue Challenge', '대결 계속하기') : t("Opponent's turn", '상대 차례')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>

          {showChallengeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  if (!selectedChallengePartnerId || !userId) return;
                  e.preventDefault();
                  const selected = challengePartners.find((p) => p.id === selectedChallengePartnerId);
                  if (!selected) return;
                  void (async () => {
                    const created = await createChallengeApi(userId, selected.id, selectedChallengeGameType);
                    if (created) {
                      setShowChallengeModal(false);
                      toast.success(t('Challenge sent! Waiting for their turn.', '대결을 보냈습니다! 상대 차례를 기다리세요.'));
                      void loadChallenges();
                    } else {
                      toast.error(t('Could not create challenge', '대결을 만들지 못했습니다'));
                    }
                  })();
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-neutral-900">
                    {t('Challenge a Partner', '파트너에게 도전')}
                  </h3>
                  <Link
                    to="/partners"
                    onClick={() => setShowChallengeModal(false)}
                    className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                  >
                    {t('← Back to friends', '← 친구 목록')}
                  </Link>
                </div>
                <div className="space-y-3 mb-6">
                  {challengePartnersLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                    </div>
                  ) : challengePartners.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-600 text-center">
                      {t('No accepted partners yet.', '아직 수락된 파트너가 없습니다.')}
                    </div>
                  ) : (
                    challengePartners.map((partner) => (
                      <button
                        key={partner.id}
                        type="button"
                        onClick={() => setSelectedChallengePartnerId(partner.id)}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          selectedChallengePartnerId === partner.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{partner.avatar}</div>
                          <div>
                            <div className="font-semibold text-neutral-900">{partner.name}</div>
                            <div className="text-sm text-neutral-600">{partner.level}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                    {t('Game type', '게임 종류')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'vocab' as const, label: t('Term Match', '단어'), icon: '📖' },
                      { value: 'grammar' as const, label: t('Grammar', '문법'), icon: '🎯' },
                      { value: 'pronunciation' as const, label: t('Pron.', '발음'), icon: '🎤' },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedChallengeGameType(opt.value)}
                        className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                          selectedChallengeGameType === opt.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="mr-1">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChallengeModal(false)}
                    className="flex-1 bg-neutral-200 text-neutral-900 py-3 rounded-lg font-medium"
                  >
                    {t('Cancel', '취소')}
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedChallengePartnerId) {
                        toast.error(t('Choose a partner first', '먼저 파트너를 선택하세요'));
                        return;
                      }
                      const selected = challengePartners.find((p) => p.id === selectedChallengePartnerId);
                      if (!selected) {
                        toast.error(t('Choose a partner first', '먼저 파트너를 선택하세요'));
                        return;
                      }
                      if (!userId) return;
                      void (async () => {
                        const created = await createChallengeApi(userId, selected.id, selectedChallengeGameType);
                        if (created) {
                          setShowChallengeModal(false);
                          toast.success(t('Challenge sent! Waiting for their turn.', '대결을 보냈습니다! 상대 차례를 기다리세요.'));
                          void loadChallenges();
                        } else {
                          toast.error(t('Could not create challenge', '대결을 만들지 못했습니다'));
                        }
                      })();
                    }}
                    disabled={!selectedChallengePartnerId}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('Challenge', '도전')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'solo' && gameMode === 'menu') {
    return (
      <div className="size-full flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-3">
          <button onClick={resetGame} className="text-sm text-neutral-600 hover:text-neutral-900">
            ← {t('Back', '뒤로')}
          </button>
          <h3 className="text-xl font-bold text-neutral-900">{t('Choose a game mode', '게임 모드 선택')}</h3>
          <button
            type="button"
            onClick={() => startSoloGame('vocab')}
            className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-neutral-700" />
              <div>
                <p className="font-semibold text-neutral-900">{t('Term Matching', '단어 매칭')}</p>
                <p className="text-xs text-neutral-600">{t('Random vocabulary quiz each round', '매 라운드 랜덤 어휘 퀴즈')}</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => startSoloGame('grammar')}
            className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-neutral-700" />
              <div>
                <p className="font-semibold text-neutral-900">{t('Grammar Quiz', '문법 퀴즈')}</p>
                <p className="text-xs text-neutral-600">{t('Sentence patterns and particles', '문장 패턴과 조사')}</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => startSoloGame('pronunciation')}
            className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-neutral-700" />
              <div>
                <p className="font-semibold text-neutral-900">{t('Pronunciation Drill', '발음 드릴')}</p>
                <p className="text-xs text-neutral-600">{t('Sound and rhythm focused', '소리와 리듬 중심')}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'teams') {
    const memberLabels =
      apiTeam?.members?.map((m) => {
        if (userId && Number(m.userId) === Number(userId)) {
          const u = m.user;
          if (u?.firstName || u?.lastName) {
            return `${[u.firstName, u.lastName].filter(Boolean).join(' ')} (${t('you', '나')})`;
          }
          return t('You', '나');
        }
        const u = m.user;
        if (u?.firstName || u?.lastName) {
          return [u.firstName, u.lastName].filter(Boolean).join(' ');
        }
        return t('Member', '멤버');
      }) ?? [];

    return (
      <div className="size-full overflow-y-auto bg-gradient-to-b from-blue-50 to-neutral-50">
        <div className="max-w-2xl mx-auto p-6">
          <button
            type="button"
            onClick={() => setView('menu')}
            className="mb-6 text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
          >
            ← {t('Back', '뒤로')}
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">
              {t('Team Battles', '팀 대결')}
            </h2>
            <p className="text-neutral-600">
              {t('Create teams and compete together', '팀을 만들어 함께 경쟁하세요')}
            </p>
          </div>

          {!userId ? (
            <p className="text-sm text-neutral-600 mb-4">
              {t('Sign in to use teams.', '팀 기능을 쓰려면 로그인하세요.')}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!userId || !!apiTeam}
            onClick={() => {
              setNewTeamName('');
              setShowTeamModal(true);
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            {t('Create Team', '팀 만들기')}
          </button>

          {teamLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {teamInvitesLoading ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              ) : null}
              {teamInvites.length > 0 ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">
                    {t('Team invites for you', '받은 팀 초대')}
                  </h4>
                  <div className="space-y-3">
                    {teamInvites.map((invite) => (
                      <div key={invite.id} className="rounded-xl border border-blue-200 bg-white px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 truncate">
                              {getInviteTeamName(invite, t)}
                            </p>
                            <p className="text-xs text-neutral-600 truncate mt-0.5">
                              {t('Invited by', '초대한 사람')}:{' '}
                              {`${invite.inviter?.firstName || ''} ${invite.inviter?.lastName || ''}`.trim() ||
                                t('Team owner', '팀장')}
                            </p>
                          </div>
                          <span className="text-xs rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 shrink-0">
                            {t('Pending', '대기중')}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={actingTeamInviteId === invite.id}
                            onClick={async () => {
                              if (!userId) return;
                              setActingTeamInviteId(invite.id);
                              const ok = await declineTeamInvite(invite.id, userId);
                              setActingTeamInviteId(null);
                              if (ok) {
                                toast.success(t('Invite declined', '초대를 거절했습니다'));
                                void loadTeamInvites();
                              }
                            }}
                            className="flex-1 rounded-lg border border-neutral-300 bg-white py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            {t('Decline', '거절')}
                          </button>
                          <button
                            type="button"
                            disabled={actingTeamInviteId === invite.id}
                            onClick={async () => {
                              if (!userId) return;
                              setActingTeamInviteId(invite.id);
                              const res = await acceptTeamInvite(invite.id, userId);
                              setActingTeamInviteId(null);
                              if (res?.team) {
                                toast.success(t('Joined team', '팀에 참가했습니다'));
                                void refreshTeam();
                                void loadTeamInvites();
                              }
                            }}
                            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            {t('Accept', '수락')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {apiTeam ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-1 flex items-center gap-2">
                        <span>{apiTeam.logo || '🏆'}</span>
                        {apiTeam.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Users className="w-4 h-4" />
                        <span>
                          {memberLabels.length} {t('members', '멤버')}
                        </span>
                      </div>
                      {apiTeam.inviteCode ? (
                        <p className="text-xs text-neutral-500 mt-2 font-mono">
                          {t('Invite code', '초대 코드')}: {apiTeam.inviteCode}
                        </p>
                      ) : null}
                    </div>
                    <Crown className="w-6 h-6 text-yellow-500 shrink-0" />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {memberLabels.map((label, index) => (
                      <span
                        key={`${label}-${index}`}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{apiTeam.totalXP ?? 0}</div>
                      <div className="text-xs text-neutral-600">{t('Team XP', '팀 XP')}</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{memberLabels.length}</div>
                      <div className="text-xs text-neutral-600">{t('Roster', '로스터')}</div>
                    </div>
                  </div>

                  {matchedOpponentTeam ? (
                    <div className="mb-4 rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50 to-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-indigo-600 font-semibold">
                            {t('Team Quest Race', '팀 퀘스트 레이스')}
                          </p>
                          <h3 className="mt-1 text-base font-bold text-neutral-900">
                            {apiTeam.name} <span className="text-indigo-600">VS</span> {matchedOpponentTeam.name}
                          </h3>
                        </div>
                        <span className="text-[10px] rounded-full bg-indigo-100 text-indigo-700 px-2 py-1 font-semibold whitespace-nowrap">
                          {t('Active', '진행중')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mb-3">
                        {t(
                          'Complete quests before the other team. If both finish, earliest completion wins.',
                          '상대 팀보다 먼저 퀘스트를 완료하세요. 둘 다 완료하면 더 빨리 끝낸 팀이 승리합니다.'
                        )}
                      </p>
                      <div className="space-y-3">
                        {teamVsLoading ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                          </div>
                        ) : null}
                        {(teamVsBoard?.quests ?? []).map((quest) => (
                          <div key={`inline-quest-${quest.questId}`} className="rounded-xl border border-neutral-200 p-3 bg-white">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-neutral-900">{quest.title}</p>
                                <p className="text-xs text-neutral-600">{quest.description}</p>
                              </div>
                              <span
                                className={`text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap ${
                                  quest.leader === 'team'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : quest.leader === 'opponent'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                {quest.leader === 'team'
                                  ? t('Your team leads', '내 팀 우세')
                                  : quest.leader === 'opponent'
                                    ? t('Opponent leads', '상대 팀 우세')
                                    : t('Tied', '동점')}
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-neutral-600 truncate">{apiTeam.name}</p>
                                <p className="font-semibold text-neutral-900">
                                  {quest.team.progress}/{quest.goal}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-neutral-600 truncate">{matchedOpponentTeam.name}</p>
                                <p className="font-semibold text-neutral-900">
                                  {quest.opponent.progress}/{quest.goal}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const modeMap: Record<string, 'vocab' | 'grammar' | 'pronunciation'> = {
                                  'term-matching': 'vocab',
                                  'grammar-quiz': 'grammar',
                                  'pronunciation-drill': 'pronunciation',
                                };
                                const targetMode = modeMap[String(quest.gameType || '')] || 'vocab';
                                setActiveChallengeId(null);
                                setActiveTeamQuestGameType(String(quest.gameType || 'term-matching'));
                                startSoloGame(targetMode);
                              }}
                              className="mt-3 w-full rounded-lg bg-indigo-600 text-white py-2 text-xs font-semibold hover:bg-indigo-700"
                            >
                              {t('Play this quest', '이 퀘스트 플레이')}
                            </button>
                          </div>
                        ))}
                        {!teamVsLoading && (teamVsBoard?.quests ?? []).length === 0 ? (
                          <p className="text-center text-xs text-neutral-500 py-4">
                            {t('No active quests yet.', '아직 진행 중인 퀘스트가 없습니다.')}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!userId) return;
                          await endTeamMatch(userId);
                          setMatchedOpponentTeam(null);
                          setWaitingForMatch(false);
                          setTeamVsBoard(null);
                          toast.message(t('Match ended', '매치가 종료되었습니다'));
                        }}
                        className="mt-4 w-full rounded-lg border border-neutral-300 bg-white text-neutral-700 py-2 text-xs font-semibold hover:bg-neutral-50"
                      >
                        {t('End match', '매치 종료')}
                      </button>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mb-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900 mb-0.5">
                        {t('Invite friends to this team', '친구를 이 팀에 초대하기')}
                      </h4>
                      <p className="text-xs text-neutral-600">
                        {myTeamRole === 'owner'
                          ? t(
                              'Only accepted friends who are not already in this team appear here.',
                              '이 팀에 없는 수락된 친구만 여기에 표시됩니다.'
                            )
                          : t(
                              'Only the team owner can send team invites.',
                              '팀 초대는 팀장만 보낼 수 있습니다.'
                            )}
                      </p>
                    </div>

                    {teamFriendPoolLoading ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    ) : teamFriendPool.length === 0 ? (
                      <div className="text-xs text-neutral-600 rounded-lg border border-dashed border-neutral-300 bg-white p-3">
                        {t(
                          'No invite-ready friends found. Accept friends first or ask them to leave their current team.',
                          '초대 가능한 친구가 없습니다. 먼저 친구를 수락하거나, 친구가 기존 팀에서 나오도록 해주세요.'
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teamFriendPool.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2"
                          >
                            <span className="text-sm text-neutral-900">
                              {[friend.firstName, friend.lastName].filter(Boolean).join(' ').trim() || 'Partner'}
                            </span>
                            <button
                              type="button"
                              disabled={
                                myTeamRole !== 'owner' ||
                                invitingFriendId === Number(friend.id) ||
                                pendingInvitedFriendIds.has(Number(friend.id))
                              }
                              onClick={async () => {
                                if (!userId) return;
                                setInvitingFriendId(Number(friend.id));
                                try {
                                  await sendTeamInvite(userId, String(friend.id));
                                  setPendingInvitedFriendIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(Number(friend.id));
                                    return next;
                                  });
                                  toast.success(t('Invite sent', '초대를 보냈습니다'));
                                } catch (err: unknown) {
                                  const ax = err as { response?: { data?: { error?: string } }; message?: string };
                                  toast.error(
                                    ax.response?.data?.error ||
                                      ax.message ||
                                      t('Could not send invite', '초대를 보내지 못했습니다')
                                  );
                                } finally {
                                  setInvitingFriendId(null);
                                  void loadTeamFriendPool();
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                            >
                              {invitingFriendId === Number(friend.id) ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : null}
                              {pendingInvitedFriendIds.has(Number(friend.id))
                                ? t('Pending', '대기중')
                                : t('Invite', '초대')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!userId) return;
                      await endTeamMatch(userId);
                      const ok = await leaveTeam(userId);
                      if (!ok) {
                        toast.error(t('Could not leave team', '팀에서 나가지 못했습니다'));
                        return;
                      }
                      toast.success(t('You left the team', '팀에서 나왔습니다'));
                      setMatchedOpponentTeam(null);
                      setWaitingForMatch(false);
                      setTeamVsBoard(null);
                      await refreshTeam();
                      await loadTeamInvites();
                    }}
                    className="mb-4 w-full rounded-lg border border-red-300 bg-white text-red-600 py-2.5 text-sm font-semibold hover:bg-red-50"
                  >
                    {t('Leave Team', '팀 나가기')}
                  </button>

                  {!matchedOpponentTeam ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!userId) return;
                        setFindingMatch(true);
                        try {
                          const res = await findTeamMatch(userId);
                          if (res?.matched && res.opponent) {
                            setMatchedOpponentTeam(res.opponent);
                            setWaitingForMatch(false);
                            toast.success(
                              t('Matched against team', '상대 팀 매칭됨') + `: ${res.opponent.name || 'Opponent'}`
                            );
                          } else {
                            setMatchedOpponentTeam(null);
                            setWaitingForMatch(true);
                            toast.message(
                              t('Waiting for an opponent team', '상대 팀을 기다리는 중'),
                              {
                                description: t(
                                  "We'll match you as soon as another team taps Find Match.",
                                  '다른 팀이 매치 찾기를 누르면 바로 매칭됩니다.'
                                ),
                              }
                            );
                          }
                        } finally {
                          setFindingMatch(false);
                        }
                      }}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      disabled={findingMatch || waitingForMatch}
                    >
                      {(findingMatch || waitingForMatch) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {waitingForMatch
                        ? t('Waiting for opponent…', '상대 팀 대기 중…')
                        : t('Find Match', '매치 찾기')}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/80 p-8 text-center text-neutral-600 text-sm">
                  {t(
                    'You are not in a team yet. Create one with a unique name, then share the invite code with friends.',
                    '아직 팀이 없습니다. 팀 이름을 정하고 친구에게 초대 코드를 공유하세요.'
                  )}
                </div>
              )}
            </div>
          )}


          {showTeamModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  if (creatingTeam || !userId || !newTeamName.trim()) return;
                  e.preventDefault();
                  void (async () => {
                    setCreatingTeam(true);
                    try {
                      const { inviteCode } = await createTeam(userId, newTeamName.trim());
                      toast.success(
                        t('Team created!', '팀이 만들어졌습니다!') +
                          (inviteCode ? ` Code: ${inviteCode}` : '')
                      );
                      setShowTeamModal(false);
                      await refreshTeam();
                    } catch (err: unknown) {
                      const ax = err as { response?: { data?: { error?: string } }; message?: string };
                      toast.error(
                        ax.response?.data?.error ||
                          ax.message ||
                          t('Could not create team', '팀을 만들 수 없습니다')
                      );
                    } finally {
                      setCreatingTeam(false);
                    }
                  })();
                }}
              >
                <h3 className="text-xl font-bold text-neutral-900 mb-4">
                  {t('Create New Team', '새 팀 만들기')}
                </h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('Team Name', '팀 이름')}
                    </label>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder={t('Enter team name', '팀 이름 입력')}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    {t(
                      'After creating, use the invite code on this screen to add friends (they must leave any old team first).',
                      '생성 후 초대 코드로 친구를 추가하세요. (기존 팀에서 나와야 할 수 있습니다.)'
                    )}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    className="flex-1 bg-neutral-200 text-neutral-900 py-3 rounded-lg font-medium"
                  >
                    {t('Cancel', '취소')}
                  </button>
                  <button
                    type="button"
                    disabled={creatingTeam || !userId || !newTeamName.trim()}
                    onClick={async () => {
                      if (!userId) return;
                      setCreatingTeam(true);
                      try {
                        const { inviteCode } = await createTeam(userId, newTeamName.trim());
                        toast.success(
                          t('Team created!', '팀이 만들어졌습니다!') +
                            (inviteCode ? ` Code: ${inviteCode}` : '')
                        );
                        setShowTeamModal(false);
                        await refreshTeam();
                      } catch (err: unknown) {
                        const ax = err as { response?: { data?: { error?: string } }; message?: string };
                        toast.error(
                          ax.response?.data?.error ||
                            ax.message ||
                            t('Could not create team', '팀을 만들 수 없습니다')
                        );
                      } finally {
                        setCreatingTeam(false);
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {creatingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {t('Create', '만들기')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameMode === 'results') {
  const percentage = Math.round((score / activeQuestions.length) * 100);
  const isPerfect = score === activeQuestions.length;
 
  return (
    <div className="size-full flex items-center justify-center p-6 bg-gradient-to-b from-yellow-50 to-neutral-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        {/* Trophy emoji */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-8xl mb-4"
        >
          {isPerfect ? '🏆' : percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
        </motion.div>
 
        <h2 className="text-3xl font-bold text-neutral-900 mb-4">
          {isPerfect
            ? t('Perfect Round!', '퍼펙트 라운드!')
            : percentage >= 80
            ? t('Excellent!', '훌륭해요!')
            : percentage >= 60
            ? t('Good Job!', '잘했어요!')
            : t('Keep Practicing!', '계속 연습하세요!')}
        </h2>
 
        {/* Score card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-4 shadow-sm">
          <div className="text-5xl font-bold text-purple-600 mb-1">
            {score}/{activeQuestions.length}
          </div>
          <p className="text-neutral-500 text-sm">
            {percentage}% {t('correct', '정답')}
          </p>
        </div>
 
        {/* XP / submitting */}
        {submittingResult ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-4 flex items-center justify-center gap-2 text-sm text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('Saving your result…', '결과 저장 중…')}
          </div>
        ) : xpEarned != null ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center justify-center gap-2 text-amber-700 font-semibold text-lg">
              <Trophy className="w-5 h-5 text-amber-500" />
              +{xpEarned} XP {t('earned', '획득')}
            </div>
            {isPerfect && (
              <p className="text-xs text-amber-600 mt-1">
                {t('Perfect round bonus included!', '퍼펙트 라운드 보너스 포함!')}
              </p>
            )}
          </motion.div>
        ) : null}
 
        {/* New badges */}
        {(newBadges ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 text-left"
          >
            <p className="text-sm font-semibold text-blue-900 mb-3 text-center">
              🎖️ {t('New Badge Unlocked!', '새 배지 획득!')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {(newBadges ?? []).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 bg-white border border-blue-200 rounded-full px-3 py-1.5"
                >
                  <span className="text-lg leading-none">{badge.icon ?? '🏅'}</span>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">{badge.name}</p>
                    {badge.description && (
                      <p className="text-[10px] text-neutral-500">{badge.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
 
        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={resetGame}
            className="flex-1 bg-neutral-200 text-neutral-900 py-4 rounded-lg font-medium hover:bg-neutral-300 flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            {t('Back to Menu', '메뉴로')}
          </button>
          <button
            type="button"
            onClick={() => {
              setXpEarned(null);
              setNewBadges([]);
              startSoloGame(soloGameType);
            }}
            className="flex-1 bg-purple-600 text-white py-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            {t('Play Again', '다시 하기')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

  return (
    <div className="size-full flex items-center justify-center p-6 bg-gradient-to-b from-purple-50 to-neutral-50">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={resetGame}
            className="text-neutral-600 hover:text-neutral-900"
          >
            ← {t('Back', '뒤로')}
          </button>
          <div className="text-sm text-neutral-600">
            {t('Question', '문제')} {currentQuestion + 1}/{activeQuestions.length}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
            <Trophy className="w-4 h-4" />
            <span>{t('Score', '점수')}: {score}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-8 mb-6 text-center shadow-md">
          <p className="text-white/80 text-sm mb-2">
            {soloGameType === 'grammar'
              ? t('Pick the best grammar option', '가장 알맞은 문법을 고르세요')
              : soloGameType === 'pronunciation'
                ? t('Choose the best pronunciation answer', '가장 알맞은 발음 답을 고르세요')
                : t('Translate this word', '이 단어를 번역하세요')}
          </p>
          <h3 className="text-4xl font-bold text-white mb-4">
            {question.prompt}
          </h3>
          {question.hint ? <p className="text-white/80 text-xs">{question.hint}</p> : null}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.answer;
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              return (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !showFeedback && handleAnswer(option)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-xl font-medium text-left transition-all ${
                    showCorrect
                      ? 'bg-green-500 text-white'
                      : showWrong
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-neutral-900 hover:bg-purple-50 border border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showCorrect && <span>✓</span>}
                    {showWrong && <span>✗</span>}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function friendRowToChallengePartner(friend: FriendRow): ChallengePartner {
  const first = String(friend.firstName || '').trim();
  const last = String(friend.lastName || '').trim();
  const name = `${first} ${last}`.trim() || 'Partner';
  const seed = Number(friend.id) || 0;
  const avatarPool = ['👤', '🦊', '🐱', '🐼', '🐯', '🐻', '🐰', '🐨'];
  return {
    id: String(friend.id),
    name,
    level: 'Partner',
    avatar: avatarPool[Math.abs(seed) % avatarPool.length],
  };
}
