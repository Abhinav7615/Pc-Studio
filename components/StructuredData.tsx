import { Metadata } from 'next';

interface StructuredDataProps {
  type: 'website' | 'organization' | 'product' | 'breadcrumb';
  data: Record<string, any>;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type === 'website' ? 'WebSite' : type.charAt(0).toUpperCase() + type.slice(1),
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(baseData),
      }}
    />
  );
}

// Predefined structured data components
export function WebsiteStructuredData({ url = 'https://pcstudio.com' }: { url?: string }) {
  return (
    <StructuredData
      type="website"
      data={{
        name: 'PC Studio',
        description: 'Shop premium refurbished computers and laptops at affordable prices',
        url,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${url}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function OrganizationStructuredData() {
  return (
    <StructuredData
      type="organization"
      data={{
        name: 'PC Studio',
        description: 'Leading provider of refurbished computers and laptops',
        url: 'https://pcstudio.com',
        logo: 'https://pcstudio.com/icon-512.png',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-XXXXXXXXXX',
          contactType: 'customer service',
          availableLanguage: 'English',
        },
        sameAs: [
          'https://facebook.com/pcstudio',
          'https://twitter.com/pcstudio',
          'https://instagram.com/pcstudio',
        ],
      }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <StructuredData
      type="breadcrumb"
      data={{
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}