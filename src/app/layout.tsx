import type { Metadata } from "next";
import { Manrope, Barlow_Condensed, Geist_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DealFlow AI — Off-Market Deal Intelligence",
  description:
    "Find business owners ready to sell before they know it themselves. Scored off-market leads for business brokers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${barlow.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="ambient min-h-full flex flex-col">{children}</body>
    </html>
  );
}
