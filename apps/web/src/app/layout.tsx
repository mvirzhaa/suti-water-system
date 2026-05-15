import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Suti Water System",
  description: "Sistem Manajemen Distribusi Air Mineral Suti Water",
  icons: {
    icon: "/images/logo-login2.png",
    shortcut: "/images/logo-login2.png",
    apple: "/images/logo-login2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/images/logo-login2.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo-login2.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo-login2.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
