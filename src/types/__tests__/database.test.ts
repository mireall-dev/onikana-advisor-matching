import { describe, it, expect, vi } from "vitest";
import {
  INDUSTRIES,
  SPECIALTIES,
  AREAS,
  EMPLOYEE_SCALES,
} from "../database";

describe("database constants", () => {
  it("INDUSTRIES が7つの要素を持つ", () => {
    expect(INDUSTRIES).toHaveLength(7);
  });

  it("SPECIALTIES が6つの要素を持つ", () => {
    expect(SPECIALTIES).toHaveLength(6);
  });

  it("AREAS が6つの要素を持つ", () => {
    expect(AREAS).toHaveLength(6);
  });

  it("EMPLOYEE_SCALES が5つの要素を持つ", () => {
    expect(EMPLOYEE_SCALES).toHaveLength(5);
  });

  it("INDUSTRIES に期待される値が含まれている", () => {
    expect(INDUSTRIES).toContain("IT");
    expect(INDUSTRIES).toContain("製造");
    expect(INDUSTRIES).toContain("金融");
    expect(INDUSTRIES).toContain("不動産");
    expect(INDUSTRIES).toContain("医療");
    expect(INDUSTRIES).toContain("小売");
    expect(INDUSTRIES).toContain("その他");
  });

  it("SPECIALTIES に期待される値が含まれている", () => {
    expect(SPECIALTIES).toContain("新規開拓");
    expect(SPECIALTIES).toContain("ルート営業");
    expect(SPECIALTIES).toContain("代理店開拓");
    expect(SPECIALTIES).toContain("インサイドセールス");
    expect(SPECIALTIES).toContain("エンタープライズ営業");
    expect(SPECIALTIES).toContain("海外営業");
  });

  it("AREAS に期待される値が含まれている", () => {
    expect(AREAS).toContain("関東");
    expect(AREAS).toContain("関西");
    expect(AREAS).toContain("中部");
    expect(AREAS).toContain("九州");
    expect(AREAS).toContain("全国対応");
    expect(AREAS).toContain("リモート対応");
  });

  it("EMPLOYEE_SCALES に期待される値が含まれている", () => {
    expect(EMPLOYEE_SCALES).toContain("1-10名");
    expect(EMPLOYEE_SCALES).toContain("11-50名");
    expect(EMPLOYEE_SCALES).toContain("51-200名");
    expect(EMPLOYEE_SCALES).toContain("201-1000名");
    expect(EMPLOYEE_SCALES).toContain("1001名以上");
  });
});
