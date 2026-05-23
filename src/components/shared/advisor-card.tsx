import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatHourlyRate, getInitials } from "@/lib/utils";
import type { AdvisorProfile, User } from "@/types/database";

interface AdvisorCardProps {
  advisor: AdvisorProfile & { user: User };
}

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const displayIndustries = advisor.industries.slice(0, 3);

  return (
    <Link
      href={`/company/advisors/${advisor.id}`}
      className="card-hover block rounded-xl border border-[#E5E7EB] bg-white overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="size-16 shrink-0">
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
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-base font-semibold text-[#1A1A2E]">
              {advisor.user.display_name}
            </h3>
            {advisor.catchphrase && (
              <p className="mt-1 line-clamp-2 text-sm text-[#6B7280]">
                {advisor.catchphrase}
              </p>
            )}
          </div>
        </div>

        {displayIndustries.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {displayIndustries.map((industry) => (
              <Badge
                key={industry}
                variant="secondary"
                className="bg-[#E8F0FE] text-[#0F569D] text-xs"
              >
                {industry}
              </Badge>
            ))}
            {advisor.industries.length > 3 && (
              <Badge
                variant="secondary"
                className="bg-[#E8F0FE] text-[#0F569D] text-xs"
                aria-label={`他${advisor.industries.length - 3}件の業界`}
              >
                +{advisor.industries.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <RatingStars
            rating={advisor.rating_avg}
            count={advisor.rating_count}
            size="sm"
          />
          <StatusBadge status={advisor.status} />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#F1F5F9] pt-3">
          <span className="text-xs text-[#6B7280]">参考報酬</span>
          <span className="text-sm font-semibold text-[#0F569D]">
            {formatHourlyRate(advisor.hourly_rate)}
          </span>
        </div>
      </div>
    </Link>
  );
}
