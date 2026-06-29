/* eslint-disable @typescript-eslint/no-require-imports */

// Quick test: verify sanitizer and provider registration
try {
  const { sanitizeHtml } = require('../lib/ads/sanitize');
  const adsLib = require('../lib/ads/index');

  console.log('Providers registered:', adsLib.listProviders().map(p => p.id));

  const bad = '<div onclick="alert(1)">Click me</div><script>console.log(1)</script><a href="javascript:evil()">x</a>';
  const clean = sanitizeHtml(bad);
  console.log('Sanitized output:', clean);
  process.exit(0);
} catch (err) {
  console.error('Test script failed', err);
  process.exit(2);
}
