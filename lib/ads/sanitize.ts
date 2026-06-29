// Server-side sanitizer using isomorphic-dompurify when available.
// Falls back to a minimal regex sanitizer if the dependency is missing.
let DOMPurify: any = null;
(async () => {
  try {
    const mod = await import('isomorphic-dompurify');
    DOMPurify = mod.default || mod;
  } catch (err) {
    DOMPurify = null;
  }
})();

export function sanitizeHtml(input: string) {
  if (!input) return '';
  if (DOMPurify && typeof DOMPurify.sanitize === 'function') {
    try {
      return DOMPurify.sanitize(input, { USE_PROFILES: { html: true } });
    } catch (err) {
      console.warn('DOMPurify sanitize failed, falling back to regex sanitizer', err);
    }
  }

  // Fallback minimal sanitizer (best-effort). Keep conservative.
  let out = input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
  out = out.replace(/on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(/href\s*=\s*("|')?javascript:[^"'>\s]*/gi, '');
  return out;
}
