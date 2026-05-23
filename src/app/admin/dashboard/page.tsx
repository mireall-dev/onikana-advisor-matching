import { format } from "date-fns";
import Link from "next/link";
import {
  Building2,
  UserCheck,
  ClipboardList,
  Handshake,
  Banknote,
  UserPlus,
  Send,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/database";

interface ActivityItem {
  id: string;
  type: "request" | "match" | "user";
  text: string;
  date: string;
}

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "user":
      return <UserPlus aria-hidden="true" className="size-5 text-[#0F569D]" />;
    case "request":
      return <Send aria-hidden="true" className="size-5 text-[#D97706]" />;
    case "match":
      return <CheckCircle2 aria-hidden="true" className="size-5 text-[#16A34A]" />;
  }
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();

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
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "company"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "advisor"),
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
    supabase.from("payments").select("amount").eq("status", "succeeded"),
    supabase
      .from("users")
      .select("id, display_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("meeting_requests")
      .select(
        "id, consultation_content, created_at, company:users!company_id(display_name)"
      )
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("matches")
      .select(
        "id, is_matched, matched_at, created_at, company:users!company_id(display_name), advisor:users!advisor_id(display_name)"
      )
      .eq("is_matched", true)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const companyCount = companiesRes.count ?? 0;
  const advisorCount = advisorsRes.count ?? 0;
  const pendingAdvisors = pendingAdvisorsRes.count ?? 0;
  const monthlyRequests = monthlyRequestsRes.count ?? 0;
  const matchCount = matchesRes.count ?? 0;
  const revenue = (revenueRes.data ?? []).reduce(
    (sum: number, p: { amount: number }) => sum + p.amount,
    0
  );

  const activityItems: ActivityItem[] = [];

  for (const u of (recentUsersRes.data ?? []) as Pick<
    User,
    "id" | "display_name" | "role" | "created_at"
  >[]) {
    const roleLabel =
      u.role === "company" ? "企業" : u.role === "advisor" ? "顧問" : "管理者";
    activityItems.push({
      id: `user-${u.id}`,
      type: "user",
      text: `${u.display_name} さんが${roleLabel}として登録しました`,
      date: u.created_at,
    });
  }

  for (const r of recentRequestsRes.data ?? []) {
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

  for (const m of recentMatchesRes.data ?? []) {
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

  activityItems.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const activities = activityItems.slice(0, 10);

  const formattedRevenue = `¥${revenue.toLocaleString()}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">管理ダッシュボード</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          システム全体の状況を確認できます
        </p>
      </div>

      <div className="stagger-children mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="登録企業数" value={companyCount} icon={Building2} />
        <Link href="/admin/approvals" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#0F569D] focus-visible:ring-offset-2">
          <KpiCard
            title="登録顧問数"
            value={advisorCount}
            icon={UserCheck}
            trend={pendingAdvisors > 0 ? `(承認待ち${pendingAdvisors}件)` : undefined}
          />
        </Link>
        <KpiCard
          title="今月の新規リクエスト数"
          value={monthlyRequests}
          icon={ClipboardList}
        />
        <KpiCard title="累計マッチング成立数" value={matchCount} icon={Handshake} />
        <div className="sm:col-span-2 lg:col-span-4">
          <KpiCard title="月間売上" value={formattedRevenue} icon={Banknote} />
        </div>
      </div>

      <div className="animate-fade-in-up">
        <Card className="bg-white border border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#1A1A2E]">
              直近のアクティビティ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <EmptyState title="アクティビティはまだありません" className="py-8" />
            ) : (
              <ul className="space-y-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F8F9FB]">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1A1A2E]">{activity.text}</p>
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
