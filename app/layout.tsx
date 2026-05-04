import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import SiteAvailabilityGuard from "@/components/SiteAvailabilityGuard";
import ThemeProvider from "@/components/ThemeProvider";
import ChatWidget from "@/components/ChatWidget";
import PWAProvider from "@/components/PWAProvider";

export const metadata: Metadata = {
  title: {
    default: "Refurbished PC Studio",
    template: "%s | Refurbished PC Studio",
  },
  description: "E-commerce website for refurbished PCs",
  keywords: ["refurbished PC", "second hand computer", "laptop", "desktop", "gaming PC"],
  authors: [{ name: "PC Studio" }],
  creator: "PC Studio",
  publisher: "PC Studio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
  // PWA Metadata
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PC Studio",
  },
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://pcstudio.com",
    siteName: "Refurbished PC Studio",
    title: "Refurbished PC Studio",
    description: "E-commerce website for refurbished PCs",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PC Studio",
      },
    ],
  },
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Refurbished PC Studio",
    description: "E-commerce website for refurbished PCs",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e3a8a",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Icons and Favicon */}
        <link rel="icon" href="/file.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#1e3a8a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PC Studio" />
        
        {/* Microsoft Tags */}
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-TileColor" content="#1e3a8a" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased min-h-screen">
        <PWAProvider>
          <Providers>
            <ThemeProvider>
              <Header />
              <SiteAvailabilityGuard>{children}</SiteAvailabilityGuard>
              <ChatWidget />
            </ThemeProvider>
          </Providers>
        </PWAProvider>
      </body>
    </html>
  );
}
