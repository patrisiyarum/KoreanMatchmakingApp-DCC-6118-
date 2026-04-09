import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft, Volume2 } from 'lucide-react';
import { useTranslator } from '../context/TranslatorContext';
import { useLanguage } from '../context/LanguageContext';

export function Translator() {
  const { isTranslatorOpen, setIsTranslatorOpen, translateText } = useTranslator();
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('ko');

  const handleTranslate = () => {
    const translated = translateText(inputText, fromLang, toLang);
    setOutputText(translated);
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  return (
    <AnimatePresence>
      {isTranslatorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsTranslatorOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">
                {t('Translator', '번역기')}
              </h3>
              <button
                type="button"
                onClick={() => setIsTranslatorOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label={t('Close', '닫기')}
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <select
                  value={fromLang}
                  onChange={(e) => setFromLang(e.target.value)}
                  className="flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="en">English</option>
                  <option value="ko">한국어 Korean</option>
                </select>

                <button
                  type="button"
                  onClick={swapLanguages}
                  className="p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors shrink-0"
                  aria-label={t('Swap languages', '언어 바꾸기')}
                >
                  <ArrowRightLeft className="w-5 h-5 text-neutral-600" />
                </button>

                <select
                  value={toLang}
                  onChange={(e) => setToLang(e.target.value)}
                  className="flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="ko">한국어 Korean</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">
                      {fromLang === 'en' ? 'English' : '한국어'}
                    </span>
                    <button type="button" className="p-1 hover:bg-neutral-100 rounded transition-colors">
                      <Volume2 className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('Enter text to translate...', '번역할 텍스트 입력...')}
                    className="w-full h-36 sm:h-40 px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">
                      {toLang === 'ko' ? '한국어' : 'English'}
                    </span>
                    <button type="button" className="p-1 hover:bg-neutral-100 rounded transition-colors">
                      <Volume2 className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                  <div className="w-full h-36 sm:h-40 px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 overflow-y-auto text-sm">
                    {outputText || (
                      <span className="text-neutral-400">
                        {t('Translation will appear here', '번역이 여기에 표시됩니다')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTranslate}
                disabled={!inputText.trim()}
                className="w-full bg-neutral-400 text-white py-3.5 rounded-xl font-medium hover:bg-neutral-500 disabled:bg-neutral-300 disabled:text-white/80 disabled:cursor-not-allowed transition-colors"
              >
                {t('Translate', '번역하기')}
              </button>

              <p className="text-xs text-neutral-500 text-center pt-1">
                {t(
                  'Quick translations: Type common phrases to see instant translations',
                  '빠른 번역: 일반적인 문구를 입력하면 즉시 번역을 볼 수 있습니다'
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
