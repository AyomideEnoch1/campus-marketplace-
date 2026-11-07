"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Store,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { useCart, CartItem } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, itemsByVendor } = useCart();

  const vendorIds = Object.keys(itemsByVendor);

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-neutral-50/50">
        <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-neutral-900">Your Order Bag is Empty</h2>
            <p className="text-xs text-neutral-500">
              Explore textbooks, electronics, and hostel drip listed by verified students.
            </p>
          </div>
          <Link href="/shop" className="block pt-2">
            <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md">
              Start Shopping &rarr;
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200/80 py-8 px-4">
        <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
              Campus Order Bag ({items.length})
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Orders are fulfilled directly by student sellers on campus with verified pickups.
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Empty Bag
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Multi-Vendor Explanation Notice */}
        {vendorIds.length > 1 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
            <Store className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Multi-Vendor Bag Notice:</p>
              <p className="text-amber-800 leading-snug mt-0.5">
                Your bag contains items from <strong>{vendorIds.length} different student stores</strong>. Per campus marketplace policy, each vendor receives a separate order request so you can arrange on-campus pickups individually.
              </p>
            </div>
          </div>
        )}

        {/* Vendor-Segregated Item Groups (Section 4.5) */}
        {vendorIds.map((vendorId) => {
          const group = itemsByVendor[vendorId];
          const vendor = group.vendor;

          return (
            <div
              key={vendorId}
              className="rounded-3xl bg-white border border-neutral-200/80 overflow-hidden shadow-xs space-y-4 p-6"
            >
              {/* Vendor Store Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <Link
                      href={`/store/${vendor.slug}`}
                      className="font-bold text-sm text-neutral-900 hover:text-emerald-700 transition-colors"
                    >
                      {vendor.storeName}
                    </Link>
                    {vendor.campus && (
                      <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {vendor.campus.name}
                      </p>
                    )}
                  </div>
                </div>

                <Badge variant="default" className="text-[10px] w-fit">
                  {group.items.length} {group.items.length === 1 ? "Item" : "Items"}
                </Badge>
              </div>

              {/* Items in this Vendor's Group */}
              <div className="divide-y divide-neutral-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <Link href={`/product/${item.slug}`}>
                          <h4 className="font-bold text-xs sm:text-sm text-neutral-900 hover:text-emerald-700 line-clamp-1">
                            {item.title}
                          </h4>
                        </Link>
                        {item.condition && (
                          <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                            {item.condition}
                          </span>
                        )}
                        <p className="font-extrabold text-xs sm:text-sm text-neutral-900 pt-0.5">
                          {formatNGN(item.price)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      <div className="flex items-center border border-neutral-200 rounded-xl bg-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-l-xl font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-r-xl font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-black text-sm text-neutral-900 sm:w-24 text-right">
                        {formatNGN(item.price * item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal & Checkout for this Vendor */}
              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/60 -mx-6 -mb-6 p-6 rounded-b-3xl">
                <div>
                  <span className="text-xs text-neutral-500">
                    Store Order Subtotal ({vendor.storeName}):
                  </span>
                  <p className="text-xl font-black text-neutral-900">
                    {formatNGN(group.subtotal)}
                  </p>
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Free on-campus inspection & pickup
                  </p>
                </div>

                <Link href={`/checkout?vendorId=${vendor.id}`}>
                  <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs rounded-xl shadow-md h-11 px-6">
                    Request Order from {vendor.storeName} &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
