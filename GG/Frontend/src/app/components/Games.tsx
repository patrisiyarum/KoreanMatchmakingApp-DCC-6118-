import { useState, useEffect, useCallback, useRef } from 'react';
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
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { initialMatches } from '../data/mockData';
import { createTeam, fetchMyTeam, type TeamRow } from '@/api/teamsApi';
import {
  fetchUserInterestNames,
  saveMatchmakingBioAndInterests,
} from '@/api/matchmakingProfileApi';
import { fetchUserAccount, fetchUserProfilePayload, uploadProfileImage } from '@/api/profileApi';
import { publicAssetUrl } from '../utils/profileImage';
import { PROFILE_INTEREST_OPTIONS } from '../constants/profileInterests';

interface VocabQuestion {
  korean: string;
  english: string;
  options: string[];
}

interface Challenge {
  id: string;
  opponentId: string;
  opponentName: string;
  status: 'pending' | 'active' | 'completed';
  myScore?: number;
  opponentScore?: number;
}

const vocabQuestions: VocabQuestion[] = [
  {
    korean: '안녕하세요',
    english: 'Hello',
    options: ['Hello', 'Goodbye', 'Thank you', 'Please']
  },
  {
    korean: '감사합니다',
    english: 'Thank you',
    options: ['Sorry', 'Thank you', 'Welcome', 'Excuse me']
  },
  {
    korean: '사랑해요',
    english: 'I love you',
    options: ['I love you', 'I like you', 'I miss you', 'I need you']
  },
  {
    korean: '배고파요',
    english: 'I\'m hungry',
    options: ['I\'m tired', 'I\'m hungry', 'I\'m thirsty', 'I\'m cold']
  },
  {
    korean: '물',
    english: 'Water',
    options: ['Water', 'Fire', 'Earth', 'Air']
  },
];

