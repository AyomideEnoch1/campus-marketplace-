import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPayout } from "../_shared/flutterwave.ts";

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
    const { orderId } = body;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order with vendor bank details
    const { data: order, error: orderErr } = await supabaseClient
      .from("Order")
      .select("*, vendor:VendorProfile(*)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.escrow_status !== "confirmed" && order.escrow_status !== "delivered") {
      return new Response(JSON.stringify({ error: `Order in '${order.escrow_status}' state` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const seller = order.vendor;
    const sellerAmount = Number(order.seller_amount || order.subtotal - order.commission);
    const reference = `payout_${order.id}_${Date.now()}`;

    // Bank Account
    const bankCode = seller.bankCode;
    const accountNumber = seller.bankAccountNumber;

    if (!bankCode || !accountNumber) {
      return new Response(JSON.stringify({ error: "Seller bank account missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic updates
    await supabaseClient
      .from("Order")
      .update({ escrow_status: "payout_pending" })
      .eq("id", order.id);

    await supabaseClient.from("escrow_ledger").insert({
      id: crypto.randomUUID(),
      order_id: order.id,
      type: "escrow_out",
      amount: sellerAmount,
      currency: "NGN",
      reference,
      description: `Payout to vendor ${seller.storeName}`,
    });

    await supabaseClient.from("payouts").insert({
      id: crypto.randomUUID(),
      order_id: order.id,
      seller_id: seller.id,
      amount: sellerAmount,
      reference,
      status: "pending",
      attempts: 1,
    });

    // Execute Flutterwave Transfer
    const flwTransfer = await sendPayout(
      { bankCode, accountNumber, accountName: seller.bankAccountName },
      sellerAmount,
      reference
    );

    const isSuccess = flwTransfer.status.toLowerCase() === "successful";

    if (isSuccess) {
      const now = new Date().toISOString();
      await supabaseClient
        .from("payouts")
        .update({
          status: "successful",
          completed_at: now,
          flw_transfer_id: String(flwTransfer.transferId),
        })
        .eq("reference", reference);

      await supabaseClient
        .from("Order")
        .update({ escrow_status: "released", released_at: now })
        .eq("id", order.id);
    } else {
      await supabaseClient
        .from("payouts")
        .update({
          status: "processing",
          flw_transfer_id: String(flwTransfer.transferId),
        })
        .eq("reference", reference);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: isSuccess ? "released" : "payout_pending",
        reference,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
