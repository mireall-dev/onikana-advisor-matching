import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchStepper } from "../match-stepper";

describe("MatchStepper", () => {
  it("5つのステップラベルがレンダリングされる", () => {
    render(<MatchStepper current="requested" />);
    // current step (`申請`) も mobile summary line に出るため getAllByText で許容
    expect(screen.getAllByText("申請").length).toBeGreaterThan(0);
    expect(screen.getByText("承認")).toBeInTheDocument();
    expect(screen.getByText("マッチ確定")).toBeInTheDocument();
    expect(screen.getByText("決済")).toBeInTheDocument();
    expect(screen.getByText("レビュー")).toBeInTheDocument();
  });

  it("モバイル用 summary line に現在ステップ番号と名前が表示される", () => {
    render(<MatchStepper current="matched" />);
    expect(screen.getByText(/ステップ\s*3\s*\/\s*5/)).toBeInTheDocument();
  });

  it("現在のステップに aria-current=step が付く", () => {
    const { container } = render(<MatchStepper current="matched" />);
    const activeItems = container.querySelectorAll('[aria-current="step"]');
    expect(activeItems).toHaveLength(1);
    expect(activeItems[0].textContent).toContain("マッチ確定");
  });

  it("paid 状態だと決済ステップが現在", () => {
    const { container } = render(<MatchStepper current="paid" />);
    const active = container.querySelector('[aria-current="step"]');
    expect(active?.textContent).toContain("決済");
  });

  it("reviewed 状態だとレビューステップが現在", () => {
    const { container } = render(<MatchStepper current="reviewed" />);
    const active = container.querySelector('[aria-current="step"]');
    expect(active?.textContent).toContain("レビュー");
  });
});
