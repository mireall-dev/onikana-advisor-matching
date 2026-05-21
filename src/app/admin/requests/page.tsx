"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { MeetingRequest, RequestStatus, User } from "@/types/database";

type StatusFilter = "all" | RequestStatus;

type RequestWithUsers = MeetingRequest & {
  company: Pick<User, "display_name"> | null;
  advisor: Pick<User, "display_name"> | null;
};

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function shortenId(id: string): string {
  return id.slice(0, 8);
}

export default function RequestsPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [requests, setRequests] = useState<RequestWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("meeting_requests")
      .select(
        "*, company:users!company_id(display_name), advisor:users!advisor_id(display_name)"
      )
      .order("created_at", { ascending: false });

    if (data) {
      setRequests(data as RequestWithUsers[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "admin") {
      router.push("/login");
      return;
    }
    fetchRequests();
  }, [authLoading, user, role, router, fetchRequests]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">リクエスト一覧</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          全面談リクエストを管理します ({filteredRequests.length}件)
        </p>
      </div>

      {/* Filter */}
      <div className="animate-fade-in-up mb-6">
        <Select
          value={statusFilter}
          onValueChange={(val) => { if (val !== null) setStatusFilter(val as StatusFilter); }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="ステータスで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="pending">申請中</SelectItem>
            <SelectItem value="approved">承認済</SelectItem>
            <SelectItem value="rejected">見送り</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="animate-fade-in-up rounded-xl border border-[#E5E7EB] bg-white">
        {filteredRequests.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6B7280]">
            該当するリクエストはありません
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead>ID</TableHead>
                <TableHead>企業名</TableHead>
                <TableHead>顧問名</TableHead>
                <TableHead>相談内容</TableHead>
                <TableHead>日付</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id} className="border-[#E5E7EB]">
                  <TableCell className="font-mono text-xs text-[#6B7280]">
                    {shortenId(request.id)}
                  </TableCell>
                  <TableCell className="font-medium text-[#1A1A2E]">
                    {request.company?.display_name ?? "不明"}
                  </TableCell>
                  <TableCell className="text-[#1A1A2E]">
                    {request.advisor?.display_name ?? "不明"}
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] text-[#6B7280]"
                    title={request.consultation_content}
                  >
                    {truncateText(request.consultation_content, 40)}
                  </TableCell>
                  <TableCell className="text-[#6B7280]">
                    {format(new Date(request.created_at), "yyyy/MM/dd HH:mm")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
