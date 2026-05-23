import {
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
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
  hideIcon?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: LucideIcon }
> = {
  accepting: {
    label: "受付中",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: CircleDot,
  },
  full: {
    label: "満席",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: PauseCircle,
  },
  paused: {
    label: "休止中",
    bg: "bg-gray-100",
    text: "text-gray-500",
    icon: PauseCircle,
  },
  pending: {
    label: "承認待ち",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: Clock,
  },
  approved: {
    label: "承認済",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "却下",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: XCircle,
  },
};

export function StatusBadge({ status, className, hideIcon }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-transparent font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {!hideIcon && <Icon aria-hidden="true" className="size-3" />}
      {config.label}
    </Badge>
  );
}