export function Games() {
  const { t } = useLanguage();
  const { userId } = useAuth();
  const [view, setView] = useState<'menu' | 'solo' | 'challenge' | 'teams'>('menu');
  const [gameMode, setGameMode] = useState<'menu' | 'vocab' | 'results'>('menu');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1',
      opponentId: 'user-2',
      opponentName: '지우 (Jiwoo)',
      status: 'active',
      myScore: 0,
      opponentScore: 0,
    }
  ]);

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [apiTeam, setApiTeam] = useState<TeamRow | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);

  const teamPhotoInputRef = useRef<HTMLInputElement>(null);
  const [teamBio, setTeamBio] = useState('');
  const [teamInterests, setTeamInterests] = useState<string[]>([]);
  const [teamProfileImage, setTeamProfileImage] = useState<string | null>(null);
  const [teamProfileLoading, setTeamProfileLoading] = useState(false);
  const [teamProfileSaving, setTeamProfileSaving] = useState(false);

  const refreshTeam = useCallback(async () => {
    if (!userId) {
      setApiTeam(null);
      return;
    }
    setTeamLoading(true);
    try {
      const res = await fetchMyTeam(userId);
      setApiTeam(res?.team ?? null);
    } catch {
      setApiTeam(null);
    } finally {
      setTeamLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (view === 'teams') refreshTeam();
  }, [view, refreshTeam]);

  const loadTeamMatchmakingProfile = useCallback(async () => {
    if (!userId) {
      setTeamBio('');
      setTeamInterests([]);
      setTeamProfileImage(null);
      return;
    }
    setTeamProfileLoading(true);
    try {
      const [account, interests, profile] = await Promise.all([
        fetchUserAccount(userId),
        fetchUserInterestNames(userId).catch(() => [] as string[]),
        fetchUserProfilePayload(userId),
      ]);
      setTeamProfileImage(account?.profileImage ?? null);
      setTeamBio(profile?.bio ?? '');
      setTeamInterests(interests.filter(Boolean));
    } catch {
      toast.error(t('Could not load your profile for discover', '디스커버용 프로필을 불러오지 못했습니다'));
    } finally {
      setTeamProfileLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    if (view === 'teams' && userId) loadTeamMatchmakingProfile();
  }, [view, userId, loadTeamMatchmakingProfile]);

  const toggleTeamInterest = (label: string) => {
    setTeamInterests((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const teamPhotoSrc = publicAssetUrl(teamProfileImage);

  const question = vocabQuestions[currentQuestion];

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowFeedback(true);

    if (answer === question.english) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion < vocabQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setGameMode('results');
      }
    }, 1500);
  };

  const resetGame = () => {
    setGameMode('menu');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
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

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setView('solo');
                setGameMode('vocab');
              }}
              className="w-full bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-0.5">
                    {t('Solo Practice', '혼자 연습')}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {t('Practice vocabulary at your own pace', '나만의 속도로 어휘 연습')}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setView('challenge')}
              className="w-full bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow text-left group"
            >
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
              className="w-full bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow text-left group"
            >
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
            {challenges.map(challenge => (
              <div
                key={challenge.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {t('VS', '대')} {challenge.opponentName}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      challenge.status === 'active' ? 'bg-orange-100 text-orange-700' :
                      challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {challenge.status === 'active' ? t('Active', '진행중') :
                       challenge.status === 'pending' ? t('Pending', '대기중') :
                       t('Completed', '완료')}
                    </span>
                  </div>
                  <Swords className="w-6 h-6 text-orange-600" />
                </div>

                {challenge.status === 'active' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-600">{t('Your Score', '내 점수')}</span>
                      <span className="text-2xl font-bold text-blue-600">{challenge.myScore}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-neutral-600">{t('Opponent Score', '상대 점수')}</span>
                      <span className="text-2xl font-bold text-orange-600">{challenge.opponentScore}</span>
                    </div>
                    <button
                      onClick={() => {
                        setView('solo');
                        setGameMode('vocab');
                      }}
                      className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700"
                    >
                      {t('Continue Challenge', '대결 계속하기')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showChallengeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-neutral-900 mb-4">
                  {t('Challenge a Partner', '파트너에게 도전')}
                </h3>
                <div className="space-y-3 mb-6">
                  {initialMatches.map(match => (
                    <button
                      key={match.user.id}
                      className="w-full p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{match.user.avatar}</div>
                        <div>
                          <div className="font-semibold text-neutral-900">{match.user.name}</div>
                          <div className="text-sm text-neutral-600">{match.user.level}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChallengeModal(false)}
                    className="flex-1 bg-neutral-200 text-neutral-900 py-3 rounded-lg font-medium"
                  >
                    {t('Cancel', '취소')}
                  </button>
                  <button
                    onClick={() => setShowChallengeModal(false)}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium"
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

                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 mb-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-violet-950 mb-0.5">
                        {t('Your discover profile', '디스커버에 보일 프로필')}
                      </h4>
                      <p className="text-xs text-violet-800/90">
                        {t(
                          'Add a photo, short bio, and interests before finding a match so partners see the real you.',
                          '매치 찾기 전에 사진·소개·관심사를 저장하면 파트너에게 그대로 보여요.'
                        )}
                      </p>
                    </div>

                    {teamProfileLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            {teamPhotoSrc ? (
                              <img
                                src={teamPhotoSrc}
                                alt=""
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-xl font-medium border-2 border-white shadow">
                                ?
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => teamPhotoInputRef.current?.click()}
                              disabled={!userId}
                              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-violet-200 shadow flex items-center justify-center text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                              aria-label={t('Upload photo', '사진 업로드')}
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                            <input
                              ref={teamPhotoInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !userId) return;
                                try {
                                  const { profileImage } = await uploadProfileImage(userId, file);
                                  setTeamProfileImage(profileImage);
                                  toast.success(t('Photo updated', '사진이 업데이트되었습니다'));
                                } catch {
                                  toast.error(t('Upload failed', '업로드 실패'));
                                }
                                e.target.value = '';
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            {t('Bio', '소개')}{' '}
                            <span className="text-neutral-500 font-normal">
                              {t('(optional)', '(선택)')}
                            </span>
                          </label>
                          <textarea
                            value={teamBio}
                            onChange={(e) => setTeamBio(e.target.value)}
                            rows={3}
                            maxLength={2000}
                            placeholder={t(
                              'Say hello! What do you want to practice? Favorite topics?',
                              '인사와 연습 목표, 좋아하는 주제를 적어 보세요.'
                            )}
                            className="w-full px-3 py-2 rounded-lg border border-violet-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y min-h-[72px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-2">
                            {t('Interests', '관심사')}{' '}
                            <span className="text-neutral-500 font-normal">({t('choose at least one', '하나 이상')})</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {PROFILE_INTEREST_OPTIONS.map((label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => toggleTeamInterest(label)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  teamInterests.includes(label)
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-white text-neutral-700 border border-violet-200 hover:bg-violet-100/80'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!userId || teamProfileSaving || teamInterests.length === 0}
                          onClick={async () => {
                            if (!userId) return;
                            setTeamProfileSaving(true);
                            try {
                              const res = await saveMatchmakingBioAndInterests(userId, teamBio, teamInterests);
                              if (!res.ok) {
                                toast.error(res.message || t('Save failed', '저장 실패'));
                                return;
                              }
                              toast.success(
                                t('Profile saved for Discover', '디스커버용 프로필이 저장되었습니다')
                              );
                            } finally {
                              setTeamProfileSaving(false);
                            }
                          }}
                          className="w-full py-2.5 rounded-lg font-medium text-sm bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          {teamProfileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {t('Save bio & interests', '소개·관심사 저장')}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toast.message(t('Finding opponents…', '상대 찾는 중…'), {
                        description: t(
                          'Team matchmaking will pair you when another team is ready. Play solo or 1v1 while you wait.',
                          '다른 팀이 준비되면 매칭됩니다. 그동안 혼자 또는 1대1을 즐겨 보세요.'
                        ),
                      })
                    }
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                  >
                    {t('Find Match', '매치 찾기')}
                  </button>
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
    const percentage = Math.round((score / vocabQuestions.length) * 100);

    return (
      <div className="size-full flex items-center justify-center p-6 bg-gradient-to-b from-yellow-50 to-neutral-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-8xl mb-6"
          >
            {percentage >= 80 ? '🏆' : percentage >= 60 ? '🎉' : '💪'}
          </motion.div>

          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            {percentage >= 80 ? t('Excellent!', '훌륭해요!') :
             percentage >= 60 ? t('Good Job!', '잘했어요!') :
             t('Keep Practicing!', '계속 연습하세요!')}
          </h2>

          <div className="bg-white rounded-2xl border border-neutral-200 p-8 mb-6">
            <div className="text-5xl font-bold text-purple-600 mb-2">
              {score}/{vocabQuestions.length}
            </div>
            <p className="text-neutral-600">
              {percentage}% {t('correct', '정답')}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetGame}
              className="flex-1 bg-neutral-200 text-neutral-900 py-4 rounded-lg font-medium hover:bg-neutral-300 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              {t('Back to Menu', '메뉴로')}
            </button>
            <button
              onClick={() => {
                setCurrentQuestion(0);
                setScore(0);
                setSelectedAnswer(null);
                setShowFeedback(false);
                setGameMode('vocab');
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
            {t('Question', '문제')} {currentQuestion + 1}/{vocabQuestions.length}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
            <Trophy className="w-4 h-4" />
            <span>{t('Score', '점수')}: {score}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-8 mb-6 text-center shadow-md">
          <p className="text-white/80 text-sm mb-2">
            {t('Translate this word', '이 단어를 번역하세요')}
          </p>
          <h3 className="text-4xl font-bold text-white mb-4">
            {question.korean}
          </h3>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.english;
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
