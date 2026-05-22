import { describe, it, expect } from "vitest";
import { formatHourlyRate, getInitials, cn } from "../utils";

describe("formatHourlyRate", () => {
  it("正の値は ¥xx,xxx/h 形式で返す", () => {
    expect(formatHourlyRate(50000)).toBe("¥50,000/h");
    expect(formatHourlyRate(1500)).toBe("¥1,500/h");
  });

  it("0 や負値は『応相談』を返す", () => {
    expect(formatHourlyRate(0)).toBe("応相談");
    expect(formatHourlyRate(-100)).toBe("応相談");
  });

  it("NaN/undefined 相当も応相談", () => {
    // @ts-expect-error 故意に invalid 値を渡す
    expect(formatHourlyRate(undefined)).toBe("応相談");
    expect(formatHourlyRate(NaN)).toBe("応相談");
  });
});

describe("getInitials", () => {
  it("2語以上の名前は先頭文字を結合して大文字化", () => {
    expect(getInitials("山田 太郎")).toBe("山太");
    expect(getInitials("Taro Yamada")).toBe("TY");
  });

  it("1語のみは先頭2文字を大文字化", () => {
    expect(getInitials("taro")).toBe("TA");
    expect(getInitials("田中")).toBe("田中");
  });

  it("前後の空白を無視", () => {
    expect(getInitials("  Taro  Yamada  ")).toBe("TY");
  });
});

describe("cn", () => {
  it("クラスを結合し重複は tailwind-merge で解決", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("falsy はスキップ", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
