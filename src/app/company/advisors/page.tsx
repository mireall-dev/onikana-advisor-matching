import Image from "next/image";
import { Button } from "@/components/ui/button";


import { AdvisorCard } from "@/components/shared/advisor-card";
import { createClient } from "@/lib/supabase/server";
import {
  ActiveFilterChips,
  DesktopSidebar,
  HeaderActions,
  type FilterValues,
} from "./_components/filter-panel";
import type { AdvisorProfile, User } from "@/types/database";
import { INDUSTRIES, SPECIALTIES, AREAS } from "@/types/database";

type AdvisorWithUser = AdvisorProfile & { user: User };

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function parseFilters(sp: {
  [key: string]: string | string[] | undefined;
}): FilterValues {
  const keyword = typeof sp.keyword === "string" ? sp.keyword : "";
  const industries = asArray(sp.industry).filter((x) =>
    (INDUSTRIES as readonly string[]).includes(x)
  );
  const specialties = asArray(sp.specialty).filter((x) =>
    (SPECIALTIES as readonly string[]).includes(x)
  );
  const areas = asArray(sp.area).filter((x) =>
    (AREAS as readonly string[]).includes(x)
  );
  const acceptingOnly = sp.accepting === "1";
  const sortBy = typeof sp.sort === "string" ? sp.sort : "rating";

  return {
    keyword,
    industries,
    specialties,
    areas,
    acceptingOnly,
    sortBy,
  };
}

const SORT_CONFIG: Record<string, { col: string; asc: boolean }> = {
  rating: { col: "rating_avg", asc: false },
  newest: { col: "created_at", asc: false },
  rate_asc: { col: "hourly_rate", asc: true },
  rate_desc: { col: "hourly_rate", asc: false },
};

async function loadAdvisors(filters: FilterValues): Promise<AdvisorWithUser[]> {
  const supabase = await createClient();
  let query = supabase
    .from("advisor_profiles")
    .select("*, user:users!user_id(*)")
    .eq("approval_status", "approved");

  if (filters.keyword) {
    query = query.or(
      `catchphrase.ilike.%${filters.keyword}%,career_summary.ilike.%${filters.keyword}%`
    );
  }
  for (const ind of filters.industries) query = query.contains("industries", [ind]);
  for (const sp of filters.specialties) query = query.contains("specialties", [sp]);
  for (const a of filters.areas) query = query.contains("areas", [a]);
  if (filters.acceptingOnly) query = query.eq("status", "accepting");

  const sort = SORT_CONFIG[filters.sortBy] ?? SORT_CONFIG.rating;
  query = query.order(sort.col, { ascending: sort.asc });

  const { data } = await query;
  return (data ?? []) as unknown as AdvisorWithUser[];
}

export default async function AdvisorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const advisors = await loadAdvisors(filters);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="mx-auto flex max-w-[1200px] gap-8 px-4 py-8">
        <DesktopSidebar initial={filters} />

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div>
              {filters.keyword && (
                <p className="mb-1 text-sm text-[#6B7280]">
                  「{filters.keyword}」の検索結果
                </p>
              )}
              <h1 className="text-lg font-semibold text-[#1A1A2E]">
                検索結果: {advisors.length}件
              </h1>
            </div>
            <HeaderActions initial={filters} />
          </div>

          <ActiveFilterChips initial={filters} />

          {advisors.length > 0 ? (
            <div className="stagger-children grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {advisors.map((advisor) => (
                <div key={advisor.id} className="animate-fade-in-up">
                  <AdvisorCard advisor={advisor} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
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
      <form>
        <Button
          type="submit"
          variant="outline"
          className="mt-4"
          formAction="/company/advisors"
        >
          フィルターをクリア
        </Button>
      </form>
    </div>
  );
}
