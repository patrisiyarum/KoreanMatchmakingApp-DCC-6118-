import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, Mic, Square, Loader2 } from 'lucide-react';
import { useAIAssistant } from '../context/AIAssistantContext';
import { useLanguage } from '../context/LanguageContext';

const accent = 'bg-[#7c3aed]';

/** Same English prompts as main `AssistantPanel` so backend intent/tools match. */
const QUICK_PROMPTS = [
  {
    labelKey: ['Find a practice partner', '연습 파트너 찾기'],
    prompt: 'Can you suggest some compatible practice partners for me?',
  },
  {
    labelKey: ['Summarize my last session', '지난 세션 요약'],
    prompt: 'Can you summarize my most recent practice session?',
  },
  {
    labelKey: ['Practice pronunciation', '발음 연습'],
    prompt: 'I want to practice my Korean pronunciation. Can you help me?',
  },
  {
    labelKey: ['Schedule a meeting', '미팅 잡기'],
    prompt: 'Can you help me schedule a meeting with one of my friends?',
  },
  {
    labelKey: ['Language learning help', '언어 학습 도움'],
    prompt: 'Can you help me with a Korean language learning question?',
  },
] as const;

function formatBoldSegment(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, j) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) {
      return (
        <strong key={j} className="font-semibold">
          {m[1]}
        </strong>
      );
    }
    return <span key={j}>{part}</span>;
  });
}

function AssistantFormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} className="whitespace-pre-wrap break-words">
          {formatBoldSegment(line)}
        </p>
      ))}
    </div>
  );
}

export function AIAssistant() {
  const {
    isAssistantOpen,
    setIsAssistantOpen,
    messages,
    isSending,
    sendMessage,
    sendAudioBlob,
    syncFromServer,
    resetToPrompts,
  } = useAIAssistant();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const chatId = useMemo(() => {
    const raw = searchParams.get('chatId');
    if (!raw) return undefined;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
  }, [searchParams]);

  const quickActions = useMemo(
    () =>
      QUICK_PROMPTS.map((a) => ({
        label: t(a.labelKey[0], a.labelKey[1]),
        prompt: a.prompt,
      })),
    [t]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (!isAssistantOpen) return;
    syncFromServer();
  }, [isAssistantOpen, syncFromServer]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const text = input;
    setInput('');
    await sendMessage(text, { chatId });
  };

  const sendPrompt = async (prompt: string) => {
    if (isSending) return;
    await sendMessage(prompt, { chatId });
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = async () => {
    if (isSending || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current = null;
        if (blob.size > 0) {
          await sendAudioBlob(blob, { chatId });
        }
      };
      mr.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        mediaRecorderRef.current = null;
      };
      mr.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else void startRecording();
  };

  const showWelcome = messages.length === 0;

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
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-full ${accent} flex items-center justify-center shrink-0`}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-neutral-900">
                    {t('AI Language Assistant', 'AI 언어 도우미')}
                  </h3>
                  <p className="text-xs text-neutral-500 truncate">
                    {t('Always ready to help', '항상 도와드릴 준비가 되어있습니다')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!showWelcome && (
                  <button
                    type="button"
                    onClick={() => resetToPrompts()}
                    className="text-xs font-medium text-violet-700 hover:underline px-2 py-1 rounded-lg hover:bg-violet-50"
                  >
                    {t('Back to prompts', '프롬프트로')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAssistantOpen(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-label={t('Close', '닫기')}
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {showWelcome && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 space-y-3">
                  <p className="text-sm text-neutral-800 leading-relaxed">
                    {t(
                      'Hi! I am your AI assistant. How can I help with your language learning today?',
                      '안녕하세요! 언어 학습을 어떻게 도와드릴까요?'
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {t(
                      'Tip: add ?chatId=123 to the page URL when you need a session summary for that chat.',
                      '팁: 특정 채팅 요약이 필요하면 URL에 ?chatId=번호 를 추가하세요.'
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        disabled={isSending}
                        onClick={() => sendPrompt(action.prompt)}
                        className="text-left text-xs font-medium px-3 py-2 rounded-full border border-violet-200 bg-white text-violet-900 hover:bg-violet-50 disabled:opacity-50"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    {message.role === 'assistant' ? (
                      <AssistantFormattedText text={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-neutral-500 text-sm px-1">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{t('Thinking…', '생각 중…')}</span>
                </div>
              )}

              {!showWelcome && (
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-xs font-medium text-neutral-500 mb-2">
                    {t('Other ways I can help', '다른 도움')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={`more-${action.label}`}
                        type="button"
                        disabled={isSending}
                        onClick={() => sendPrompt(action.prompt)}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-neutral-200 p-4 bg-white">
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleRecording()}
                  disabled={isSending}
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                    isRecording
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                  } disabled:opacity-40`}
                  title={
                    isRecording
                      ? t('Stop recording', '녹음 종료')
                      : t('Voice message', '음성 메시지')
                  }
                  aria-label={t('Voice message', '음성 메시지')}
                >
                  {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                </button>
                <div className="relative flex-1 flex items-center min-w-0">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
                    placeholder={t('Ask me anything...', '무엇이든 물어보세요...')}
                    disabled={isSending || isRecording}
                    className="w-full pl-4 pr-14 py-3.5 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm disabled:bg-neutral-50"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isSending || isRecording}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full ${accent} text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-sm`}
                    aria-label={t('Send', '보내기')}
                  >
                    <Send className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
