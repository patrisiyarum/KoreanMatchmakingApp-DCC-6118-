/** Cookie used by Google Website Translator */
export function isKoreanSiteTranslationActive() {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => {
    const t = c.trim();
    return t.startsWith('googtrans=') && /\/ko\b/.test(t);
  });
}

export function setSiteTranslationKorean() {
  document.cookie = 'googtrans=/en/ko;path=/';
  window.location.reload();
}

export function setSiteTranslationEnglish() {
  const expires = 'expires=Thu, 01 Jan 1970 00:00:00 UTC';
  document.cookie = `googtrans=;${expires};path=/`;
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    document.cookie = `googtrans=;${expires};path=/;domain=.${host}`;
  }
  window.location.reload();
}
