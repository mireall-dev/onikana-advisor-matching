import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRequireAdmin = vi.fn();
vi.mock("@/lib/auth/server", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => ({ update: mockUpdate }),
  })),
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

import { approveAdvisor, rejectAdvisor } from "../actions";

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({
    authUserId: "admin-1",
    profile: { id: "admin-1", role: "admin" },
  });
  mockUpdateEq.mockResolvedValue({ error: null });
});

describe("approveAdvisor", () => {
  it("admin チェック → approved に update → revalidatePath", async () => {
    const result = await approveAdvisor("advisor-7");

    expect(mockRequireAdmin).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledWith({ approval_status: "approved" });
    expect(mockUpdateEq).toHaveBeenCalledWith("user_id", "advisor-7");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/approvals");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/dashboard");
    expect(result).toEqual({ ok: true });
  });

  it("update が失敗したら ok=false で error を返す", async () => {
    mockUpdateEq.mockResolvedValueOnce({ error: { message: "boom" } });
    const result = await approveAdvisor("advisor-7");
    expect(result).toEqual({ ok: false, error: "boom" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("requireAdmin が throw したら例外が伝播する", async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));
    await expect(approveAdvisor("advisor-7")).rejects.toThrow("NEXT_REDIRECT");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("rejectAdvisor", () => {
  it("rejected に update して revalidate", async () => {
    const result = await rejectAdvisor("advisor-9");
    expect(mockUpdate).toHaveBeenCalledWith({ approval_status: "rejected" });
    expect(mockUpdateEq).toHaveBeenCalledWith("user_id", "advisor-9");
    expect(result).toEqual({ ok: true });
  });
});
