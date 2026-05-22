"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdvisorCard } from "@/components/shared/advisor-card";
import type { AdvisorProfile, User } from "@/types/database";
import { INDUSTRIES, SPECIALTIES, AREAS } from "@/types/database";

type AdvisorWithUser = AdvisorProfile & { user: User };

interface FilterState {
  industries: string[];
  specialties: string[];
  areas: string[];
  acceptingOnly: boolean;
}

function FilterSection({
  filters,
  onFiltersChange,
  onClear,
}: {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClear: () => void;
}) {
  function toggleIndustry(ind: string) {
    const next = filters.industries.includes(ind)
      ? filters.industries.filter((i) => i !== ind)
      : [...filters.industries, ind];
    onFiltersChange({ ...filters, industries: next });
  }

  function toggleSpecialty(sp: string) {
    const next = filters.specialties.includes(sp)
      ? filters.specialties.filter((s) => s !== sp)
      : [...filters.specialties, sp];
    onFiltersChange({ ...filters, specialties: next });
  }

  function toggleArea(a: string) {
    const next = filters.areas.includes(a)
      ? filters.areas.filter((ar) => ar !== a)
      : [...filters.areas, a];
    onFiltersChange({ ...filters, areas: next });
  }

  return (
    <div className="space-y-6">
      {/* Industry Filter */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#1A1A2E]">業界</h3>
        <div className="space-y-2">
          {INDUSTRIES.map((ind) => (
            <label
              key={ind}
              className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A2E]"
            >
              <Checkbox
                checked={filters.industries.includes(ind)}
                onCheckedChange={() => toggleIndustry(ind)}
              />
              {ind}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Specialty Filter */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#1A1A2E]">営業領域</h3>
        <div className="space-y-2">
          {SPECIALTIES.map((sp) => (
            <label
              key={sp}
              className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A2E]"
            >
              <Checkbox
                checked={filters.specialties.includes(sp)}
                onCheckedChange={() => toggleSpecialty(sp)}
              />
              {sp}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Area Filter */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#1A1A2E]">エリア</h3>
        <div className="space-y-2">
          {AREAS.map((a) => (
            <label
              key={a}
              className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A2E]"
            >
              <Checkbox
                checked={filters.areas.includes(a)}
                onCheckedChange={() => toggleArea(a)}
              />
              {a}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Status Filter */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#1A1A2E]">ステータス</h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A2E]">
          <Checkbox
            checked={filters.acceptingOnly}
            onCheckedChange={(checked) =>
              onFiltersChange({
                ...filters,
                acceptingOnly: checked === true,
              })
            }
          />
          受付中のみ
        </label>
      </div>

      <Separator />

      <Button
        variant="outline"
        className="w-full"
        onClick={onClear}
      >
        <X className="mr-2 size-4" />
        フィルタークリア
      </Button>
    </div>
  );
}

export default function AdvisorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const keywordParam = searchParams.get("keyword") ?? "";
  const industryParam = searchParams.get("industry") ?? "";
  const specialtyParam = searchParams.get("specialty") ?? "";
  const areaParam = searchParams.get("area") ?? "";

  const [advisors, setAdvisors] = useState<AdvisorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("rating");
  const [filters, setFilters] = useState<FilterState>({
    industries: industryParam ? [industryParam] : [],
    specialties: specialtyParam ? [specialtyParam] : [],
    areas: areaParam ? [areaParam] : [],
    acceptingOnly: false,
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchAdvisors = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("advisor_profiles")
      .select("*, user:users!user_id(*)")
      .eq("approval_status", "approved");

    // Keyword filter
    if (keywordParam) {
      query = query.or(
        `catchphrase.ilike.%${keywordParam}%,career_summary.ilike.%${keywordParam}%`
      );
    }

    // Industry filter
    if (filters.industries.length > 0) {
      for (const ind of filters.industries) {
        query = query.contains("industries", [ind]);
      }
    }

    // Specialty filter
    if (filters.specialties.length > 0) {
      for (const sp of filters.specialties) {
        query = query.contains("specialties", [sp]);
      }
    }

    // Area filter
    if (filters.areas.length > 0) {
      for (const a of filters.areas) {
        query = query.contains("areas", [a]);
      }
    }

    // Status filter
    if (filters.acceptingOnly) {
      query = query.eq("status", "accepting");
    }

    // Sort
    const sortConfig: Record<string, { col: string; asc: boolean }> = {
      rating: { col: "rating_avg", asc: false },
      newest: { col: "created_at", asc: false },
      rate_asc: { col: "hourly_rate", asc: true },
      rate_desc: { col: "hourly_rate", asc: false },
    };
    const sort = sortConfig[sortBy] ?? sortConfig.rating;
    query = query.order(sort.col, { ascending: sort.asc });

    const { data } = await query;

    if (data) {
      setAdvisors(data as AdvisorWithUser[]);
    }
    setLoading(false);
  }, [keywordParam, filters, sortBy]);

  useEffect(() => {
    fetchAdvisors();
  }, [fetchAdvisors]);

  const activeFilterCount =
    filters.industries.length +
    filters.specialties.length +
    filters.areas.length +
    (filters.acceptingOnly ? 1 : 0);

  function clearFilters() {
    setFilters({
      industries: [],
      specialties: [],
      areas: [],
      acceptingOnly: false,
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="mx-auto flex max-w-[1200px] gap-8 px-4 py-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1A1A2E]">
              <Filter className="size-4" />
              フィルター
            </h2>
            <FilterSection
              filters={filters}
              onFiltersChange={setFilters}
              onClear={clearFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              {keywordParam && (
                <p className="mb-1 text-sm text-[#6B7280]">
                  「{keywordParam}」の検索結果
                </p>
              )}
              <h1 className="text-lg font-semibold text-[#1A1A2E]">
                検索結果: {loading ? "..." : `${advisors.length}件`}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <Sheet
                open={mobileFilterOpen}
                onOpenChange={setMobileFilterOpen}
              >
                <SheetTrigger
                  render={
                    <Button variant="outline" size="sm" className="lg:hidden" />
                  }
                >
                  <SlidersHorizontal className="mr-2 size-4" />
                  フィルター
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#0F569D] text-[10px] font-semibold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto p-5">
                  <SheetHeader>
                    <SheetTitle>フィルター</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FilterSection
                      filters={filters}
                      onFiltersChange={(f) => {
                        setFilters(f);
                      }}
                      onClear={() => {
                        clearFilters();
                        setMobileFilterOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? "rating")}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">評価順</SelectItem>
                  <SelectItem value="newest">新着順</SelectItem>
                  <SelectItem value="rate_asc">時給安い順</SelectItem>
                  <SelectItem value="rate_desc">時給高い順</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#6B7280]">適用中:</span>
              {filters.industries.map((ind) => (
                <button
                  key={`ind-${ind}`}
                  type="button"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      industries: filters.industries.filter((i) => i !== ind),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FE] px-3 py-1 text-xs font-medium text-[#0F569D] hover:bg-[#D5E3FC]"
                >
                  業界: {ind}
                  <X className="size-3" />
                </button>
              ))}
              {filters.specialties.map((sp) => (
                <button
                  key={`sp-${sp}`}
                  type="button"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      specialties: filters.specialties.filter((s) => s !== sp),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FE] px-3 py-1 text-xs font-medium text-[#0F569D] hover:bg-[#D5E3FC]"
                >
                  領域: {sp}
                  <X className="size-3" />
                </button>
              ))}
              {filters.areas.map((a) => (
                <button
                  key={`area-${a}`}
                  type="button"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      areas: filters.areas.filter((ar) => ar !== a),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FE] px-3 py-1 text-xs font-medium text-[#0F569D] hover:bg-[#D5E3FC]"
                >
                  エリア: {a}
                  <X className="size-3" />
                </button>
              ))}
              {filters.acceptingOnly && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters({ ...filters, acceptingOnly: false })
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FE] px-3 py-1 text-xs font-medium text-[#0F569D] hover:bg-[#D5E3FC]"
                >
                  受付中のみ
                  <X className="size-3" />
                </button>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="ml-1 text-xs text-[#6B7280] underline-offset-2 hover:underline"
              >
                すべて解除
              </button>
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="h-[220px] animate-pulse rounded-xl bg-[#E5E7EB]"
                />
              ))}
            </div>
          ) : advisors.length > 0 ? (
            <div className="stagger-children grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {advisors.map((advisor) => (
                <div key={advisor.id} className="animate-fade-in-up">
                  <AdvisorCard advisor={advisor} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Image
                src="/images/empty-search.png"
                alt=""
                width={180}
                height={180}
                className="pointer-events-none"
              />
              <p className="mt-4 text-lg font-medium text-[#1A1A2E]">
                条件に一致する顧問が見つかりませんでした
              </p>
              <p className="mt-2 text-sm text-[#6B7280]">
                検索条件を変更して再度お試しください。
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                フィルターをクリア
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
