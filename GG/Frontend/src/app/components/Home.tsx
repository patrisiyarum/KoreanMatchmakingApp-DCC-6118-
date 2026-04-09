import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userId } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    nativeLanguage: 'English',
    learningLanguage: 'Korean',
    interests: [] as string[],
    level: 'Intermediate',
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

  const handleStart = () => {
    if (!(profile.name && profile.interests.length > 0)) return;
    if (!userId) {
      navigate('/login');
      return;
    }
    navigate('/discover');
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

          <button
            onClick={handleStart}
            disabled={!profile.name || profile.interests.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            <span>Start Matching</span>
            <span className="text-blue-100">•</span>
            <span>시작하기</span>
            <ChevronRight className="w-5 h-5" />
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
