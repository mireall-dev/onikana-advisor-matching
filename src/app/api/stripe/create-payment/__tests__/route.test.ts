import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @/lib/supabase/server
const mockGetUser = vi.fn();
const mockFromSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockFromSingle,
        }),
      }),
    }),
  })),
}));

// Mock service-role @supabase/supabase-js
const mockSrInsert = vi.fn(() => Promise.resolve({ error: null }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: () => ({ insert: mockSrInsert }),
  })),
}));

// Mock @/lib/stripe
const mockPaymentIntentsCreate = vi.fn();
const mockHasStripeServerEnv = vi.fn();
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    paymentIntents: { create: mockPaymentIntentsCreate },
  }),
  MATCH_SUCCESS_FEE: 50000,
  hasStripeServerEnv: () => mockHasStripeServerEnv(),
}));

import { POST } from "../route";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/stripe/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srv-key";
  mockHasStripeServerEnv.mockReturnValue(true);
});

describe("POST /api/stripe/create-payment", () => {
  it("未認証は 401", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await POST(makeReq({ matchId: "11111111-1111-4111-8111-111111111111" }));
    expect(res.status).toBe(401);
  });

  it("matchId が UUID でなければ 400", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });
    const res = await POST(makeReq({ matchId: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });

  it("match が見つからなければ 404", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
    });
    mockFromSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await POST(makeReq({ matchId: "11111111-1111-4111-8111-111111111111" }));
    expect(res.status).toBe(404);
  });

  it("ログイン者が match.company_id と一致しなければ 403", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "intruder" } },
    });
    mockFromSingle.mockResolvedValueOnce({
      data: {
        id: "m1",
        company_id: "owner",
        advisor_id: "adv",
        is_matched: true,
        payment_status: "unpaid",
      },
      error: null,
    });
    const res = await POST(makeReq({ matchId: "11111111-1111-4111-8111-111111111111" }));
    expect(res.status).toBe(403);
  });

  it("マッチ未成立なら 400", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "owner" } },
    });
    mockFromSingle.mockResolvedValueOnce({
      data: {
        id: "m1",
        company_id: "owner",
        advisor_id: "adv",
        is_matched: false,
        payment_status: "unpaid",
      },
      error: null,
    });
    const res = await POST(makeReq({ matchId: "11111111-1111-4111-8111-111111111111" }));
    expect(res.status).toBe(400);
  });

  it("既に決済済みなら 409", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "owner" } },
    });
    mockFromSingle.mockResolvedValueOnce({
      data: {
        id: "m1",
        company_id: "owner",
        advisor_id: "adv",
        is_matched: true,
        payment_status: "paid",
      },
      error: null,
    });
    const res = await POST(makeReq({ matchId: "11111111-1111-4111-8111-111111111111" }));
    expect(res.status).toBe(409);
  });

  it("Stripe env が無ければ mock=true で 200", async () => {
    mockHasStripeServerEnv.mockReturnValue(false);
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "owner" } },
    });
    mockFromSingle.mockResolvedValueOnce({
      data: {
        id: "m1",
        company_id: "owner",
        advisor_id: "adv",
        is_matched: true,
        payment_status: "unpaid",
      },
      error: null,
    });
    const res = await POST(makeReq({ matchId: "11111111-1111-4111-8111-111111111111" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mock: boolean; amount: number };
    expect(body.mock).toBe(true);
    expect(body.amount).toBe(50000);
  });

  it("Stripe あり/全条件OK なら PaymentIntent を作って clientSecret を返す", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "owner" } },
    });
    mockFromSingle.mockResolvedValueOnce({
      data: {
        id: "m1",
        company_id: "owner",
        advisor_id: "adv",
        is_matched: true,
        payment_status: "unpaid",
      },
      error: null,
    });
    mockPaymentIntentsCreate.mockResolvedValueOnce({
      id: "pi_123",
      client_secret: "secret_xyz",
    });
    const res = await POST(makeReq({ matchId: "11111111-1111-4111-8111-111111111111" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { clientSecret: string };
    expect(body.clientSecret).toBe("secret_xyz");
    expect(mockPaymentIntentsCreate).toHaveBeenCalledOnce();
    expect(mockSrInsert).toHaveBeenCalledOnce();
  });
});
