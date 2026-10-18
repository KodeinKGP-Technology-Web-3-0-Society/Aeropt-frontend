"use client";

import Link from "next/link";
import type { UpNextItem } from "@/lib/api/study";
import { conceptHref, KIND_LABEL } from "@/lib/studyOverview";

interface ContinueCardProps {
  items: UpNextItem[];
}

export default function ContinueCard({ items }: ContinueCardProps) {
  if (!items || items.length === 0) return null;

  const [first, ...rest] = items;
  const isReview = first.kind === "review";
  const kindMeta = KIND_LABEL[first.kind] || { tag: "Up next", cta: "Start" };

  return (
    <section
      aria-label="What to study next"
      className="rounded-2xl border border-line bg-surface p-6 shadow-xs transition-colors sm:p-8 lg:p-9"
    >
      <div className="flex flex-col gap-5">
        {/* Eyebrow tag */}
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isReview ? "bg-danger" : "bg-accent"}`}
            aria-hidden
          />
          <span
            className={`text-xs sm:text-sm font-semibold tracking-wide ${
              isReview ? "text-danger" : "text-accent"
            }`}
          >
            {kindMeta.tag}
          </span>
        </div>

        {/* Title and Context */}
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink first-letter:uppercase sm:text-3xl lg:text-4xl">
            <Link
              href={conceptHref(first)}
              className="transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {first.name}
            </Link>
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-ink-2 sm:text-base">
            <span className="font-medium text-muted">{first.chapter}. </span>
            {first.reason.replace(/—/g, ": ")}
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-1">
          <Link
            href={conceptHref(first)}
            className="inline-flex min-h-[46px] sm:min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm sm:text-base font-semibold text-accent-on transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>{kindMeta.cta}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Secondary Queued Topics */}
        {rest.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/80 pt-4 text-xs sm:text-sm">
            <span className="font-medium text-muted">Also queued:</span>
            {rest.map((item, idx) => (
              <span key={item.concept_id} className="inline-flex items-center gap-2">
                {idx > 0 && <span className="text-line-strong">·</span>}
                <Link
                  href={conceptHref(item)}
                  className="font-medium text-ink-2 underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  {item.name}
                </Link>
                <span className="text-muted">({item.chapter})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
