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
    if (fromConfig === "" && typeof window.location !== "undefined") {
      const loc = window.location;
      const isLocal =
        loc.hostname === "localhost" ||
        loc.hostname === "127.0.0.1" ||
        loc.hostname === "[::1]" ||
        loc.hostname === "::1";
      const portNum = loc.port
        ? parseInt(loc.port, 10)
        : loc.protocol === "https:"
          ? 443
          : 80;
      // CRA dev: NODE_ENV development — always talk to Express on :8080
      if (process.env.NODE_ENV === "development") {
        return "http://localhost:8080";
      }
      // Production build preview (e.g. npx serve on :4173): same-origin "" would POST to the
      // static server and return HTML → "Registration failed" with no errorCode. Default API.
      if (isLocal && portNum !== 8080 && portNum !== 443) {
        return "http://localhost:8080";
      }
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
