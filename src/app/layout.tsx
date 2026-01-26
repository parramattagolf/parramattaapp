import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TopNav from '@/components/top-nav'
import BottomNav from '@/components/bottom-nav'
import NotificationListener from '@/components/notification-listener'
import UnreadMessagePopup from '@/components/unread-message-popup'
import PushNotificationManager from '@/components/push-notification-manager'

const kakaoFont = localFont({
  src: [

    {
      path: '../../public/fonts/카카오작은글씨/웹폰트/woff2/KakaoSmallSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/카카오작은글씨/웹폰트/woff2/KakaoSmallSans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-kakao',
  display: 'swap',
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
    <html lang="ko" className={`${kakaoFont.variable} overflow-x-hidden`} suppressHydrationWarning>
      <body className={`${kakaoFont.className} bg-[var(--color-bg)] min-h-screen overflow-x-hidden`}>
        {/* Mobile Layout Container */}
        <div className="flex justify-center min-h-screen overflow-x-hidden">
          <main className="w-full max-w-[500px] bg-[var(--color-bg)] min-h-screen relative flex flex-col overflow-x-hidden">
            {/* Top Navigation */}
            <TopNav />
            <NotificationListener />
            <PushNotificationManager />
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
