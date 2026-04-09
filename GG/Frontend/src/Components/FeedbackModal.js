import React, { useState } from 'react';
import { getApiBase } from '../Utils/apiBase';
import './FeedbackModal.css';

const FEEDBACK_TO = 'patrisiya141@gmail.com';

export default function FeedbackModal({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [status, setStatus] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus('Please enter a message.');
      return;
    }

    setStatus('Sending…');
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

    try {
      const base = getApiBase();
      await fetch(`${base}/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          replyEmail: replyEmail.trim(),
          pageUrl,
        }),
      });
    } catch {
      /* still open mailto */
    }

    const mailBody = [
      trimmed,
      '',
      '—',
      replyEmail.trim() ? `Reply-to: ${replyEmail.trim()}` : '(no reply email provided)',
      `Page: ${pageUrl}`,
    ].join('\n');

    const mailto = `mailto:${FEEDBACK_TO}?subject=${encodeURIComponent('LangMatch feedback')}&body=${encodeURIComponent(mailBody)}`;
    window.location.href = mailto;
    setStatus('If your mail app opened, send the message there. Thanks!');
    setMessage('');
    setReplyEmail('');
    setTimeout(() => {
      onClose();
      setStatus(null);
    }, 2500);
  };

  return (
    <div className="feedback-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
      <div className="feedback-modal">
        <div className="feedback-modal-header">
          <h2 id="feedback-modal-title">Send feedback</h2>
          <button type="button" className="feedback-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="feedback-modal-hint">
          Your message opens in your email app addressed to <strong>{FEEDBACK_TO}</strong>. You can edit before sending.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="feedback-modal-label" htmlFor="feedback-msg">
            Message
          </label>
          <textarea
            id="feedback-msg"
            className="feedback-modal-textarea"
            rows={5}
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            placeholder="What would you like to share?"
            maxLength={12000}
          />
          <label className="feedback-modal-label" htmlFor="feedback-email">
            Your email (optional, for a reply)
          </label>
          <input
            id="feedback-email"
            type="email"
            className="feedback-modal-input"
            value={replyEmail}
            onChange={(ev) => setReplyEmail(ev.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {status ? <p className="feedback-modal-status">{status}</p> : null}
          <div className="feedback-modal-actions">
            <button type="button" className="feedback-modal-btn feedback-modal-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="feedback-modal-btn feedback-modal-btn--primary">
              Open email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
