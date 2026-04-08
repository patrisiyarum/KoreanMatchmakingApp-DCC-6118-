/**
 * Runtime config — edit this file on the server after deploy (no rebuild needed).
 * API_BASE_URL: '' = same origin as the page (use when Node serves the SPA and API).
 * Local `npm start` (port 3000) still uses the backend at http://localhost:8080 automatically.
 * If login fails in prod, set to your Node app URL, e.g. 'https://…'
 */
window.__APP_CONFIG__ = {
  API_BASE_URL: "",
};
