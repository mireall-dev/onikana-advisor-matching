import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RatingStars } from "../rating-stars";

describe("RatingStars", () => {
  it("rating=4.5 で5つの星ボタンがレンダリングされる", () => {
    render(<RatingStars rating={4.5} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it('count=10 が渡されたら "(10)" と表示される', () => {
    render(<RatingStars rating={4} count={10} />);
    expect(screen.getByText("(10)")).toBeInTheDocument();
  });

  it("rating=0 のケースでも5つの星がレンダリングされる", () => {
    render(<RatingStars rating={0} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });
});
