"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function confirmMatch(matchId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "ログインが必要です" };
  }

  // company 側の確認をセット。両者確認時に is_matched/matched_at を
  // 立てるのは DB トリガー check_match_completion の責務。
  const { error } = await supabase
    .from("matches")
    .update({ company_confirmed: true })
    .eq("id", matchId)
    .eq("company_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/company/mypage");
  return { ok: true };
}
