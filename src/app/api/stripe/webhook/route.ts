import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// webhook用にservice roleクライアントを使う
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
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

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from("payments")
      .update({ status: "succeeded" })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    // matchのpayment_statusも更新
    const matchId = paymentIntent.metadata.match_id;
    if (matchId) {
      await supabase
        .from("matches")
        .update({ payment_status: "paid" })
        .eq("id", matchId);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    const matchId = paymentIntent.metadata.match_id;
    if (matchId) {
      await supabase
        .from("matches")
        .update({ payment_status: "failed" })
        .eq("id", matchId);
    }
  }

  return NextResponse.json({ received: true });
}
