import { registerProvider } from '../index';

const PropellerProvider = {
  id: 'propeller-ads',
  name: 'PropellerAds (placeholder)',
  render: async (opts: any) => {
    return `<div data-provider="propeller">PropellerAds placeholder for zone=${opts?.zone || 'unknown'}</div>`;
  },
  test: async () => true,
};

registerProvider(PropellerProvider as any);

export default PropellerProvider;
