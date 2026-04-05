import ProductList from '@/components/ProductList';
import { Suspense } from 'react';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';
import Content from '@/models/Content';

async function getBusinessSettings() {
  try {
    await dbConnect();

    let settings = await BusinessSettings.findOne().lean();

    if (!settings) {
      settings = new BusinessSettings();
      await settings.save();
      settings = settings.toObject();
    }

    return {
      websiteName: settings.websiteName || 'Refurbished PC Studio',
      offlineShopEnabled: settings.offlineShopEnabled ?? false,
      ...settings,
    };
  } catch (error) {
    console.error('Failed to load business settings from DB:', error);
  }

  // Return default settings if fetch fails
  return {
    websiteName: 'Refurbished PC Studio',
    offlineShopEnabled: false,
  };
}

async function getPageContents() {
  try {
    await dbConnect();
    // Include documents that are explicitly active OR missing isActive (legacy data), then sort by order and updatedAt
    const contents = await Content.find({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
      ],
    }).sort({ displayOrder: 1, updatedAt: -1 }).lean();

    // Ensure existing records without isActive default to true for safe rendering
    return contents.map((item) => ({
      ...item,
      isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
      displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : 1000,
    }));
  } catch (error) {
    console.error('Failed to load contents', error);
    return [];
  }
}

export default async function Home() {
  const settings = await getBusinessSettings();
  const contents = await getPageContents();

  const activeContent = Array.isArray(contents) ? contents : [];

  return (
    <div className="min-h-screen bg-theme-background text-theme-body">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-theme-surface p-8 rounded-lg shadow mb-8 border border-theme">
          <h2 className="text-3xl font-bold mb-4" style={{ color: settings.websiteNameColor || settings?.websiteNameColor || '#111827' }}>
            Welcome to {settings?.websiteName || 'Refurbished PC Studio'}
          </h2>
          <p className="text-theme-body text-lg font-medium">Discover high-quality refurbished computers at unbeatable prices</p>
        </div>

        {settings?.offlineShopEnabled && (
          <div className="bg-blue-50 p-6 rounded-lg shadow mb-8 border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">🏪 Visit Our Offline Store</h3>
            {settings.offlineShopAddress && (
              <p className="text-blue-800 mb-1">
                <strong>Address:</strong> {settings.offlineShopAddress}
              </p>
            )}
            {(settings.offlineShopCity || settings.offlineShopState || settings.offlineShopPincode) && (
              <p className="text-blue-800 mb-1">
                <strong>Location:</strong> {[
                  settings.offlineShopCity,
                  settings.offlineShopState,
                  settings.offlineShopPincode
                ].filter(Boolean).join(', ')}
              </p>
            )}
            {settings.offlineShopGoogleMapsLink && (
              <p className="mt-2">
                <a href={settings.offlineShopGoogleMapsLink} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline">
                  Open in Google Maps
                </a>
              </p>
            )}
            <p className="text-blue-700 text-sm mt-2">
              Visit us in person for personalized service and to see our products before purchasing!
            </p>
          </div>
        )}

        {(settings?.contactWhatsapp || settings?.contactEmail) && (
          <div className="bg-green-50 p-6 rounded-lg shadow mb-8 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-green-900 mb-2">📞 Contact Details</h3>
            {settings.contactWhatsapp && (
              <p className="mb-1" style={{ color: settings.contactWhatsappColor || '#16a34a' }}>
                WhatsApp: {settings.contactWhatsapp}
              </p>
            )}
            {settings.contactEmail && (
              <p className="mb-1" style={{ color: settings.contactEmailColor || '#1d4ed8' }}>
                Email: {settings.contactEmail}
              </p>
            )}
            {settings.contactWhatsapp && (
              <a
                href={`https://wa.me/${settings.contactWhatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-green-700 hover:underline"
              >
                Message on WhatsApp
              </a>
            )}
          </div>
        )}

        {activeContent.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">📰 Latest Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeContent.map((item) => (
                <article key={item._id} className="p-4 bg-white rounded-lg shadow border border-gray-200">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <div className="text-gray-800 text-sm mb-2">{new Date(item.updatedAt).toLocaleString()}</div>
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: item.content }} />
                  <div className="mt-2 text-xs text-gray-500">Key: {item.key}</div>
                </article>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Products</h2>
        <Suspense fallback={<div className="text-center py-8">Loading products...</div>}>
          <ProductList />
        </Suspense>
      </main>
    </div>
  );
}
