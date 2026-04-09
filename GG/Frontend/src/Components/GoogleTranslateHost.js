import { useEffect } from 'react';

const CB_NAME = '__lmGoogleTranslateInit';

let scriptInjected = false;

/**
 * Loads Google Website Translator (hidden). Translation is driven via the `googtrans` cookie
 * + reload (see siteChromeUtils) so the whole SPA is translated without per-string i18n.
 */
export default function GoogleTranslateHost() {
  useEffect(() => {
    if (typeof window[CB_NAME] !== 'function') {
      window[CB_NAME] = () => {
        try {
          if (!window.google?.translate?.TranslateElement) return;
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,ko',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        } catch (e) {
          console.warn('Google Translate init failed', e);
        }
      };
    }

    if (scriptInjected) return;
    const existing = document.querySelector('script[data-lm-google-translate]');
    if (existing) {
      scriptInjected = true;
      return;
    }

    scriptInjected = true;
    const s = document.createElement('script');
    s.src = `https://translate.google.com/translate_a/element.js?cb=${CB_NAME}`;
    s.async = true;
    s.dataset.lmGoogleTranslate = '1';
    document.body.appendChild(s);
  }, []);

  return <div id="google_translate_element" className="lm-google-translate-host" aria-hidden="true" />;
}
