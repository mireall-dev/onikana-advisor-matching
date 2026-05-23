import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/shared/states";
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
  AdvisorStatus,
  ApprovalStatus,
} from "@/types/database";
import { UsersFilter, type RoleFilter } from "./_components/users-filter";

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

function parseRole(value: string | undefined): RoleFilter {
  if (value === "company" || value === "advisor" || value === "admin")
    return value;
  return "all";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const roleFilter = parseRole(sp.role);
  const query = (sp.q ?? "").trim();

  const supabase = await createClient();
  const [usersRes, advisorProfilesRes] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }),
    supabase.from("advisor_profiles").select("user_id, status, approval_status"),
  ]);

  if (usersRes.error || advisorProfilesRes.error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="ユーザーデータの取得に失敗しました" />
      </div>
    );
  }

  const users = (usersRes.data ?? []) as User[];
  const advisorProfiles = (advisorProfilesRes.data ?? []) as AdvisorInfo[];

  const advisorMap = new Map<string, AdvisorInfo>();
  for (const profile of advisorProfiles) {
    advisorMap.set(profile.user_id, profile);
  }

  let filteredUsers = users;
  if (roleFilter !== "all") {
    filteredUsers = filteredUsers.filter((u) => u.role === roleFilter);
  }
  if (query) {
    const q = query.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
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

      <div className="animate-fade-in-up mb-6">
        <UsersFilter role={roleFilter} query={query} />
      </div>

      <div className="animate-fade-in-up rounded-xl border border-[#E5E7EB] bg-white">
        {filteredUsers.length === 0 ? (
          <EmptyState
            variant="search"
            title="該当するユーザーはいません"
            description="フィルター条件を変更してみてください"
          />
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
                const advisorInfo =
                  u.role === "advisor" ? advisorMap.get(u.id) : null;
                const roleBadgeStyle = ROLE_BADGE_STYLES[u.role];

                return (
                  <TableRow key={u.id} className="border-[#E5E7EB]">
                    <TableCell className="font-medium text-[#1A1A2E]">
                      {u.display_name}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">{u.email}</TableCell>
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
