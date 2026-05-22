import { NextResponse } from "next/server";
import { getStripe, hasStripeServerEnv } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// webhook 用に service role クライアントを使う
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  // Stripe / Supabase env が無ければ webhook は無効
  if (!hasStripeServerEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;

      // 冪等性: 既に succeeded で記録済みならスキップ
      const { data: existing } = await supabase
        .from("payments")
        .select("status")
        .eq("stripe_payment_intent_id", pi.id)
        .single();

      if (existing?.status === "succeeded") {
        break;
      }

      await supabase
        .from("payments")
        .update({ status: "succeeded" })
        .eq("stripe_payment_intent_id", pi.id);

      const matchId = pi.metadata.match_id;
      if (matchId) {
        await supabase
          .from("matches")
          .update({ payment_status: "paid" })
          .eq("id", matchId);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;

      const { data: existing } = await supabase
        .from("payments")
        .select("status")
        .eq("stripe_payment_intent_id", pi.id)
        .single();

      if (existing?.status === "failed") {
        break;
      }

      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", pi.id);

      const matchId = pi.metadata.match_id;
      if (matchId) {
        await supabase
          .from("matches")
          .update({ payment_status: "failed" })
          .eq("id", matchId);
      }
      break;
    }

    default:
      // 未対応イベントは 200 で受信のみ
      break;
  }

  return NextResponse.json({ received: true });
}
