"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvisorCard } from "@/components/shared/advisor-card";
import type { AdvisorProfile, User } from "@/types/database";
import { INDUSTRIES, SPECIALTIES, AREAS } from "@/types/database";

type AdvisorWithUser = AdvisorProfile & { user: User };

export default function SearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [area, setArea] = useState("");
  const [recommended, setRecommended] = useState<AdvisorWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommended() {
      const supabase = createClient();
      const { data } = await supabase
        .from("advisor_profiles")
        .select("*, user:users!user_id(*)")
        .eq("approval_status", "approved")
        .eq("status", "accepting")
        .order("rating_avg", { ascending: false })
        .limit(4);

      if (data) {
        setRecommended(data as AdvisorWithUser[]);
      }
      setLoading(false);
    }

    fetchRecommended();
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (industry) params.set("industry", industry);
    if (specialty) params.set("specialty", specialty);
    if (area) params.set("area", area);

    const queryString = params.toString();
    router.push(`/company/advisors${queryString ? `?${queryString}` : ""}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#E8F0FE] to-white py-16">
        <div className="mx-auto max-w-[1200px] px-4">
          <h1 className="text-center text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            あなたのビジネスに
            <span className="relative inline-block">
              <span className="relative z-10">最適な営業顧問</span>
              <span className="absolute bottom-0 left-0 z-0 h-3 w-full bg-[#B89B4A]/20" />
            </span>
            を見つけよう
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#6B7280]">
            業界・営業領域・エリアから、あなたの課題に合った顧問を検索できます。
          </p>

          {/* Search Form */}
          <div className="mx-auto mt-10 max-w-4xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#E5E7EB]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-[#1A1A2E]">
                  キーワード
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
                  <Input
                    placeholder="キーワードで検索..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="min-w-[140px]">
                <label className="mb-1.5 block text-sm font-medium text-[#1A1A2E]">
                  業界
                </label>
                <Select
                  value={industry}
                  onValueChange={(val) => setIndustry(val === "__all__" ? "" : val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">すべて</SelectItem>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-sm font-medium text-[#1A1A2E]">
                  営業領域
                </label>
                <Select
                  value={specialty}
                  onValueChange={(val) => setSpecialty(val === "__all__" ? "" : val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">すべて</SelectItem>
                    {SPECIALTIES.map((sp) => (
                      <SelectItem key={sp} value={sp}>
                        {sp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px]">
                <label className="mb-1.5 block text-sm font-medium text-[#1A1A2E]">
                  エリア
                </label>
                <Select
                  value={area}
                  onValueChange={(val) => setArea(val === "__all__" ? "" : val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">すべて</SelectItem>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSearch}
                className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
              >
                <Search className="mr-2 size-4" />
                検索
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Advisors */}
      <section className="mx-auto max-w-[1200px] px-4 py-16">
        <h2 className="text-2xl font-bold text-[#1A1A2E]">
          <span className="relative inline-block">
            <span className="relative z-10">おすすめの顧問</span>
            <span className="absolute bottom-0 left-0 z-0 h-3 w-full bg-[#B89B4A]/20" />
          </span>
        </h2>
        <p className="mt-2 text-[#6B7280]">
          高評価の顧問をご紹介します。
        </p>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-[220px] animate-pulse rounded-xl bg-[#E5E7EB]"
              />
            ))}
          </div>
        ) : recommended.length > 0 ? (
          <div className="stagger-children mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recommended.map((advisor) => (
              <div key={advisor.id} className="animate-fade-in-up">
                <AdvisorCard advisor={advisor} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-[#6B7280]">
            現在おすすめの顧問がいません。
          </p>
        )}
      </section>
    </div>
  );
}
