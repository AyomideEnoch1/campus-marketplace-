import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  MessageSquare,
  Package,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Truck,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserCampus } from "@/lib/user-campus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNGN, formatDate } from "@/lib/utils";

interface OrderSuccessPageProps {
  params: { orderNumber: string };
}

export default async function OrderSuccessPage({
  params,
}: OrderSuccessPageProps) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      vendor: {
        include: { campus: true },
      },
      meetupPoint: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const isGuestSeller = order.vendor.sellerType === "guest";
  const buyerCampus = order.buyerId ? await getUserCampus(order.buyerId) : null;

  return (
    <div className="min-h-screen bg-neutral-50/60 py-16 px-4">
      <div className="container mx-auto max-w-2xl bg-white rounded-3xl border border-neutral-200/80 shadow-lg p-6 sm:p-10 space-y-8 text-center">
        {/* Animated Check */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/15">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
            Thank You, {order.buyerName.split(" ")[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Your order request has been dispatched to <strong>{order.vendor.storeName}</strong> under Escrow protection.
          </p>
        </div>

        {/* Order Card Summary & Receipt */}
        <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3 text-xs">
            <div>
              <span className="text-neutral-400">Order Reference:</span>
              <p className="font-mono font-black text-sm text-neutral-900 mt-0.5">
                #{order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-neutral-400">Total Amount:</span>
              <p className="font-extrabold text-base text-emerald-600">
                {formatNGN(order.totalAmount)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-neutral-600">
            {/* Vendor Store */}
            <div>
              <span className="text-neutral-400 block font-semibold text-[11px] uppercase tracking-wider">Vendor:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <strong className="text-neutral-900">{order.vendor.storeName}</strong>
                {isGuestSeller ? (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] px-1.5 py-0">Non-Student Vendor</Badge>
                ) : (
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] px-1.5 py-0">
                    Student Vendor
                  </Badge>
                )}
              </div>
              {order.vendor.campus && (
                <span className="text-neutral-500 text-[11px] block mt-0.5">
                  Vendor Campus: {order.vendor.campus.name}
                </span>
              )}
            </div>

            {/* Student Buyer School / University */}
            <div>
              <span className="text-neutral-400 block font-semibold text-[11px] uppercase tracking-wider">Buyer School / Campus:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                <strong className="text-neutral-900 font-bold">
                  {buyerCampus?.name || (order.vendor.campus ? order.vendor.campus.name : "Campus Student")}
                </strong>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] px-1.5 py-0">
                  Verified Student
                </Badge>
              </div>
              {buyerCampus?.city && (
                <span className="text-neutral-500 text-[11px] block mt-0.5">
                  Location: {buyerCampus.city}{buyerCampus.state ? `, ${buyerCampus.state}` : ""}
                </span>
              )}
            </div>

            {/* Fulfillment Method */}
            <div>
              <span className="text-neutral-400 block font-semibold text-[11px] uppercase tracking-wider">Fulfillment Method:</span>
              <p className="font-semibold text-neutral-900 mt-0.5">
                {order.deliveryMethod === "SAFE_MEETUP_POINT"
                  ? "Campus Safe Meetup Point"
                  : order.deliveryMethod}
              </p>
              <span className="text-neutral-500 text-[11px] line-clamp-1">
                {order.deliveryAddress}
              </span>
            </div>

            {/* Buyer Contact */}
            <div>
              <span className="text-neutral-400 block font-semibold text-[11px] uppercase tracking-wider">Buyer Name:</span>
              <p className="font-semibold text-neutral-900 mt-0.5">
                {order.buyerName}
              </p>
              <span className="text-neutral-500 text-[11px] block">
                {order.buyerPhone} &bull; {order.buyerEmail}
              </span>
            </div>
          </div>

          {order.meetupPoint && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900">
              <p className="font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-700" />
                <span>Designated Safe Zone: {order.meetupPoint.name}</span>
              </p>
              {order.meetupPoint.description && (
                <p className="text-[11px] text-purple-700 mt-0.5">
                  {order.meetupPoint.description}
                </p>
              )}
            </div>
          )}

          {/* Ordered items */}
          <div className="space-y-2 pt-2 border-t border-neutral-200/60">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Items Ordered ({order.items.length})
            </span>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-neutral-800 line-clamp-1">
                  <strong>{item.quantity}x</strong> {item.product.title}
                </span>
                <span className="font-bold text-neutral-900 shrink-0">
                  {formatNGN(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* In-App Chat Action: Exclusive secure communication */}
        <div className="space-y-3">
          <Link
            href={`/messages?vendor=${order.vendor.slug || order.vendor.id}${order.items[0]?.productId ? `&product=${order.items[0].productId}` : ""}`}
            className={`inline-flex items-center justify-center gap-2.5 w-full h-14 rounded-2xl text-white font-extrabold text-sm sm:text-base shadow-xl transition-all hover:scale-[1.01] ${
              isGuestSeller
                ? "bg-purple-700 hover:bg-purple-800 shadow-purple-700/30"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat with Seller in App &rarr;</span>
          </Link>
          <p className="text-[11px] text-neutral-500">
            🔒 All order communications and meetup coordination must be done in the secure in-app chat to protect your escrow guarantee.
          </p>
        </div>

        {/* Action Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href={`/orders/track/${order.orderNumber}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-600/20">
              <Truck className="w-3.5 h-3.5" />
              Track My Item
            </Button>
          </Link>
          <Link href="/orders" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto text-xs font-bold rounded-xl">
              View My Orders
            </Button>
          </Link>
          <Link href="/shop" className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full sm:w-auto text-xs font-bold text-neutral-600">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
