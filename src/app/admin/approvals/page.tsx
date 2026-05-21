"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { AdvisorProfile, User, ApprovalStatus } from "@/types/database";

type AdvisorWithUser = AdvisorProfile & {
  user: Pick<User, "display_name" | "email"> | null;
};

export default function ApprovalsPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [advisors, setAdvisors] = useState<AdvisorWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorWithUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAdvisors = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("advisor_profiles")
      .select("*, user:users!user_id(display_name, email)")
      .order("created_at", { ascending: false });

    if (data) {
      setAdvisors(data as AdvisorWithUser[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "admin") {
      router.push("/login");
      return;
    }
    fetchAdvisors();
  }, [authLoading, user, role, router, fetchAdvisors]);

  async function handleApprove(advisorUserId: string) {
    setProcessingId(advisorUserId);
    const { error } = await supabase
      .from("advisor_profiles")
      .update({ approval_status: "approved" as ApprovalStatus })
      .eq("user_id", advisorUserId);

    if (error) {
      toast.error("承認に失敗しました");
    } else {
      toast.success("顧問を承認しました");
      await fetchAdvisors();
    }
    setProcessingId(null);
    setDialogOpen(false);
  }

  async function handleReject(advisorUserId: string) {
    setProcessingId(advisorUserId);
    const { error } = await supabase
      .from("advisor_profiles")
      .update({ approval_status: "rejected" as ApprovalStatus })
      .eq("user_id", advisorUserId);

    if (error) {
      toast.error("却下に失敗しました");
    } else {
      toast.error("顧問を却下しました");
      await fetchAdvisors();
    }
    setProcessingId(null);
    setDialogOpen(false);
  }

  function openDetail(advisor: AdvisorWithUser) {
    setSelectedAdvisor(advisor);
    setDialogOpen(true);
  }

  const pendingAdvisors = advisors.filter((a) => a.approval_status === "pending");
  const approvedAdvisors = advisors.filter((a) => a.approval_status === "approved");
  const rejectedAdvisors = advisors.filter((a) => a.approval_status === "rejected");

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  function renderTable(list: AdvisorWithUser[], showActions: boolean) {
    if (list.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-[#6B7280]">
          該当する顧問はいません
        </p>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-[#E5E7EB]">
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>得意業界</TableHead>
            <TableHead>営業領域</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((advisor) => (
            <TableRow key={advisor.id} className="border-[#E5E7EB]">
              <TableCell className="font-medium text-[#1A1A2E]">
                {advisor.user?.display_name ?? "不明"}
              </TableCell>
              <TableCell className="text-[#6B7280]">
                {advisor.user?.email ?? "不明"}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {advisor.industries.slice(0, 3).map((ind) => (
                    <Badge
                      key={ind}
                      variant="secondary"
                      className="bg-[#E8F0FE] text-[#0F569D] text-xs"
                    >
                      {ind}
                    </Badge>
                  ))}
                  {advisor.industries.length > 3 && (
                    <span className="text-xs text-[#6B7280]">
                      +{advisor.industries.length - 3}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {advisor.specialties.slice(0, 2).map((sp) => (
                    <Badge
                      key={sp}
                      variant="secondary"
                      className="bg-[#F8F9FB] text-[#1A1A2E] text-xs"
                    >
                      {sp}
                    </Badge>
                  ))}
                  {advisor.specialties.length > 2 && (
                    <span className="text-xs text-[#6B7280]">
                      +{advisor.specialties.length - 2}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-[#6B7280]">
                {format(new Date(advisor.created_at), "yyyy/MM/dd HH:mm")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetail(advisor)}
                  >
                    <Eye className="size-3.5" />
                    詳細
                  </Button>
                  {showActions && (
                    <>
                      <Button
                        size="sm"
                        disabled={processingId === advisor.user_id}
                        onClick={() => handleApprove(advisor.user_id)}
                        className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
                      >
                        {processingId === advisor.user_id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "承認"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        disabled={processingId === advisor.user_id}
                        onClick={() => handleReject(advisor.user_id)}
                        className="bg-[#D42027] hover:bg-[#D42027]/90 text-white"
                      >
                        {processingId === advisor.user_id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "却下"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">顧問承認管理</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          顧問の承認・却下を管理します
        </p>
      </div>

      <div className="animate-fade-in-up rounded-xl border border-[#E5E7EB] bg-white p-6">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              承認待ち
              {pendingAdvisors.length > 0 && (
                <Badge className="ml-1.5 bg-[#D97706] text-white text-xs">
                  {pendingAdvisors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              承認済
              <span className="ml-1.5 text-xs text-[#6B7280]">
                ({approvedAdvisors.length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              却下
              <span className="ml-1.5 text-xs text-[#6B7280]">
                ({rejectedAdvisors.length})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {renderTable(pendingAdvisors, true)}
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            {renderTable(approvedAdvisors, false)}
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            {renderTable(rejectedAdvisors, false)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>顧問プロフィール詳細</DialogTitle>
            <DialogDescription>
              {selectedAdvisor?.user?.display_name ?? "不明"} さんのプロフィール
            </DialogDescription>
          </DialogHeader>

          {selectedAdvisor && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-xs font-medium text-[#6B7280]">キャッチコピー</p>
                <p className="mt-1 text-sm text-[#1A1A2E]">
                  {selectedAdvisor.catchphrase || "未設定"}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-[#6B7280]">得意業界</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedAdvisor.industries.map((ind) => (
                    <Badge
                      key={ind}
                      variant="secondary"
                      className="bg-[#E8F0FE] text-[#0F569D] text-xs"
                    >
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#6B7280]">営業領域</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedAdvisor.specialties.map((sp) => (
                    <Badge
                      key={sp}
                      variant="secondary"
                      className="bg-[#F8F9FB] text-[#1A1A2E] text-xs"
                    >
                      {sp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[#6B7280]">対応エリア</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedAdvisor.areas.map((area) => (
                    <Badge
                      key={area}
                      variant="outline"
                      className="text-xs"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-[#6B7280]">経歴</p>
                <p className="mt-1 text-sm text-[#1A1A2E] whitespace-pre-wrap">
                  {selectedAdvisor.career_summary || "未設定"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[#6B7280]">実績</p>
                {selectedAdvisor.achievements.length > 0 ? (
                  <ul className="mt-1 space-y-2">
                    {selectedAdvisor.achievements.map((ach, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-[#E5E7EB] p-3"
                      >
                        <p className="text-xs font-medium text-[#0F569D]">
                          {ach.company}
                        </p>
                        <p className="mt-0.5 text-sm text-[#1A1A2E]">
                          {ach.description}
                        </p>
                        <p className="mt-0.5 text-xs text-[#6B7280]">
                          結果: {ach.result}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-[#6B7280]">未設定</p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">時給</p>
                  <p className="mt-1 text-sm text-[#1A1A2E]">
                    {"\u00A5"}{selectedAdvisor.hourly_rate.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">人脈・コネクション</p>
                  <p className="mt-1 text-sm text-[#1A1A2E]">
                    {selectedAdvisor.connections || "未設定"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedAdvisor?.approval_status === "pending" && (
            <DialogFooter>
              <Button
                disabled={processingId === selectedAdvisor.user_id}
                onClick={() => handleApprove(selectedAdvisor.user_id)}
                className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
              >
                {processingId === selectedAdvisor.user_id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "承認"
                )}
              </Button>
              <Button
                disabled={processingId === selectedAdvisor.user_id}
                onClick={() => handleReject(selectedAdvisor.user_id)}
                className="bg-[#D42027] hover:bg-[#D42027]/90 text-white"
              >
                {processingId === selectedAdvisor.user_id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "却下"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
