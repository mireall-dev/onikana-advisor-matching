"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/select-field";
import type { UserRole } from "@/types/database";

export type RoleFilter = "all" | UserRole;

const ROLE_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "company", label: "企業" },
  { value: "advisor", label: "顧問" },
  { value: "admin", label: "管理者" },
] as const;

export function UsersFilter({
  role,
  query,
}: {
  role: RoleFilter;
  query: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  function pushParams(updater: (sp: URLSearchParams) => void) {
    const sp = new URLSearchParams(searchParams.toString());
    updater(sp);
    const qs = sp.toString();
    startTransition(() => {
      router.push(`/admin/users${qs ? `?${qs}` : ""}`);
    });
  }

  function setRole(value: string) {
    pushParams((sp) => {
      if (value === "all") sp.delete("role");
      else sp.set("role", value);
    });
  }

  function setQuery(value: string) {
    setLocalQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams((sp) => {
        if (!value.trim()) sp.delete("q");
        else sp.set("q", value.trim());
      });
    }, 250);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <SelectField
        value={role}
        onValueChange={setRole}
        options={ROLE_OPTIONS}
        placeholder="ロールで絞り込み"
        ariaLabel="ロールで絞り込み"
        triggerClassName="w-[160px]"
        className="w-[160px]"
      />

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
        <Input
          placeholder="名前 or メールで検索"
          value={localQuery}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
