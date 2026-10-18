"use client";

export default function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-8 sm:gap-10 animate-pulse" aria-busy="true" aria-label="Loading your study overview">
      {/* 1. Continue Card Hero Skeleton (~210px) */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:p-9 shadow-xs">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <div className="h-3.5 w-28 rounded-md bg-line" />
          </div>
          <div>
            <div className="h-8 sm:h-9 w-2/3 max-w-md rounded-lg bg-line-strong" />
            <div className="mt-2.5 h-4.5 w-5/6 max-w-xl rounded-md bg-line" />
          </div>
          <div className="pt-1">
            <div className="h-12 w-36 rounded-lg bg-line-strong" />
          </div>
          <div className="mt-1 flex gap-4 border-t border-line/60 pt-4">
            <div className="h-3.5 w-20 rounded-md bg-line" />
            <div className="h-3.5 w-48 rounded-md bg-line" />
          </div>
        </div>
      </div>

      {/* 2. Compact Search Skeleton (~130px) */}
      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-3.5">
          <div className="flex gap-6 border-b border-line pb-2.5">
            <div className="h-4 w-24 rounded-md bg-line-strong" />
            <div className="h-4 w-32 rounded-md bg-line" />
          </div>
          <div className="h-12 sm:h-13 w-full rounded-xl bg-input border border-line" />
          <div className="mt-1.5 flex gap-3">
            <div className="h-3.5 w-14 rounded-md bg-line" />
            <div className="h-3.5 w-28 rounded-md bg-line" />
            <div className="h-3.5 w-32 rounded-md bg-line" />
          </div>
        </div>
      </div>

      {/* 3. Unified Topics Panel Skeleton (~400px) */}
      <div className="rounded-2xl border border-line bg-surface shadow-xs">
        {/* Tab bar skeleton */}
        <div className="flex gap-3 border-b border-line px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="h-9 w-32 rounded-md bg-line-strong" />
          <div className="h-9 w-28 rounded-md bg-line" />
          <div className="h-9 w-28 rounded-md bg-line" />
          <div className="h-9 w-28 rounded-md bg-line" />
        </div>

        {/* 6 row skeletons matching TopicRow min-h-[52px] sm:min-h-[56px] */}
        <div className="divide-y divide-line/40 min-h-[340px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex min-h-[52px] sm:min-h-[56px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
              <div className="flex items-baseline gap-2.5 w-1/2">
                <div className="h-4 sm:h-4.5 w-3/5 rounded-md bg-line-strong" />
                <div className="h-3.5 w-2/5 rounded-md bg-line hidden sm:block" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 rounded-full bg-line" />
                <div className="h-3.5 w-14 rounded-md bg-line hidden md:block" />
              </div>
              <div className="h-9 w-20 rounded-md bg-line" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Coverage Summary Skeleton (~100px) */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline">
            <div className="h-5 w-44 rounded-md bg-line-strong" />
            <div className="h-4 w-56 rounded-md bg-line" />
          </div>
          <div className="h-2 w-full rounded-full bg-line" />
        </div>
      </div>
    </div>
  );
}
