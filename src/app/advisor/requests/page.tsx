"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  MeetingRequest,
  CompanyProfile,
} from "@/types/database";

type RequestWithCompany = Omit<MeetingRequest, "company_profile"> & {
  company_profile?: CompanyProfile | null;
};

type TabValue = "all" | "pending" | "approved" | "rejected";

export default function AdvisorRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [requests, setRequests] = useState<RequestWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data: requestsData } = await supabase
      .from("meeting_requests")
      .select("*, company:users!company_id(*)")
      .eq("advisor_id", user.id)
      .order("created_at", { ascending: false });

    if (requestsData) {
      const companyIds = [
        ...new Set(
          requestsData.map((r: MeetingRequest) => r.company_id)
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

        const enriched = requestsData.map((req: MeetingRequest) => ({
          ...req,
          company_profile: profileMap.get(req.company_id) ?? null,
        }));

        setRequests(enriched as RequestWithCompany[]);
      } else {
        setRequests(requestsData as RequestWithCompany[]);
      }
    }

    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchRequests();
    }
  }, [authLoading, user, fetchRequests]);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }

  function filterByStatus(status: TabValue): RequestWithCompany[] {
    if (status === "all") return requests;
    return requests.filter((r) => r.status === status);
  }

  function getTabCount(status: TabValue): number {
    if (status === "all") return requests.length;
    return requests.filter((r) => r.status === status).length;
  }

  function renderRequestCards(items: RequestWithCompany[], emptyLabel: string) {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Image
              src="/images/empty-inbox.png"
              alt=""
              width={180}
              height={180}
              className="pointer-events-none"
            />
            <p className="mt-4 text-[#6B7280]">{emptyLabel}</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="stagger-children grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((req) => (
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
                    <Badge className="border-transparent bg-[#D42027] text-white">
                      新着
                    </Badge>
                  )}
                  <StatusBadge status={req.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {req.company_profile?.industry && (
                <Badge variant="secondary" className="mb-2">
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
    );
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
        <h1 className="mb-6 font-heading text-2xl font-bold text-[#1A1A2E]">
          リクエスト一覧
        </h1>

        <Tabs
          defaultValue="all"
          onValueChange={(val) => setActiveTab(val as TabValue)}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              すべて ({getTabCount("all")})
            </TabsTrigger>
            <TabsTrigger value="pending">
              申請中 ({getTabCount("pending")})
            </TabsTrigger>
            <TabsTrigger value="approved">
              承認済 ({getTabCount("approved")})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              見送り ({getTabCount("rejected")})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderRequestCards(
              filterByStatus("all"),
              "リクエストはありません"
            )}
          </TabsContent>
          <TabsContent value="pending">
            {renderRequestCards(
              filterByStatus("pending"),
              "申請中のリクエストはありません"
            )}
          </TabsContent>
          <TabsContent value="approved">
            {renderRequestCards(
              filterByStatus("approved"),
              "承認済のリクエストはありません"
            )}
          </TabsContent>
          <TabsContent value="rejected">
            {renderRequestCards(
              filterByStatus("rejected"),
              "見送りのリクエストはありません"
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
