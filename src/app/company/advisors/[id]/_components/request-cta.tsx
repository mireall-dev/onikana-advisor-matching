"use client";

import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RequestCta({
  advisorId,
  accepting,
  variant = "desktop",
}: {
  advisorId: string;
  accepting: boolean;
  variant?: "desktop" | "mobile";
}) {
  const router = useRouter();
  const isMobile = variant === "mobile";
  const buttonClassName = isMobile
    ? "w-full bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
    : "bg-[#0F569D] text-white hover:bg-[#0A3D6E]";

  if (accepting) {
    return (
      <Button
        className={buttonClassName}
        onClick={() => router.push(`/company/request/${advisorId}`)}
      >
        <CalendarCheck className="mr-2 size-4" />
        面談をリクエストする
      </Button>
    );
  }

  if (isMobile) {
    return (
      <Button className="w-full bg-[#0F569D] text-white opacity-50" disabled>
        <CalendarCheck className="mr-2 size-4" />
        現在受付停止中です
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              className="bg-[#0F569D] text-white opacity-50"
              disabled
            />
          }
        >
          <CalendarCheck className="mr-2 size-4" />
          面談をリクエストする
        </TooltipTrigger>
        <TooltipContent>現在受付停止中です</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
