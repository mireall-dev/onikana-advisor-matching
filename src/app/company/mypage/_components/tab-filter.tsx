"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabValue = "all" | "pending" | "approved" | "rejected";

export function TabFilter({
  active,
  counts,
}: {
  active: TabValue;
  counts: Record<TabValue, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setActive(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === "all") sp.delete("tab");
    else sp.set("tab", value);
    const qs = sp.toString();
    startTransition(() => {
      router.push(`/company/mypage${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList variant="line">
        <TabsTrigger value="all">すべて ({counts.all})</TabsTrigger>
        <TabsTrigger value="pending">申請中 ({counts.pending})</TabsTrigger>
        <TabsTrigger value="approved">承認済 ({counts.approved})</TabsTrigger>
        <TabsTrigger value="rejected">見送り ({counts.rejected})</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
