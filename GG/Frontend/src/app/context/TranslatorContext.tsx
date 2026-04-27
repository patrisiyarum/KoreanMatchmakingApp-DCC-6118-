import { createContext, useContext, useState, ReactNode } from 'react';
import { translateText as translateTextApi } from '@/api/translateApi';

interface TranslatorContextType {
  isTranslatorOpen: boolean;
  setIsTranslatorOpen: (open: boolean) => void;
  translateText: (text: string, from: string, to: string) => Promise<string>;
}

const TranslatorContext = createContext<TranslatorContextType | undefined>(undefined);

export function TranslatorProvider({ children }: { children: ReactNode }) {
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);

  const translateText = async (text: string, from: string, to: string) => {
    const trimmed = text.trim();
    if (!trimmed) return '';
    return translateTextApi(trimmed, from, to);
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
