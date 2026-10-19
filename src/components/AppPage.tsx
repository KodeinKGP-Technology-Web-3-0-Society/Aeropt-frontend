import type { ReactNode } from "react";

/** Outer frame shared by study, chat, plan, and progress. */
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="flex h-dvh bg-canvas">{children}</div>;
}

/**
 * Document column: same top padding, width, and title on every page that is a
 * page rather than a live conversation.
 */
export function AppPage({
  title,
  lede,
  actions,
  children,
  headerId,
  busy,
}: {
  title: string;
  lede?: string;
  actions?: ReactNode;
  children: ReactNode;
  headerId?: string;
  busy?: boolean;
}) {
  return (
    <main className="flex-1 overflow-y-auto px-4 pb-16 sm:px-6" aria-busy={busy || undefined}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 pt-20">
        <header id={headerId} className="flex flex-wrap items-end justify-between gap-3 scroll-mt-28">
          <div className="min-w-0">
            <h1 className="text-[32px] leading-10 font-semibold tracking-tight text-ink">{title}</h1>
            {lede ? <p className="mt-1 max-w-2xl text-[15px] leading-6 text-muted">{lede}</p> : null}
          </div>
          {actions}
        </header>
        {children}
      </div>
    </main>
  );
}
