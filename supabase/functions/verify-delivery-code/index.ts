import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { orderId, code } = body;

    if (!orderId || !code) {
      return new Response(JSON.stringify({ error: "orderId and code are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanCode = String(code).trim();

    // Fetch delivery code
    const { data: record, error: codeErr } = await supabaseClient
      .from("delivery_codes")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (codeErr || !record) {
      return new Response(JSON.stringify({ error: "Delivery code not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (record.locked) {
      return new Response(JSON.stringify({ error: "Delivery code locked after 5 attempts", locked: true }), {
        status: 423,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SHA-256 of code
    const encoder = new TextEncoder();
    const data = encoder.encode(cleanCode);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const submittedHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const storedHash = record.code_hash.split("|")[0];

    if (submittedHash === storedHash) {
      const now = new Date().toISOString();
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      await supabaseClient
        .from("Order")
        .update({
          status: "DELIVERED",
          escrow_status: "confirmed",
          delivered_at: now,
          confirmed_at: now,
          dispute_deadline: deadline,
        })
        .eq("id", orderId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Delivery confirmed successfully!",
          status: "confirmed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // MISMATCH
    const attempts = record.attempts + 1;
    const locked = attempts >= 5;

    await supabaseClient
      .from("delivery_codes")
      .update({ attempts, locked })
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({
        error: locked ? "Code locked after 5 failed attempts" : "Incorrect code",
        attemptsRemaining: Math.max(0, 5 - attempts),
        locked,
      }),
      {
        status: locked ? 423 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
