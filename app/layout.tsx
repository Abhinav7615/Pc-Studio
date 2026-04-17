import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import SiteAvailabilityGuard from "@/components/SiteAvailabilityGuard";
import ThemeProvider from "@/components/ThemeProvider";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Refurbished PC Studio",
  description: "E-commerce website for refurbished PCs",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
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
