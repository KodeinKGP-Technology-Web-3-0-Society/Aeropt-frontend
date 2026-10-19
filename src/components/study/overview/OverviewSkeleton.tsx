"use client";

function Bone({ className }: { className: string }) {
  return <div className={`rounded-md bg-line ${className}`} />;
}

export default function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-8 motion-reduce:animate-none animate-pulse" aria-busy="true" aria-label="Loading your study overview">
      <section className="scroll-mt-28">
        <Bone className="mb-3 h-7 w-32" />
        <div className="rounded-2xl border border-line bg-surface p-6  sm:p-7">
          <Bone className="h-6 w-28 rounded-full" />
          <Bone className="mt-4 h-10 w-2/3 max-w-md" />
          <Bone className="mt-3 h-5 w-1/2" />
          <div className="mt-4 flex gap-2">
            <Bone className="h-8 w-20 rounded-full" />
            <Bone className="h-8 w-24 rounded-full" />
            <Bone className="h-8 w-24 rounded-full" />
          </div>
          <Bone className="mt-6 h-12 w-36 rounded-xl" />
        </div>
      </section>

      <section>
        <Bone className="mb-3 h-7 w-52" />
        <div className="rounded-2xl border border-line bg-surface p-5  sm:p-6">
          <Bone className="h-12 w-64 rounded-xl" />
          <Bone className="mt-4 h-12 w-full rounded-xl" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Bone key={index} className="h-11 w-36 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      <section>
        <Bone className="mb-3 h-7 w-36" />
        <div className="rounded-2xl border border-line bg-surface ">
          <div className="flex gap-3 border-b border-line px-4 py-3">
            <Bone className="h-8 w-32" />
            <Bone className="h-8 w-28" />
            <Bone className="h-8 w-24" />
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex min-h-14 items-center gap-3 border-b border-line/40 px-4">
              <Bone className="h-8 w-8 rounded-lg" />
              <div className="flex-1">
                <Bone className="h-4 w-1/2" />
                <Bone className="mt-2 h-3 w-1/3" />
              </div>
              <Bone className="hidden h-6 w-24 rounded-full md:block" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
