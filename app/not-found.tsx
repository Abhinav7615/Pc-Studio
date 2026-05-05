import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-12 rounded-2xl shadow-xl max-w-lg w-full text-center border border-gray-100">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          It might have been moved, deleted, or you entered the wrong URL.
        </p>
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
          >
            🏠 Go to Homepage
          </Link>
          <div className="text-sm text-gray-500">
            <p>Or try searching for what you need:</p>
            <div className="mt-2 flex gap-2 justify-center">
              <Link href="/products" className="text-blue-600 hover:text-blue-800 underline">
                Browse Products
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/support-tickets" className="text-blue-600 hover:text-blue-800 underline">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}