export interface Targeting {
  countries?: string[];
  states?: string[];
  cities?: string[];
  devices?: string[];
  languages?: string[];
  loggedInOnly?: boolean;
}

export interface AdRecord {
  _id?: string;
  title?: string;
  provider?: string;
  providerName?: string;
  providerType?: string;
  zone: string;
  type?: 'html'|'js'|'image'|'video'|'iframe'|'native';
  html?: string;
  js?: string;
  css?: string;
  image?: string;
  video?: string;
  iframeSrc?: string;
  nativePayload?: any;
  targetUrl?: string;
  startDate?: string;
  endDate?: string;
  status?: 'draft'|'active'|'disabled'|'expired';
  priority?: number;
  weight?: number;
  impressions?: number;
  clicks?: number;
  targeting?: Targeting;
}
