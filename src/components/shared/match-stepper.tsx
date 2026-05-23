import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type MatchStep =
  | "requested"
  | "approved"
  | "matched"
  | "paid"
  | "reviewed";

interface MatchStepperProps {
  current: MatchStep;
  className?: string;
}

const STEPS: { key: MatchStep; label: string }[] = [
  { key: "requested", label: "申請" },
  { key: "approved", label: "承認" },
  { key: "matched", label: "マッチ確定" },
  { key: "paid", label: "決済" },
  { key: "reviewed", label: "レビュー" },
];

function stepIndex(step: MatchStep): number {
  return STEPS.findIndex((s) => s.key === step);
}

export function MatchStepper({ current, className }: MatchStepperProps) {
  const currentIdx = stepIndex(current);
  const currentLabel = STEPS[currentIdx]?.label ?? "";

  return (
    <div className={className}>
      {/* Mobile: compact summary with current step label */}
      <p
        className="mb-2 flex items-baseline gap-1 text-xs text-[#6B7280] sm:hidden"
        aria-live="polite"
      >
        <span>ステップ {currentIdx + 1} / {STEPS.length}</span>
        <span className="font-semibold text-[#1A1A2E]">{currentLabel}</span>
      </p>

      <ol className="flex w-full items-center gap-1">
        {STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <li
              key={step.key}
              className="flex flex-1 items-center gap-1"
              aria-current={active ? "step" : undefined}
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                    done && "bg-[#16A34A] text-white",
                    active && "bg-[#0F569D] text-white ring-4 ring-[#0F569D]/20",
                    !done && !active && "bg-[#E5E7EB] text-[#6B7280]"
                  )}
                >
                  {done ? <Check aria-hidden="true" className="size-3" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap text-[10px] sm:block",
                    active ? "font-semibold text-[#1A1A2E]" : "text-[#6B7280]"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-px flex-1 sm:mb-4",
                    done ? "bg-[#16A34A]" : "bg-[#E5E7EB]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
