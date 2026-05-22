"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  MessageCircle,
  CheckCircle2,
  Star,
  CreditCard,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { MatchStepper, type MatchStep } from "@/components/shared/match-stepper";
import { getInitials } from "@/lib/utils";
import type {
  MeetingRequest,
  Match,
  User,
  AdvisorProfile,
} from "@/types/database";

type RequestWithRelations = MeetingRequest & {
  advisor: User;
  advisor_profile: Pick<AdvisorProfile, "user_id" | "catchphrase" | "status">;
};

type MatchWithRelations = Match & {
  advisor: User;
  advisor_profile: Pick<AdvisorProfile, "user_id" | "catchphrase">;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

function deriveStep(
  request: { status: string },
  match: { is_matched: boolean; payment_status: string } | undefined
): MatchStep {
  if (request.status === "pending") return "requested";
  if (request.status === "rejected") return "requested";
  // approved
  if (!match) return "approved";
  if (!match.is_matched) return "approved";
  if (match.payment_status !== "paid") return "matched";
  return "paid";
}

type TabFilter = "all" | "pending" | "approved" | "rejected";

export default function MyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [matches, setMatches] = useState<MatchWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [confirmingMatchId, setConfirmingMatchId] = useState<string | null>(
    null
  );

  const fetchData = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();

    // Fetch requests
    const { data: requestsData } = await supabase
      .from("meeting_requests")
      .select(
        "*, advisor:users!advisor_id(*), advisor_profile:advisor_profiles!advisor_id(*)"
      )
      .eq("company_id", user.id)
      .order("created_at", { ascending: false });

    if (requestsData) {
      setRequests(requestsData as RequestWithRelations[]);
    }

    // Fetch matches
    const { data: matchesData } = await supabase
      .from("matches")
      .select(
        "*, advisor:users!advisor_id(*), advisor_profile:advisor_profiles!advisor_id(*)"
      )
      .eq("company_id", user.id);

    if (matchesData) {
      setMatches(matchesData as MatchWithRelations[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchData]);

  async function handleConfirmMatch(matchId: string) {
    setConfirmingMatchId(matchId);

    try {
      const supabase = createClient();

      // company_confirmed のみ更新する。両者確認時に is_matched/matched_at を
      // セットするのは DB トリガー `check_match_completion` の責務なので、
      // クライアント側では同じ列を二重に更新しない。
      const { error } = await supabase
        .from("matches")
        .update({ company_confirmed: true })
        .eq("id", matchId);

      if (error) throw error;

      toast.success("マッチ完了を確認しました。");
      await fetchData();
    } catch {
      toast.error("エラーが発生しました。再度お試しください。");
    } finally {
      setConfirmingMatchId(null);
    }
  }

  function getFilteredRequests(): RequestWithRelations[] {
    if (activeTab === "all") return requests;
    return requests.filter((r) => r.status === activeTab);
  }

  function getMatchForRequest(requestId: string): MatchWithRelations | undefined {
    return matches.find((m) => m.request_id === requestId);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <div className="mx-auto max-w-[900px] px-4 py-8">
          <div className="h-12 w-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-[140px] animate-pulse rounded-xl bg-[#E5E7EB]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB]">
        <p className="text-lg font-medium text-[#1A1A2E]">
          ログインが必要です。
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

  const filteredRequests = getFilteredRequests();

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="mx-auto max-w-[900px] px-4 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">マイページ</h1>
        <p className="mt-1 text-[#6B7280]">
          面談リクエストの状況とマッチング進捗を確認できます。
        </p>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as TabFilter)}
          >
            <TabsList variant="line">
              <TabsTrigger value="all">
                すべて ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                申請中 ({requests.filter((r) => r.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                承認済 ({requests.filter((r) => r.status === "approved").length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                見送り ({requests.filter((r) => r.status === "rejected").length})
              </TabsTrigger>
            </TabsList>

            {/* All tabs share the same content renderer */}
            {(["all", "pending", "approved", "rejected"] as const).map(
              (tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="mt-6 space-y-4">
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((request) => {
                        const match = getMatchForRequest(request.id);
                        const isBothConfirmed =
                          match?.company_confirmed && match?.advisor_confirmed;
                        const isCompanyConfirmed = match?.company_confirmed;

                        return (
                          <Card
                            key={request.id}
                            className="animate-fade-in-up transition-shadow hover:shadow-md"
                          >
                            <CardContent className="p-5">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                {/* Left: Advisor Info */}
                                <div className="flex items-start gap-4">
                                  <Avatar className="size-12 shrink-0">
                                    {request.advisor?.avatar_url ? (
                                      <AvatarImage
                                        src={request.advisor.avatar_url}
                                        alt={
                                          request.advisor.display_name
                                        }
                                      />
                                    ) : null}
                                    <AvatarFallback className="bg-[#0F569D] text-sm font-semibold text-white">
                                      {request.advisor
                                        ? getInitials(
                                            request.advisor.display_name
                                          )
                                        : "??"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-[#1A1A2E]">
                                        {request.advisor?.display_name ??
                                          "不明"}
                                      </h3>
                                      <StatusBadge status={request.status} />
                                    </div>
                                    <p className="mt-1 text-sm text-[#6B7280]">
                                      {truncateText(
                                        request.consultation_content,
                                        80
                                      )}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1 text-xs text-[#6B7280]">
                                      <Clock className="size-3" />
                                      {formatDate(request.created_at)}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  {/* Chat Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      router.push(`/company/chat?request_id=${request.id}`)
                                    }
                                  >
                                    <MessageCircle className="mr-1.5 size-3.5" />
                                    チャット
                                  </Button>

                                  {/* Match Confirmation (only for approved requests) */}
                                  {request.status === "approved" && match && (
                                    <>
                                      {isBothConfirmed ? (
                                        <Badge className="bg-green-50 text-green-700 border-transparent">
                                          <CheckCircle2 className="mr-1 size-3" />
                                          マッチング成立
                                        </Badge>
                                      ) : isCompanyConfirmed ? (
                                        <Badge className="bg-amber-50 text-amber-700 border-transparent">
                                          <Clock className="mr-1 size-3" />
                                          顧問の確認待ち
                                        </Badge>
                                      ) : (
                                        <Button
                                          size="sm"
                                          className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                                          disabled={
                                            confirmingMatchId === match.id
                                          }
                                          onClick={() =>
                                            handleConfirmMatch(match.id)
                                          }
                                        >
                                          {confirmingMatchId === match.id ? (
                                            <span className="flex items-center gap-1.5">
                                              <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                              確認中...
                                            </span>
                                          ) : (
                                            <>
                                              <CalendarCheck className="mr-1.5 size-3.5" />
                                              マッチ完了
                                            </>
                                          )}
                                        </Button>
                                      )}

                                      {/* Review & Payment for fully matched */}
                                      {isBothConfirmed && (
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              router.push(
                                                `/company/review/${match.id}`
                                              )
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
                                              onClick={() =>
                                                router.push(
                                                  `/company/payment/${match.id}`
                                                )
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
                                  <MatchStepper
                                    current={deriveStep(request, match)}
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center py-16">
                        <FileText className="mb-3 size-10 text-[#E5E7EB]" />
                        <p className="text-[#6B7280]">
                          {activeTab === "all"
                            ? "まだリクエストはありません。"
                            : `${
                                activeTab === "pending"
                                  ? "申請中"
                                  : activeTab === "approved"
                                    ? "承認済"
                                    : "見送り"
                              }のリクエストはありません。`}
                        </p>
                        {activeTab === "all" && (
                          <Button
                            className="mt-4 bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                            onClick={() => router.push("/company/search")}
                          >
                            顧問を探す
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              )
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
