"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Send, MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { getInitials } from "@/lib/utils";
import type { AdvisorProfile, User } from "@/types/database";

type AdvisorWithUser = AdvisorProfile & { user: User };

export default function RequestPage({
  params,
}: {
  params: Promise<{ advisorId: string }>;
}) {
  const { advisorId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [advisor, setAdvisor] = useState<AdvisorWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [consultationContent, setConsultationContent] = useState("");
  const [preferredDates, setPreferredDates] = useState("");
  const [errors, setErrors] = useState<{
    consultationContent?: string;
    preferredDates?: string;
  }>({});

  useEffect(() => {
    async function fetchAdvisor() {
      const supabase = createClient();
      const { data } = await supabase
        .from("advisor_profiles")
        .select("*, user:users!user_id(*)")
        .eq("id", advisorId)
        .single();

      if (data) {
        setAdvisor(data as AdvisorWithUser);
      }
      setLoading(false);
    }

    fetchAdvisor();
  }, [advisorId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      toast.error("ログインが必要です。");
      return;
    }

    if (!advisor) {
      toast.error("顧問情報の取得に失敗しました。");
      return;
    }

    const fieldErrors: { consultationContent?: string; preferredDates?: string } = {};
    if (!consultationContent.trim()) {
      fieldErrors.consultationContent = "相談内容を入力してください";
    }
    if (!preferredDates.trim()) {
      fieldErrors.preferredDates = "希望日程を入力してください";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);

    try {
      const supabase = createClient();

      // Check for existing pending request to same advisor
      const { data: existing } = await supabase
        .from("meeting_requests")
        .select("id")
        .eq("company_id", user.id)
        .eq("advisor_id", advisor.user_id)
        .eq("status", "pending")
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error(
          "この顧問にはすでに承認待ちのリクエストがあります。"
        );
        setSubmitting(false);
        return;
      }

      // Insert meeting request
      const { data: requestData, error: requestError } = await supabase
        .from("meeting_requests")
        .insert({
          company_id: user.id,
          advisor_id: advisor.user_id,
          consultation_content: consultationContent.trim(),
          preferred_dates: preferredDates.trim(),
          status: "pending",
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
      }

      // Insert initial match record
      const { error: matchError } = await supabase.from("matches").insert({
        request_id: requestData.id,
        company_id: user.id,
        advisor_id: advisor.user_id,
        company_confirmed: false,
        advisor_confirmed: false,
        is_matched: false,
        payment_status: "unpaid",
      });

      if (matchError) {
        throw matchError;
      }

      setRequestId(requestData.id);
      setSubmitted(true);
      toast.success("面談リクエストを送信しました。");
    } catch {
      toast.error("リクエストの送信に失敗しました。再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="h-[500px] animate-pulse rounded-xl bg-[#E5E7EB]" />
        </div>
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB]">
        <p className="text-lg font-medium text-[#1A1A2E]">
          顧問が見つかりませんでした
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/company/advisors")}
        >
          <ChevronLeft className="mr-2 size-4" />
          一覧に戻る
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Card className="animate-fade-in-up">
            <CardContent className="flex flex-col items-center py-12">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-[#1A1A2E]">
                リクエストを送信しました
              </h2>
              <p className="mt-2 text-center text-[#6B7280]">
                {advisor.user.display_name}
                さんにリクエストが送信されました。
                <br />
                顧問からの返答をお待ちください。
              </p>
              <div className="mt-8 flex gap-3">
                {requestId && (
                  <Button
                    className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                    onClick={() => router.push(`/company/chat?request_id=${requestId}`)}
                  >
                    <MessageCircle className="mr-2 size-4" />
                    チャットで直接やりとりする
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push("/company/mypage")}
                >
                  マイページへ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back Link */}
        <Link
          href={`/company/advisors/${advisor.id}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#6B7280] transition-colors hover:text-[#0F569D]"
        >
          <ChevronLeft className="size-4" />
          顧問詳細に戻る
        </Link>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-xl">面談リクエスト</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Advisor Info */}
            <div className="mb-6 flex items-center gap-4 rounded-lg bg-[#F8F9FB] p-4">
              <Avatar className="size-14 shrink-0">
                {advisor.user.avatar_url ? (
                  <AvatarImage
                    src={advisor.user.avatar_url}
                    alt={advisor.user.display_name}
                  />
                ) : null}
                <AvatarFallback className="bg-[#0F569D] text-base font-semibold text-white">
                  {getInitials(advisor.user.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-[#1A1A2E]">
                  {advisor.user.display_name}
                </p>
                {advisor.catchphrase && (
                  <p className="mt-0.5 text-sm text-[#6B7280]">
                    {advisor.catchphrase}
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <FormField
                label="相談内容"
                htmlFor="consultation"
                error={errors.consultationContent}
                required
              >
                <Textarea
                  id="consultation"
                  rows={6}
                  placeholder="ご相談したい内容を具体的にお書きください..."
                  value={consultationContent}
                  onChange={(e) => setConsultationContent(e.target.value)}
                />
              </FormField>

              <FormField
                label="希望日程"
                htmlFor="dates"
                error={errors.preferredDates}
                required
              >
                <Textarea
                  id="dates"
                  rows={4}
                  placeholder={
                    "第1希望：○月○日 10:00〜\n第2希望：○月○日 14:00〜\n第3希望：○月○日 16:00〜"
                  }
                  value={preferredDates}
                  onChange={(e) => setPreferredDates(e.target.value)}
                />
              </FormField>

              <Button
                type="submit"
                className="w-full bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    送信中...
                  </span>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    リクエストを送信
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
