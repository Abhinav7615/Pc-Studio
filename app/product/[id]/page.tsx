'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/components/CartContext';

interface Product {
  _id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountPercent: number;
  gstPercent?: number;
  quantity: number;
  images: string[];
  status?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data: Product[] = await res.json();
        const match = data.find((item) => item._id === productId);
        if (match) {
          setProduct(match);
          setActiveImage(match.images?.[0] || '');
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem('recentProducts') : null;
          const recent = stored ? (JSON.parse(stored) as Product[]) : [];
          const updated = [match, ...recent.filter((item) => item._id !== match._id)].slice(0, 5);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('recentProducts', JSON.stringify(updated));
          }
          setRecentlyViewed(updated.filter((item) => item._id !== match._id));
        }
      } catch (error) {
        console.error('Unable to load product', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  const finalPrice = useMemo(() => {
    if (!product) return 0;
    return product.originalPrice * (1 - product.discountPercent / 100);
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    if (quantity < 1) return;
    if (quantity > product.quantity) return;
    addItem({
      productId: product._id,
      name: product.name,
      price: finalPrice,
      gstPercent: product.gstPercent || 0,
      quantity,
    });
    router.push('/cart');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen px-4 py-20 text-center">
        <p className="text-xl font-semibold text-slate-900">Product not found</p>
        <p className="mt-3 text-slate-500">Please return to the homepage or choose another item.</p>
        <div className="mt-6">
          <Link href="/" className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Product details</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">{product.name}</h1>
          </div>
          <Link href="/cart" className="inline-flex items-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
            🛒 View Cart
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="space-y-6 rounded-[32px] bg-white p-6 shadow-soft">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[32px] overflow-hidden bg-slate-100">
                <img src={activeImage || '/icon-192.png'} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {product.images?.slice(0, 4).map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      className={`overflow-hidden rounded-3xl border ${activeImage === image ? 'border-blue-600' : 'border-slate-200'} bg-white`}
                    >
                      <img src={image} alt={product.name} className="h-24 w-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="rounded-[28px] bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">{product.quantity > 0 ? 'In stock' : 'Out of stock'}</span>
                    <span className="text-sm text-slate-500">Est. delivery: 2-5 days</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    <p className="text-slate-500">Product code</p>
                    <p className="text-base font-semibold text-slate-900">{product._id}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[32px] bg-slate-50 p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Price</p>
                    <p className="mt-2 text-4xl font-semibold text-slate-900">₹{finalPrice.toFixed(2)}</p>
                    {product.discountPercent > 0 && (
                      <p className="text-sm text-slate-500 line-through">₹{product.originalPrice.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="rounded-3xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                    {product.discountPercent > 0 ? `${product.discountPercent}% off` : 'Best value'}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
                    GST: {product.gstPercent ?? 0}%
                  </div>
                  <div className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
                    Condition: Refurbished
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
                <div className="rounded-[32px] bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
                  <p className="mt-3 text-slate-600">{product.description || 'This refurbished product has been inspected and tested for quality. It offers reliable performance at a smart price.'}</p>
                </div>
                <div className="rounded-[32px] bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">Why buy it</h2>
                  <ul className="mt-4 space-y-3 text-slate-600">
                    <li>✅ Thoroughly tested by experts</li>
                    <li>✅ Secure checkout and warranty support</li>
                    <li>✅ Fast delivery and customer help</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] bg-white p-6 shadow-soft ring-1 ring-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Checkout</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <label className="text-sm font-semibold text-slate-700">Quantity</label>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700"
                    >
                      −
                    </button>
                    <span className="text-lg font-semibold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.min(product.quantity, value + 1))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.quantity <= 0}
                  className="w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  Add to cart
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  View cart
                </button>
              </div>
            </div>

            <div className="rounded-[32px] bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Need help?</h3>
              <p className="mt-3 text-sm text-slate-600">Reach out to support for product advice, delivery updates or returns.</p>
              <div className="mt-4 space-y-3">
                <Link href="/support-tickets" className="block rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100">
                  Create a support ticket
                </Link>
                <Link href="/" className="block rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                  Browse more products
                </Link>
              </div>
            </div>

            {recentlyViewed.length > 0 && (
              <div className="rounded-[32px] bg-white p-6 shadow-soft ring-1 ring-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Recently viewed</h3>
                <div className="mt-4 space-y-3">
                  {recentlyViewed.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => router.push(`/product/${item._id}`)}
                      className="w-full text-left rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
