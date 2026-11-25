import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { refund, sendPayout } from "../_shared/flutterwave.ts";

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
    const { disputeId, resolution, resolutionNotes } = body;

    const { data: dispute } = await supabaseClient
      .from("disputes")
      .select("id, order:Order(id, orderNumber, flw_transaction_id, subtotal, seller_amount, vendor:VendorProfile(bankCode, bankAccountNumber))")
      .eq("id", disputeId)
      .single();

    if (!dispute) {
      return new Response(JSON.stringify({ error: "Dispute not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = dispute.order;
    const now = new Date().toISOString();

    if (resolution === "refund") {
      if (order.flw_transaction_id) {
        await refund(order.flw_transaction_id, order.subtotal, resolutionNotes).catch(console.warn);
      }

      await supabaseClient
        .from("disputes")
        .update({ status: "resolved_refund", resolution: "refund", resolved_at: now })
        .eq("id", disputeId);

      await supabaseClient
        .from("Order")
        .update({ escrow_status: "refunded", status: "CANCELLED" })
        .eq("id", order.id);

      await supabaseClient.from("escrow_ledger").insert({
        id: crypto.randomUUID(),
        order_id: order.id,
        type: "refund_out",
        amount: order.subtotal,
        currency: "NGN",
        reference: `refund_${order.id}`,
        description: `Dispute refund for Order #${order.orderNumber}`,
      });
    } else if (resolution === "release") {
      const seller = order.vendor;
      if (seller.bankCode && seller.bankAccountNumber) {
        await sendPayout(
          { bankCode: seller.bankCode, accountNumber: seller.bankAccountNumber },
          order.seller_amount,
          `payout_${order.id}_dispute`
        ).catch(console.warn);
      }

      await supabaseClient
        .from("disputes")
        .update({ status: "resolved_release", resolution: "release", resolved_at: now })
        .eq("id", disputeId);

      await supabaseClient
        .from("Order")
        .update({ escrow_status: "released", released_at: now })
        .eq("id", order.id);

      await supabaseClient.from("escrow_ledger").insert({
        id: crypto.randomUUID(),
        order_id: order.id,
        type: "escrow_out",
        amount: order.seller_amount,
        currency: "NGN",
        reference: `payout_${order.id}_dispute`,
        description: `Dispute release to vendor for Order #${order.orderNumber}`,
      });
    }

    return new Response(
      JSON.stringify({ success: true, resolution, status: `resolved_${resolution}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
