import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../status-badge";

describe("StatusBadge", () => {
  it('advisor status "accepting" は "受付中" と表示される', () => {
    render(<StatusBadge status="accepting" />);
    expect(screen.getByText("受付中")).toBeInTheDocument();
  });

  it('advisor status "full" は "満席" と表示される', () => {
    render(<StatusBadge status="full" />);
    expect(screen.getByText("満席")).toBeInTheDocument();
  });

  it('advisor status "paused" は "休止中" と表示される', () => {
    render(<StatusBadge status="paused" />);
    expect(screen.getByText("休止中")).toBeInTheDocument();
  });

  it('approval status "pending" は "承認待ち" と表示される', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("承認待ち")).toBeInTheDocument();
  });

  it('approval status "approved" は "承認済" と表示される', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText("承認済")).toBeInTheDocument();
  });

  it('approval status "rejected" は "却下" と表示される', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText("却下")).toBeInTheDocument();
  });

  it('request status "pending" は "承認待ち" と表示される（STATUS_CONFIGの共通マッピング）', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("承認待ち")).toBeInTheDocument();
  });
});
