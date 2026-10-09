"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatListItem } from "./useTutorChat";

type Group = { label: string; items: ChatListItem[] };

function groupByDay(items: ChatListItem[]): Group[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const day = 24 * 60 * 60 * 1000;
  const buckets: [string, (t: number) => boolean][] = [
    ["Today", (t) => t >= startOfToday.getTime()],
    ["Yesterday", (t) => t >= startOfToday.getTime() - day],
    ["Previous 7 days", (t) => t >= startOfToday.getTime() - 7 * day],
    ["Previous 30 days", (t) => t >= startOfToday.getTime() - 30 * day],
    ["Older", () => true],
  ];
  const groups: Group[] = buckets.map(([label]) => ({ label, items: [] }));
  for (const item of items) {
    // The agent stores naive UTC timestamps; read them as UTC.
    const raw = item.updated_at || "";
    const t = raw ? Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(raw) ? raw : `${raw}Z`) : 0;
    const index = buckets.findIndex(([, test]) => test(t || 0));
    groups[index].items.push(item);
  }
  return groups.filter((g) => g.items.length > 0);
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function HistoryRow({
  item,
  active,
  disabled,
  onSelect,
  onRename,
  onDelete,
}: {
  item: ChatListItem;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(item.label);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setRowError("");
    try {
      await action();
      setEditing(false);
      setConfirming(false);
    } catch (caught) {
      setRowError(caught instanceof Error ? caught.message : "That did not work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <form
        className="px-2 py-1"
        onSubmit={(event) => {
          event.preventDefault();
          void run(() => onRename(draft));
        }}
      >
        <input
          autoFocus
          value={draft}
          maxLength={120}
          disabled={busy}
          aria-label="Chat name"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          onBlur={() => {
            if (!busy) void run(() => onRename(draft));
          }}
          className="w-full rounded-lg border border-accent bg-surface px-2.5 py-1.5 text-sm text-ink outline-none"
        />
        {rowError ? <p className="mt-1 px-1 text-xs text-danger">{rowError}</p> : null}
      </form>
    );
  }

  if (confirming) {
    return (
      <div className="mx-1 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
        <p className="truncate text-xs text-ink">Delete “{item.label}”?</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(onDelete)}
            className="cursor-pointer rounded-md bg-danger px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirming(false)}
            className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>
        {rowError ? <p className="mt-1 text-xs text-danger">{rowError}</p> : null}
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-center rounded-lg transition-colors ${
        active ? "bg-accent-soft text-ink" : "text-ink hover:bg-hover"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className="min-w-0 flex-1 cursor-pointer truncate px-3 py-2 text-left text-sm disabled:cursor-not-allowed"
      >
        {item.label}
      </button>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label={`Options for ${item.label}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className={`mr-1 cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink focus-visible:opacity-100 ${
            menuOpen || active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <DotsIcon />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-[var(--shadow-card)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setDraft(item.title || item.label);
                setEditing(true);
              }}
              className="block w-full cursor-pointer px-3 py-1.5 text-left text-sm text-ink hover:bg-hover"
            >
              Rename
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setConfirming(true);
              }}
              className="block w-full cursor-pointer px-3 py-1.5 text-left text-sm text-danger hover:bg-danger/5"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ChatHistory({
  sessions,
  loading,
  error,
  activeId,
  busy,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onRetry,
}: {
  sessions: ChatListItem[];
  loading: boolean;
  error: string;
  activeId: string | null;
  busy: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupByDay(q ? sessions.filter((s) => s.label.toLowerCase().includes(q)) : sessions);
  }, [sessions, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 p-3">
        <button
          type="button"
          onClick={onNewChat}
          disabled={busy}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon />
          New chat
        </button>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
        />
      </div>

      <nav aria-label="Chat history" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="flex flex-col gap-2 px-1 pt-1" aria-hidden="true">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="h-8 animate-pulse rounded-lg bg-hover" />
            ))}
          </div>
        ) : error ? (
          <div className="px-2 pt-2 text-sm">
            <p className="text-danger">{error}</p>
            <button type="button" onClick={onRetry} className="mt-2 cursor-pointer font-semibold text-accent hover:text-accent-hover">
              Try again
            </button>
          </div>
        ) : groups.length === 0 ? (
          <p className="px-2 pt-2 text-sm text-muted">
            {query.trim() ? "No chats match that." : "Your chats will appear here."}
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mt-3 first:mt-0">
              <h3 className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{group.label}</h3>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <HistoryRow
                    key={item.session_id}
                    item={item}
                    active={item.session_id === activeId}
                    disabled={busy}
                    onSelect={() => onSelect(item.session_id)}
                    onRename={(title) => onRename(item.session_id, title)}
                    onDelete={() => onDelete(item.session_id)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </nav>
    </div>
  );
}
