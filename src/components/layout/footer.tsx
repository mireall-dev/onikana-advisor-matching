import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="bg-[#0A3D6E] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="font-heading text-lg font-semibold tracking-tight">
            {BRAND.full}
          </span>
          <p className="text-sm text-white/70">
            &copy; {new Date().getFullYear()} {BRAND.full} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
