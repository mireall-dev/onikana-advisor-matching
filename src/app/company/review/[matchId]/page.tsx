"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/shared/rating-stars";
import type { Match, User, AdvisorProfile } from "@/types/database";

type MatchWithRelations = Match & {
  advisor: User;
  advisor_profile: AdvisorProfile;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [match, setMatch] = useState<MatchWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function fetchMatch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("matches")
        .select(
          "*, advisor:users!advisor_id(*), advisor_profile:advisor_profiles!advisor_id(*)"
        )
        .eq("id", matchId)
        .single();

      if (data) {
        setMatch(data as MatchWithRelations);
      }
      setLoading(false);
    }

    fetchMatch();
  }, [matchId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      toast.error("ログインが必要です。");
      return;
    }

    if (!match) {
      toast.error("マッチ情報の取得に失敗しました。");
      return;
    }

    if (rating === 0) {
      toast.error("評価を選択してください。");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      // Check for existing review
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("match_id", matchId)
        .eq("company_id", user.id)
        .limit(1);

      if (existingReview && existingReview.length > 0) {
        toast.error("このマッチングには既にレビューを投稿済みです。");
        setSubmitting(false);
        return;
      }

      // Insert review
      const { error } = await supabase.from("reviews").insert({
        match_id: matchId,
        company_id: user.id,
        advisor_id: match.advisor_id,
        rating,
        comment: comment.trim(),
      });

      if (error) throw error;

      // Update advisor's rating_avg and rating_count
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("advisor_id", match.advisor_id);

      if (allReviews && allReviews.length > 0) {
        const totalRating = allReviews.reduce(
          (sum, r) => sum + r.rating,
          0
        );
        const avgRating = totalRating / allReviews.length;

        await supabase
          .from("advisor_profiles")
          .update({
            rating_avg: Math.round(avgRating * 10) / 10,
            rating_count: allReviews.length,
          })
          .eq("user_id", match.advisor_id);
      }

      toast.success("レビューを投稿しました。ありがとうございます!");
      router.push("/company/mypage");
    } catch (err) {
      toast.error("レビューの投稿に失敗しました。再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="h-[400px] animate-pulse rounded-xl bg-[#E5E7EB]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB]">
        <p className="text-lg font-medium text-[#1A1A2E]">
          ログインが必要です。
        </p>
        <Button
          className="mt-4 bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
          onClick={() => router.push("/login")}
        >
          ログイン
        </Button>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB]">
        <p className="text-lg font-medium text-[#1A1A2E]">
          マッチ情報が見つかりませんでした。
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/company/mypage")}
        >
          <ChevronLeft className="mr-2 size-4" />
          マイページに戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Back Link */}
        <Link
          href="/company/mypage"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#6B7280] transition-colors hover:text-[#0F569D]"
        >
          <ChevronLeft className="size-4" />
          マイページに戻る
        </Link>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-xl">レビューを投稿</CardTitle>
            <CardDescription>
              顧問との面談はいかがでしたか? 評価とコメントをお聞かせください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Advisor Info */}
            <div className="mb-6 flex items-center gap-4 rounded-lg bg-[#F8F9FB] p-4">
              <Avatar className="size-14 shrink-0">
                {match.advisor?.avatar_url ? (
                  <AvatarImage
                    src={match.advisor.avatar_url}
                    alt={match.advisor.display_name}
                  />
                ) : null}
                <AvatarFallback className="bg-[#0F569D] text-base font-semibold text-white">
                  {match.advisor
                    ? getInitials(match.advisor.display_name)
                    : "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-[#1A1A2E]">
                  {match.advisor?.display_name ?? "不明"}
                </p>
                {match.advisor_profile?.catchphrase && (
                  <p className="mt-0.5 text-sm text-[#6B7280]">
                    {match.advisor_profile.catchphrase}
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <Label className="mb-2 block text-sm font-medium text-[#1A1A2E]">
                  評価 <span className="text-[#D42027]">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <RatingStars
                    rating={rating}
                    interactive
                    onChange={setRating}
                    size="lg"
                  />
                  {rating > 0 && (
                    <span className="text-sm font-medium text-[#B89B4A]">
                      {rating}.0
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div>
                <Label
                  htmlFor="comment"
                  className="text-sm font-medium text-[#1A1A2E]"
                >
                  コメント
                </Label>
                <Textarea
                  id="comment"
                  rows={5}
                  placeholder="面談の感想やフィードバックをお書きください..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    送信中...
                  </span>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    レビューを投稿
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
