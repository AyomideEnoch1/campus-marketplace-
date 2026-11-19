import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveBankAccount } from "../_shared/flutterwave.ts";

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
    const { bankCode, accountNumber, sellerId } = body;

    if (!bankCode || !accountNumber) {
      return new Response(JSON.stringify({ error: "bankCode and accountNumber required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanAccount = String(accountNumber).trim();

    // Check duplicate bank account
    if (sellerId) {
      const { data: duplicate } = await supabaseClient
        .from("seller_bank_accounts")
        .select("id")
        .eq("bank_code", bankCode)
        .eq("account_number", cleanAccount)
        .neq("seller_id", sellerId)
        .maybeSingle();

      if (duplicate) {
        return new Response(JSON.stringify({ error: "Bank account already linked to another vendor" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Call Flutterwave resolve
    const res = await resolveBankAccount(bankCode, cleanAccount);

    return new Response(
      JSON.stringify({
        success: true,
        accountName: res.accountName,
        accountNumber: res.accountNumber,
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
