"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createMockClient } from "@/lib/mock/client";

function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

export function createClient(): BrowserSupabaseClient {
  if (!hasSupabaseEnv()) {
    // Mock mode for local dev / preview without a Supabase project.
    // Page-level code reads `data` as any, so the runtime-compatible mock
    // is safe to assert into the real client type.
    return createMockClient() as unknown as BrowserSupabaseClient;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
