import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient as createSbClient } from "@supabase/supabase-js";
import {
  getStripe,
  MATCH_SUCCESS_FEE,
  hasStripeServerEnv,
} from "@/lib/stripe";

const bodySchema = z.object({
  matchId: z.string().uuid(),
});

function hasSupabaseServiceRole(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function getServiceRoleClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { matchId } = parsed.data;

    const { data: match, error: matchError } = await authClient
      .from("matches")
      .select("id, company_id, advisor_id, is_matched, payment_status")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // 認可: 決済を起こせるのは企業側のみ
    if (match.company_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 双方マッチ完了済みのみ決済可能
    if (!match.is_matched) {
      return NextResponse.json(
        { error: "Match is not finalized" },
        { status: 400 }
      );
    }

    // 既に支払い済みなら 409 で弾く
    if (match.payment_status === "paid") {
      return NextResponse.json({ error: "Already paid" }, { status: 409 });
    }

    // Stripe env が無い場合は mock モード: clientSecret を返さず、
    // フロントが擬似成功フローへ分岐するシグナルを返す
    if (!hasStripeServerEnv()) {
      return NextResponse.json({
        mock: true,
        amount: MATCH_SUCCESS_FEE,
        matchId,
      });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: MATCH_SUCCESS_FEE,
      currency: "jpy",
      metadata: {
        match_id: matchId,
        company_id: match.company_id,
        advisor_id: match.advisor_id,
      },
    });

    // payments テーブルへの書き込みは service_role 経由のみ
    // (RLS で anon/authenticated は拒否)
    if (hasSupabaseServiceRole()) {
      await getServiceRoleClient().from("payments").insert({
        match_id: matchId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: MATCH_SUCCESS_FEE,
        status: "pending",
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: MATCH_SUCCESS_FEE,
      matchId,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Payment creation failed" },
      { status: 500 }
    );
  }
}
