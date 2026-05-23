"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/types/database";

export type RoleFilter = "all" | UserRole;

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
      <Select
        value={role}
        onValueChange={(val) => {
          if (val !== null) setRole(val);
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="ロールで絞り込み" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="company">企業</SelectItem>
          <SelectItem value="advisor">顧問</SelectItem>
          <SelectItem value="admin">管理者</SelectItem>
        </SelectContent>
      </Select>

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
