import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

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
          {/* header moved into its own client component so cart/session work everywhere */}
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
