// Create demo auth users in Supabase Auth via Admin API
// Run: node scripts/seed-auth.mjs
//
// Required env vars:
//   - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
//   - SUPABASE_SERVICE_ROLE_KEY

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error(
    "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) env var is required"
  );
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY env var is required");
  process.exit(1);
}

const DEMO_PASSWORD = "demo1234";

const users = [
  { id: "11111111-1111-1111-1111-111111111111", email: "demo-company@example.com" },
  { id: "11111111-1111-1111-1111-222222222222", email: "maruyama@example.com" },
  { id: "11111111-1111-1111-1111-333333333333", email: "green-estate@example.com" },
  { id: "22222222-2222-2222-2222-111111111111", email: "demo-advisor@example.com" },
  { id: "22222222-2222-2222-2222-222222222222", email: "suzuki@example.com" },
  { id: "22222222-2222-2222-2222-333333333333", email: "yamada@example.com" },
  { id: "22222222-2222-2222-2222-444444444444", email: "sato@example.com" },
  { id: "22222222-2222-2222-2222-555555555555", email: "takahashi@example.com" },
  { id: "22222222-2222-2222-2222-666666666666", email: "ito@example.com" },
  { id: "22222222-2222-2222-2222-777777777777", email: "watanabe@example.com" },
  { id: "22222222-2222-2222-2222-888888888888", email: "nakamura@example.com" },
  { id: "33333333-3333-3333-3333-111111111111", email: "demo-admin@example.com" },
];

async function createUser(user) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    // Already exists is fine
    if (data.msg?.includes("already been registered") || data.message?.includes("already been registered")) {
      console.log(`  SKIP (exists): ${user.email}`);
      return;
    }
    console.error(`  FAIL: ${user.email} - ${JSON.stringify(data)}`);
    return;
  }
  console.log(`  OK: ${user.email}`);
}

async function main() {
  console.log("Creating auth users...");
  for (const user of users) {
    await createUser(user);
  }
  console.log("Done.");
}

main();
