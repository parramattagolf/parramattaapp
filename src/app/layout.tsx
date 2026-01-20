import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopNav from '@/components/top-nav'
import BottomNav from '@/components/bottom-nav'
import NotificationListener from '@/components/notification-listener'

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Parramatta Golf",
  description: "Premium Golf Community Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} bg-[var(--color-bg)] min-h-screen`}>
        {/* Mobile Layout Container */}
        <div className="flex justify-center min-h-screen">
          <main className="w-full max-w-[500px] bg-[var(--color-bg)] min-h-screen relative flex flex-col">
            {/* Top Navigation */}
            <TopNav />
            <NotificationListener />

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
