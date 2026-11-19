import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPayout } from "../_shared/flutterwave.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();
    const { data: eligible } = await supabaseClient
      .from("payouts")
      .select("*, seller:VendorProfile(*)")
      .eq("status", "failed")
      .lt("attempts", 5)
      .or(`next_retry_at.lte.${now},next_retry_at.is.null`)
      .limit(10);

    const results = [];

    if (eligible && eligible.length > 0) {
      for (const payout of eligible) {
        const seller = payout.seller;
        if (!seller.bankCode || !seller.bankAccountNumber) continue;

        const nextAttempt = payout.attempts + 1;
        const retryRef = `${payout.reference}_r${nextAttempt}`;

        try {
          const res = await sendPayout(
            {
              bankCode: seller.bankCode,
              accountNumber: seller.bankAccountNumber,
              accountName: seller.bankAccountName,
            },
            payout.amount,
            retryRef
          );

          const isSuccess = res.status.toLowerCase() === "successful";

          await supabaseClient
            .from("payouts")
            .update({
              status: isSuccess ? "successful" : "processing",
              flw_transfer_id: String(res.transferId),
              attempts: nextAttempt,
            })
            .eq("id", payout.id);

          results.push({ id: payout.id, status: isSuccess ? "successful" : "processing" });
        } catch (e: any) {
          await supabaseClient
            .from("payouts")
            .update({
              attempts: nextAttempt,
              failure_reason: e.message,
            })
            .eq("id", payout.id);

          results.push({ id: payout.id, status: "failed", error: e.message });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, retriedCount: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
