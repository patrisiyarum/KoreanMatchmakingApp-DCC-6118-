import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Edit3 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  CONVERSATION_PROMPT_CATEGORIES,
  type ConversationPrompt,
} from '../constants/conversationPrompts';

interface ConversationPromptsProps {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onInsert: (text: string) => void;
  partnerName: string;
  variant?: 'panel' | 'empty-state';
}

export function ConversationPrompts({
  open,
  onClose,
  onSend,
  onInsert,
  partnerName,
  variant = 'panel',
}: ConversationPromptsProps) {
  const { t } = useLanguage();
  const [activeCategoryId, setActiveCategoryId] = useState(
    CONVERSATION_PROMPT_CATEGORIES[0].id
  );

  const activeCategory =
    CONVERSATION_PROMPT_CATEGORIES.find((c) => c.id === activeCategoryId) ||
    CONVERSATION_PROMPT_CATEGORIES[0];

  const renderPromptCard = (prompt: ConversationPrompt) => (
    <motion.div
      key={prompt.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-neutral-200 rounded-xl p-3 hover:border-violet-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl shrink-0" aria-hidden>
          {prompt.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-900">{prompt.english}</p>
          <p className="text-xs text-neutral-500 mt-0.5" lang="ko">
            {prompt.korean}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSend(prompt.english)}
          aria-label={`${t('Send prompt', '프롬프트 보내기')}: ${prompt.english}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors"
        >
          <Send className="w-3 h-3" />
          {t('Send', '보내기')}
        </button>
        <button
          type="button"
          onClick={() => onInsert(prompt.english)}
          aria-label={`${t('Edit prompt before sending', '보내기 전 편집')}: ${prompt.english}`}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-full hover:bg-neutral-200 transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          {t('Edit', '편집')}
        </button>
      </div>
    </motion.div>
  );

  const renderCategoryTabs = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {CONVERSATION_PROMPT_CATEGORIES.map((cat) => {
        const active = cat.id === activeCategoryId;
        return (
          <button
            type="button"
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              active
                ? 'bg-violet-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            aria-pressed={active}
          >
            <span aria-hidden>{cat.emoji}</span>
            {t(cat.labelEn, cat.labelKo)}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'empty-state') {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-50 text-violet-600 mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">
              {t(`Say hi to ${partnerName}!`, `${partnerName}님에게 인사해 보세요!`)}
            </h3>
            <p className="text-sm text-neutral-600">
              {t(
                'Pick a prompt below to break the ice — or just start typing.',
                '아래 프롬프트로 대화를 시작하거나, 직접 입력하세요.'
              )}
            </p>
          </div>

          <div className="mb-3">{renderCategoryTabs()}</div>

          <div className="grid grid-cols-1 gap-2">
            {activeCategory.prompts.map(renderPromptCard)}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="border-t border-neutral-200 bg-neutral-50 max-h-[55vh] overflow-y-auto"
          role="dialog"
          aria-label={t('Conversation prompts', '대화 프롬프트')}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <h4 className="text-sm font-semibold text-neutral-900">
                  {t('Conversation prompts', '대화 프롬프트')}
                </h4>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('Close prompts', '프롬프트 닫기')}
                className="text-neutral-500 hover:text-neutral-900 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3">{renderCategoryTabs()}</div>

            <div className="grid grid-cols-1 gap-2">
              {activeCategory.prompts.map(renderPromptCard)}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
