'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface WeeklyScheduleItem {
  day: number;
  dayName: string;
  active: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessSettings {
  siteOpen?: boolean;
  scheduleEnabled?: boolean;
  alwaysOpen247?: boolean;
  globalOpenTime?: string;
  globalCloseTime?: string;
  closedPageTitle?: string;
  closedPageMessage?: string;
  weeklySchedule?: WeeklyScheduleItem[];
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headerColor?: string;
  cardColor?: string;
}

export default function SiteAvailabilityGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const isOpen = settings?.siteOpen === false ? false : true; // default open for unspecified/true

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/business-settings', {
          next: { revalidate: 300 },
        });
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error('Error loading site availability', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const parseThemePreview = (): BusinessSettings | null => {
      if (typeof window === 'undefined') return null;
      const stored = window.localStorage.getItem('themePreview');
      if (!stored) return null;
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    };

    const applyTheme = (settings: BusinessSettings) => {
      const root = document.documentElement;
      if (!root) return;

      const previewSettings = parseThemePreview();
      const targetSettings = previewSettings || settings;

      const themeMap: Record<string, string | undefined> = {
        '--primary-color': targetSettings.primaryColor || '#2563eb',
        '--secondary-color': targetSettings.secondaryColor || '#9333ea',
        '--background-color': targetSettings.backgroundColor || '#f8fafc',
        '--text-color': targetSettings.textColor || '#111827',
        '--header-color': targetSettings.headerColor || '#ffffff',
        '--card-color': targetSettings.cardColor || '#ffffff',
      };

      Object.entries(themeMap).forEach(([varName, value]) => {
        if (value) {
          root.style.setProperty(varName, value);
        }
      });
    };

    if (settings) {
      applyTheme(settings);
    }
  }, [settings]);

  const canIgnoreLock = pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/register';

  if (!isOpen && !canIgnoreLock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8 text-center">
        <div className="max-w-lg bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          <h1 className="text-4xl font-bold text-red-600 mb-4">{settings?.closedPageTitle || 'Website Temporarily Closed'}</h1>
          <p className="text-lg text-gray-700 mb-2">{settings?.closedPageMessage || 'We are currently closed. Please come back during our working hours.'}</p>
          <p className="text-sm text-gray-500 mt-4">If you are an admin, login at /admin.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
