import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  MessageCircle,
  Package,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
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
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const whatsappMessage = `Hi ${order.vendor.storeName}, I just submitted order request #${order.orderNumber} on CampusTrade for ${formatNGN(order.totalAmount)}. Let's coordinate pickup/delivery at: ${order.deliveryAddress}.`;

  const whatsappUrl = order.vendor.whatsapp
    ? `https://wa.me/${order.vendor.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  return (
    <div className="min-h-screen bg-neutral-50/60 py-16 px-4">
      <div className="container mx-auto max-w-2xl bg-white rounded-3xl border border-neutral-200/80 shadow-lg p-6 sm:p-10 space-y-8 text-center">
        {/* Animated Check */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <div className="space-y-2">
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold uppercase tracking-wider">
            Order Request Received
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
            Thank You, {order.buyerName.split(" ")[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Your order request has been dispatched to <strong>{order.vendor.storeName}</strong>.
          </p>
        </div>

        {/* Order Card Summary */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-600">
            <div>
              <span className="text-neutral-400 block">Student Vendor:</span>
              <strong className="text-neutral-900">{order.vendor.storeName}</strong>
              <p className="text-[11px] text-neutral-500">{order.vendor.campus?.name}</p>
            </div>
            <div>
              <span className="text-neutral-400 block">Fulfillment Location:</span>
              <strong className="text-neutral-900">{order.deliveryMethod}</strong>
              <p className="text-[11px] text-neutral-500 truncate">{order.deliveryAddress}</p>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="pt-2 border-t border-neutral-200/60 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Items Ordered:
            </span>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-neutral-800">
                  {item.quantity} &times; {item.product.title}
                </span>
                <span className="font-semibold text-neutral-900">
                  {formatNGN(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Follow-up Action (Section 4.5) */}
        {whatsappUrl && (
          <div className="space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.01]"
            >
              <MessageCircle className="w-5 h-5" />
              Chat Seller on WhatsApp to Confirm Meetup &rarr;
            </a>
            <p className="text-[11px] text-neutral-400">
              Clicking above opens WhatsApp with your order details prefilled for the vendor.
            </p>
          </div>
        )}

        {/* Action Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/shop" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto text-xs font-bold rounded-xl">
              Continue Shopping
            </Button>
          </Link>
          <Link href={`/store/${order.vendor.slug}`} className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full sm:w-auto text-xs font-bold text-neutral-600">
              Visit {order.vendor.storeName} Storefront
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
