# Study Session URL Routing (ChatGPT-style)

**Date:** 2026-08-26  
**Status:** Approved design (Approach 1)  
**Goal:** Opening Study Session always starts an empty new chat; every chat lives at `/chat/<session-id>`.

---

## 1. Problem

Today:

- Bare `/chat` restores the last session from `localStorage` (`agent_active_session_id`) or the newest listed session.
- Session identity is not in the path — only query params (roadmap) appear in the URL.
- Roadmap Start/Continue can resume a bound prior transcript.

Users expect ChatGPT/Gemini behavior: nav to Study Session → blank chat with its own URL; history opens only when selected.

---

## 2. Success criteria

1. Navigating to Study Session (sidebar, Dashboard “Start a session”, Practice, etc.) creates a **new** empty session and lands on `/chat/<session-id>`.
2. Roadmap Start/Continue also creates a **new** session (no resume of prior transcript); URL is `/chat/<session-id>?…roadmap params`.
3. Opening `/chat/<existing-id>` loads that session’s history.
4. Sidebar session click navigates to `/chat/<that-id>`.
5. “New chat” creates another new session and navigates to its URL.
6. Refresh on `/chat/<id>` keeps that session (does not spawn another).

---

## 3. Approach

**Server-create on open (Approach 1).**

Add `POST /api/v1/chat/sessions` that inserts an empty Supabase session and returns `{ session_id }`. The frontend redirects `/chat` → `/chat/<id>` before any message.

Rejected alternatives:

- Client UUID without DB row — agent 404s if `session_id` is sent but missing.
- Delay id until first message — violates “id always in URL on empty open.”

---

## 4. Routing

| URL | Behavior |
|-----|----------|
| `/chat` | Authenticated bootstrap: create session → `router.replace(/chat/<id>[?query])`. Preserve roadmap/study query params. |
| `/chat/[sessionId]` | Load session detail (turns may be empty). If session missing / not owned → error + offer New chat. |
| `/chat/[sessionId]?node=…&concept=…&stage=…` | Same load; roadmap context from query (and bind update to this id). |

**App Router:** add `Aeropt-frontend/src/app/chat/[sessionId]/page.tsx` (reuse `ChatWorkspace`). Keep `chat/page.tsx` as the “create then redirect” entry.

**Middleware:** protect `/chat/:path*` (already covered).

---

## 5. Frontend behavior (`ChatWorkspace`)

### 5.1 Bootstrap

- If route has **no** `sessionId` (`/chat`): call `createChatSession(userId)` → set active id → `replace` to `/chat/<id>` (+ existing search params). Empty messages. Do **not** restore `SESSION_STORAGE_KEY`.
- If route has `sessionId`: set active id, fetch history (empty OK). Update `SESSION_STORAGE_KEY` optionally for legacy; **URL is source of truth**.

### 5.2 Entry points

Update links that go to Study Session:

- Sidebar Study Session → `/chat` (triggers create).
- Dashboard / Practice “start” → `/chat`.
- Roadmap `buildContinueChatUrl` → `/chat?…` (no session in path yet; page creates then replace). Or create then push `/chat/<id>?…` from the caller — either is fine; prefer centralizing create in `/chat` page so all entry points stay `/chat[?…]`.

### 5.3 Session list & New chat

- `selectSession(id)` → `router.push(/chat/<id>)` (history load from route effect).
- New chat → `router.push(/chat)` or create + `push(/chat/<newId>)`. Prefer `push(/chat)` so one code path creates.

### 5.4 Roadmap

- Always new session on Start/Continue (`fresh` / no resume of bound transcript).
- After create, write roadmap bind `{ sessionId: newId, stageIndex }`.
- Mid-lesson refresh on `/chat/<id>?node=…` still loads **that** id (not create again).

### 5.5 Remove / reduce

- Stop “Free chat: restore last active session” branch on bare `/chat`.
- Stop auto-picking `mapped[0]` as active on open.

---

## 6. Backend (`Aeropt-agent`)

### 6.1 New endpoint

```
POST /api/v1/chat/sessions
Body: { "user_id": "<uuid>" }
Response: { "session_id": "<uuid>" }
```

Implementation: call existing `db.create_session(user_id)`; return id. Auth model unchanged (caller-supplied `user_id`, same as message API).

### 6.2 Unchanged

- `POST /api/v1/chat/message` still accepts `session_id`; first message uses the pre-created id.
- `GET …/sessions`, `GET …/sessions/{id}`, `POST …/end-session` unchanged.

### 6.3 Frontend client

Add `createChatSession(userId)` in `src/lib/agent.ts`.

---

## 7. Error handling

| Case | Behavior |
|------|----------|
| Create session fails | Show error on `/chat`; do not loop redirect. |
| Load unknown / other-user id | Show not-found; CTA New chat → `/chat`. |
| Create succeeds, replace fails | Unlikely; if stuck on `/chat` without id, allow retry once with guard against infinite redirect. |

---

## 8. Testing (manual)

1. Open Study Session → URL is `/chat/<uuid>`, empty composer, no prior turns.
2. Send a message → same URL; history persists on refresh.
3. Open Study Session again from sidebar → different new uuid, empty.
4. Click older session in list → `/chat/<old-id>` with prior turns.
5. Roadmap Start → `/chat/<new-id>?…`, empty then auto-prompt as today.
6. Refresh mid-roadmap lesson on that URL → same session, not a new one.

---

## 9. Out of scope

- Deleting empty unused sessions.
- Session title renaming / sharing.
- Changing Django auth.
- Personalization / policy-plane agent rewrite.

---

## 10. Files likely touched

- `Aeropt-agent/api_server.py` — POST create session
- `Aeropt-frontend/src/lib/agent.ts` — `createChatSession`
- `Aeropt-frontend/src/app/chat/page.tsx` — create + redirect
- `Aeropt-frontend/src/app/chat/[sessionId]/page.tsx` — new
- `Aeropt-frontend/src/components/ChatWorkspace.tsx` — bootstrap / select / new chat
- `Aeropt-frontend/src/lib/roadmap.ts` — URLs stay `/chat?…` (create on entry)
- `Aeropt-frontend/src/components/StudySidebar.tsx` — href `/chat` (unchanged path)
- `Aeropt-frontend/src/middleware.ts` — confirm `/chat/:path*`
