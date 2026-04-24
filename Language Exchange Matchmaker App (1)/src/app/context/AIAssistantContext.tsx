import { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantContextType {
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  messages: Message[];
  sendMessage: (content: string) => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! Hi! I\'m your language learning assistant. I can help you practice Korean, answer questions, and give you study tips. How can I help you today?',
      timestamp: new Date(),
    }
  ]);

  const sendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Mock AI response
    setTimeout(() => {
      const responses = [
        'Great question! In Korean, you can say "안녕하세요" (annyeonghaseyo) for a polite hello.',
        'That\'s a good approach! Try practicing with your partner for 30 minutes daily.',
        'Korean grammar follows a Subject-Object-Verb order. For example: "I coffee drink" = 저는 커피를 마셔요',
        'Tip: Watch Korean dramas with subtitles to improve your listening skills!',
        'Let me help you with that! Would you like to practice some common phrases?',
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <AIAssistantContext.Provider value={{ isAssistantOpen, setIsAssistantOpen, messages, sendMessage }}>
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return context;
}
