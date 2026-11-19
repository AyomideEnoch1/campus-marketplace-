import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTransferStatus } from "../_shared/flutterwave.ts";

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

    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: stuck } = await supabaseClient
      .from("payouts")
      .select("*")
      .in("status", ["processing", "pending"])
      .lte("created_at", thirtyMinsAgo)
      .limit(25);

    const reconciled = [];

    if (stuck && stuck.length > 0) {
      for (const p of stuck) {
        const id = p.flw_transfer_id || p.reference;
        if (!id) continue;

        try {
          const check = await getTransferStatus(id);
          const status = check.status.toLowerCase();

          if (status === "successful") {
            const now = new Date().toISOString();
            await supabaseClient
              .from("payouts")
              .update({ status: "successful", completed_at: now })
              .eq("id", p.id);

            await supabaseClient
              .from("Order")
              .update({ escrow_status: "released", released_at: now })
              .eq("id", p.order_id);

            reconciled.push({ id: p.id, status: "successful" });
          } else if (status === "failed") {
            await supabaseClient
              .from("payouts")
              .update({ status: "failed", failure_reason: check.failureReason })
              .eq("id", p.id);

            reconciled.push({ id: p.id, status: "failed" });
          }
        } catch (e: any) {
          console.warn("Poll status failed:", e.message);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, count: reconciled.length, reconciled }), {
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
