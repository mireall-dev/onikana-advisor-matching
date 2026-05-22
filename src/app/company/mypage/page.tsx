import Link from "next/link";
import Image from "next/image";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageCircle,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { MatchStepper, type MatchStep } from "@/components/shared/match-stepper";
import { getInitials } from "@/lib/utils";
import type {
  AdvisorProfile,
  Match,
  MeetingRequest,
  User,
} from "@/types/database";
import { ConfirmMatchButton } from "./_components/confirm-match-button";
import { TabFilter } from "./_components/tab-filter";

type RequestWithAdvisor = MeetingRequest & {
  advisor: User;
  advisor_profile: Pick<AdvisorProfile, "user_id" | "catchphrase" | "status">;
};

type MatchRow = Match & {
  advisor: User;
  advisor_profile: Pick<AdvisorProfile, "user_id" | "catchphrase">;
};

type TabValue = "all" | "pending" | "approved" | "rejected";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + "...";
}

function deriveStep(
  request: { status: string },
  match: { is_matched: boolean; payment_status: string } | undefined
): MatchStep {
  if (request.status === "pending") return "requested";
  if (request.status === "rejected") return "requested";
  if (!match || !match.is_matched) return "approved";
  if (match.payment_status !== "paid") return "matched";
  return "paid";
}

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const activeTab: TabValue =
    sp.tab === "pending" || sp.tab === "approved" || sp.tab === "rejected"
      ? sp.tab
      : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#F8F9FB]">
        <p className="text-lg font-medium text-[#1A1A2E]">ログインが必要です。</p>
        <Button
          className="mt-4 bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
          render={<Link href="/login" />}
        >
          ログイン
        </Button>
      </div>
    );
  }

  const [requestsRes, matchesRes] = await Promise.all([
    supabase
      .from("meeting_requests")
      .select(
        "*, advisor:users!advisor_id(*), advisor_profile:advisor_profiles!advisor_id(*)"
      )
      .eq("company_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select(
        "*, advisor:users!advisor_id(*), advisor_profile:advisor_profiles!advisor_id(*)"
      )
      .eq("company_id", user.id),
  ]);

  const requests = (requestsRes.data ?? []) as unknown as RequestWithAdvisor[];
  const matches = (matchesRes.data ?? []) as unknown as MatchRow[];

  const matchByRequestId = new Map<string, MatchRow>();
  for (const m of matches) matchByRequestId.set(m.request_id, m);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };
  const filtered =
    activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="mx-auto max-w-[900px] px-4 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">マイページ</h1>
        <p className="mt-1 text-[#6B7280]">
          面談リクエストの状況とマッチング進捗を確認できます。
        </p>

        <div className="mt-8">
          <TabFilter active={activeTab} counts={counts} />

          <div className="mt-6 space-y-4">
            {filtered.length > 0 ? (
              filtered.map((request) => {
                const match = matchByRequestId.get(request.id);
                const bothConfirmed =
                  match?.company_confirmed && match?.advisor_confirmed;
                const companyConfirmed = match?.company_confirmed;

                return (
                  <Card
                    key={request.id}
                    className="animate-fade-in-up transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="size-12 shrink-0">
                            {request.advisor?.avatar_url ? (
                              <AvatarImage
                                src={request.advisor.avatar_url}
                                alt={request.advisor.display_name}
                              />
                            ) : null}
                            <AvatarFallback className="bg-[#0F569D] text-sm font-semibold text-white">
                              {request.advisor
                                ? getInitials(request.advisor.display_name)
                                : "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-[#1A1A2E]">
                                {request.advisor?.display_name ?? "不明"}
                              </h3>
                              <StatusBadge status={request.status} />
                            </div>
                            <p className="mt-1 text-sm text-[#6B7280]">
                              {truncate(request.consultation_content, 80)}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-[#6B7280]">
                              <Clock className="size-3" />
                              {formatDate(request.created_at)}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            render={
                              <Link
                                href={`/company/chat?request_id=${request.id}`}
                              />
                            }
                          >
                            <MessageCircle className="mr-1.5 size-3.5" />
                            チャット
                          </Button>

                          {request.status === "approved" && match && (
                            <>
                              {bothConfirmed ? (
                                <Badge className="bg-green-50 text-green-700 border-transparent">
                                  <CheckCircle2 className="mr-1 size-3" />
                                  マッチング成立
                                </Badge>
                              ) : companyConfirmed ? (
                                <Badge className="bg-amber-50 text-amber-700 border-transparent">
                                  <Clock className="mr-1 size-3" />
                                  顧問の確認待ち
                                </Badge>
                              ) : (
                                <ConfirmMatchButton matchId={match.id} />
                              )}

                              {bothConfirmed && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    render={
                                      <Link
                                        href={`/company/review/${match.id}`}
                                      />
                                    }
                                  >
                                    <Star className="mr-1.5 size-3.5" />
                                    レビューを書く
                                  </Button>
                                  {match.payment_status === "paid" ? (
                                    <Badge className="bg-green-50 text-green-700 border-transparent">
                                      <CreditCard className="mr-1 size-3" />
                                      決済済み
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                                      render={
                                        <Link
                                          href={`/company/payment/${match.id}`}
                                        />
                                      }
                                    >
                                      <CreditCard className="mr-1.5 size-3.5" />
                                      {match.payment_status === "failed"
                                        ? "再決済"
                                        : "決済する"}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {request.status !== "rejected" && (
                        <div className="mt-5 border-t border-[#F1F5F9] pt-4">
                          <MatchStepper current={deriveStep(request, match)} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <EmptyState activeTab={activeTab} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ activeTab }: { activeTab: TabValue }) {
  const labels: Record<Exclude<TabValue, "all">, string> = {
    pending: "申請中",
    approved: "承認済",
    rejected: "見送り",
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Image
        src="/images/empty-inbox.png"
        alt=""
        width={180}
        height={180}
        className="pointer-events-none"
      />
      <p className="mt-4 text-[#6B7280]">
        {activeTab === "all"
          ? "まだリクエストはありません。"
          : `${labels[activeTab]}のリクエストはありません。`}
      </p>
      {activeTab === "all" && (
        <Button
          className="mt-4 bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
          render={<Link href="/company/search" />}
        >
          顧問を探す
        </Button>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
