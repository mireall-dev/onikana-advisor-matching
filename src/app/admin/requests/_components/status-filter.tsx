"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StatusFilter = "all" | "pending" | "approved" | "rejected";

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
    <Select
      value={active}
      onValueChange={(val) => {
        if (val !== null) setActive(val);
      }}
    >
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="ステータスで絞り込み" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">すべて</SelectItem>
        <SelectItem value="pending">申請中</SelectItem>
        <SelectItem value="approved">承認済</SelectItem>
        <SelectItem value="rejected">見送り</SelectItem>
      </SelectContent>
    </Select>
  );
}
