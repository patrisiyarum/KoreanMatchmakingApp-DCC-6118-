import { createContext, useContext, useState, ReactNode } from 'react';

interface TranslatorContextType {
  isTranslatorOpen: boolean;
  setIsTranslatorOpen: (open: boolean) => void;
  translateText: (text: string, from: string, to: string) => string;
}

const TranslatorContext = createContext<TranslatorContextType | undefined>(undefined);

export function TranslatorProvider({ children }: { children: ReactNode }) {
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);

  // Mock translation function - in production, this would call a translation API
  const translateText = (text: string, from: string, to: string) => {
    const mockTranslations: Record<string, string> = {
      'Hello': '안녕하세요',
      'Thank you': '감사합니다',
      'How are you?': '어떻게 지내세요?',
      'I love learning Korean': '저는 한국어 배우는 것을 좋아해요',
      '안녕하세요': 'Hello',
      '감사합니다': 'Thank you',
      '어떻게 지내세요?': 'How are you?',
    };

    return mockTranslations[text] || `[Translated: ${text}]`;
  };

  return (
    <TranslatorContext.Provider value={{ isTranslatorOpen, setIsTranslatorOpen, translateText }}>
      {children}
    </TranslatorContext.Provider>
  );
}

export function useTranslator() {
  const context = useContext(TranslatorContext);
  if (!context) {
    throw new Error('useTranslator must be used within TranslatorProvider');
  }
  return context;
}
