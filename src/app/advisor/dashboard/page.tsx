"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import Image from "next/image";
import { ClipboardList, Handshake, CheckCircle2, Star, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SelectField } from "@/components/shared/select-field";
import type {
  AdvisorProfile,
  AdvisorStatus,
  MeetingRequest,
  CompanyProfile,
} from "@/types/database";

const ADVISOR_STATUS_OPTIONS = [
  { value: "accepting", label: "受付中" },
  { value: "full", label: "満席" },
  { value: "paused", label: "休止中" },
] as const;

type RequestWithCompany = Omit<MeetingRequest, "company_profile"> & {
  company_profile?: CompanyProfile | null;
};

interface KpiData {
  monthlyRequests: number;
  activeDeals: number;
  totalMatches: number;
  ratingAvg: number;
}

export default function AdvisorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [requests, setRequests] = useState<RequestWithCompany[]>([]);
  const [kpi, setKpi] = useState<KpiData>({
    monthlyRequests: 0,
    activeDeals: 0,
    totalMatches: 0,
    ratingAvg: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const [profileRes, requestsRes, monthlyRes, activeRes, matchesRes] =
      await Promise.all([
        supabase
          .from("advisor_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("meeting_requests")
          .select("*, company:users!company_id(*)")
          .eq("advisor_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("meeting_requests")
          .select("*", { count: "exact", head: true })
          .eq("advisor_id", user.id)
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
        supabase
          .from("meeting_requests")
          .select("*", { count: "exact", head: true })
          .eq("advisor_id", user.id)
          .eq("status", "approved"),
        supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("advisor_id", user.id)
          .eq("is_matched", true),
      ]);

    if (profileRes.data) {
      setProfile(profileRes.data as AdvisorProfile);
    }

    // Fetch company profiles separately and merge
    if (requestsRes.data) {
      const companyIds = [
        ...new Set(
          requestsRes.data.map(
            (r: MeetingRequest) => r.company_id
          )
        ),
      ];

      if (companyIds.length > 0) {
        const { data: companyProfiles } = await supabase
          .from("company_profiles")
          .select("*")
          .in("user_id", companyIds);

        const profileMap = new Map(
          (companyProfiles ?? []).map((cp: CompanyProfile) => [
            cp.user_id,
            cp,
          ])
        );

        const enrichedRequests = requestsRes.data.map(
          (req: MeetingRequest) => ({
            ...req,
            company_profile: profileMap.get(req.company_id) ?? null,
          })
        );

        setRequests(enrichedRequests as RequestWithCompany[]);
      } else {
        setRequests(requestsRes.data as RequestWithCompany[]);
      }
    }

    setKpi({
      monthlyRequests: monthlyRes.count ?? 0,
      activeDeals: activeRes.count ?? 0,
      totalMatches: matchesRes.count ?? 0,
      ratingAvg: profileRes.data?.rating_avg ?? 0,
    });

    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  async function handleStatusChange(newStatus: AdvisorStatus) {
    if (!user || statusUpdating) return;

    setStatusUpdating(true);
    const { error } = await supabase
      .from("advisor_profiles")
      .update({ status: newStatus })
      .eq("user_id", user.id);

    if (error) {
      toast.error("ステータスの更新に失敗しました");
    } else {
      setProfile((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
      toast.success("ステータスを更新しました");
    }
    setStatusUpdating(false);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#6B7280]">ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#1A1A2E]">
              ダッシュボード
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              リクエスト状況と実績を確認できます
            </p>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#6B7280]">現在のステータス:</span>
            {profile && <StatusBadge status={profile.status} />}
            <SelectField
              value={profile?.status ?? "accepting"}
              onValueChange={(val) => handleStatusChange(val as AdvisorStatus)}
              options={ADVISOR_STATUS_OPTIONS}
              placeholder="ステータスを選択"
              ariaLabel="ステータスを選択"
              disabled={statusUpdating}
              triggerClassName="w-36"
              className="w-36"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="stagger-children mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="今月の新規リクエスト"
            value={kpi.monthlyRequests}
            icon={ClipboardList}
            trend="件"
          />
          <KpiCard
            title="対応中の商談"
            value={kpi.activeDeals}
            icon={Handshake}
            trend="件"
          />
          <KpiCard
            title="累計マッチング"
            value={kpi.totalMatches}
            icon={CheckCircle2}
            trend="件"
          />
          <KpiCard
            title="平均評価"
            value={kpi.ratingAvg > 0 ? kpi.ratingAvg.toFixed(1) : "-"}
            icon={Star}
          />
        </div>

        {/* Incoming Requests */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-[#1A1A2E]">
            受信リクエスト
          </h2>
          {requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Image
                  src="/images/empty-inbox.png"
                  alt=""
                  width={180}
                  height={180}
                  className="pointer-events-none"
                />
                <p className="mt-4 text-[#6B7280]">
                  まだリクエストはありません
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="stagger-children grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((req) => (
                <Card
                  key={req.id}
                  className="card-hover cursor-pointer transition-shadow"
                  onClick={() => router.push(`/advisor/requests/${req.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-bold text-[#1A1A2E]">
                        {req.company_profile?.company_name ??
                          req.company?.display_name ??
                          "企業名不明"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {req.status === "pending" && (
                          <Badge className="bg-[#D42027] text-white border-transparent">
                            新着
                          </Badge>
                        )}
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {req.company_profile?.industry && (
                      <Badge
                        variant="secondary"
                        className="mb-2"
                      >
                        {req.company_profile.industry}
                      </Badge>
                    )}
                    <p className="line-clamp-2 text-sm text-[#6B7280]">
                      {req.consultation_content}
                    </p>
                    <p className="mt-3 text-xs text-[#6B7280]">
                      {formatDate(req.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
