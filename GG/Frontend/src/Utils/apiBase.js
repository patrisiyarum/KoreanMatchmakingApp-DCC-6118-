/**
 * API origin: runtime config.js (server) > REACT_APP_* at build > dev default.
 *
 * public/config.js often sets API_BASE_URL to '' so production uses the same origin
 * as the SPA (Node serves both). CRA dev runs on :3000 with no /Register route, so
 * '' would POST to localhost:3000 and 404 — we use the backend (default :8080) then.
 */
export function getApiBase() {
  if (
    typeof window !== "undefined" &&
    window.__APP_CONFIG__ &&
    Object.prototype.hasOwnProperty.call(window.__APP_CONFIG__, "API_BASE_URL")
  ) {
    const fromConfig = window.__APP_CONFIG__.API_BASE_URL;
    if (
      fromConfig === "" &&
      process.env.NODE_ENV === "development" &&
      typeof window.location !== "undefined" &&
      window.location.port === "3000"
    ) {
      return "http://localhost:8080";
    }
    return fromConfig;
  }
  if (process.env.REACT_APP_BACKEND_URL !== undefined) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "";
  }
  return "http://localhost:8080";
}
