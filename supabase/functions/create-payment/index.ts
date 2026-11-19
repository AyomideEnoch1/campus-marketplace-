import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createPayment } from "../_shared/flutterwave.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { items, meetupPointId, deliveryAddress, deliveryMethod, buyerName, buyerEmail, buyerPhone } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Order must contain at least one item" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch products server-side
    const productIds = items.map((i: any) => i.productId || i.id);
    const { data: dbProducts, error: prodErr } = await supabaseClient
      .from("Product")
      .select("id, title, price, vendorId, vendor:VendorProfile(id, storeName, sellerType)")
      .in("id", productIds);

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      return new Response(JSON.stringify({ error: "Products not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const primaryVendor = (dbProducts[0] as any).vendor;
    const vendorId = primaryVendor.id;

    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const prod = dbProducts.find((p: any) => p.id === (item.productId || item.id));
      if (!prod || (prod as any).vendorId !== vendorId) continue;

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(prod.price);
      subtotal += unitPrice * qty;

      orderItems.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: unitPrice,
      });
    }

    const commissionRate = primaryVendor.sellerType === "guest" ? 0.05 : 0.03;
    const commission = Math.round(subtotal * commissionRate * 100) / 100;
    const sellerAmount = subtotal - commission;

    const orderNumber = `CT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txRef = `ct_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://campustrade.ng";
    const redirectUrl = `${appUrl}/checkout/confirm?tx_ref=${txRef}`;

    // 2. Insert Order
    const { data: order, error: orderErr } = await supabaseClient
      .from("Order")
      .insert({
        id: crypto.randomUUID(),
        orderNumber,
        buyerName: buyerName || "Campus Student",
        buyerEmail: buyerEmail,
        buyerPhone: buyerPhone || "08000000000",
        deliveryAddress: deliveryAddress || "Campus Safe Meetup Point",
        deliveryMethod: deliveryMethod || "MEETUP",
        meetupPointId: meetupPointId || null,
        vendorId,
        status: "PENDING",
        escrow_status: "pending",
        totalAmount: subtotal,
        subtotal: subtotal,
        commission: commission,
        seller_amount: sellerAmount,
        currency: "NGN",
        tx_ref: txRef,
      })
      .select()
      .single();

    if (orderErr) {
      throw orderErr;
    }

    // 3. Call Flutterwave Wrapper
    const payment = await createPayment({
      txRef,
      amount: subtotal,
      currency: "NGN",
      redirectUrl,
      customer: {
        email: buyerEmail,
        name: buyerName || "Campus Student",
        phoneNumber: buyerPhone || "",
      },
      customizations: {
        title: `CampusTrade Escrow: #${orderNumber}`,
        description: "Payment held safely in escrow until you inspect and accept items.",
      },
      meta: {
        order_id: order.id,
        order_number: orderNumber,
        seller_id: vendorId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        txRef,
        paymentLink: payment.paymentLink,
        subtotal,
        commission,
        sellerAmount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
