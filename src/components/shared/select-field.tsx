"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectFieldOption[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

/**
 * Wrapper around the shadcn/base-ui Select that takes an `options` list and
 * handles value→label mapping automatically. Avoids the gotcha where
 * `<SelectValue />` without a children function renders the raw value.
 */
export function SelectField({
  value,
  onValueChange,
  options,
  placeholder = "選択してください",
  ariaLabel,
  disabled,
  className,
  triggerClassName,
}: SelectFieldProps) {
  const labelFor = (v: unknown): string => {
    if (typeof v !== "string" || v === "") return "";
    return options.find((o) => o.value === v)?.label ?? v;
  };

  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v !== null) onValueChange(v);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn("w-full", triggerClassName)}
          aria-label={ariaLabel ?? placeholder}
        >
          <SelectValue placeholder={placeholder}>
            {(currentValue) => {
              const label = labelFor(currentValue);
              return label || placeholder;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
