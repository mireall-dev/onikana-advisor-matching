import Image from "next/image";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  variant?: "inbox" | "search";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EMPTY_IMAGE: Record<NonNullable<EmptyStateProps["variant"]>, string> = {
  inbox: "/images/empty-inbox.png",
  search: "/images/empty-search.png",
};

export function EmptyState({
  variant = "inbox",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <Image
        src={EMPTY_IMAGE[variant]}
        alt=""
        width={180}
        height={180}
        className="pointer-events-none"
      />
      <p className="mt-4 font-medium text-[#1A1A2E]">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-[#6B7280]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 py-12",
        className
      )}
    >
      <Loader2 aria-hidden="true" className="size-8 animate-spin text-[#0F569D]" />
      {label && <p className="text-sm text-[#6B7280]">{label}</p>}
      <span className="sr-only">{label ?? "読み込み中"}</span>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "エラーが発生しました",
  description = "しばらくしてから再度お試しください。",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-[#D42027]/10">
        <AlertCircle aria-hidden="true" className="size-7 text-[#D42027]" />
      </div>
      <p className="mt-4 font-medium text-[#1A1A2E]">{title}</p>
      <p className="mt-1 max-w-md text-sm text-[#6B7280]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
