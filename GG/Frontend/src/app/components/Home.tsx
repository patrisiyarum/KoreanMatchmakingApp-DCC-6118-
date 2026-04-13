import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { saveWelcomeProfile } from '@/api/matchmakingProfileApi';
import { uploadProfileImage } from '@/api/profileApi';

export function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userId } = useAuth();
  const photoRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    nativeLanguage: 'English',
    learningLanguage: 'Korean',
    interests: [] as string[],
    level: 'Beginner',
    bio: '',
  });

  const interestOptions = [
    'K-pop', 'Gaming', 'Cooking', 'Movies', 'Sports',
    'Art', 'Music', 'Technology', 'Travel', 'Anime'
  ];

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleStart = async () => {
    if (!(profile.name && profile.interests.length > 0)) return;
    if (!userId) {
      navigate('/login');
      return;
    }
    const trimmed = profile.name.trim();
    const parts = trimmed.split(/\s+/);
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || '';
    setStarting(true);
    try {
      const res = await saveWelcomeProfile({
        userId,
        firstName,
        lastName,
        nativeLanguage: profile.nativeLanguage,
        learningLanguage: profile.learningLanguage,
        proficiency: profile.level,
        interestNames: profile.interests,
        bio: profile.bio,
      });
      if (!res.ok) {
        toast.error(res.message || 'Could not save your profile');
        return;
      }
      if (pendingPhoto) {
        try {
          await uploadProfileImage(userId, pendingPhoto);
        } catch {
          toast.error('Photo upload failed — you can add one later in Profile.');
        }
      }
      navigate('/discover');
    } catch {
      toast.error('Could not save your profile');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🇰🇷 🇺🇸</div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome to LangMatch
          </h2>
          <p className="text-lg text-blue-600 mb-1">
            환영합니다
          </p>
          <p className="text-neutral-600">
            Connect with language partners worldwide
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Your Name <span className="text-neutral-500">이름</span>
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name • 이름을 입력하세요"
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                I speak <span className="text-neutral-500">모국어</span>
              </label>
              <select
                value={profile.nativeLanguage}
                onChange={(e) => setProfile(prev => ({ ...prev, nativeLanguage: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>English</option>
                <option>Korean 한국어</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                I'm learning <span className="text-neutral-500">배우는 언어</span>
              </label>
              <select
                value={profile.learningLanguage}
                onChange={(e) => setProfile(prev => ({ ...prev, learningLanguage: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Korean 한국어</option>
                <option>English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              My Level <span className="text-neutral-500">레벨</span>
            </label>
            <select
              value={profile.level}
              onChange={(e) => setProfile(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Beginner 초급</option>
              <option>Intermediate 중급</option>
              <option>Advanced 고급</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Interests <span className="text-neutral-500">관심사</span> <span className="text-xs text-neutral-500">(select at least one)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    profile.interests.includes(interest)
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio <span className="text-neutral-500">소개</span>{' '}
              <span className="text-xs text-neutral-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              rows={3}
              maxLength={2000}
              placeholder="A short intro for your Discover card • 디스커버 카드에 보일 짧은 소개"
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Profile photo <span className="text-neutral-500">프로필 사진</span>{' '}
              <span className="text-xs text-neutral-500 font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="relative w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 shrink-0"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </button>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPendingPhoto(file);
                  setPhotoPreview(URL.createObjectURL(file));
                  e.target.value = '';
                }}
              />
              <p className="text-xs text-neutral-600">
                {userId
                  ? 'Saved when you start — or add later in Profile.'
                  : 'After login, your photo uploads when you start matching.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={starting || !profile.name || profile.interests.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>Start Matching</span>
            <span className="text-blue-100">•</span>
            <span>시작하기</span>
            {!starting ? <ChevronRight className="w-5 h-5" /> : null}
          </button>
          <p className="text-center text-sm text-neutral-600">
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              {t('Already have an account? Login', '이미 계정이 있나요? 로그인')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
