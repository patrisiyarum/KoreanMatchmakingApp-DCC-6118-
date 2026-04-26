import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Gamepad2, Loader2, Shield, Swords, Trophy, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchUserGameStats, fetchUserAccount } from '@/api/profileApi';
import { getUserBadges, type UserBadgeRow } from '@/api/badgesApi';
import { getChallengesForUser } from '@/api/challengesApi';
import { fetchMyTeam } from '@/api/teamsApi';

export function GamesProfile() {
  const { t } = useLanguage();
  const { userId: authUserId } = useAuth();
  const { userId: routeUserId } = useParams();
  const targetUserId = routeUserId || authUserId || '';
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string>('');
  const [xp, setXp] = useState<number | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [xpToNext, setXpToNext] = useState<number | null>(null);
  const [badges, setBadges] = useState<UserBadgeRow[]>([]);
  const [activity, setActivity] = useState<{
    gamesPlayed: number;
    termMatching: number;
    grammarQuiz: number;
    pronunciation: number;
    perfectRounds: number;
  } | null>(null);
  const [challengeSummary, setChallengeSummary] = useState({
    completed: 0,
    pending: 0,
    inProgress: 0,
  });
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [account, stats, userBadges, challenges, team] = await Promise.all([
          fetchUserAccount(targetUserId),
          fetchUserGameStats(targetUserId),
          getUserBadges(targetUserId),
          getChallengesForUser(targetUserId),
          fetchMyTeam(targetUserId),
        ]);
        if (cancelled) return;

        setName(`${account?.firstName || ''} ${account?.lastName || ''}`.trim());
        setXp(typeof stats?.xp === 'number' ? stats.xp : null);
        setLevel(typeof stats?.level === 'number' ? stats.level : null);
        setXpToNext(typeof stats?.xpToNext === 'number' ? stats.xpToNext : null);
        setBadges(userBadges);
        setActivity(
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
        setChallengeSummary({
          completed: challenges.filter((c) => c.status === 'completed').length,
          pending: challenges.filter((c) => c.status === 'pending').length,
          inProgress: challenges.filter((c) => c.status === 'accepted' || c.status === 'in_progress').length,
        });
        setTeamName(team?.team?.name || null);
        setTeamMembers(team?.team?.members?.length || 0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  const progress = useMemo(() => {
    if (xp == null || xpToNext == null || xpToNext <= 0) return 0;
    return Math.min(100, Math.round((xp / xpToNext) * 100));
  }, [xp, xpToNext]);

  if (!targetUserId) {
    return <div className="p-6 text-sm text-neutral-600">{t('Sign in to view game profile.', '게임 프로필을 보려면 로그인하세요.')}</div>;
  }

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="size-full overflow-y-auto bg-neutral-50">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="rounded-2xl bg-white border border-neutral-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">
                {t('Games Profile', '게임 프로필')}
              </p>
              <h2 className="text-2xl font-bold text-neutral-900 mt-1">
                {name || t('Player', '플레이어')}
              </h2>
            </div>
            <Gamepad2 className="w-7 h-7 text-blue-600" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 font-semibold">
              {t('Level', '레벨')} {level ?? '—'}
            </span>
            <span className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-700 px-3 py-1 font-medium">
              XP {xp ?? '—'}{xpToNext != null ? ` / ${xpToNext}` : ''}
            </span>
          </div>
          <div className="mt-3 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-neutral-900">{t('Badges', '배지')}</p>
          </div>
          {badges.length ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={`${b.id}-${b.earnedAt || ''}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-800"
                >
                  <span>{b.icon || '🏅'}</span>
                  <span>{b.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-600">{t('No badges yet.', '아직 배지가 없습니다.')}</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/games?view=challenge" className="rounded-2xl bg-white border border-neutral-200 p-5 block hover:border-orange-300 hover:shadow-sm transition">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-orange-500" />
              <p className="text-sm font-semibold text-neutral-900">{t('Challenges', '대결')}</p>
            </div>
            <div className="space-y-1 text-sm text-neutral-700">
              <p>{t('Completed', '완료')}: <span className="font-semibold">{challengeSummary.completed}</span></p>
              <p>{t('In progress', '진행 중')}: <span className="font-semibold">{challengeSummary.inProgress}</span></p>
              <p>{t('Pending', '대기')}: <span className="font-semibold">{challengeSummary.pending}</span></p>
            </div>
            <p className="mt-2 text-xs text-neutral-500">{t('Tap to open challenges in Games.', '탭하여 게임의 대결로 이동하세요.')}</p>
          </Link>

          <Link to="/games?view=teams" className="rounded-2xl bg-white border border-neutral-200 p-5 block hover:border-indigo-300 hover:shadow-sm transition">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-semibold text-neutral-900">{t('Team battles', '팀 대결')}</p>
            </div>
            {teamName ? (
              <div className="space-y-1 text-sm text-neutral-700">
                <p className="font-semibold text-neutral-900">{teamName}</p>
                <p>{t('Members', '멤버')}: <span className="font-semibold">{teamMembers}</span></p>
                <p className="text-xs text-neutral-500">{t('Open Games to continue quests and battles.', '게임에서 퀘스트와 팀 대결을 계속하세요.')}</p>
              </div>
            ) : (
              <p className="text-sm text-neutral-600">{t('No active team yet.', '아직 활성 팀이 없습니다.')}</p>
            )}
          </Link>
        </div>

        {activity ? (
          <div className="rounded-2xl bg-white border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-neutral-900">{t('Game activity', '게임 활동')}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-neutral-700">
              <p>{t('Games', '게임')}: <span className="font-semibold">{activity.gamesPlayed}</span></p>
              <p>{t('Perfect', '퍼펙트')}: <span className="font-semibold">{activity.perfectRounds}</span></p>
              <p>{t('Terms', '단어')}: <span className="font-semibold">{activity.termMatching}</span></p>
              <p>{t('Grammar', '문법')}: <span className="font-semibold">{activity.grammarQuiz}</span></p>
              <p className="col-span-2">{t('Pronunciation', '발음')}: <span className="font-semibold">{activity.pronunciation}</span></p>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
