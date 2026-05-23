import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const child = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        {
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        }
      )
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-[#1A1A2E]">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-[#D42027]">
              *
            </span>
          )}
        </Label>
        {hint && !error && (
          <span id={hintId} className="text-xs text-[#6B7280]">
            {hint}
          </span>
        )}
      </div>
      {child}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1 text-sm text-[#D42027]"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
