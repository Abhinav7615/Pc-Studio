
"use client";
import { useWishlist } from '../../components/WishlistContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (wishlist.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/products?ids=${wishlist.join(',')}`)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]));
  }, [wishlist]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">💖 My Wishlist</h1>
      {products.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-gray-600 border border-gray-200">No products in your wishlist.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
              <img src={product.images[0]} alt={product.name} className="w-full h-40 object-cover rounded mb-4" />
              <h2 className="text-lg font-bold mb-2">{product.name}</h2>
              <p className="text-gray-700 mb-2 line-clamp-2">{product.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600 font-bold">₹{(product.originalPrice * (1 - product.discountPercent / 100)).toFixed(2)}</span>
                {product.discountPercent > 0 && (
                  <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>
                )}
              </div>
              <button
                className="mt-auto rounded-lg bg-pink-600 text-white px-4 py-2 font-semibold hover:bg-pink-700"
                onClick={() => removeFromWishlist(product._id)}
              >
                Remove from Wishlist
              </button>
              <button
                className="mt-2 rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700"
                onClick={() => router.push(`/product/${product._id}`)}
              >
                View Product
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
