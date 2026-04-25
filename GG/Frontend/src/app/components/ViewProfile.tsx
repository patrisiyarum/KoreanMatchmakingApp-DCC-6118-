import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { publicAssetUrl } from '../utils/profileImage';
import {
  fetchUserAccount,
  fetchUserProfilePayload,
  fetchUserGameStats,
} from '@/api/profileApi';
import { fetchUserInterestNames } from '@/api/matchmakingProfileApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InfoCardProps {
  label: string;
  value: string | number | null | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoCard({ label, value }: InfoCardProps) {
  if (value === '' || value === null || value === undefined) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
      <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-900">{String(value)}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ViewProfile() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { t } = useLanguage();

  const [dataLoaded, setDataLoaded] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImgError, setProfileImgError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Account
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Profile
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageProficiency, setTargetLanguageProficiency] = useState('');
  const [age, setAge] = useState<string | number>('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('');
  const [mbti, setMbti] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [defaultTimeZone, setDefaultTimeZone] = useState('');
  const [visibility, setVisibility] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [gameStats, setGameStats] = useState<{
    gamesPlayed: number;
    termMatching: number;
    grammarQuiz: number;
    pronunciation: number;
    perfectRounds: number;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadAll = async () => {
      try {
        const [account, profileRow, statsRes, interestNames] = await Promise.all([
          fetchUserAccount(userId),
          fetchUserProfilePayload(userId),
          fetchUserGameStats(userId),
          fetchUserInterestNames(userId).catch(() => [] as string[]),
        ]);

        if (account) {
          setFirstName(account.firstName || '');
          setLastName(account.lastName || '');
          setEmail(account.email || '');
          setProfileImage(account.profileImage ?? null);
        }

        if (profileRow && profileRow.id != null) {
          setNativeLanguage(profileRow.native_language || '');
          setTargetLanguage(profileRow.target_language || '');
          setTargetLanguageProficiency(profileRow.target_language_proficiency || '');
          setAge(profileRow.age ?? '');
          setGender(profileRow.gender || '');
          setProfession(profileRow.profession || '');
          setMbti(profileRow.mbti || '');
          setZodiac(profileRow.zodiac || '');
          setDefaultTimeZone(profileRow.default_time_zone || '');
          setVisibility(profileRow.visibility || '');
          setLearningGoal(profileRow.learning_goal || '');
          setCommunicationStyle(profileRow.communication_style || '');
          setBio(profileRow.bio != null ? String(profileRow.bio) : '');
          if (profileRow.commitment_level != null) {
            setCommitmentLevel(Number(profileRow.commitment_level));
          }
        }

        setGameStats(
          statsRes?.gameActivity
            ? {
                gamesPlayed: statsRes.gameActivity.gamesPlayed || 0,
                termMatching: statsRes.gameActivity.termMatching || 0,
                grammarQuiz: statsRes.gameActivity.grammarQuiz || 0,
                pronunciation: statsRes.gameActivity.pronunciation || 0,
                perfectRounds: statsRes.gameActivity.perfectRounds || 0,
              }
            : null
        );

        setInterests(interestNames.length ? [...interestNames] : []);
      } catch (err) {
        console.error('Error loading view profile:', err);
      } finally {
        setDataLoaded(true);
      }
    };

    loadAll();
  }, [userId]);

  const getInitial = () => (firstName ? firstName.charAt(0).toUpperCase() : '?');

  const handleLogout = () => navigate('/login');

  const photoSrc = publicAssetUrl(profileImage);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (!dataLoaded) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-5">

          {/* ── Avatar + Name ── */}
          <div className="flex flex-col items-center text-center gap-2">
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-200 bg-neutral-100 shadow-sm">
              {photoSrc && !profileImgError ? (
                <img
                  src={photoSrc}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={() => setProfileImgError(true)}
                />
              ) : (
                <span className="text-3xl font-semibold text-neutral-500">{getInitial()}</span>
              )}
            </span>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">
                {firstName} {lastName}
              </h1>
              {email && <p className="text-sm text-neutral-500">{email}</p>}
              {visibility && (
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
                    visibility === 'Show'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {visibility === 'Show' ? '🌐 Public Profile' : '🔒 Private Profile'}
                </span>
              )}
            </div>
          </div>

          {/* ── Languages ── */}
          <div>
            <p className="text-sm font-semibold text-neutral-900 mb-2">{t('Languages', '언어')}</p>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label={t('Native Language', '모국어')} value={nativeLanguage} />
              <InfoCard label={t('Target Language', '배우는 언어')} value={targetLanguage} />
              <InfoCard label={t('Proficiency Level', '레벨')} value={targetLanguageProficiency} />
            </div>
          </div>

          {/* ── About ── */}
          <div>
            <p className="text-sm font-semibold text-neutral-900 mb-2">{t('About', '소개')}</p>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label={t('Age', '나이')} value={age} />
              <InfoCard label={t('Gender', '성별')} value={gender} />
              <InfoCard label={t('Profession', '직업')} value={profession} />
              <InfoCard label="MBTI" value={mbti} />
              <InfoCard label={t('Zodiac', '별자리')} value={zodiac} />
            </div>
          </div>

          {/* ── Bio ── */}
          {bio && (
            <div>
              <p className="text-sm font-semibold text-neutral-900 mb-2">Bio</p>
              <p className="text-sm text-neutral-700 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                {bio}
              </p>
            </div>
          )}

          {/* ── Learning Style ── */}
          <div>
            <p className="text-sm font-semibold text-neutral-900 mb-2">{t('Learning Style', '학습 스타일')}</p>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label={t('Learning Goal', '학습 목표')} value={learningGoal} />
              <InfoCard label={t('Communication Style', '소통 방식')} value={communicationStyle} />
              <InfoCard label={t('Time Zone', '시간대')} value={defaultTimeZone} />
            </div>
            {commitmentLevel != null && (
              <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <p className="text-xs text-neutral-500 mb-1">{t('Commitment Level', '헌신도')}</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`text-xl ${n <= commitmentLevel ? 'text-yellow-400' : 'text-neutral-300'}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-1 text-xs text-neutral-500">
                    {commitmentLevel <= 2
                      ? t('Casual', '캐주얼')
                      : commitmentLevel >= 4
                      ? t('Very committed', '매우 헌신적')
                      : t('Moderate', '보통')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Game Stats ── */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">{t('Game stats', '게임 통계')}</p>
              <button
                type="button"
                onClick={() => navigate(userId ? `/games/profile/${userId}` : '/games/profile')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                {t('Games profile', '게임 프로필')}
              </button>
            </div>
            {gameStats ? (
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700">
                <div>{t('Games played', '플레이한 게임')}: <span className="font-semibold">{gameStats.gamesPlayed}</span></div>
                <div>{t('Perfect rounds', '퍼펙트 라운드')}: <span className="font-semibold">{gameStats.perfectRounds}</span></div>
                <div>{t('Term matching', '단어 매칭')}: <span className="font-semibold">{gameStats.termMatching}</span></div>
                <div>{t('Grammar quiz', '문법 퀴즈')}: <span className="font-semibold">{gameStats.grammarQuiz}</span></div>
                <div>{t('Pronunciation', '발음')}: <span className="font-semibold">{gameStats.pronunciation}</span></div>
              </div>
            ) : (
              <p className="text-xs text-neutral-600">{t('No game stats yet.', '아직 게임 통계가 없습니다.')}</p>
            )}
          </div>

          {/* ── Interests ── */}
          {interests.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-neutral-900 mb-2">{t('Interests', '관심사')}</p>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate('/edit-profile')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('Edit Profile', '프로필 편집')}
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex-1 py-3 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              {t('Log Out', '로그아웃')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Logout Modal ── */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-neutral-200 p-6 w-full max-w-sm mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-neutral-900">{t('Log out?', '로그아웃?')}</h3>
            <p className="text-sm text-neutral-600">{t('Are you sure you want to log out?', '정말 로그아웃하시겠습니까?')}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {t('Cancel', '취소')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                {t('Log Out', '로그아웃')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}