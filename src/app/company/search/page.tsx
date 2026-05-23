"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdvisorCard } from "@/components/shared/advisor-card";
import { EmptyState } from "@/components/shared/states";
import {
  SelectField,
  type SelectFieldOption,
} from "@/components/shared/select-field";
import type { AdvisorProfile, User } from "@/types/database";
import { INDUSTRIES, SPECIALTIES, AREAS } from "@/types/database";

const ALL = "__all__";

function buildOptions(items: readonly string[]): SelectFieldOption[] {
  return [{ value: ALL, label: "すべて" }, ...items.map((v) => ({ value: v, label: v }))];
}

const INDUSTRY_OPTIONS = buildOptions(INDUSTRIES);
const SPECIALTY_OPTIONS = buildOptions(SPECIALTIES);
const AREA_OPTIONS = buildOptions(AREAS);

type AdvisorWithUser = AdvisorProfile & { user: User };

export default function SearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [area, setArea] = useState("");
  const [recommended, setRecommended] = useState<AdvisorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = useMemo(
    () => [industry, specialty, area].filter(Boolean).length,
    [industry, specialty, area]
  );

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
          <div className="mx-auto mt-10 max-w-4xl rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB] sm:p-6">
            {/* Mobile: keyword + filter sheet trigger + search */}
            <div className="flex flex-col gap-3 md:hidden">
              <label className="block text-sm font-medium text-[#1A1A2E]" htmlFor="search-keyword-mobile">
                キーワード
              </label>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
                <Input
                  id="search-keyword-mobile"
                  placeholder="キーワードで検索..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        variant="outline"
                        className="flex-1 justify-center gap-2"
                      />
                    }
                  >
                    <SlidersHorizontal aria-hidden="true" className="size-4" />
                    絞り込み
                    {activeFilterCount > 0 && (
                      <Badge className="ml-1 bg-[#0F569D] text-white">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl p-0">
                    <SheetHeader className="border-b border-[#E5E7EB] px-5 py-4">
                      <SheetTitle className="text-left">絞り込み</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 px-5 py-4">
                      <FilterRow
                        label="業界"
                        value={industry}
                        onChange={setIndustry}
                        options={INDUSTRY_OPTIONS}
                      />
                      <FilterRow
                        label="営業領域"
                        value={specialty}
                        onChange={setSpecialty}
                        options={SPECIALTY_OPTIONS}
                      />
                      <FilterRow
                        label="エリア"
                        value={area}
                        onChange={setArea}
                        options={AREA_OPTIONS}
                      />
                    </div>
                    <div className="flex items-center gap-2 border-t border-[#E5E7EB] px-5 py-4">
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => {
                          setIndustry("");
                          setSpecialty("");
                          setArea("");
                        }}
                      >
                        クリア
                      </Button>
                      <SheetClose
                        render={
                          <Button className="flex-1 bg-[#0F569D] text-white hover:bg-[#0A3D6E]" />
                        }
                      >
                        この条件で適用
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
                <Button
                  onClick={handleSearch}
                  className="flex-1 bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                >
                  <Search aria-hidden="true" className="mr-2 size-4" />
                  検索
                </Button>
              </div>
            </div>

            {/* Desktop: full row */}
            <div className="hidden md:flex md:flex-row md:items-end md:gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-[#1A1A2E]" htmlFor="search-keyword">
                  キーワード
                </label>
                <div className="relative">
                  <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
                  <Input
                    id="search-keyword"
                    placeholder="キーワードで検索..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9"
                  />
                </div>
              </div>

              <FilterRow
                label="業界"
                value={industry}
                onChange={setIndustry}
                options={INDUSTRY_OPTIONS}
                className="min-w-[140px]"
              />
              <FilterRow
                label="営業領域"
                value={specialty}
                onChange={setSpecialty}
                options={SPECIALTY_OPTIONS}
                className="min-w-[160px]"
              />
              <FilterRow
                label="エリア"
                value={area}
                onChange={setArea}
                options={AREA_OPTIONS}
                className="min-w-[140px]"
              />

              <Button
                onClick={handleSearch}
                className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
              >
                <Search aria-hidden="true" className="mr-2 size-4" />
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
          <EmptyState
            variant="search"
            title="現在おすすめの顧問がいません"
            description="しばらくしてから再度ご確認ください"
            className="mt-8"
          />
        )}
      </section>
    </div>
  );
}

function FilterRow({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly SelectFieldOption[];
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-[#1A1A2E]">
        {label}
      </label>
      <SelectField
        value={value || ALL}
        onValueChange={(val) => onChange(val === ALL ? "" : val)}
        options={options}
        placeholder="すべて"
        ariaLabel={label}
      />
    </div>
  );
}
