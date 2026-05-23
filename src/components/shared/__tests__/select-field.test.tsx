import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SelectField } from "../select-field";

const ROLE_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "company", label: "企業" },
  { value: "advisor", label: "顧問" },
  { value: "admin", label: "管理者" },
] as const;

describe("SelectField", () => {
  it("初期valueに対応するlabelをtriggerに表示する", () => {
    render(
      <SelectField
        value="company"
        onValueChange={() => {}}
        options={ROLE_OPTIONS}
        placeholder="ロールで絞り込み"
      />
    );
    expect(screen.getByText("企業")).toBeInTheDocument();
    expect(screen.queryByText("company")).not.toBeInTheDocument();
  });

  it("空valueの場合 placeholder が表示される", () => {
    render(
      <SelectField
        value=""
        onValueChange={() => {}}
        options={ROLE_OPTIONS}
        placeholder="ロールで絞り込み"
      />
    );
    expect(screen.getAllByText("ロールで絞り込み").length).toBeGreaterThan(0);
  });

  it("__all__ のような内部値もちゃんと label に置換される (regression: 検索プルダウンで __all__ が出ていた件)", () => {
    const options = [
      { value: "__all__", label: "すべて" },
      { value: "IT", label: "IT" },
    ];
    render(
      <SelectField
        value="__all__"
        onValueChange={() => {}}
        options={options}
        placeholder="placeholder"
      />
    );
    expect(screen.queryByText("__all__")).not.toBeInTheDocument();
    expect(screen.getByText("すべて")).toBeInTheDocument();
  });

  it("未知のvalueはそのまま表示される (fallback)", () => {
    render(
      <SelectField
        value="unknown_value"
        onValueChange={() => {}}
        options={ROLE_OPTIONS}
        placeholder="..."
      />
    );
    expect(screen.getByText("unknown_value")).toBeInTheDocument();
  });

  it("aria-label が trigger に設定される", () => {
    render(
      <SelectField
        value="admin"
        onValueChange={() => {}}
        options={ROLE_OPTIONS}
        placeholder="placeholder"
        ariaLabel="ロール選択"
      />
    );
    expect(screen.getByRole("combobox", { name: "ロール選択" })).toBeInTheDocument();
  });
});
