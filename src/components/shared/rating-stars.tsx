"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const SIZE_MAP: Record<string, string> = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-6",
};

export function RatingStars({
  rating,
  count,
  size = "md",
  interactive = false,
  onChange,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
  const iconSize = SIZE_MAP[size];

  function handleClick(star: number) {
    if (interactive && onChange) {
      onChange(star);
    }
  }

  function handleMouseEnter(star: number) {
    if (interactive) {
      setHoverRating(star);
    }
  }

  function handleMouseLeave() {
    if (interactive) {
      setHoverRating(0);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const starIndex = i + 1;
          const isFilled = starIndex <= Math.floor(displayRating);
          const isHalf =
            !isFilled &&
            starIndex === Math.ceil(displayRating) &&
            displayRating % 1 >= 0.5;

          return (
            <button
              key={starIndex}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              className={cn(
                "relative p-0 border-none bg-transparent",
                interactive
                  ? "cursor-pointer hover:scale-110 transition-transform"
                  : "cursor-default"
              )}
              aria-label={
                interactive ? `${starIndex}点をつける` : undefined
              }
            >
              {isHalf ? (
                <span className="relative inline-block">
                  <Star
                    className={cn(iconSize, "fill-[#E5E7EB] text-[#E5E7EB]")}
                  />
                  <span className="absolute inset-0 overflow-hidden w-1/2">
                    <Star
                      className={cn(
                        iconSize,
                        "fill-[#B89B4A] text-[#B89B4A]"
                      )}
                    />
                  </span>
                </span>
              ) : (
                <Star
                  className={cn(
                    iconSize,
                    isFilled
                      ? "fill-[#B89B4A] text-[#B89B4A]"
                      : "fill-[#E5E7EB] text-[#E5E7EB]"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      {typeof count === "number" && (
        <span className="text-sm text-[#6B7280]">({count})</span>
      )}
    </div>
  );
}
