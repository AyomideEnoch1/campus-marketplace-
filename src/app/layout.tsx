import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { AppMainContent } from "@/components/layout/AppMainContent";
import { getSession } from "@/lib/auth";
import { QueryProvider } from "@/lib/react-query/query-provider";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { RouteNavigationLoader } from "@/components/common/RouteNavigationLoader";
import { ReferralTracker } from "@/components/ambassador/ReferralTracker";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSession();
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang="en" className={`scroll-smooth ${isAdminRoute ? "dark" : ""}`}>
      <body
        className={`min-h-screen flex flex-col font-sans antialiased ${
          isAdminRoute
            ? "bg-neutral-950 text-neutral-100"
            : "bg-white text-neutral-900"
        }`}
      >
        <QueryProvider>
          <CartProvider initialUser={sessionUser}>
            <WishlistProvider>
              <Suspense fallback={null}>
                <ReferralTracker />
              </Suspense>
              <RouteNavigationLoader />
              {!isAdminRoute && <AnnouncementBar />}
              {!isAdminRoute && <Navbar initialUser={sessionUser} />}
              <AppMainContent isAdmin={isAdminRoute}>{children}</AppMainContent>
              {!isAdminRoute && <MobileNav initialUser={sessionUser} />}
              {!isAdminRoute && <Footer />}
            </WishlistProvider>
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
