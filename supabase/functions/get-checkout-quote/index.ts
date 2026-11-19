import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { items, buyerWantsDirect } = body;

    const productIds = items.map((i: any) => i.productId || i.id);
    const { data: dbProducts } = await supabaseClient
      .from("Product")
      .select("id, price, vendorId, vendor:VendorProfile(id, storeName, sellerType, verificationTier, isTrustedSeller, strikesCount, createdAt)")
      .in("id", productIds);

    if (!dbProducts || dbProducts.length === 0) {
      return new Response(JSON.stringify({ error: "Products not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const primaryVendor = (dbProducts[0] as any).vendor;
    const vendorId = primaryVendor.id;
    let subtotal = 0;

    for (const item of items) {
      const prod = dbProducts.find((p: any) => p.id === (item.productId || item.id));
      if (!prod || (prod as any).vendorId !== vendorId) continue;
      subtotal += Number(prod.price) * Math.max(1, Number(item.quantity) || 1);
    }

    const subtotalKobo = Math.round(subtotal * 100);

    // Thresholds
    let escrow_mode = "escrow";
    let canToggle = false;
    let isForced = false;
    let forcedReason = null;

    if (primaryVendor.sellerType === "guest") {
      isForced = true;
      forcedReason = "Escrow is mandatory for guest vendors.";
    } else if ((primaryVendor.verificationTier || 1) < 4 || !primaryVendor.isTrustedSeller) {
      isForced = true;
      forcedReason = "Escrow is required for this vendor (Pending Tier 4 Trusted Seller Status).";
    }

    if (!isForced) {
      if (subtotalKobo < 500000) {
        escrow_mode = "direct";
        canToggle = false;
      } else if (subtotalKobo < 2000000) {
        canToggle = true;
        escrow_mode = buyerWantsDirect ? "direct" : "escrow";
      } else {
        escrow_mode = "escrow";
        canToggle = false;
        forcedReason = "Escrow protection is mandatory for orders of ₦20,000 and above.";
      }
    }

    let feePercent = 0.0;
    let feeKobo = 0;
    if (escrow_mode === "escrow") {
      if (subtotalKobo >= 2000000) feePercent = 2.0;
      else if (subtotalKobo >= 500000) feePercent = 1.0;
      if (feePercent > 0) {
        feeKobo = Math.max(5000, Math.min(500000, Math.round((subtotalKobo * feePercent) / 100)));
      }
    }

    const buyerTotalKobo = subtotalKobo + feeKobo;

    return new Response(
      JSON.stringify({
        success: true,
        quote: {
          escrow_mode,
          canToggle,
          isForced,
          forcedReason,
          subtotal,
          feeAmount: feeKobo / 100,
          feePercent,
          buyerTotal: buyerTotalKobo / 100,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
