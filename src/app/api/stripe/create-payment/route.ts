import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, MATCH_SUCCESS_FEE } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = (await request.json()) as { matchId: string };

    // matchの存在と権限を確認
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!match || !match.is_matched) {
      return NextResponse.json({ error: "Invalid match" }, { status: 400 });
    }

    // PaymentIntent作成
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: MATCH_SUCCESS_FEE,
      currency: "jpy",
      metadata: {
        match_id: matchId,
        company_id: match.company_id,
        advisor_id: match.advisor_id,
      },
    });

    // paymentsテーブルに記録
    await supabase.from("payments").insert({
      match_id: matchId,
      stripe_payment_intent_id: paymentIntent.id,
      amount: MATCH_SUCCESS_FEE,
      status: "pending",
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Payment creation failed" },
      { status: 500 }
    );
  }
}
