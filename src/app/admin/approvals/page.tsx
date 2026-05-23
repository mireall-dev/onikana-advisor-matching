import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server";
import { ApprovalTabs, type ApprovalTab } from "./_components/approval-tabs";
import {
  ApprovalTable,
  type AdvisorWithUser,
} from "./_components/approval-table";

function parseTab(value: string | undefined): ApprovalTab {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const activeTab = parseTab(sp.tab);

  const supabase = await createClient();
  const { data } = await supabase
    .from("advisor_profiles")
    .select("*, user:users!user_id(display_name, email)")
    .order("created_at", { ascending: false });

  const advisors = (data ?? []) as AdvisorWithUser[];

  const counts = {
    pending: advisors.filter((a) => a.approval_status === "pending").length,
    approved: advisors.filter((a) => a.approval_status === "approved").length,
    rejected: advisors.filter((a) => a.approval_status === "rejected").length,
  };

  const filtered = advisors.filter((a) => a.approval_status === activeTab);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">顧問承認管理</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          顧問の承認・却下を管理します
        </p>
      </div>

      <div className="animate-fade-in-up rounded-xl border border-[#E5E7EB] bg-white p-6">
        <ApprovalTabs active={activeTab} counts={counts} />
        <div className="mt-4">
          <ApprovalTable advisors={filtered} showActions={activeTab === "pending"} />
        </div>
      </div>
    </div>
  );
}
