import React, { useState } from 'react';
import GoogleTranslateHost from './GoogleTranslateHost';
import FeedbackModal from './FeedbackModal';
import { isKoreanSiteTranslationActive, setSiteTranslationEnglish, setSiteTranslationKorean } from '../Utils/siteChromeUtils';
import './SiteChrome.css';

/**
 * Global controls: full-page Korean translation (Google) + feedback mailto.
 */
export default function SiteChrome() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const koActive = isKoreanSiteTranslationActive();

  return (
    <>
      <GoogleTranslateHost />
      <div className="site-chrome" role="toolbar" aria-label="Site language and feedback">
        {koActive ? (
          <button
            type="button"
            className="site-chrome-btn site-chrome-btn--lang"
            onClick={setSiteTranslationEnglish}
          >
            English
          </button>
        ) : (
          <button
            type="button"
            className="site-chrome-btn site-chrome-btn--lang"
            onClick={setSiteTranslationKorean}
          >
            한국어
          </button>
        )}
        <button type="button" className="site-chrome-btn site-chrome-btn--feedback" onClick={() => setFeedbackOpen(true)}>
          Feedback
        </button>
      </div>
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
