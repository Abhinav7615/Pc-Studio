'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Product {
  _id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountPercent: number;
  gstPercent: number;
  quantity: number;
  marketMode?: 'none' | 'bargain' | 'auction';
  status?: 'active' | 'out-of-stock' | 'new' | 'archived';
  bargainEnabled?: boolean;
  biddingEnabled?: boolean;
  biddingStart?: string;
  biddingEnd?: string;
}

export default function AdminMarketPage() {
  const searchParams = useSearchParams();
  const productId = searchParams?.get('productId') || '';
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) {
      setError('Product ID is missing from the URL.');
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Unable to load product.');
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch product details.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏷️ Market Management</h1>
          <p className="text-sm text-gray-600 mt-2">Manage auction and bargain products from the dedicated market interface.</p>
        </div>
        <Link href="/admin/products" className="inline-flex items-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          ← Back to Products
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {!productId ? (
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-red-600">Missing productId query parameter.</p>
            <p>Please open this page from the product list using the Market link.</p>
          </div>
        ) : loading ? (
          <p className="text-gray-700">Loading product details…</p>
        ) : error ? (
          <p className="text-red-600 font-semibold">{error}</p>
        ) : product ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Product</p>
                <h2 className="text-2xl font-bold text-gray-900 truncate">{product.name}</h2>
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{product.description}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Status & Mode</p>
                <p className="text-sm text-gray-700">Mode: <span className="font-semibold capitalize">{product.marketMode || 'none'}</span></p>
                <p className="text-sm text-gray-700">Product status: <span className="font-semibold capitalize">{product.status || 'active'}</span></p>
                <p className="text-sm text-gray-700">Bargain enabled: {product.bargainEnabled ? 'Yes' : 'No'}</p>
                <p className="text-sm text-gray-700">Auction enabled: {product.biddingEnabled ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Pricing</p>
                <p className="text-xl font-bold text-gray-900">₹{(product.originalPrice * (1 - (product.discountPercent || 0)/100) * (1 + (product.gstPercent || 0)/100)).toFixed(2)}</p>
                <p className="text-sm text-gray-700">Final selling price</p>
                <p className="text-sm text-gray-700">Original: ₹{product.originalPrice}</p>
                <p className="text-sm text-gray-700">Discount: {product.discountPercent}%</p>
                <p className="text-sm text-gray-700">GST: {product.gstPercent ?? 0}%</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Inventory</p>
                <p className="text-xl font-bold text-gray-900">{product.quantity}</p>
                <p className="text-sm text-gray-700">Available</p>
              </div>
            </div>

            {product.marketMode === 'auction' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Auction schedule</p>
                <p className="text-sm text-gray-700">Start: {product.biddingStart ? new Date(product.biddingStart).toLocaleString() : 'Not set'}</p>
                <p className="text-sm text-gray-700">End: {product.biddingEnd ? new Date(product.biddingEnd).toLocaleString() : 'Not set'}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-700">No product details available.</p>
        )}
      </div>
    </div>
  );
}
