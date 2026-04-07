// CommonJS entry point for Phusion Passenger
// Passenger uses require() which can't load ES modules directly.
// This wrapper uses dynamic import() to load the ESM server.
async function start() {
  await import('./src/server.js');
}
start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
