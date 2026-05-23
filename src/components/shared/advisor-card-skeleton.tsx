export function AdvisorCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#E8F0FE] to-white animate-pulse" />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="flex gap-1.5 mt-2">
              <div className="h-5 w-12 rounded bg-gray-200 animate-pulse" />
              <div className="h-5 w-14 rounded bg-gray-200 animate-pulse" />
              <div className="h-5 w-10 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="my-3 h-px bg-gray-200" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
