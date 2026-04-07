/**
 * API origin: runtime config.js (server) > REACT_APP_* at build > dev default.
 */
export function getApiBase() {
  if (
    typeof window !== "undefined" &&
    window.__APP_CONFIG__ &&
    Object.prototype.hasOwnProperty.call(window.__APP_CONFIG__, "API_BASE_URL")
  ) {
    return window.__APP_CONFIG__.API_BASE_URL;
  }
  if (process.env.REACT_APP_BACKEND_URL !== undefined) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "";
  }
  return "http://localhost:8080";
}
