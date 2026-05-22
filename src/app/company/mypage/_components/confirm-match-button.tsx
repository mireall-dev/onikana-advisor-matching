"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmMatch } from "../actions";

export function ConfirmMatchButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await confirmMatch(matchId);
      if (result.ok) {
        toast.success("マッチ完了を確認しました。");
      } else {
        toast.error(result.error ?? "エラーが発生しました。");
      }
    });
  }

  return (
    <Button
      size="sm"
      className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
      disabled={isPending}
      onClick={onClick}
    >
      {isPending ? (
        <span className="flex items-center gap-1.5">
          <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          確認中...
        </span>
      ) : (
        <>
          <CalendarCheck className="mr-1.5 size-3.5" />
          マッチ完了
        </>
      )}
    </Button>
  );
}
