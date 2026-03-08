'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Critical Error</h2>
            <p className="text-gray-600 mb-4">
              A critical error occurred in the application.
            </p>
            <button
              onClick={() => reset()}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}