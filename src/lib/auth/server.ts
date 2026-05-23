import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User, UserRole } from "@/types/database";

export interface AuthContext {
  authUserId: string;
  profile: User;
}

export async function getCurrentUser(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  return { authUserId: authUser.id, profile: profile as User };
}

export async function requireRole(role: UserRole): Promise<AuthContext> {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/login");
  if (ctx.profile.role !== role) redirect("/login");
  return ctx;
}

export async function requireAdmin(): Promise<AuthContext> {
  return requireRole("admin");
}
