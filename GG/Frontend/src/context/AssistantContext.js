import React, { createContext, useContext, useState } from 'react';

const AssistantContext = createContext(null);

export function AssistantProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState('chat');

  const openAssistant = (uid) => {
    if (uid != null) setUserId(uid);
    setIsOpen(true);
  };

  const closeAssistant = () => setIsOpen(false);

  const toggleAssistant = (uid) => {
    if (uid != null) setUserId(uid);
    setIsOpen((o) => !o);
  };

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const openWithSummary = (uid, sessionId) => {
    if (uid != null) setUserId(uid);
    setTab('chat');
    setIsOpen(true);
    // The panel will send this as an initial message via a separate mechanism
    // We store it as a pending prompt that AssistantPanel reads and clears
    setPendingPrompt(`Summarize the practice session with session ID ${sessionId}`);
  };

  const [pendingPrompt, setPendingPrompt] = useState(null);
  const clearPendingPrompt = () => setPendingPrompt(null);

  return (
    <AssistantContext.Provider value={{
      isOpen, userId, messages, tab,
      openAssistant, closeAssistant, toggleAssistant,
      addMessage, setMessages, setTab,
      openWithSummary, pendingPrompt, clearPendingPrompt,
    }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}
