import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { getSession } from "@/lib/auth";
import { QueryProvider } from "@/lib/react-query/query-provider";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { RouteNavigationLoader } from "@/components/common/RouteNavigationLoader";
import { ReferralTracker } from "@/components/ambassador/ReferralTracker";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ojacampus.com"),
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSession();

  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans antialiased">
        <QueryProvider>
          <CartProvider initialUser={sessionUser}>
            <WishlistProvider>
              <Suspense fallback={null}>
                <ReferralTracker />
              </Suspense>
              <RouteNavigationLoader />
              <AnnouncementBar />
              <Navbar initialUser={sessionUser} />
              <main className="flex-grow pb-16 md:pb-0">{children}</main>
              <MobileNav initialUser={sessionUser} />
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
