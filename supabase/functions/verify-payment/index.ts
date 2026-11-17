import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyTransaction } from "../_shared/flutterwave.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const txRef = url.searchParams.get("tx_ref");
    const transactionId = url.searchParams.get("transaction_id");

    if (!txRef && !transactionId) {
      return new Response(JSON.stringify({ error: "Missing tx_ref or transaction_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (transactionId) {
      const flwResult = await verifyTransaction(transactionId);
      if (!flwResult.success || flwResult.status !== "successful") {
        return new Response(JSON.stringify({ success: false, message: "Flutterwave verification failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const activeTxRef = flwResult.txRef || txRef;

      // Find order
      const { data: order } = await supabaseClient
        .from("Order")
        .select("id, orderNumber, subtotal, commission, escrow_status")
        .eq("tx_ref", activeTxRef)
        .single();

      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (order.escrow_status !== "paid_held" && order.escrow_status !== "released") {
        const rawDeliveryCode = Math.floor(100000 + Math.random() * 900000).toString();
        const encoder = new TextEncoder();
        const data = encoder.encode(rawDeliveryCode);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const codeHash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // Update Order
        await supabaseClient
          .from("Order")
          .update({
            escrow_status: "paid_held",
            status: "CONFIRMED",
            paid_at: now,
            flw_transaction_id: String(flwResult.flwTransactionId),
          })
          .eq("id", order.id);

        // Insert Payment
        await supabaseClient.from("payments").insert({
          id: crypto.randomUUID(),
          order_id: order.id,
          flw_transaction_id: String(flwResult.flwTransactionId),
          tx_ref: activeTxRef,
          amount: flwResult.amount,
          currency: "NGN",
          status: "successful",
          payment_type: flwResult.paymentType || "card",
          raw_verify_response: flwResult.rawResponse,
        });

        // Insert Escrow Ledger
        await supabaseClient.from("escrow_ledger").insert({
          id: crypto.randomUUID(),
          order_id: order.id,
          type: "escrow_in",
          amount: flwResult.amount,
          currency: "NGN",
          reference: activeTxRef,
          description: `Escrow held for Order #${order.orderNumber}`,
        });

        // Insert Delivery Code
        await supabaseClient.from("delivery_codes").insert({
          id: crypto.randomUUID(),
          order_id: order.id,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
          locked: false,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          orderId: order.id,
          status: "paid_held",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(JSON.stringify({ error: "Verification requires transaction_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
