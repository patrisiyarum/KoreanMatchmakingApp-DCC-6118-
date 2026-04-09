/**
 * Normalize user input to a Zoom join URL when possible.
 * Accepts full https links or a numeric meeting ID.
 */
export function normalizeZoomUrl(input) {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const h = u.hostname.toLowerCase();
      if (h === 'zoom.us' || h.endsWith('.zoom.us') || h.includes('zoomgov.com')) {
        return u.href;
      }
    } catch {
      return null;
    }
    return null;
  }

  const digits = s.replace(/\D/g, '');
  if (/^\d{9,12}$/.test(digits)) {
    return `https://zoom.us/j/${digits}`;
  }

  return null;
}

export function zoomMeetingLabel(url) {
  const n = normalizeZoomUrl(url);
  if (!n) return 'Zoom meeting';
  try {
    const u = new URL(n);
    const parts = u.pathname.split('/').filter(Boolean);
    const j = parts.indexOf('j');
    if (j >= 0 && parts[j + 1]) return `Meeting ${parts[j + 1]}`;
    return 'Zoom meeting';
  } catch {
    return 'Zoom meeting';
  }
}
