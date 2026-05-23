import { BRAND } from "@/lib/brand";

type Variant = "full" | "short";

export function BrandName({
  variant = "full",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return <span className={className}>{BRAND[variant]}</span>;
}
