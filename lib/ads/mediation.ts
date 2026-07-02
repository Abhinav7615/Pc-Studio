import Ad from '@/models/Ad';
import Provider from '@/models/Provider';
import { getProvider } from './index';
import { sanitizeHtml } from '@/lib/ads/sanitize';

/**
 * Mediation helper: weighted random selection with cooldown and basic provider filtering.
 */
export async function selectAd(candidates: any[]) {
  if (!candidates || candidates.length === 0) return null;

  const now = Date.now();

  // Enrich with provider info
  const withProviders = await Promise.all(candidates.map(async (ad) => {
    let provider = null;
    try {
      if (ad.provider) provider = await Provider.findById(ad.provider).lean();
    } catch (_err) {
      provider = null;
    }
    return { ad, provider };
  }));

  // Apply cooldown/frequency cap filtering
  const filtered = withProviders.filter(({ ad }) => {
    if (!ad) return false;
    if (ad.status !== 'active') return false;
    if (ad.frequencyCap && typeof ad.frequencyCap === 'number' && ad.impressions >= ad.frequencyCap) return false;
    if (ad.cooldownSeconds && ad.lastImpressionAt) {
      const elapsed = (now - new Date(ad.lastImpressionAt).getTime()) / 1000;
      if (elapsed < (ad.cooldownSeconds || 0)) return false;
    }
    return true;
  }).map(({ ad, provider }) => ({ ad, provider }));

  if (filtered.length === 0) return null;

  // Compute weights for weighted random selection
  // Handle rotation strategies
  // If any ad requests round_robin or sequential, pick the ad with the oldest lastImpressionAt
  const rr = filtered.find(({ ad }) => (ad.rotationStrategy || 'weighted') === 'round_robin' || (ad.rotationStrategy || 'weighted') === 'sequential');
  if (rr) {
    // pick ad with oldest lastImpressionAt (or createdAt)
    filtered.sort((a, b) => {
      const la = a.ad.lastImpressionAt ? new Date(a.ad.lastImpressionAt).getTime() : 0;
      const lb = b.ad.lastImpressionAt ? new Date(b.ad.lastImpressionAt).getTime() : 0;
      return la - lb;
    });
    const chosen = filtered[0].ad;
    const providerDoc = filtered[0].provider;
    const providerImpl = getProvider(providerDoc?.type || providerDoc?.name || '');
    let providerMarkup = undefined;
    try {
      if (providerImpl && typeof providerImpl.render === 'function') {
        providerMarkup = await providerImpl.render({ zone: chosen.zone, ad: chosen });
      } else if (providerDoc) {
        // Prefer stored provider HTML/JS from DB when adapter not present
        if (providerDoc.html) providerMarkup = sanitizeHtml(providerDoc.html);
        else if (providerDoc.javascript && providerDoc.allowJs) providerMarkup = `<script>${providerDoc.javascript}</script>`;
      }
    } catch (e) {
      providerMarkup = undefined;
    }
    return { ad: chosen, providerMarkup, provider: providerDoc };
  }

  const items = filtered.map(({ ad, provider }) => {
    const weight = (ad.weight || 1) * (1 + (ad.priority || 0)) * (1 + (provider?.priority || 0));
    return { ad, weight: Math.max(0.1, weight) };
  });

  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    if (r < it.weight) {
      const chosen = it.ad;
      const providerDoc = filtered.find(f => String(f.ad._id) === String(chosen._id))?.provider;
      const providerImpl = getProvider(providerDoc?.type || providerDoc?.name || '');
      let providerMarkup = undefined;
      try {
        if (providerImpl && typeof providerImpl.render === 'function') {
          providerMarkup = await providerImpl.render({ zone: chosen.zone, ad: chosen });
        } else if (providerDoc) {
          if (providerDoc.html) providerMarkup = sanitizeHtml(providerDoc.html);
          else if (providerDoc.javascript && providerDoc.allowJs) providerMarkup = `<script>${providerDoc.javascript}</script>`;
        }
      } catch (e) {
        providerMarkup = undefined;
      }
      return { ad: chosen, providerMarkup, provider: providerDoc };
    }
    r -= it.weight;
  }

  const fallback = items[0].ad;
  return { ad: fallback, providerMarkup: undefined, provider: null };
}

export default { selectAd };
