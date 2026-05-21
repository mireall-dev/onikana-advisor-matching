"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Check, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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
  PaymentStatus,
  StripePaymentStatus,
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

function PaymentStatusBadge({
  status,
}: {
  status: string;
}) {
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

export default function MatchesPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [matches, setMatches] = useState<MatchWithRelations[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const [matchesRes, paymentsRes] = await Promise.all([
      supabase
        .from("matches")
        .select(
          "*, company:users!company_id(display_name), advisor:users!advisor_id(display_name), request:meeting_requests!request_id(*)"
        )
        .order("created_at", { ascending: false }),
      supabase.from("payments").select("*"),
    ]);

    if (matchesRes.data) {
      setMatches(matchesRes.data as MatchWithRelations[]);
    }
    if (paymentsRes.data) {
      setPayments(paymentsRes.data as Payment[]);
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "admin") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [authLoading, user, role, router, fetchData]);

  const paymentMap = useMemo(() => {
    const map = new Map<string, Payment>();
    for (const payment of payments) {
      map.set(payment.match_id, payment);
    }
    return map;
  }, [payments]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  function getPaymentStatusForMatch(matchItem: MatchWithRelations): string {
    // First check the payment_status field on the match itself
    if (matchItem.payment_status) {
      return matchItem.payment_status;
    }
    // Then check the payments table
    const payment = paymentMap.get(matchItem.id);
    if (payment) {
      // Map StripePaymentStatus to display status
      if (payment.status === "succeeded") return "paid";
      if (payment.status === "failed") return "failed";
      return "pending";
    }
    return "unpaid";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">マッチング一覧</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          全マッチングを管理します ({matches.length}件)
        </p>
      </div>

      {/* Table */}
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
                const paymentStatus = getPaymentStatusForMatch(matchItem);

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
                        ? format(
                            new Date(matchItem.matched_at),
                            "yyyy/MM/dd HH:mm"
                          )
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
