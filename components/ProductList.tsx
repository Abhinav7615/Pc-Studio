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

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const { addItem } = useCart();
  const router = useRouter();

  const finalPrice = (original: number, discount: number) => original * (1 - discount / 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <div key={product._id} className="bg-white p-6 rounded-lg shadow">
          {product.images.length > 0 && (
            <Image src={product.images[0]} alt={product.name} width={300} height={200} className="w-full h-48 object-cover mb-4" />
          )}
          <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-2">{product.description}</p>
          <p className="text-lg font-bold text-red-600">
            ₹{finalPrice(product.originalPrice, product.discountPercent).toFixed(2)}
            {product.discountPercent > 0 && (
              <span className="text-sm text-gray-500 ml-2 line-through">₹{product.originalPrice}</span>
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
      ))}
    </div>
  );
}