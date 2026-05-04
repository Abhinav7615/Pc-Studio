'use client';

import { useState } from 'react';

export default function TestDelhiveryPage() {
  const [awbNumber, setAwbNumber] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    if (!awbNumber.trim()) {
      alert('Please enter an AWB number');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-delhivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          awbNumber: awbNumber.trim(),
          testMode
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Network error', message: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const generateAWB = () => {
    const awb = `AWB${Date.now()}${Math.floor(Math.random() * 1000)}`;
    setAwbNumber(awb);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Delhivery API Test</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">AWB Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="Enter AWB number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={generateAWB}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="testMode"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="testMode" className="text-sm">Test Mode (no real API call)</label>
          </div>

          <button
            onClick={testAPI}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Delhivery API'}
          </button>
        </div>

        {result && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Result:</h2>
            <div className="bg-gray-100 p-4 rounded-md">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Generate or enter an AWB number</li>
            <li>Uncheck "Test Mode" to make real API calls</li>
            <li>Click "Test Delhivery API"</li>
            <li>Check the result and server logs</li>
            <li>If real API fails, check the error details</li>
          </ol>
        </div>
      </div>
    </div>
  );
}