const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxy API traffic to the Express backend (port 8080).
 * Legacy web.js routes (POST /Register, etc.) are not under /api; without a proxy
 * the CRA dev server returns "Cannot POST /Register".
 *
 * Important: React Router uses the same paths (GET /Register, /Dashboard, …) for pages.
 * Only proxy the HTTP methods the Express app actually handles — never proxy GET for those,
 * or the dev server will try to forward the SPA route to the backend and fail.
 */
function shouldProxy(pathname, req) {
  const m = req.method;

  if (pathname.startsWith('/api') || pathname.startsWith('/uploads')) return true;

  // Legacy body routes — Express only implements these verbs (see web.js).
  if (pathname === '/Register' && m === 'POST') return true;
  if (pathname === '/CreateProfile' && m === 'POST') return true;
  if (pathname === '/UpdateProfile' && m === 'PUT') return true;
  if (pathname === '/Dashboard' && m === 'POST') return true;
  if (pathname === '/Translator' && m === 'POST') return true;
  if (pathname === '/findFriends' && m === 'POST') return true;

  if (pathname === '/populateData' && m === 'GET') return true;

  if (pathname.startsWith('/Message')) return true;
  if (pathname.startsWith('/Chats')) return true;
  if (pathname.startsWith('/createFriends')) return true;

  if (pathname === '/Chat' && m === 'POST') return true;
  if (/^\/Chat\/\d+\/\d+/.test(pathname)) return true;

  return false;
}

module.exports = function (app) {
  app.use(
    createProxyMiddleware(shouldProxy, {
      target: 'http://localhost:8080',
      changeOrigin: true,
    })
  );
};
