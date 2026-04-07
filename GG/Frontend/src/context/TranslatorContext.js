import React, { createContext, useContext, useState } from 'react';

const TranslatorContext = createContext(null);

export function TranslatorProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openTranslator = () => setIsOpen(true);
  const closeTranslator = () => setIsOpen(false);
  const toggleTranslator = () => setIsOpen((o) => !o);

  return (
    <TranslatorContext.Provider value={{ isOpen, openTranslator, closeTranslator, toggleTranslator }}>
      {children}
    </TranslatorContext.Provider>
  );
}

export function useTranslator() {
  const ctx = useContext(TranslatorContext);
  if (!ctx) throw new Error('useTranslator must be used within TranslatorProvider');
  return ctx;
}
