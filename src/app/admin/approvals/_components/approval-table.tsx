"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { AdvisorProfile, User } from "@/types/database";
import { approveAdvisor, rejectAdvisor } from "../actions";

export type AdvisorWithUser = AdvisorProfile & {
  user: Pick<User, "display_name" | "email"> | null;
};

export function ApprovalTable({
  advisors,
  showActions,
}: {
  advisors: AdvisorWithUser[];
  showActions: boolean;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] =
    useState<AdvisorWithUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  function runAction(
    action: typeof approveAdvisor | typeof rejectAdvisor,
    advisorUserId: string,
    successMessage: string
  ) {
    setProcessingId(advisorUserId);
    startTransition(async () => {
      const result = await action(advisorUserId);
      if (result.ok) {
        toast.success(successMessage);
        setDialogOpen(false);
      } else {
        toast.error(result.error ?? "エラーが発生しました");
      }
      setProcessingId(null);
    });
  }

  function openDetail(advisor: AdvisorWithUser) {
    setSelectedAdvisor(advisor);
    setDialogOpen(true);
  }

  if (advisors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#6B7280]">
        該当する顧問はいません
      </p>
    );
  }

  return (
    <>
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
          {advisors.map((advisor) => (
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
                        onClick={() =>
                          runAction(approveAdvisor, advisor.user_id, "顧問を承認しました")
                        }
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
                        onClick={() =>
                          runAction(rejectAdvisor, advisor.user_id, "顧問を却下しました")
                        }
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
                    <Badge key={area} variant="outline" className="text-xs">
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
                    ¥{selectedAdvisor.hourly_rate.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#6B7280]">
                    人脈・コネクション
                  </p>
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
                onClick={() =>
                  runAction(
                    approveAdvisor,
                    selectedAdvisor.user_id,
                    "顧問を承認しました"
                  )
                }
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
                onClick={() =>
                  runAction(
                    rejectAdvisor,
                    selectedAdvisor.user_id,
                    "顧問を却下しました"
                  )
                }
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
    </>
  );
}
