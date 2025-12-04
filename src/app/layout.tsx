import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { MainNav } from "@/components/layout/main-nav";
import { AuthInitializer } from "@/components/auth-initializer";
import { ensureAdminExists } from "@/lib/init-admin";
import { Toaster } from "@/components/ui/toaster";
import { ClearTableListener } from "@/components/clear-table-listener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRK Dashboard",
  description: "HRK E-commerce Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ensure admin account exists on server startup (non-blocking)
  ensureAdminExists().catch((error) => {
    console.error('Failed to initialize admin:', error);
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}>
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
