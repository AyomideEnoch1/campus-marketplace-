import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyWebhook, verifyTransaction } from "../_shared/flutterwave.ts";

serve(async (req) => {
  // 1. Verify Secret Hash
  const hash = req.headers.get("verif-hash");
  const secretHash = Deno.env.get("FLW_SECRET_HASH") || "campustrade_flw_secret_hash_2026";

  if (!hash || hash.trim() !== secretHash.trim()) {
    return new Response(JSON.stringify({ error: "Unauthorized webhook" }), { status: 401 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const eventType = body["event"] || "charge.completed";
    const eventData = body.data || body;
    const eventId = String(eventData.id || eventData.reference || body.id || `evt_${Date.now()}`);

    // 2. Idempotency Check
    const { data: existing } = await supabaseClient
      .from("webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ message: "Already processed" }), { status: 200 });
    }

    // Insert Webhook Event
    await supabaseClient.from("webhook_events").insert({
      id: crypto.randomUUID(),
      provider: "flutterwave",
      event_id: eventId,
      event_type: eventType,
      payload: body,
      status: "processed",
    });

    if (eventType === "charge.completed" && eventData.id) {
      // Re-verify through API
      const flwResult = await verifyTransaction(eventData.id);
      if (flwResult.success && flwResult.status === "successful") {
        const { data: order } = await supabaseClient
          .from("Order")
          .select("id, escrow_status")
          .eq("tx_ref", flwResult.txRef)
          .single();

        if (order && order.escrow_status !== "paid_held" && order.escrow_status !== "released") {
          await supabaseClient
            .from("Order")
            .update({
              escrow_status: "paid_held",
              status: "CONFIRMED",
              paid_at: new Date().toISOString(),
              flw_transaction_id: String(flwResult.flwTransactionId),
            })
            .eq("id", order.id);

          await supabaseClient.from("payments").insert({
            id: crypto.randomUUID(),
            order_id: order.id,
            flw_transaction_id: String(flwResult.flwTransactionId),
            tx_ref: flwResult.txRef,
            amount: flwResult.amount,
            currency: "NGN",
            status: "successful",
            payment_type: flwResult.paymentType || "card",
            raw_verify_response: flwResult.rawResponse,
          });

          await supabaseClient.from("escrow_ledger").insert({
            id: crypto.randomUUID(),
            order_id: order.id,
            type: "escrow_in",
            amount: flwResult.amount,
            currency: "NGN",
            reference: flwResult.txRef,
            description: `Escrow held via Flutterwave (Tx: ${flwResult.flwTransactionId})`,
          });
        }
      }
    } else if (eventType === "transfer.completed" && eventData.reference) {
      const { data: payout } = await supabaseClient
        .from("payouts")
        .select("id, order_id")
        .eq("reference", eventData.reference)
        .single();

      if (payout) {
        const now = new Date().toISOString();
        await supabaseClient
          .from("payouts")
          .update({
            status: "successful",
            completed_at: now,
            flw_transfer_id: String(eventData.id || ""),
          })
          .eq("id", payout.id);

        await supabaseClient
          .from("Order")
          .update({
            escrow_status: "released",
            released_at: now,
          })
          .eq("id", payout.order_id);
      }
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
