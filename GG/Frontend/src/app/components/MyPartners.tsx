import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { MessageSquare, Gamepad2, Calendar } from 'lucide-react';
import { initialMatches } from '../data/mockData';
import { Match } from '../types';
import { useLanguage } from '../context/LanguageContext';

export function MyPartners() {
  const [matches] = useState<Match[]>(initialMatches);
  const { t } = useLanguage();

  if (matches.length === 0) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            No partners yet
          </h3>
          <p className="text-neutral-600 mb-6">
            Start swiping to find your perfect study buddy!
          </p>
          <Link
            to="/discover"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Find Partners
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">
            {t('My Study Partners', '내 파트너')}
          </h2>
          <p className="text-neutral-600">
            {matches.length === 1
              ? t('1 active match', '활성 매치 1개')
              : `${matches.length} ${t('active matches', '활성 매치')}`}
          </p>
        </div>

        {matches.map((match, index) => (
          <motion.div
            key={match.user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="text-5xl">{match.user.avatar}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {match.user.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                  <span>{match.user.nativeLanguage}</span>
                  <span>↔</span>
                  <span>{match.user.learningLanguage}</span>
                  <span>•</span>
                  <span>{match.user.level}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Matched {match.matchedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-blue-600">
                {match.compatibility}% match
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {match.user.interests.map(interest => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                >
                  {interest}
                </span>
              ))}
            </div>

            <p className="text-sm text-neutral-600 mb-4">{match.user.bio}</p>

            <div className="flex gap-3">
              <Link
                to={`/chat/${match.user.id}`}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('Chat', '채팅')}</span>
              </Link>
              <Link
                to="/games"
                className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-medium hover:bg-violet-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>{t('Game', '게임')}</span>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
