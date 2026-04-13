function trimTrailingSlash(s: string): string {
  return s.replace(/\/$/, '');
}

/**
 * Base URL for API calls (no trailing slash).
 * - Empty string = same origin (Plesk: Node serves API + static, or Vite dev proxy for `/api`).
 * - Set `window.__APP_CONFIG__.API_BASE_URL` after deploy if API is on another host.
 */
export function getApiBase(): string {
  if (
    typeof window !== 'undefined' &&
    window.__APP_CONFIG__ &&
    Object.prototype.hasOwnProperty.call(window.__APP_CONFIG__, 'API_BASE_URL')
  ) {
    const raw = window.__APP_CONFIG__.API_BASE_URL;
    if (raw != null && String(raw).trim() !== '') {
      return trimTrailingSlash(String(raw));
    }
    return '';
  }

  if (import.meta.env.VITE_BACKEND_URL) {
    return trimTrailingSlash(String(import.meta.env.VITE_BACKEND_URL));
  }

  if (import.meta.env.DEV) {
    return '';
  }

  return '';
}
