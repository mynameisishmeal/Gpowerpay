import Script from 'next/script';
import type { Metadata } from "next";
import { Suspense } from 'react';
import "./globals.css";
import "./responsive.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { Navbar } from "@/components/layout/Navbar";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { ToastProvider } from '@/components/providers/ToastProvider';
import { AlertProvider } from "@/lib/hooks/useAlert";

export const metadata: Metadata = {
  title: {
    default: "Gpower Pay",
    template: "%s | Gpower Pay",
  },
  description: "Gpower Frozen Foods Online Store & Delivery Platform",
  keywords: ["frozen foods", "online store", "delivery", "gpower", "nigeria"],
  authors: [{ name: "Gpower Frozen Foods" }],
  creator: "Gpower Frozen Foods",
  publisher: "Gpower Frozen Foods",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Paystack Inline JS */}
        <Script
          src="https://js.paystack.co/v1/inline.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <SessionProvider>
            <AlertProvider>
              <LoadingProvider>
                <Navbar />
              <EmailVerificationBanner />
                <main className="flex-1">{children}</main>
                <ToastProvider />
              </LoadingProvider>
            </AlertProvider>
          </SessionProvider>
        </Suspense>
      </body>
    </html>
  );
}
