'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useCart } from './CartContext';
import { useRouter } from 'next/navigation';

interface Product {
  _id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountPercent: number;
  quantity: number;
  images: string[];
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [maxPrice, setMaxPrice] = useState<number>(0);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        if (data.length > 0) {
          const maxPriceValue = Math.max(...data.map((p: Product) => p.originalPrice));
          setMaxPrice(Math.ceil(maxPriceValue / 10000) * 10000);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProducts();
      }
    };

    const handleProductsUpdated = () => {
      fetchProducts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('productsUpdated', handleProductsUpdated);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('productsUpdated', handleProductsUpdated);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const { addItem } = useCart();
  const router = useRouter();

  const finalPrice = (original: number, discount: number) => original * (1 - discount / 100);

  // Filter logic
  const filteredProducts = products.filter(product => {
    // Availability filter
    if (availabilityFilter === 'instock' && product.quantity <= 0) return false;
    if (availabilityFilter === 'outofstock' && product.quantity > 0) return false;

    // Price filter
    const minPrice = priceFilter.min ? parseFloat(priceFilter.min) : 0;
    const maxPriceFilter = priceFilter.max ? parseFloat(priceFilter.max) : maxPrice;
    const productPrice = product.originalPrice;
    if (productPrice < minPrice || productPrice > maxPriceFilter) return false;

    return true;
  });

  return (
    <>
      {/* Filter Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Filter Products</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Availability Filter */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">📦 Availability:</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value="all"
                  checked={availabilityFilter === 'all'}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-gray-800 font-medium">All Products</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value="instock"
                  checked={availabilityFilter === 'instock'}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-gray-800 font-medium">✅ In Stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value="outofstock"
                  checked={availabilityFilter === 'outofstock'}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-gray-800 font-medium">❌ Out of Stock</span>
              </label>
            </div>
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">💰 Price Range:</label>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex-1 min-w-fit">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceFilter.min}
                  onChange={(e) => setPriceFilter({ ...priceFilter, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <span className="text-gray-600 font-bold">-</span>
              <div className="flex-1 min-w-fit">
                <input
                  type="number"
                  placeholder={`Max (₹${maxPrice})`}
                  value={priceFilter.max}
                  onChange={(e) => setPriceFilter({ ...priceFilter, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button
                onClick={() => setPriceFilter({ min: '', max: '' })}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold min-w-fit"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mt-4">
          📊 Showing <span className="font-bold text-gray-900">{filteredProducts.length}</span> of <span className="font-bold text-gray-900">{products.length}</span> products
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-2xl font-bold text-gray-600 mb-2">😢 No Products Found</p>
            <p className="text-gray-500">Try adjusting your filters to see more products</p>
          </div>
        ) : (
          filteredProducts.map(product => (
        <div key={product._id} className="bg-white p-6 rounded-lg shadow">
          {product.images.length > 0 && (
            <Image src={product.images[0]} alt={product.name} width={300} height={200} className="w-full h-48 object-cover mb-4" />
          )}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-gray-800 mb-2 font-semibold">{product.description}</p>
          <p className="text-lg font-bold text-red-600">
            ₹{finalPrice(product.originalPrice, product.discountPercent).toFixed(2)}
            {product.discountPercent > 0 && (
              <span className="text-sm text-gray-600 ml-2 line-through">₹{product.originalPrice}</span>
            )}
          </p>
          {product.discountPercent > 0 && (
            <p className="text-green-600 font-semibold">{product.discountPercent}% off</p>
          )}
          {product.quantity <= 0 ? (
            <p className="text-red-600 font-semibold mt-2">Out of Stock</p>
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  // @ts-ignore
                  addItem({ productId: product._id, name: product.name, price: finalPrice(product.originalPrice, product.discountPercent), quantity: 1 });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add to Cart
              </button>
              <button
                onClick={() => {
                  // @ts-ignore
                  addItem({ productId: product._id, name: product.name, price: finalPrice(product.originalPrice, product.discountPercent), quantity: 1 });
                  router.push('/cart');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
          ))
        )}
      </div>
    </>
  );
}