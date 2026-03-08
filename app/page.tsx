import Link from 'next/link';
import ProductList from '@/components/ProductList';
import { Suspense } from 'react';

async function getBusinessSettings() {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/business-settings`, {
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch business settings');
  }
  return null;
}

export default async function Home() {
  const settings = await getBusinessSettings();

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to {settings?.websiteName || 'Refurbished PC Studio'}</h2>
          <p className="text-gray-700 text-lg font-medium">Discover high-quality refurbished computers at unbeatable prices</p>
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
            <p className="text-blue-700 text-sm mt-2">
              Visit us in person for personalized service and to see our products before purchasing!
            </p>
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
