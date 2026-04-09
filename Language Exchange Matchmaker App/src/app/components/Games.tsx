import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, RotateCcw } from 'lucide-react';

interface VocabQuestion {
  korean: string;
  english: string;
  options: string[];
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
  const [gameMode, setGameMode] = useState<'menu' | 'vocab' | 'results'>('menu');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

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
  };

  if (gameMode === 'menu') {
    return (
      <div className="size-full flex items-center justify-center p-6 bg-gradient-to-b from-purple-50 to-neutral-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              Language Games
            </h2>
            <p className="text-neutral-600">
              Practice and improve your skills
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setGameMode('vocab')}
              className="w-full bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                    Vocabulary Quiz
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Test your Korean vocabulary knowledge
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </button>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6 opacity-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                    Translation Challenge
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Coming soon!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6 opacity-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                    Speed Match
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Coming soon!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
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
            {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
          </h2>

          <div className="bg-white rounded-2xl border border-neutral-200 p-8 mb-6">
            <div className="text-5xl font-bold text-purple-600 mb-2">
              {score}/{vocabQuestions.length}
            </div>
            <p className="text-neutral-600">
              {percentage}% correct
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetGame}
              className="flex-1 bg-neutral-200 text-neutral-900 py-4 rounded-lg font-medium hover:bg-neutral-300 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Back to Menu
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
              Play Again
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
          <div className="text-sm text-neutral-600">
            Question {currentQuestion + 1}/{vocabQuestions.length}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
            <Trophy className="w-4 h-4" />
            <span>Score: {score}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 mb-6 text-center">
          <p className="text-white/80 text-sm mb-2">Translate this word:</p>
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
