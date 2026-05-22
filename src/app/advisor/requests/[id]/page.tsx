"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  CheckCircle2,
  Building2,
  Calendar,
  FileText,
  Users,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import type {
  MeetingRequest,
  CompanyProfile,
  User as DbUser,
} from "@/types/database";

type RequestDetail = Omit<MeetingRequest, "company"> & {
  company: DbUser | null;
};

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  );
  const [advisorConfirmed, setAdvisorConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const fetchRequest = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data: reqData, error: reqError } = await supabase
      .from("meeting_requests")
      .select("*, company:users!company_id(*)")
      .eq("id", id)
      .single();

    if (reqError || !reqData) {
      toast.error("リクエストが見つかりませんでした");
      setLoading(false);
      return;
    }

    setRequest(reqData as RequestDetail);

    const { data: cpData } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", reqData.company_id)
      .single();

    if (cpData) {
      setCompanyProfile(cpData as CompanyProfile);
    }

    const { data: matchData } = await supabase
      .from("matches")
      .select("advisor_confirmed")
      .eq("request_id", reqData.id)
      .single();

    setAdvisorConfirmed(Boolean(matchData?.advisor_confirmed));

    setLoading(false);
  }, [user, id, supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchRequest();
    }
  }, [authLoading, user, fetchRequest]);

  async function handleApprove() {
    if (!user || !request || actionLoading) return;

    setActionLoading(true);
    const { error } = await supabase
      .from("meeting_requests")
      .update({
        status: "approved",
        responded_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (error) {
      toast.error("承認に失敗しました");
    } else {
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              status: "approved",
              responded_at: new Date().toISOString(),
            }
          : prev
      );
      toast.success("リクエストを承認しました");
    }
    setActionLoading(false);
  }

  async function handleReject() {
    if (!user || !request || actionLoading) return;

    setActionLoading(true);
    const { error } = await supabase
      .from("meeting_requests")
      .update({
        status: "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (error) {
      toast.error("見送りに失敗しました");
    } else {
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              status: "rejected",
              responded_at: new Date().toISOString(),
            }
          : prev
      );
      toast.success("リクエストを見送りました");
    }
    setActionLoading(false);
    setConfirmDialogOpen(false);
  }

  async function handleMatchConfirm() {
    if (!user || !request || actionLoading) return;

    setActionLoading(true);

    // Find or create match record, then set advisor_confirmed = true
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("*")
      .eq("request_id", request.id)
      .single();

    const { error } = existingMatch
      ? await supabase
          .from("matches")
          .update({ advisor_confirmed: true })
          .eq("id", existingMatch.id)
      : await supabase.from("matches").insert({
          request_id: request.id,
          company_id: request.company_id,
          advisor_id: request.advisor_id,
          advisor_confirmed: true,
          company_confirmed: false,
          is_matched: false,
        });

    if (error) {
      toast.error("マッチ確認に失敗しました");
    } else {
      setAdvisorConfirmed(true);
      toast.success("マッチ完了を確認しました");
    }

    setActionLoading(false);
  }

  function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  if (!user || !request) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#6B7280]">リクエストが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="animate-fade-in-up">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#6B7280] transition-colors hover:text-[#0F569D]"
        >
          <ArrowLeft className="size-4" />
          戻る
        </button>

        {/* Status header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-[#1A1A2E]">
            リクエスト詳細
          </h1>
          <StatusBadge status={request.status} />
        </div>

        {/* Company Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-[#0F569D]" />
              <CardTitle className="text-xl font-bold text-[#1A1A2E]">
                {companyProfile?.company_name ??
                  request.company?.display_name ??
                  "企業名不明"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companyProfile?.industry && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#6B7280]">業界:</span>
                  <Badge variant="secondary">
                    {companyProfile.industry}
                  </Badge>
                </div>
              )}
              {companyProfile?.employee_scale && (
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-[#6B7280]" />
                  <span className="text-sm text-[#6B7280]">従業員規模:</span>
                  <span className="text-sm text-[#1A1A2E]">
                    {companyProfile.employee_scale}
                  </span>
                </div>
              )}
              {companyProfile?.sales_challenge && (
                <div>
                  <p className="mb-1 text-sm text-[#6B7280]">営業課題:</p>
                  <p className="text-sm text-[#1A1A2E] leading-relaxed">
                    {companyProfile.sales_challenge}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request Content Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-[#0F569D]" />
              <CardTitle className="font-bold text-[#1A1A2E]">
                リクエスト内容
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-sm font-medium text-[#6B7280]">
                  相談内容
                </p>
                <p className="text-sm text-[#1A1A2E] leading-relaxed whitespace-pre-wrap">
                  {request.consultation_content}
                </p>
              </div>
              {request.preferred_dates && (
                <div>
                  <div className="mb-1 flex items-center gap-1">
                    <Calendar className="size-4 text-[#6B7280]" />
                    <p className="text-sm font-medium text-[#6B7280]">
                      希望日程
                    </p>
                  </div>
                  <p className="text-sm text-[#1A1A2E] whitespace-pre-wrap">
                    {request.preferred_dates}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#6B7280]">
                  申請日時: {formatDateTime(request.created_at)}
                </p>
                {request.responded_at && (
                  <p className="text-xs text-[#6B7280]">
                    対応日時: {formatDateTime(request.responded_at)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Section */}
        {request.status === "pending" && (
          <Card>
            <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-end">
              <Dialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
              >
                <DialogTrigger
                  render={
                    <Button
                      className="bg-[#D42027] text-white hover:bg-red-700"
                      disabled={actionLoading}
                    />
                  }
                >
                  {actionLoading ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : null}
                  見送る
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>リクエストを見送りますか？</DialogTitle>
                    <DialogDescription>
                      この操作は取り消すことができません。リクエストを見送ると、企業側に通知されます。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose
                      render={
                        <Button variant="outline" disabled={actionLoading} />
                      }
                    >
                      キャンセル
                    </DialogClose>
                    <Button
                      className="bg-[#D42027] text-white hover:bg-red-700"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-1 size-4 animate-spin" />
                      ) : null}
                      見送る
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                className="bg-[#16A34A] text-white hover:bg-green-700"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : null}
                承認する
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Approved Actions */}
        {request.status === "approved" && (
          <Card>
            <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="outline"
                className="gap-1"
                onClick={() =>
                  router.push(`/advisor/chat?request_id=${request.id}`)
                }
              >
                <MessageSquare className="size-4" />
                チャットを開く
              </Button>
              {advisorConfirmed ? (
                <Badge className="gap-1 border-transparent bg-green-50 px-3 py-1.5 text-sm text-green-700">
                  <CheckCircle2 className="size-4" />
                  マッチ確認済み
                </Badge>
              ) : (
                <Button
                  className="gap-1 bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                  onClick={handleMatchConfirm}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  マッチ完了
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
