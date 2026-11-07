"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-neutral-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8 fill-rose-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-neutral-900">Your Saved Items</h2>
          <p className="text-xs text-neutral-500">
            Click the heart icon on any product in the marketplace to save it for later.
          </p>
        </div>
        <Link href="/shop" className="block pt-2">
          <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md">
            Explore Marketplace Drops &rarr;
          </Button>
        </Link>
      </div>
    </div>
  );
}
