import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft, Volume2, Loader2 } from 'lucide-react';
import { useTranslator } from '../context/TranslatorContext';
import { useLanguage } from '../context/LanguageContext';

export function Translator() {
  const { isTranslatorOpen, setIsTranslatorOpen, translateText } = useTranslator();
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('ko');
  const [translating, setTranslating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!inputText.trim() || translating) return;
    setTranslating(true);
    setErrorMsg(null);
    setOutputText('');
    try {
      const translated = await translateText(inputText, fromLang, toLang);
      setOutputText(translated);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          t('Translation failed', '번역에 실패했습니다')
      );
    } finally {
      setTranslating(false);
    }
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
    setErrorMsg(null);
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
                    {translating ? (
                      <span className="inline-flex items-center gap-2 text-neutral-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('Translating…', '번역 중…')}
                      </span>
                    ) : errorMsg ? (
                      <span className="text-red-600">{errorMsg}</span>
                    ) : outputText ? (
                      outputText
                    ) : (
                      <span className="text-neutral-400">
                        {t('Translation will appear here', '번역이 여기에 표시됩니다')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleTranslate()}
                disabled={!inputText.trim() || translating}
                className="w-full bg-neutral-400 text-white py-3.5 rounded-xl font-medium hover:bg-neutral-500 disabled:bg-neutral-300 disabled:text-white/80 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                {translating && <Loader2 className="w-4 h-4 animate-spin" />}
                {translating ? t('Translating…', '번역 중…') : t('Translate', '번역하기')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
