import type { Metadata } from "next";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { getSession } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";

export const metadata: Metadata = {
  title: "CampusTrade | Multi-Vendor Marketplace for Nigerian University Students",
  description:
    "Buy and sell textbooks, fashion, tech gadgets, and hostel essentials from verified student vendors across UNILAG, UI, and OAU.",
  keywords: [
    "campus marketplace",
    "unilag market",
    "ui students",
    "oau students",
    "student vendors",
    "nigeria campus ecommerce",
  ],
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
        <CartProvider>
          <WishlistProvider>
            <AnnouncementBar />
            <Navbar initialUser={sessionUser} />
            <main className="flex-grow pb-16 md:pb-0">{children}</main>
            <MobileNav initialUser={sessionUser} />
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
