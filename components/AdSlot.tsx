'use client';

import { useEffect, useState } from 'react';

interface AdSlotProps {
  zone: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function AdSlot({ zone, className = '', width, height }: AdSlotProps) {
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadAd();
  }, [zone]);

  const loadAd = async () => {
    try {
      setLoading(true);
      setError(false);

      // Get visitor ID from session storage or generate one
      let visitorId = typeof window !== 'undefined' ? sessionStorage.getItem('ad-visitor-id') : null;
      if (!visitorId) {
        visitorId = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('ad-visitor-id', visitorId);
        }
      }

      const headers: any = {
        'x-visitor-id': visitorId,
      };

      // Try to detect user location and device
      if (typeof navigator !== 'undefined') {
        headers['user-agent'] = navigator.userAgent;
      }

      const res = await fetch(`/api/ads?zone=${encodeURIComponent(zone)}`, { headers });

      if (res.status === 204 || !res.ok) {
        setError(false);
        setAd(null);
        return;
      }

      const data = await res.json();
      setAd(data);
    } catch (err) {
      console.error('Failed to load ad for zone:', zone, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const recordImpression = async () => {
    if (!ad || !ad._id) return;
    try {
      await fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad._id, token: ad.messageToken }),
      });
    } catch (err) {
      console.error('Failed to record impression', err);
    }
  };

  const recordClick = async () => {
    if (!ad || !ad._id) return;
    try {
      await fetch('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad._id, token: ad.messageToken }),
      });
    } catch (err) {
      console.error('Failed to record click', err);
    }
  };

  useEffect(() => {
    if (ad) {
      recordImpression();
    }
  }, [ad]);

  if (loading || error || !ad) {
    return null; // Don't show anything if no ad or error
  }

  const handleAdClick = () => {
    recordClick();
    if (ad.targetUrl) {
      window.open(ad.targetUrl, '_blank');
    }
  };

  const containerStyle = width && height ? { width: `${width}px`, height: `${height}px` } : {};

  return (
    <div
      className={`ad-slot ${className}`}
      style={{
        ...containerStyle,
        overflow: 'hidden',
        position: 'relative' as const,
      }}
      data-ad-id={ad._id}
      data-ad-zone={zone}
    >
      {ad.html && (
        <div
          dangerouslySetInnerHTML={{ __html: ad.html }}
          onClick={handleAdClick}
          style={{ cursor: 'pointer' }}
        />
      )}

      {ad.image && (
        <img
          src={ad.image}
          alt={ad.title || 'Advertisement'}
          onClick={handleAdClick}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
        />
      )}

      {ad.video && (
        <video
          src={ad.video}
          controls
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}

      {ad.iframeSrc && (
        <iframe
          src={ad.iframeSrc}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title={ad.title || 'Advertisement'}
        />
      )}

      {ad.provider === 'third-party' && ad.html && (
        <div style={{ fontSize: '10px', color: '#999', padding: '2px' }}>Ad</div>
      )}
    </div>
  );
}
