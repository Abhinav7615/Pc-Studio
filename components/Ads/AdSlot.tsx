'use client';

import { useEffect, useState, useRef } from 'react';

interface AdSlotProps {
  zone: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSlot({ zone, className, style }: AdSlotProps) {
  const [html, setHtml] = useState<string>('');
  const [adPayload, setAdPayload] = useState<any>(null);

  function getVisitorId() {
    try {
      const name = 'pc_visitor';
      const existing = document.cookie.split('; ').find((r) => r.startsWith(name + '='));
      if (existing) return existing.split('=')[1];
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
      document.cookie = `${name}=${id}; path=/; max-age=${60 * 60 * 24 * 365}`;
      return id;
    } catch (err) {
      return '';
    }
  }

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const visitorId = getVisitorId();
        const res = await fetch(`/api/ads?zone=${encodeURIComponent(zone)}`, {
          headers: {
            'x-visitor-id': visitorId,
            'x-user-logged-in': (!!(window as any).__PC_SESSION__ ? 'true' : 'false'),
            // optionally send user id if available via client bootstrapped session
            'x-user-id': (window as any).__PC_SESSION__?.user?.id || '',
          },
        });
        if (!res.ok) return;
        // Some responses may be empty or non-JSON (server-side may return 204/empty).
        // Read as text first and try to parse to avoid uncaught JSON errors.
        const text = await res.text();
        let data: any = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (err) {
            console.error('AdSlot: invalid JSON response from /api/ads', err);
            return;
          }
        } else {
          // empty response
          return;
        }
        if (!mounted) return;
        // server should return sanitized html or structured payload
        if (data?.html) {
          setAdPayload(data);
          setHtml(data.html);
        } else if (data?.type === 'image' && data.image) {
          setAdPayload(data);
          setHtml(`<img src="${data.image}" alt="${data.title || ''}" style="max-width:100%"/>`);
        }
      } catch (err) {
        // swallow errors to keep UI stable
        console.error('AdSlot load error', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [zone]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      try {
        const msg = e.data || {};
        // Ensure message comes from our iframe
        if (!iframeRef.current) return;
        if (e.source !== iframeRef.current.contentWindow) return;
        if (!msg || !msg.type) return;

        // verify message token
        if (!adPayload || !adPayload.messageToken || msg.token !== adPayload.messageToken) return;

        if (msg.type === 'ad-click') {
          // report click
          fetch('/api/ads/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: msg.adId, token: adPayload?.messageToken }) }).catch(() => {});
          // open target if provided
          if (msg.href) {
            try { window.open(msg.href, '_blank', 'noopener'); } catch (err) {}
          }
        } else if (msg.type === 'ad-impression') {
          // optional: report impression (server already logged on fetch), but we can ping analytics
          fetch('/api/ads/impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: msg.adId, token: adPayload?.messageToken }) }).catch(() => {});
        }
      } catch (err) {}
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [adPayload?.messageToken]);

  function containsScript(src: string | null | undefined) {
    if (!src) return false;
    return /<script[\s>]/i.test(src) || /javascript:\s*/i.test(src);
  }

  // If HTML contains scripts or provider markup, render in sandboxed iframe
  const shouldUseIframe = containsScript(html) || (adPayload && adPayload.provider === 'third-party');

  // Listen for messages from the iframe (impressions/clicks) and handle them securely.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      try {
        const msg = e.data || {};
        // Ensure message comes from our iframe
        if (!iframeRef.current) return;
        if (e.source !== iframeRef.current.contentWindow) return;
        if (!msg || !msg.type) return;

        // verify message token
        if (!adPayload || !adPayload.messageToken || msg.token !== adPayload.messageToken) return;

        if (msg.type === 'ad-click') {
          // report click
          fetch('/api/ads/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: msg.adId, token: adPayload?.messageToken }) }).catch(() => {});
          // open target if provided
          if (msg.href) {
            try { window.open(msg.href, '_blank', 'noopener'); } catch (err) {}
          }
        } else if (msg.type === 'ad-impression') {
          // optional: report impression (server already logged on fetch), but we can ping analytics
          fetch('/api/ads/impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: msg.adId, token: adPayload?.messageToken }) }).catch(() => {});
        }
      } catch (err) {}
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [adPayload?.messageToken]);

  // Non-html payloads: wrap with click tracker if targetUrl exists
  if (adPayload && adPayload.type !== 'html' && adPayload.targetUrl) {
    return (
      <div className={className} style={style}>
        <a
          href={adPayload.targetUrl}
          onClick={(e) => {
            e.preventDefault();
            fetch('/api/ads/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: adPayload._id, token: adPayload?.messageToken }) }).catch(() => {});
            window.open(adPayload.targetUrl, '_blank');
          }}
          rel="noopener noreferrer"
        >
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </a>
      </div>
    );
  }

  if (shouldUseIframe) {
    const allowJs = adPayload?.allowJs === true;
    // Build sandbox attributes: by default disallow scripts; allow if admin opted-in
    const sandboxAttrs = ['allow-same-origin', 'allow-popups', 'allow-forms'];
    if (allowJs) sandboxAttrs.push('allow-scripts');
    // Inject a small communication script into the srcDoc to post impressions and clicks to the parent window.
    const safeAdId = JSON.stringify(adPayload?._id || '');
    const safeTarget = JSON.stringify(adPayload?.targetUrl || '');
    const safeToken = JSON.stringify(adPayload?.messageToken || '');
    const injectedScript = `
      (function(){
        try{
          // notify parent of impression
          window.parent.postMessage({ type: 'ad-impression', adId: ${safeAdId}, token: ${safeToken} }, '*');
        }catch(e){}
        document.addEventListener('click', function(ev){
          try{
            var el = ev.target;
            while(el && !el.href && el.parentElement) el = el.parentElement;
            var href = (el && el.href) ? el.href : ${safeTarget};
            window.parent.postMessage({ type: 'ad-click', adId: ${safeAdId}, href: href, token: ${safeToken} }, '*');
          }catch(e){}
        }, true);
      })();`;

    const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
      (adPayload?.css ? `<style>${adPayload.css}</style>` : '') + `</head><body>` + injectedScript + html + `</body></html>`;

    return (
      <div className={className} style={style}>
        <iframe
          ref={iframeRef}
          title={adPayload?.title || 'ad-slot'}
          srcDoc={srcDoc}
          sandbox={sandboxAttrs.join(' ')}
          style={{ border: 0, width: '100%', height: adPayload?.height || 250 }}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
