import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#E5E7EB] bg-white p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[#6B7280]">{title}</p>
          <p className="animate-count-up mt-2 font-heading text-3xl font-bold text-[#1A1A2E]">
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-[#6B7280]">{trend}</p>
          )}
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0F569D]/10">
          <Icon className="size-6 text-[#0F569D]" />
        </div>
      </div>
    </div>
  );
}
