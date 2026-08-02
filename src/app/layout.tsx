import Script from 'next/script';
import type { Metadata } from "next";
import { Suspense } from 'react';
import "./globals.css";
import "./responsive.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { Navbar } from "@/components/layout/Navbar";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { Toaster } from 'react-hot-toast';
import { AlertProvider } from "@/lib/hooks/useAlert";

export const metadata: Metadata = {
  title: "Gpower CRM",
  description: "Gpower Frozen Foods CRM System",
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
              <Navbar />
              <EmailVerificationBanner />
              <main className="flex-1">{children}</main>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#fff',
                    color: '#1e293b',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AlertProvider>
          </SessionProvider>
        </Suspense>
      </body>
    </html>
  );
}
