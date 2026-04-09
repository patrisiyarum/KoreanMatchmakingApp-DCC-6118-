const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxy API traffic to the Express backend (port 8080).
 * Legacy web.js routes (POST /Register, etc.) are not under /api; without a proxy
 * the CRA dev server returns "Cannot POST /Register".
 */
function shouldProxy(pathname, req) {
  if (pathname.startsWith('/api') || pathname.startsWith('/uploads')) return true;

  const exact = new Set([
    '/Register',
    '/CreateProfile',
    '/UpdateProfile',
    '/Dashboard',
    '/Translator',
    '/findFriends',
    '/populateData',
  ]);
  if (exact.has(pathname)) return true;

  if (pathname.startsWith('/Message')) return true;
  if (pathname.startsWith('/Chats')) return true;
  if (pathname.startsWith('/createFriends')) return true;

  if (pathname === '/Chat' && req.method === 'POST') return true;
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
