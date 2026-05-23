import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState, ErrorState } from "@/components/shared/states";
import type { MeetingRequest, RequestStatus, User } from "@/types/database";
import { RequestStatusFilter, type StatusFilter } from "./_components/status-filter";

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

function parseStatus(value: string | undefined): StatusFilter {
  if (value === "pending" || value === "approved" || value === "rejected")
    return value;
  return "all";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const statusFilter = parseStatus(sp.status);

  const supabase = await createClient();
  const [requestsRes, companyProfilesRes] = await Promise.all([
    supabase
      .from("meeting_requests")
      .select(
        "*, company:users!company_id(display_name), advisor:users!advisor_id(display_name)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("company_profiles").select("user_id, company_name"),
  ]);

  if (requestsRes.error || companyProfilesRes.error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="リクエストの取得に失敗しました" />
      </div>
    );
  }

  const requests = (requestsRes.data ?? []) as RequestWithUsers[];
  const companyNameMap = new Map<string, string>();
  for (const cp of (companyProfilesRes.data ?? []) as {
    user_id: string;
    company_name: string;
  }[]) {
    companyNameMap.set(cp.user_id, cp.company_name);
  }
  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === (statusFilter as RequestStatus));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">リクエスト一覧</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          全面談リクエストを管理します ({filteredRequests.length}件)
        </p>
      </div>

      <div className="animate-fade-in-up mb-6">
        <RequestStatusFilter active={statusFilter} />
      </div>

      <div className="animate-fade-in-up rounded-xl border border-[#E5E7EB] bg-white">
        {filteredRequests.length === 0 ? (
          <EmptyState title="該当するリクエストはありません" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead>ID</TableHead>
                <TableHead>企業 (担当者)</TableHead>
                <TableHead>顧問名</TableHead>
                <TableHead>相談内容</TableHead>
                <TableHead>日付</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => {
                const companyName = companyNameMap.get(request.company_id);
                const contactName = request.company?.display_name ?? "不明";
                return (
                <TableRow key={request.id} className="border-[#E5E7EB]">
                  <TableCell className="font-mono text-xs text-[#6B7280]">
                    {shortenId(request.id)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#1A1A2E]">
                        {companyName ?? contactName}
                      </span>
                      {companyName && (
                        <span className="text-xs text-[#6B7280]">
                          担当: {contactName}
                        </span>
                      )}
                    </div>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
