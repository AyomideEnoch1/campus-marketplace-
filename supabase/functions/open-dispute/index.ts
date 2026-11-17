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
    const { orderId, buyerId, reason, description, evidencePaths } = body;

    if (!orderId || !reason || !description) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await supabaseClient
      .from("Order")
      .select("id, escrow_status, delivered_at")
      .eq("id", orderId)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const disputeId = crypto.randomUUID();

    await supabaseClient.from("disputes").insert({
      id: disputeId,
      order_id: orderId,
      buyer_id: buyerId || "guest",
      reason,
      description,
      evidence_paths: evidencePaths || [],
      status: "open",
    });

    await supabaseClient
      .from("Order")
      .update({ escrow_status: "disputed" })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ success: true, disputeId, status: "disputed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
