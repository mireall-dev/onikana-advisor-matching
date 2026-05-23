"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export type ApprovalTab = "pending" | "approved" | "rejected";

export function ApprovalTabs({
  active,
  counts,
}: {
  active: ApprovalTab;
  counts: Record<ApprovalTab, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setActive(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === "pending") sp.delete("tab");
    else sp.set("tab", value);
    const qs = sp.toString();
    startTransition(() => {
      router.push(`/admin/approvals${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList>
        <TabsTrigger value="pending">
          承認待ち
          {counts.pending > 0 && (
            <Badge className="ml-1.5 bg-[#D97706] text-white text-xs">
              {counts.pending}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="approved">
          承認済
          <span className="ml-1.5 text-xs text-[#6B7280]">({counts.approved})</span>
        </TabsTrigger>
        <TabsTrigger value="rejected">
          却下
          <span className="ml-1.5 text-xs text-[#6B7280]">({counts.rejected})</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
