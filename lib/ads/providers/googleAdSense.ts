import { registerProvider } from '../index';

const GoogleAdSenseProvider = {
  id: 'google-adsense',
  name: 'Google AdSense (placeholder)',
  render: async (opts: any) => {
    // Placeholder string. In production, return provider script/iframe markup.
    return `<div data-provider="adsense">AdSense placeholder for zone=${opts?.zone || 'unknown'}</div>`;
  },
  test: async () => true,
};

registerProvider(GoogleAdSenseProvider as any);

export default GoogleAdSenseProvider;
