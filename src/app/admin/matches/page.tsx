import { format } from "date-fns";
import { Check, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Match,
  User,
  MeetingRequest,
  Payment,
} from "@/types/database";

type MatchWithRelations = Match & {
  company: Pick<User, "display_name"> | null;
  advisor: Pick<User, "display_name"> | null;
  request: MeetingRequest | null;
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  succeeded: { label: "決済済", bg: "bg-green-50", text: "text-green-700" },
  paid: { label: "決済済", bg: "bg-green-50", text: "text-green-700" },
  unpaid: { label: "未決済", bg: "bg-gray-100", text: "text-gray-500" },
  pending: { label: "処理中", bg: "bg-amber-50", text: "text-amber-700" },
  failed: { label: "失敗", bg: "bg-red-50", text: "text-red-700" },
};

function PaymentStatusBadge({ status }: { status: string }) {
  const config = PAYMENT_STATUS_CONFIG[status] ?? {
    label: "不明",
    bg: "bg-gray-100",
    text: "text-gray-500",
  };

  return (
    <Badge
      variant="outline"
      className={`border-transparent font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </Badge>
  );
}

function getPaymentStatusForMatch(
  matchItem: MatchWithRelations,
  paymentMap: Map<string, Payment>
): string {
  if (matchItem.payment_status) return matchItem.payment_status;
  const payment = paymentMap.get(matchItem.id);
  if (payment) {
    if (payment.status === "succeeded") return "paid";
    if (payment.status === "failed") return "failed";
    return "pending";
  }
  return "unpaid";
}

export default async function MatchesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [matchesRes, paymentsRes] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "*, company:users!company_id(display_name), advisor:users!advisor_id(display_name), request:meeting_requests!request_id(*)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("*"),
  ]);

  const matches = (matchesRes.data ?? []) as MatchWithRelations[];
  const payments = (paymentsRes.data ?? []) as Payment[];

  const paymentMap = new Map<string, Payment>();
  for (const payment of payments) {
    paymentMap.set(payment.match_id, payment);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">マッチング一覧</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          全マッチングを管理します ({matches.length}件)
        </p>
      </div>

      <div className="animate-fade-in-up rounded-xl border border-[#E5E7EB] bg-white">
        {matches.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6B7280]">
            マッチングはまだありません
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead>企業名</TableHead>
                <TableHead>顧問名</TableHead>
                <TableHead className="text-center">企業確認</TableHead>
                <TableHead className="text-center">顧問確認</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>成立日</TableHead>
                <TableHead>決済</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((matchItem) => {
                const paymentStatus = getPaymentStatusForMatch(matchItem, paymentMap);

                return (
                  <TableRow key={matchItem.id} className="border-[#E5E7EB]">
                    <TableCell className="font-medium text-[#1A1A2E]">
                      {matchItem.company?.display_name ?? "不明"}
                    </TableCell>
                    <TableCell className="text-[#1A1A2E]">
                      {matchItem.advisor?.display_name ?? "不明"}
                    </TableCell>
                    <TableCell className="text-center">
                      {matchItem.company_confirmed ? (
                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-[#16A34A]/10">
                          <Check className="size-4 text-[#16A34A]" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-gray-100">
                          <Minus className="size-4 text-[#6B7280]" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {matchItem.advisor_confirmed ? (
                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-[#16A34A]/10">
                          <Check className="size-4 text-[#16A34A]" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-gray-100">
                          <Minus className="size-4 text-[#6B7280]" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {matchItem.is_matched ? (
                        <Badge
                          variant="secondary"
                          className="bg-[#16A34A]/10 text-[#16A34A] border-transparent font-medium"
                        >
                          成立
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-[#D97706]/10 text-[#D97706] border-transparent font-medium"
                        >
                          進行中
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
                      {matchItem.matched_at
                        ? format(new Date(matchItem.matched_at), "yyyy/MM/dd HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={paymentStatus} />
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
