"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";
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
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { INDUSTRIES, SPECIALTIES, AREAS } from "@/types/database";

export interface FilterValues {
  industries: string[];
  specialties: string[];
  areas: string[];
  acceptingOnly: boolean;
  keyword: string;
  sortBy: string;
}

function toQueryString(v: FilterValues): string {
  const sp = new URLSearchParams();
  if (v.keyword) sp.set("keyword", v.keyword);
  for (const i of v.industries) sp.append("industry", i);
  for (const s of v.specialties) sp.append("specialty", s);
  for (const a of v.areas) sp.append("area", a);
  if (v.acceptingOnly) sp.set("accepting", "1");
  if (v.sortBy && v.sortBy !== "rating") sp.set("sort", v.sortBy);
  return sp.toString();
}

function activeCountOf(v: FilterValues): number {
  return (
    v.industries.length +
    v.specialties.length +
    v.areas.length +
    (v.acceptingOnly ? 1 : 0)
  );
}

function FilterControls({
  current,
  onUpdate,
  onClear,
}: {
  current: FilterValues;
  onUpdate: (next: FilterValues) => void;
  onClear: () => void;
}) {
  function toggle<K extends "industries" | "specialties" | "areas">(
    key: K,
    item: string
  ) {
    const arr = current[key];
    const next = arr.includes(item)
      ? arr.filter((x) => x !== item)
      : [...arr, item];
    onUpdate({ ...current, [key]: next });
  }

  return (
    <div className="space-y-6">
      <FilterGroup label="業界">
        {INDUSTRIES.map((ind) => (
          <CheckRow
            key={ind}
            label={ind}
            checked={current.industries.includes(ind)}
            onToggle={() => toggle("industries", ind)}
          />
        ))}
      </FilterGroup>

      <Separator />

      <FilterGroup label="営業領域">
        {SPECIALTIES.map((sp) => (
          <CheckRow
            key={sp}
            label={sp}
            checked={current.specialties.includes(sp)}
            onToggle={() => toggle("specialties", sp)}
          />
        ))}
      </FilterGroup>

      <Separator />

      <FilterGroup label="エリア">
        {AREAS.map((a) => (
          <CheckRow
            key={a}
            label={a}
            checked={current.areas.includes(a)}
            onToggle={() => toggle("areas", a)}
          />
        ))}
      </FilterGroup>

      <Separator />

      <FilterGroup label="ステータス">
        <CheckRow
          label="受付中のみ"
          checked={current.acceptingOnly}
          onToggle={() =>
            onUpdate({ ...current, acceptingOnly: !current.acceptingOnly })
          }
        />
      </FilterGroup>

      <Separator />

      <Button variant="outline" className="w-full" onClick={onClear}>
        <X className="mr-2 size-4" />
        フィルタークリア
      </Button>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[#1A1A2E]">{label}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A2E]">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      {label}
    </label>
  );
}

function useFilterRouter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function push(next: FilterValues) {
    const qs = toQueryString(next);
    startTransition(() => {
      router.push(`/company/advisors${qs ? `?${qs}` : ""}`);
    });
  }

  return { push, isPending };
}

const EMPTY_FILTERS: FilterValues = {
  industries: [],
  specialties: [],
  areas: [],
  acceptingOnly: false,
  keyword: "",
  sortBy: "rating",
};

export function DesktopSidebar({ initial }: { initial: FilterValues }) {
  const { push, isPending } = useFilterRouter();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1A1A2E]">
          <Filter className="size-4" />
          フィルター
          {isPending && (
            <span className="ml-auto text-xs text-[#6B7280]">更新中…</span>
          )}
        </h2>
        <FilterControls
          current={initial}
          onUpdate={push}
          onClear={() => push({ ...EMPTY_FILTERS, keyword: initial.keyword })}
        />
      </div>
    </aside>
  );
}

export function HeaderActions({ initial }: { initial: FilterValues }) {
  const { push } = useFilterRouter();
  const activeCount = activeCountOf(initial);

  return (
    <div className="flex items-center gap-3">
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="outline" size="sm" className="lg:hidden" />
          }
        >
          <SlidersHorizontal className="mr-2 size-4" />
          フィルター
          {activeCount > 0 && (
            <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#0F569D] text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto p-5">
          <SheetHeader>
            <SheetTitle>フィルター</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <FilterControls
              current={initial}
              onUpdate={push}
              onClear={() =>
                push({ ...EMPTY_FILTERS, keyword: initial.keyword })
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      <Select
        value={initial.sortBy}
        onValueChange={(val) => push({ ...initial, sortBy: val ?? "rating" })}
      >
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
  );
}

export function ActiveFilterChips({ initial }: { initial: FilterValues }) {
  const { push } = useFilterRouter();

  function removeFromArray<K extends "industries" | "specialties" | "areas">(
    key: K,
    item: string
  ) {
    push({ ...initial, [key]: initial[key].filter((x) => x !== item) });
  }

  if (activeCountOf(initial) === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-xs text-[#6B7280]">適用中:</span>
      {initial.industries.map((ind) => (
        <Chip
          key={`ind-${ind}`}
          label={`業界: ${ind}`}
          onRemove={() => removeFromArray("industries", ind)}
        />
      ))}
      {initial.specialties.map((sp) => (
        <Chip
          key={`sp-${sp}`}
          label={`領域: ${sp}`}
          onRemove={() => removeFromArray("specialties", sp)}
        />
      ))}
      {initial.areas.map((a) => (
        <Chip
          key={`area-${a}`}
          label={`エリア: ${a}`}
          onRemove={() => removeFromArray("areas", a)}
        />
      ))}
      {initial.acceptingOnly && (
        <Chip
          label="受付中のみ"
          onRemove={() => push({ ...initial, acceptingOnly: false })}
        />
      )}
      <button
        type="button"
        onClick={() => push({ ...EMPTY_FILTERS, keyword: initial.keyword })}
        className="ml-1 text-xs text-[#6B7280] underline-offset-2 hover:underline"
      >
        すべて解除
      </button>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FE] px-3 py-1 text-xs font-medium text-[#0F569D] hover:bg-[#D5E3FC]"
    >
      {label}
      <X className="size-3" />
    </button>
  );
}
