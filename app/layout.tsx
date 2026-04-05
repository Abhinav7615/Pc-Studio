import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import SiteAvailabilityGuard from "@/components/SiteAvailabilityGuard";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Refurbished PC Studio",
  description: "E-commerce website for refurbished PCs",
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
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
