import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatHourlyRate, getInitials } from "@/lib/utils";
import type { AdvisorProfile, User } from "@/types/database";

const STATUS_DOT_COLORS: Record<string, string> = {
  accepting: "bg-[#16A34A]",
  full: "bg-[#D97706]",
  paused: "bg-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  accepting: "受付中",
  full: "満席",
  paused: "休止中",
};

interface AdvisorCardProps {
  advisor: AdvisorProfile & { user: User };
}

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const displayIndustries = advisor.industries.slice(0, 3);

  return (
    <Link
      href={`/company/advisors/${advisor.id}`}
      className="card-hover group block rounded-xl border border-[#E5E7EB] bg-white overflow-hidden transition-colors hover:border-[#0F569D]/30 active:bg-[#F8F9FB]"
    >
      {/* Color band */}
      <div className="h-1.5 bg-gradient-to-r from-[#E8F0FE] to-white" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar with status dot */}
          <div className="relative shrink-0">
            <Avatar className="size-14 ring-2 ring-[#E8F0FE]">
              {advisor.user.avatar_url ? (
                <AvatarImage
                  src={advisor.user.avatar_url}
                  alt={advisor.user.display_name}
                />
              ) : null}
              <AvatarFallback className="bg-[#0F569D] text-white text-lg font-semibold">
                {getInitials(advisor.user.display_name)}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white ${STATUS_DOT_COLORS[advisor.status] ?? "bg-gray-400"}`}
              title={STATUS_LABELS[advisor.status] ?? advisor.status}
              aria-label={STATUS_LABELS[advisor.status] ?? advisor.status}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-base font-semibold text-[#1A1A2E]">
              {advisor.user.display_name}
            </h3>
            {advisor.catchphrase && (
              <p className="mt-1 line-clamp-1 text-sm text-[#6B7280]">
                {advisor.catchphrase}
              </p>
            )}
            {displayIndustries.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {displayIndustries.map((industry) => (
                  <Badge
                    key={industry}
                    variant="secondary"
                    className="bg-[#E8F0FE] text-[#0F569D] text-xs px-2 py-0.5"
                  >
                    {industry}
                  </Badge>
                ))}
                {advisor.industries.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="bg-[#E8F0FE] text-[#0F569D] text-xs px-2 py-0.5"
                    aria-label={`他${advisor.industries.length - 3}件の業界`}
                  >
                    +{advisor.industries.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="my-3 h-px bg-[#E5E7EB]" />

        {/* Rating and Price */}
        <div className="flex items-center justify-between">
          <RatingStars
            rating={advisor.rating_avg}
            count={advisor.rating_count}
            size="sm"
          />
          <span className="text-sm font-semibold text-[#0F569D]">
            {formatHourlyRate(advisor.hourly_rate)}
          </span>
        </div>
      </div>
    </Link>
  );
}
