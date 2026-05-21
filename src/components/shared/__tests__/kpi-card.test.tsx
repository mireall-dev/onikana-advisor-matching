import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "../kpi-card";
import { Users } from "lucide-react";

describe("KpiCard", () => {
  it("title と value が正しくレンダリングされる", () => {
    render(<KpiCard title="総ユーザー数" value={120} icon={Users} />);
    expect(screen.getByText("総ユーザー数")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("trend が渡されたら表示される", () => {
    render(
      <KpiCard
        title="総ユーザー数"
        value={120}
        icon={Users}
        trend="前月比 +10%"
      />
    );
    expect(screen.getByText("前月比 +10%")).toBeInTheDocument();
  });
});
