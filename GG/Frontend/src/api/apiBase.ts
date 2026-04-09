export function getApiBase(): string {
  if (
    typeof window !== 'undefined' &&
    window.__APP_CONFIG__ &&
    Object.prototype.hasOwnProperty.call(window.__APP_CONFIG__, 'API_BASE_URL')
  ) {
    const fromConfig = window.__APP_CONFIG__.API_BASE_URL;
    if (fromConfig === '' && typeof window.location !== 'undefined') {
      const loc = window.location;
      const isLocal =
        loc.hostname === 'localhost' ||
        loc.hostname === '127.0.0.1' ||
        loc.hostname === '[::1]' ||
        loc.hostname === '::1';
      const portNum = loc.port
        ? parseInt(loc.port, 10)
        : loc.protocol === 'https:'
          ? 443
          : 80;
      if (import.meta.env.DEV) {
        return 'http://localhost:8080';
      }
      if (isLocal && portNum !== 8080 && portNum !== 443) {
        return 'http://localhost:8080';
      }
    }
    return fromConfig ?? '';
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL as string;
  }
  if (import.meta.env.PROD) {
    return '';
  }
  return 'http://localhost:8080';
}
