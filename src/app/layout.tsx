import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { AppMainContent } from "@/components/layout/AppMainContent";
import { QueryProvider } from "@/lib/react-query/query-provider";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { RouteNavigationLoader } from "@/components/common/RouteNavigationLoader";
import { ReferralTracker } from "@/components/ambassador/ReferralTracker";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://xn--j-sfa590u.com"),
  title: "ọjà | Multi-Vendor Marketplace for Nigerian University Students",
  description:
    "Buy and sell textbooks, fashion, tech gadgets, and hostel essentials from verified student vendors across UNILAG, UI, and OAU on ọjà.",
  keywords: [
    "ọjà",
    "campus marketplace",
    "unilag market",
    "ui students",
    "oau students",
    "student vendors",
    "nigeria campus ecommerce",
  ],
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseOrigin =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-dev-project")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : null;

  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-white text-neutral-900">
        <QueryProvider>
          <CartProvider>
            <WishlistProvider>
              <Suspense fallback={null}>
                <ReferralTracker />
                <PageViewTracker />
              </Suspense>
              <RouteNavigationLoader />
              <AnnouncementBar />
              <Navbar />
              <AppMainContent>{children}</AppMainContent>
              <MobileNav />
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
