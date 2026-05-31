'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ConsumerChatPanel from '@/components/ConsumerChatPanel';
import { useConsumerChat } from '@/components/ConsumerChatContext';
import { useEffect, useState } from 'react';

export default function ChatModeGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const { consumerChatEnabled, loading } = useConsumerChat();
  const [consumerChatGloballyEnabled, setConsumerChatGloballyEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/business-settings?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setConsumerChatGloballyEnabled(data.consumerChatEnabled ?? true);
      } catch (error) {
        setConsumerChatGloballyEnabled(true);
      }
    };
    fetchSettings();
  }, []);

  const allowedPaths = ['/profile', '/login', '/register', '/admin'];
  const normalizedPathname = pathname || '';
  const isAllowedPath = allowedPaths.some((path) => normalizedPathname.startsWith(path));
  const isChatOnlyMode = status === 'authenticated' && !loading && consumerChatEnabled && consumerChatGloballyEnabled;

  // If chat mode is not active or globally disabled, show normal website
  if (!isChatOnlyMode) {
    return <>{children}</>;
  }

  // If on allowed paths (profile, login, register, admin), show normal website but with chat mode indicator
  if (isAllowedPath) {
    return (
      <>
        {children}
        {/* Chat mode indicator */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white shadow-lg">
            Chat Mode Active - <Link href="/" className="underline">Go to Chat</Link>
          </div>
        </div>
      </>
    );
  }

  // For all other pages when chat mode is active, show full chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with chat mode branding */}
      <header className="border-b border-blue-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">💬</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">PC Studio Chat</h1>
                  <p className="text-sm text-gray-600">Consumer-to-Consumer Communication</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Profile Settings
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Refresh Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main chat interface */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white shadow-xl overflow-hidden">
          <ConsumerChatPanel enabled />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-blue-200 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>Chat Mode Active - Connect with other consumers on PC Studio</p>
            <p className="mt-1">© 2026 PC Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
