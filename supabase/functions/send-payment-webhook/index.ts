// Deploy this in VYETA CREDITS' Supabase project as:
// supabase/functions/send-payment-webhook/index.ts
//
// Called with { "tx_ref": "..." }.
// Looks up the payment intent, signs a JSON payload with the
// platform's webhook_secret, and POSTs it to that platform's
// webhook_url (e.g. SwiftTrade's vyeta-webhook function).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const { tx_ref } = await req.json();

  if (!tx_ref) {
    return new Response("tx_ref required", { status: 400 });
  }

  // uses the SQL function from Migration 6 to fetch everything needed
  const { data, error } = await supabase.rpc("get_payment_intent_for_webhook", {
    p_tx_ref: tx_ref,
  });

  if (error || !data || data.length === 0) {
    return new Response(`intent not found: ${error?.message ?? "no rows"}`, { status: 404 });
  }

  const intent = data[0];

  if (!intent.webhook_url) {
    // platform has no webhook registered yet - nothing to send, not an error
    return new Response("no webhook_url configured, skipped", { status: 200 });
  }

  const payload = {
    tx_ref: intent.tx_ref,
    external_ref: intent.external_ref,
    status: intent.status,
    amount_zmw: intent.amount_zmw,
    purpose: intent.purpose,
    metadata: intent.metadata,
  };

  const body = JSON.stringify(payload);
  const signature = await sign(intent.webhook_secret, body);

  const res = await fetch(intent.webhook_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vyeta-signature": signature,
    },
    body,
  });

  return new Response(
    `webhook sent, platform responded with status ${res.status}`,
    { status: 200 }
  );
});