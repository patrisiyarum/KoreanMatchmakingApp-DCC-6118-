/**
 * Runtime config — edit this file on the server after deploy (no rebuild needed).
 * API_BASE_URL: '' = same origin as the page (use when Node serves the SPA and API).
 * If login fails, set to your Node app URL, e.g. 'https://languagematchmaker.modlangs.gatech.edu'
 * or whatever URL returns JSON from GET /api/health
 */
window.__APP_CONFIG__ = {
  API_BASE_URL: "",
};
