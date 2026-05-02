import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import SiteAvailabilityGuard from "@/components/SiteAvailabilityGuard";
import ThemeProvider from "@/components/ThemeProvider";
import ChatWidget from "@/components/ChatWidget";

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
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    other: [
      { rel: "manifest", url: "/manifest.json" },
    ],
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
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/favicon.ico" as="image" />
      </head>
      <body className="antialiased min-h-screen">
        <Providers>
          <ThemeProvider>
            <Header />
            <SiteAvailabilityGuard>{children}</SiteAvailabilityGuard>
            <ChatWidget />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
