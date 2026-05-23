"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server";
import type { ApprovalStatus } from "@/types/database";

interface ActionResult {
  ok: boolean;
  error?: string;
}

async function updateApprovalStatus(
  advisorUserId: string,
  status: ApprovalStatus
): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("advisor_profiles")
    .update({ approval_status: status })
    .eq("user_id", advisorUserId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function approveAdvisor(advisorUserId: string): Promise<ActionResult> {
  return updateApprovalStatus(advisorUserId, "approved");
}

export async function rejectAdvisor(advisorUserId: string): Promise<ActionResult> {
  return updateApprovalStatus(advisorUserId, "rejected");
}
