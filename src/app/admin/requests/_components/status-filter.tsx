"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SelectField } from "@/components/shared/select-field";

export type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "申請中" },
  { value: "approved", label: "承認済" },
  { value: "rejected", label: "見送り" },
] as const;

export function RequestStatusFilter({ active }: { active: StatusFilter }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setActive(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === "all") sp.delete("status");
    else sp.set("status", value);
    const qs = sp.toString();
    startTransition(() => {
      router.push(`/admin/requests${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <SelectField
      value={active}
      onValueChange={setActive}
      options={STATUS_OPTIONS}
      placeholder="ステータスで絞り込み"
      ariaLabel="ステータスで絞り込み"
      triggerClassName="w-[160px]"
      className="w-[160px]"
    />
  );
}
