import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { MainNav } from "@/components/layout/main-nav";
import { AuthInitializer } from "@/components/auth-initializer";
import { ensureAdminExists } from "@/lib/init-admin";
import { Toaster } from "@/components/ui/toaster";
import { ClearTableListener } from "@/components/clear-table-listener";
import { OrganizationJsonLd } from "@/components/seo/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "HRK - Nhà hàng & Đặt món trực tuyến",
    template: "%s | HRK",
  },
  description: "HRK - Hệ thống đặt món trực tuyến hiện đại. Xem menu, đặt món, thanh toán nhanh chóng. Quản lý bàn ăn và đơn hàng dễ dàng.",
  keywords: ["nhà hàng", "đặt món", "food ordering", "restaurant", "menu", "đặt bàn", "HRK"],
  authors: [{ name: "HRK" }],
  creator: "HRK",
  publisher: "HRK",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "HRK",
    title: "HRK - Nhà hàng & Đặt món trực tuyến",
    description: "HRK - Hệ thống đặt món trực tuyến hiện đại. Xem menu, đặt món, thanh toán nhanh chóng.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HRK - Nhà hàng & Đặt món trực tuyến",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HRK - Nhà hàng & Đặt món trực tuyến",
    description: "HRK - Hệ thống đặt món trực tuyến hiện đại. Xem menu, đặt món, thanh toán nhanh chóng.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Thêm Google Search Console verification code nếu có
    // google: "your-google-verification-code",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ensure admin account exists on server startup (non-blocking)
  // Skip during build to avoid MongoDB connection errors
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    ensureAdminExists().catch((error) => {
      console.error('Failed to initialize admin:', error);
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <OrganizationJsonLd baseUrl={baseUrl} />
        <ClearTableListener />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthInitializer />
          <div className="relative flex min-h-screen flex-col">
            <MainNav />
            <main className="flex-1 container py-4 sm:py-6 max-w-7xl mx-auto w-full px-0">
              {children}
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
