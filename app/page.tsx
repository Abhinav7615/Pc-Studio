import Link from 'next/link';
import ProductList from '@/components/ProductList';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Refurbished PC Studio</h2>
          <p className="text-gray-600 text-lg">Discover high-quality refurbished computers at unbeatable prices</p>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Products</h2>
        <ProductList />
      </main>
    </div>
  );
}
