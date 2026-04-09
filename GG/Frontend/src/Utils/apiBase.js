/**
 * API origin: runtime config.js (server) > REACT_APP_* at build > dev default.
 *
 * public/config.js often sets API_BASE_URL to '' so production uses the same origin
 * as the SPA (Node serves both). In development, '' would POST to the CRA port and
 * miss Express — so when config is empty we call the backend at :8080 (any dev port).
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
      typeof window.location !== "undefined"
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
