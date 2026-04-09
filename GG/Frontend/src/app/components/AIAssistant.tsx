import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot } from 'lucide-react';
import { useAIAssistant } from '../context/AIAssistantContext';
import { useLanguage } from '../context/LanguageContext';

const accent = 'bg-[#7c3aed]';

export function AIAssistant() {
  const { isAssistantOpen, setIsAssistantOpen, messages, sendMessage } = useAIAssistant();
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <AnimatePresence>
      {isAssistantOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsAssistantOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[min(600px,85vh)] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${accent} flex items-center justify-center shrink-0`}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {t('AI Language Assistant', 'AI 언어 도우미')}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {t('Always ready to help', '항상 도와드릴 준비가 되어있습니다')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssistantOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label={t('Close', '닫기')}
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-neutral-200 p-4 bg-white">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('Ask me anything...', '무엇이든 물어보세요...')}
                  className="w-full pl-4 pr-14 py-3.5 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full ${accent} text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-sm`}
                  aria-label={t('Send', '보내기')}
                >
                  <Send className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
