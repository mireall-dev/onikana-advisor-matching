import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ChevronLeft, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/shared/rating-stars";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatHourlyRate, getInitials } from "@/lib/utils";
import type {
  AdvisorProfile,
  CompanyProfile,
  Review,
  User,
} from "@/types/database";
import { DetailTabs } from "./_components/detail-tabs";
import { RequestCta } from "./_components/request-cta";

type AdvisorWithUser = AdvisorProfile & { user: User };
type ReviewWithRelations = Review & {
  company: User;
  company_profile: CompanyProfile;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AdvisorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: advisorData } = await supabase
    .from("advisor_profiles")
    .select("*, user:users!user_id(*)")
    .eq("id", id)
    .single();

  if (!advisorData) {
    notFound();
  }

  const advisor = advisorData as unknown as AdvisorWithUser;

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select(
      "*, company:users!company_id(*), company_profile:company_profiles!company_id(*)"
    )
    .eq("advisor_id", advisor.user_id)
    .order("created_at", { ascending: false });

  const reviews = (reviewsData ?? []) as unknown as ReviewWithRelations[];
  const isAccepting = advisor.status === "accepting";

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="mx-auto max-w-[900px] px-4 py-8">
        {/* Back Link */}
        <Link
          href="/company/advisors"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#6B7280] transition-colors hover:text-[#0F569D]"
        >
          <ChevronLeft className="size-4" />
          顧問一覧に戻る
        </Link>

        {/* Header Section */}
        <div className="animate-fade-in-up rounded-xl bg-gradient-to-r from-[#E8F0FE] to-white p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <Avatar className="size-20 shrink-0 ring-2 ring-white">
                {advisor.user.avatar_url ? (
                  <AvatarImage
                    src={advisor.user.avatar_url}
                    alt={advisor.user.display_name}
                  />
                ) : null}
                <AvatarFallback className="bg-[#0F569D] text-xl font-semibold text-white">
                  {getInitials(advisor.user.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">
                  {advisor.user.display_name}
                </h1>
                {advisor.catchphrase && (
                  <p className="mt-1 text-[#6B7280]">{advisor.catchphrase}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StatusBadge status={advisor.status} />
                  <RatingStars
                    rating={advisor.rating_avg}
                    count={advisor.rating_count}
                    size="sm"
                  />
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-0.5 text-xs font-medium text-[#0F569D] ring-1 ring-[#0F569D]/20">
                    参考報酬 {formatHourlyRate(advisor.hourly_rate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden shrink-0 md:block">
              <RequestCta advisorId={advisor.id} accepting={isAccepting} />
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8">
          <DetailTabs
            reviewCount={reviews.length}
            profile={<ProfilePanel advisor={advisor} />}
            achievements={<AchievementsPanel advisor={advisor} />}
            reviews={<ReviewsPanel advisor={advisor} reviews={reviews} />}
          />
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="sticky bottom-0 z-40 border-t border-[#E5E7EB] bg-white/90 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur md:hidden">
        <RequestCta
          advisorId={advisor.id}
          accepting={isAccepting}
          variant="mobile"
        />
      </div>
    </div>
  );
}

function ProfilePanel({ advisor }: { advisor: AdvisorWithUser }) {
  return (
    <div className="mt-6 space-y-8">
      <TagList label="得意業界" items={advisor.industries} />
      <TagList label="得意営業領域" items={advisor.specialties} />
      <TagList label="対応エリア" items={advisor.areas} />
      <Section label="経歴サマリ" body={advisor.career_summary || "未記入"} />
      <Section label="紹介可能な人脈" body={advisor.connections || "未記入"} />
    </div>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A2E]">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="bg-[#E8F0FE] text-[#0F569D]"
            >
              {item}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-[#6B7280]">未設定</span>
        )}
      </div>
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A2E]">{label}</h3>
      <p className="whitespace-pre-wrap leading-relaxed text-[#1A1A2E]">
        {body}
      </p>
    </div>
  );
}

function AchievementsPanel({ advisor }: { advisor: AdvisorWithUser }) {
  if (!advisor.achievements || advisor.achievements.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center py-12">
        <Building2 className="mb-3 size-10 text-[#E5E7EB]" />
        <p className="text-[#6B7280]">支援実績はまだ登録されていません。</p>
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-4">
      {advisor.achievements.map((a, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FE]">
                <Building2 className="size-5 text-[#0F569D]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-[#1A1A2E]">{a.company}</h4>
                <p className="mt-1 text-sm text-[#6B7280]">{a.description}</p>
                {a.result && (
                  <div className="mt-3 flex items-center gap-2">
                    <Trophy className="size-4 text-[#B89B4A]" />
                    <span className="font-semibold text-[#B89B4A]">
                      {a.result}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReviewsPanel({
  advisor,
  reviews,
}: {
  advisor: AdvisorWithUser;
  reviews: ReviewWithRelations[];
}) {
  if (reviews.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center py-12">
        <p className="text-[#6B7280]">まだレビューはありません。</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-6 rounded-lg bg-white p-5 ring-1 ring-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1A1A2E]">
              {advisor.rating_avg.toFixed(1)}
            </p>
            <p className="text-sm text-[#6B7280]">平均評価</p>
          </div>
          <div>
            <RatingStars rating={advisor.rating_avg} size="lg" />
            <p className="mt-1 text-sm text-[#6B7280]">
              {reviews.length}件のレビュー
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-[#E8F0FE] text-xs font-medium text-[#0F569D]">
                      {review.company?.display_name
                        ? getInitials(review.company.display_name)
                        : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A2E]">
                      {review.company?.display_name ?? "匿名"}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <RatingStars rating={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p className="mt-3 leading-relaxed text-[#1A1A2E]">
                  {review.comment}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function NotFoundView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB]">
      <p className="text-lg font-medium text-[#1A1A2E]">
        顧問が見つかりませんでした
      </p>
      <Button
        variant="outline"
        className="mt-4"
        render={<Link href="/company/advisors" />}
      >
        <ChevronLeft className="mr-2 size-4" />
        一覧に戻る
      </Button>
    </div>
  );
}
