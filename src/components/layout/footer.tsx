import Image from "next/image";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="bg-[#0A3D6E] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Image
            src="/images/logo.png"
            alt={BRAND.full}
            width={140}
            height={35}
            className="h-7 w-auto brightness-0 invert"
          />
          <p className="text-sm text-white/70">
            &copy; {new Date().getFullYear()} {BRAND.full} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
