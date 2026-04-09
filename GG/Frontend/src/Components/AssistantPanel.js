import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistant } from '../context/AssistantContext';
import { useTranslator } from '../context/TranslatorContext';
import { handleChatWithAssistant } from '../Services/aiAssistantService';
import './AssistantPanel.css';

const QUICK_ACTIONS = [
  { label: 'Find me a practice partner', prompt: 'Can you suggest some compatible practice partners for me?' },
  { label: 'Summarize my last session', prompt: 'Can you summarize my most recent practice session?' },
  { label: 'Practice pronunciation', prompt: 'I want to practice my Korean pronunciation. Can you help me?' },
  { label: 'Schedule a meeting', prompt: 'Can you help me schedule a meeting with one of my friends?' },
  { label: 'Language learning help', prompt: 'Can you help me with a Korean language learning question?' },
];

function AssistantPanel() {
  const {
    isOpen, userId, messages,
    closeAssistant, addMessage, clearMessages,
    pendingPrompt, clearPendingPrompt,
  } = useAssistant();
  const { isOpen: isTranslatorOpen } = useTranslator();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeAssistant();
      setIsClosing(false);
    }, 250);
  };

  // Close when Translator opens
  useEffect(() => {
    if (isTranslatorOpen && isOpen) {
      handleClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTranslatorOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && pendingPrompt) {
      clearPendingPrompt();
      handleSend(pendingPrompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingPrompt]);

  const handleSend = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');
    addMessage({ role: 'user', content: trimmed });
    setLoading(true);
    try {
      const res = await handleChatWithAssistant(trimmed, null, userId, null);
      // axios instance returns response body directly (not { data: ... })
      const reply =
        res?.reply ||
        res?.message ||
        res?.response ||
        (typeof res === 'string' ? res : null) ||
        'No response received.';
      addMessage({ role: 'assistant', content: reply });
    } catch (err) {
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        'Something went wrong. Please try again.';
      addMessage({ role: 'assistant', content: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const openFullView = () => {
    handleClose();
    setTimeout(() => navigate(`/Assistant?id=${userId}`), 250);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div className={`ap-backdrop${isClosing ? ' ap-backdrop--closing' : ''}`} onClick={handleClose} aria-hidden="true" />
      <div className={`ap-panel${isClosing ? ' ap-panel--closing' : ''}`} role="dialog" aria-label="AI Assistant">

        <div className="ap-header">
          <div className="ap-header-left">
            <span className="ap-icon" aria-hidden="true">&#10024;</span>
            <h3 className="ap-title">AI Assistant</h3>
          </div>
          <div className="ap-header-right">
            {messages.length > 0 && (
              <button
                type="button"
                className="ap-prompts-btn"
                onClick={() => clearMessages()}
                title="Clear this chat and show the starter prompts again"
              >
                Back to prompts
              </button>
            )}
            <button type="button" className="ap-fullview-btn" onClick={openFullView}>
              Open Full Assistant
            </button>
          </div>
        </div>

        <div className="ap-chat">
          <div className="ap-messages">
            {messages.length === 0 && (
              <div className="ap-welcome">
                <p className="ap-welcome-text">
                  Hi! I am your AI assistant. How can I help with your language learning today?
                </p>
                <div className="ap-shortcuts">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      className="ap-shortcut-btn"
                      onClick={() => handleSend(action.prompt)}
                      disabled={loading}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`ap-msg ap-msg--${msg.role}`}>
                <p className="ap-msg-text">{msg.content}</p>
              </div>
            ))}

            {loading && (
              <div className="ap-msg ap-msg--assistant ap-msg--loading">
                <span className="ap-loading-dot" />
                <span className="ap-loading-dot" />
                <span className="ap-loading-dot" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length > 0 && (
            <div className="ap-more-prompts">
              <p className="ap-more-prompts-label">Other ways I can help</p>
              <div className="ap-shortcuts ap-shortcuts--compact">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={`more-${action.label}`}
                    type="button"
                    className="ap-shortcut-btn"
                    onClick={() => handleSend(action.prompt)}
                    disabled={loading}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ap-input-row">
            <input
              className="ap-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={loading}
            />
            <button
              className="ap-send-btn"
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              &#8594;
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AssistantPanel;
