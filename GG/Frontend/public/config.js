/**
 * Runtime config — edit this file on the server after deploy (no rebuild needed).
 *
 * API_BASE_URL:
 *   '' = same origin as the page (when one Node app serves both SPA + /api — e.g. Plesk).
 *   With '' on localhost, the app still targets http://localhost:8080 for API when the page
 *   is NOT served from port 8080 (see src/Utils/apiBase.js).
 *
 * Registration/login need the backend running: cd GG/Backend && npm run serve
 * (default http://localhost:8080). If you only run `npx serve` on the build folder without
 * Express, set API_BASE_URL to 'http://localhost:8080' explicitly.
 */
window.__APP_CONFIG__ = {
  API_BASE_URL: "",
};
