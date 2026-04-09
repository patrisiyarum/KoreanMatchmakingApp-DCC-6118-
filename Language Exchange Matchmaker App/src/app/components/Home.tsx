import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
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
    if (profile.name && profile.interests.length > 0) {
      navigate('/discover');
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
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome to LangMatch
          </h2>
          <p className="text-neutral-600">
            Connect with language partners worldwide
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                I speak
              </label>
              <select
                value={profile.nativeLanguage}
                onChange={(e) => setProfile(prev => ({ ...prev, nativeLanguage: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>English</option>
                <option>Korean</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                I'm learning
              </label>
              <select
                value={profile.learningLanguage}
                onChange={(e) => setProfile(prev => ({ ...prev, learningLanguage: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Korean</option>
                <option>English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              My Level
            </label>
            <select
              value={profile.level}
              onChange={(e) => setProfile(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Interests (select at least one)
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
            Start Matching
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
