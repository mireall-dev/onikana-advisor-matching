"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import type {
  User,
  UserRole,
  AdvisorProfile,
  AdvisorStatus,
  ApprovalStatus,
} from "@/types/database";

type RoleFilter = "all" | UserRole;

interface AdvisorInfo {
  user_id: string;
  status: AdvisorStatus;
  approval_status: ApprovalStatus;
}

const ROLE_BADGE_STYLES: Record<UserRole, { bg: string; text: string }> = {
  company: { bg: "bg-blue-50", text: "text-blue-700" },
  advisor: { bg: "bg-green-50", text: "text-green-700" },
  admin: { bg: "bg-purple-50", text: "text-purple-700" },
};

const ROLE_LABELS: Record<UserRole, string> = {
  company: "企業",
  advisor: "顧問",
  admin: "管理者",
};

export default function UsersPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [users, setUsers] = useState<User[]>([]);
  const [advisorProfiles, setAdvisorProfiles] = useState<AdvisorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const [usersRes, advisorProfilesRes] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("advisor_profiles")
        .select("user_id, status, approval_status"),
    ]);

    if (usersRes.data) {
      setUsers(usersRes.data as User[]);
    }
    if (advisorProfilesRes.data) {
      setAdvisorProfiles(advisorProfilesRes.data as AdvisorInfo[]);
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "admin") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [authLoading, user, role, router, fetchData]);

  const advisorMap = useMemo(() => {
    const map = new Map<string, AdvisorInfo>();
    for (const profile of advisorProfiles) {
      map.set(profile.user_id, profile);
    }
    return map;
  }, [advisorProfiles]);

  const filteredUsers = useMemo(() => {
    let result = users;

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.display_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    return result;
  }, [users, roleFilter, searchQuery]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">ユーザー一覧</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          登録ユーザーを管理します ({filteredUsers.length}件)
        </p>
      </div>

      {/* Filters */}
      <div className="animate-fade-in-up mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={roleFilter}
          onValueChange={(val) => { if (val !== null) setRoleFilter(val as RoleFilter); }}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="animate-fade-in-up rounded-xl border border-[#E5E7EB] bg-white">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Image
              src="/images/empty-search.png"
              alt=""
              width={180}
              height={180}
              className="pointer-events-none"
            />
            <p className="mt-4 text-sm text-[#6B7280]">
              該当するユーザーはいません
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead>名前</TableHead>
                <TableHead>メール</TableHead>
                <TableHead>ロール</TableHead>
                <TableHead>登録日</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const advisorInfo = u.role === "advisor" ? advisorMap.get(u.id) : null;
                const roleBadgeStyle = ROLE_BADGE_STYLES[u.role];

                return (
                  <TableRow key={u.id} className="border-[#E5E7EB]">
                    <TableCell className="font-medium text-[#1A1A2E]">
                      {u.display_name}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${roleBadgeStyle.bg} ${roleBadgeStyle.text} border-transparent`}
                      >
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
                      {format(new Date(u.created_at), "yyyy/MM/dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      {advisorInfo ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={advisorInfo.approval_status} />
                          <StatusBadge status={advisorInfo.status} />
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B7280]">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
