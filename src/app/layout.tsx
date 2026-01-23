import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopNav from '@/components/top-nav'
import BottomNav from '@/components/bottom-nav'
import NotificationListener from '@/components/notification-listener'
import UnreadMessagePopup from '@/components/unread-message-popup'

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Parramatta Golf",
  description: "Premium Golf Community Platform",
};

import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} overflow-x-hidden`} suppressHydrationWarning>
      <body className={`${inter.className} bg-[var(--color-bg)] min-h-screen overflow-x-hidden`}>
        {/* Mobile Layout Container */}
        <div className="flex justify-center min-h-screen overflow-x-hidden">
          <main className="w-full max-w-[500px] bg-[var(--color-bg)] min-h-screen relative flex flex-col overflow-x-hidden">
            {/* Top Navigation */}
            <TopNav />
            <NotificationListener />
            <UnreadMessagePopup />
            <Toaster position="top-center" theme="dark" richColors />

            {/* Main Content */}
            <div className="flex-1 pb-16">
              {children}
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
          </main>
        </div>
      </body>
    </html>
  );
}
