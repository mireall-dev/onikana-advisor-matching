import { describe, it, expect, vi } from "vitest";

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {},
    })),
  };
});

import { MATCH_SUCCESS_FEE, getStripe } from "../stripe";

describe("stripe", () => {
  it("MATCH_SUCCESS_FEE が 50000 である", () => {
    expect(MATCH_SUCCESS_FEE).toBe(50000);
  });

  it("getStripe が関数である", () => {
    expect(typeof getStripe).toBe("function");
  });
});
