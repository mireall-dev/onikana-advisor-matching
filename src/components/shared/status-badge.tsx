import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  AdvisorStatus,
  ApprovalStatus,
  RequestStatus,
} from "@/types/database";

type StatusType = AdvisorStatus | ApprovalStatus | RequestStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  accepting: { label: "受付中", bg: "bg-green-50", text: "text-green-700" },
  full: { label: "満席", bg: "bg-amber-50", text: "text-amber-700" },
  paused: { label: "休止中", bg: "bg-gray-100", text: "text-gray-500" },
  pending: { label: "承認待ち", bg: "bg-amber-50", text: "text-amber-700" },
  approved: { label: "承認済", bg: "bg-green-50", text: "text-green-700" },
  rejected: { label: "却下", bg: "bg-red-50", text: "text-red-700" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
