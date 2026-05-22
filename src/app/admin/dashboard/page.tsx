"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import {
  Building2,
  UserCheck,
  ClipboardList,
  Handshake,
  Banknote,
  Loader2,
  UserPlus,
  Send,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/database";

interface ActivityItem {
  id: string;
  type: "request" | "match" | "user";
  text: string;
  date: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [companyCount, setCompanyCount] = useState(0);
  const [advisorCount, setAdvisorCount] = useState(0);
  const [pendingAdvisors, setPendingAdvisors] = useState(0);
  const [monthlyRequests, setMonthlyRequests] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      companiesRes,
      advisorsRes,
      pendingAdvisorsRes,
      monthlyRequestsRes,
      matchesRes,
      revenueRes,
      recentUsersRes,
      recentRequestsRes,
      recentMatchesRes,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "company"),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "advisor"),
      supabase
        .from("advisor_profiles")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "pending"),
      supabase
        .from("meeting_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth),
      supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("is_matched", true),
      supabase
        .from("payments")
        .select("amount")
        .eq("status", "succeeded"),
      supabase
        .from("users")
        .select("id, display_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("meeting_requests")
        .select("id, consultation_content, created_at, company:users!company_id(display_name)")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("matches")
        .select("id, is_matched, matched_at, created_at, company:users!company_id(display_name), advisor:users!advisor_id(display_name)")
        .eq("is_matched", true)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    setCompanyCount(companiesRes.count ?? 0);
    setAdvisorCount(advisorsRes.count ?? 0);
    setPendingAdvisors(pendingAdvisorsRes.count ?? 0);
    setMonthlyRequests(monthlyRequestsRes.count ?? 0);
    setMatchCount(matchesRes.count ?? 0);

    const totalRevenue = (revenueRes.data ?? []).reduce(
      (sum: number, p: { amount: number }) => sum + p.amount,
      0
    );
    setRevenue(totalRevenue);

    // Build activity timeline
    const activityItems: ActivityItem[] = [];

    if (recentUsersRes.data) {
      for (const u of recentUsersRes.data as Pick<User, "id" | "display_name" | "role" | "created_at">[]) {
        const roleLabel = u.role === "company" ? "企業" : u.role === "advisor" ? "顧問" : "管理者";
        activityItems.push({
          id: `user-${u.id}`,
          type: "user",
          text: `${u.display_name} さんが${roleLabel}として登録しました`,
          date: u.created_at,
        });
      }
    }

    if (recentRequestsRes.data) {
      for (const r of recentRequestsRes.data) {
        const raw = r as Record<string, unknown>;
        const companyArr = raw.company as { display_name: string }[] | null;
        const companyName = companyArr?.[0]?.display_name ?? "不明";
        activityItems.push({
          id: `req-${r.id}`,
          type: "request",
          text: `${companyName} がリクエストを送信しました`,
          date: r.created_at as string,
        });
      }
    }

    if (recentMatchesRes.data) {
      for (const m of recentMatchesRes.data) {
        const raw = m as Record<string, unknown>;
        const companyArr = raw.company as { display_name: string }[] | null;
        const advisorArr = raw.advisor as { display_name: string }[] | null;
        const companyName = companyArr?.[0]?.display_name ?? "不明";
        const advisorName = advisorArr?.[0]?.display_name ?? "不明";
        activityItems.push({
          id: `match-${m.id}`,
          type: "match",
          text: `${companyName} と ${advisorName} のマッチングが成立しました`,
          date: (raw.matched_at as string | null) ?? (m.created_at as string),
        });
      }
    }

    // Sort by date descending and take top 10
    activityItems.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setActivities(activityItems.slice(0, 10));

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

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  function getActivityIcon(type: ActivityItem["type"]) {
    switch (type) {
      case "user":
        return <UserPlus className="size-4 text-[#0F569D]" />;
      case "request":
        return <Send className="size-4 text-[#D97706]" />;
      case "match":
        return <CheckCircle2 className="size-4 text-[#16A34A]" />;
    }
  }

  const formattedRevenue = `\u00A5${revenue.toLocaleString()}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">管理ダッシュボード</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          システム全体の状況を確認できます
        </p>
      </div>

      {/* KPI Cards */}
      <div className="stagger-children mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="登録企業数"
          value={companyCount}
          icon={Building2}
        />
        <KpiCard
          title="登録顧問数"
          value={advisorCount}
          icon={UserCheck}
          trend={pendingAdvisors > 0 ? `(承認待ち${pendingAdvisors}件)` : undefined}
        />
        <KpiCard
          title="今月の新規リクエスト数"
          value={monthlyRequests}
          icon={ClipboardList}
        />
        <KpiCard
          title="累計マッチング成立数"
          value={matchCount}
          icon={Handshake}
        />
        <KpiCard
          title="月間売上"
          value={formattedRevenue}
          icon={Banknote}
        />
      </div>

      {/* Recent Activity */}
      <div className="animate-fade-in-up">
        <Card className="bg-white border border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#1A1A2E]">
              直近のアクティビティ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Image
                  src="/images/empty-inbox.png"
                  alt=""
                  width={160}
                  height={160}
                  className="pointer-events-none"
                />
                <p className="mt-4 text-sm text-[#6B7280]">
                  アクティビティはまだありません
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F8F9FB]">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1A1A2E]">
                        {activity.text}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {format(new Date(activity.date), "yyyy/MM/dd HH:mm")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
