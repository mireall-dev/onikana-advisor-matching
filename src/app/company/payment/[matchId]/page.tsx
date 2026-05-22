"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import {
  ChevronLeft,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Match, User, AdvisorProfile } from "@/types/database";

type MatchDetail = Match & {
  advisor: User | null;
  advisor_profile: Pick<AdvisorProfile, "user_id" | "catchphrase"> | null;
};

type CreatePaymentResponse =
  | { mock: true; amount: number; matchId: string }
  | { clientSecret: string; amount: number; matchId: string }
  | { error: string };

const stripePromise: Promise<Stripe | null> = process.env
  .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

export default function PaymentPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paymentResp, setPaymentResp] = useState<CreatePaymentResponse | null>(
    null
  );

  const fetchMatch = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("matches")
      .select(
        "*, advisor:users!advisor_id(*), advisor_profile:advisor_profiles!advisor_id(*)"
      )
      .eq("id", matchId)
      .single();

    if (data) {
      setMatch(data as MatchDetail);
    }
    setLoading(false);
  }, [user, matchId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMatch();
    }
  }, [authLoading, user, fetchMatch]);

  const createPayment = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/stripe/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const body = (await res.json()) as CreatePaymentResponse;
      if (!res.ok) {
        const msg = "error" in body ? body.error : "決済の準備に失敗しました";
        toast.error(msg);
        return;
      }
      setPaymentResp(body);
    } catch {
      toast.error("通信エラーが発生しました");
    } finally {
      setCreating(false);
    }
  }, [creating, matchId]);

  // Auto-start payment intent when match loaded and not paid yet
  useEffect(() => {
    if (
      match &&
      match.is_matched &&
      match.payment_status !== "paid" &&
      !paymentResp &&
      !creating
    ) {
      createPayment();
    }
  }, [match, paymentResp, creating, createPayment]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#F8F9FB]">
        <p className="text-lg font-medium text-[#1A1A2E]">
          ログインしてください
        </p>
        <Button
          className="mt-4 bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
          onClick={() => router.push("/login")}
        >
          ログイン
        </Button>
      </div>
    );
  }

  if (!match) {
    return (
      <NotFound onBack={() => router.push("/company/mypage")} />
    );
  }

  if (match.company_id !== user.id) {
    return (
      <Forbidden onBack={() => router.push("/company/mypage")} />
    );
  }

  if (!match.is_matched) {
    return (
      <NotReady onBack={() => router.push("/company/mypage")} />
    );
  }

  if (match.payment_status === "paid") {
    return (
      <AlreadyPaid onBack={() => router.push("/company/mypage")} />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="mx-auto max-w-xl px-4 py-8">
        <Link
          href="/company/mypage"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#6B7280] transition-colors hover:text-[#0F569D]"
        >
          <ChevronLeft className="size-4" />
          マイページに戻る
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="size-5 text-[#0F569D]" />
              成約手数料のお支払い
            </CardTitle>
            <CardDescription>
              {match.advisor?.display_name ?? "顧問"} さんとのマッチング成立に対する
              成約手数料(50,000円)をお支払いください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentResp === null && creating && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-[#0F569D]" />
              </div>
            )}

            {paymentResp && "mock" in paymentResp && (
              <MockPaymentPanel
                matchId={paymentResp.matchId}
                amount={paymentResp.amount}
                onSuccess={() => router.push("/company/mypage")}
              />
            )}

            {paymentResp && "clientSecret" in paymentResp && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: paymentResp.clientSecret,
                  appearance: { theme: "stripe" },
                }}
              >
                <StripePaymentForm
                  amount={paymentResp.amount}
                  onSuccess={() => router.push("/company/mypage")}
                />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StripePaymentForm({
  amount,
  onSuccess,
}: {
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/company/mypage`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message ?? "決済に失敗しました");
      setProcessing(false);
      return;
    }

    toast.success("決済が完了しました");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="border-t border-[#E5E7EB] pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[#6B7280]">合計</span>
          <span className="text-xl font-bold text-[#1A1A2E]">
            ¥{amount.toLocaleString()}
          </span>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
        disabled={!stripe || processing}
      >
        {processing ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 size-4" />
        )}
        {processing ? "処理中..." : `¥${amount.toLocaleString()} を支払う`}
      </Button>
    </form>
  );
}

function MockPaymentPanel({
  matchId,
  amount,
  onSuccess,
}: {
  matchId: string;
  amount: number;
  onSuccess: () => void;
}) {
  const [processing, setProcessing] = useState(false);

  async function handleMockPay() {
    if (processing) return;
    setProcessing(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("matches")
      .update({ payment_status: "paid" })
      .eq("id", matchId);

    if (error) {
      toast.error("擬似決済の更新に失敗しました");
      setProcessing(false);
      return;
    }
    toast.success("擬似決済が完了しました(デモ環境)");
    onSuccess();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-900">
          <p className="font-medium">デモモード</p>
          <p className="mt-1">
            Stripe の環境変数が設定されていません。実際の決済は行わず、擬似的に成功させます。
          </p>
        </div>
      </div>
      <div className="border-t border-[#E5E7EB] pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[#6B7280]">合計</span>
          <span className="text-xl font-bold text-[#1A1A2E]">
            ¥{amount.toLocaleString()}
          </span>
        </div>
      </div>
      <Button
        type="button"
        className="w-full bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
        onClick={handleMockPay}
        disabled={processing}
      >
        {processing ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 size-4" />
        )}
        {processing ? "処理中..." : "擬似決済を確定する"}
      </Button>
    </div>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#F8F9FB]">
      <p className="text-lg font-medium text-[#1A1A2E]">
        マッチが見つかりませんでした
      </p>
      <Button variant="outline" className="mt-4" onClick={onBack}>
        <ChevronLeft className="mr-2 size-4" />
        マイページに戻る
      </Button>
    </div>
  );
}

function Forbidden({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#F8F9FB]">
      <p className="text-lg font-medium text-[#1A1A2E]">
        このマッチの決済を行う権限がありません
      </p>
      <Button variant="outline" className="mt-4" onClick={onBack}>
        <ChevronLeft className="mr-2 size-4" />
        マイページに戻る
      </Button>
    </div>
  );
}

function NotReady({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#F8F9FB]">
      <p className="text-lg font-medium text-[#1A1A2E]">
        マッチング成立後に決済が可能になります
      </p>
      <p className="mt-1 text-sm text-[#6B7280]">
        両者がマッチ完了を確認するとお支払いに進めます
      </p>
      <Button variant="outline" className="mt-4" onClick={onBack}>
        <ChevronLeft className="mr-2 size-4" />
        マイページに戻る
      </Button>
    </div>
  );
}

function AlreadyPaid({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#F8F9FB]">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="size-8 text-green-600" />
      </div>
      <p className="mt-4 text-lg font-medium text-[#1A1A2E]">
        この案件は決済済みです
      </p>
      <Button variant="outline" className="mt-4" onClick={onBack}>
        <ChevronLeft className="mr-2 size-4" />
        マイページに戻る
      </Button>
    </div>
  );
}
