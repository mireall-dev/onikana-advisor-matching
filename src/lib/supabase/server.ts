import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockClient } from "@/lib/mock/client";

function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

type ServerSupabaseClient = ReturnType<typeof createServerClient>;

export async function createClient(): Promise<ServerSupabaseClient> {
  if (!hasSupabaseEnv()) {
    return createMockClient() as unknown as ServerSupabaseClient;
  }

  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignored with middleware session refresh
          }
        },
      },
    }
  );
}
