import React, { useState } from 'react';
import GoogleTranslateHost from './GoogleTranslateHost';
import FeedbackModal from './FeedbackModal';
import { isKoreanSiteTranslationActive, setSiteTranslationEnglish, setSiteTranslationKorean } from '../Utils/siteChromeUtils';
import './SiteChrome.css';

/**
 * Global controls: full-page Korean translation (Google) + feedback (FAB).
 */
export default function SiteChrome() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const koActive = isKoreanSiteTranslationActive();

  return (
    <>
      <GoogleTranslateHost />
      <div className="site-chrome" role="toolbar" aria-label="Language and feedback">
        {koActive ? (
          <button
            type="button"
            className="site-chrome-lang"
            onClick={setSiteTranslationEnglish}
            title="Switch to English"
          >
            EN
          </button>
        ) : (
          <button
            type="button"
            className="site-chrome-lang"
            onClick={setSiteTranslationKorean}
            title="한국어로 보기"
          >
            한
          </button>
        )}
        <button
          type="button"
          className="site-chrome-fab"
          onClick={() => setFeedbackOpen(true)}
          aria-label="Help and feedback"
          title="Feedback"
        >
          ?
        </button>
      </div>
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
