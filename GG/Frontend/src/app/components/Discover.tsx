import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, Sparkles } from 'lucide-react';
import { potentialPartners } from '../data/mockData';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

export function Discover() {
  const { t, language } = useLanguage();
  const [partners, setPartners] = useState(potentialPartners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<User[]>([]);

  const currentPartner = partners[currentIndex];

  const handleSwipe = (liked: boolean) => {
    if (liked) {
      setMatches(prev => [...prev, currentPartner]);
    }

    setTimeout(() => {
      if (currentIndex < partners.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 300);
  };

  if (!currentPartner) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-neutral-600">No more partners to show right now!</p>
        </div>
      </div>
    );
  }

  const sharedInterests = ['K-pop', 'Gaming', 'Cooking'].filter(interest =>
    currentPartner.interests.includes(interest)
  );

  return (
    <div className="size-full flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md mb-4">
        <p className="text-center text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
            <span>
              {matches.length} {t('matches today', '오늘의 매치')}
            </span>
          </span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPartner.id}
          initial={{ scale: 0.9, opacity: 0, rotateY: -20 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.9, opacity: 0, rotateY: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-10 sm:p-12 text-center">
              <div className="text-6xl mb-4">{currentPartner.avatar}</div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {currentPartner.name}
              </h3>
              <div className="flex items-center justify-center gap-2 text-white/90 text-sm">
                <span>{currentPartner.nativeLanguage}</span>
                <span>↔</span>
                <span>{currentPartner.learningLanguage}</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-medium text-neutral-500 mb-1">LEVEL</div>
                <div className="text-sm text-neutral-900">{currentPartner.level}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-neutral-500 mb-2">INTERESTS</div>
                <div className="flex flex-wrap gap-2">
                  {currentPartner.interests.map(interest => (
                    <span
                      key={interest}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sharedInterests.includes(interest)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {interest}
                      {sharedInterests.includes(interest) && ' ✨'}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-neutral-500 mb-2">BIO</div>
                <p className="text-sm text-neutral-700">{currentPartner.bio}</p>
              </div>

              {sharedInterests.length > 0 && (
                <div className="bg-sky-50 rounded-xl p-3 border border-sky-100">
                  <p className="text-sm text-sky-900 text-center">
                    ❤️{' '}
                    {language === 'ko'
                      ? `공통 관심사가 ${sharedInterests.length}개 있어요!`
                      : `You have ${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}!`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-6 mt-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe(false)}
          className="w-16 h-16 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center shadow-lg hover:border-red-400 transition-colors"
        >
          <X className="w-8 h-8 text-neutral-600" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-lg"
        >
          <Heart className="w-8 h-8 text-white fill-white" />
        </motion.button>
      </div>
    </div>
  );
}
