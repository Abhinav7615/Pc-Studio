/**
 * Simple provider registry for advertisement providers.
 * Keep minimal to avoid coupling; providers can register themselves.
 */
type ProviderImpl = {
  id: string;
  name: string;
  render?: (opts: any) => Promise<string> | string;
  test?: () => Promise<boolean> | boolean;
};

const providers: Record<string, ProviderImpl> = {};

export function registerProvider(p: ProviderImpl) {
  if (!p || !p.id) return;
  providers[p.id] = p;
}

export function getProvider(id: string) {
  return providers[id];
}

export function listProviders() {
  return Object.values(providers);
}

export default { registerProvider, getProvider, listProviders };

// Attempt to load built-in providers (side-effect: registers providers)
void import('./providers').catch(() => {
  // ignore if providers folder missing in minimal installs
});
