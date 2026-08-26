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

## 4. Create ownership (single site)

**Only `src/app/chat/page.tsx` creates sessions.**

| Surface | Responsibility |
|---------|----------------|
| `chat/page.tsx` | Call `createChatSession` → `router.replace(/chat/<id>?…)` preserving search params. Show loading/error during create. Guard against double-invoke (React Strict Mode / remount). |
| `chat/[sessionId]/page.tsx` | Render `ChatWorkspace` only. Never create. |
| `ChatWorkspace` | If mounted under `[sessionId]`, load that id. “New chat” and any “start empty” action only `router.push("/chat")` (or `/chat?…` for roadmap). Never call create itself. |
| Entry links (sidebar, dashboard, practice, sandbox, roadmap) | Navigate to `/chat` or `/chat?…` only — never invent a session id. |

This prevents double-create.

---

## 5. Routing

| URL | Behavior |
|-----|----------|
| `/chat` | Create session → `replace` to `/chat/<session-id>` + **unchanged** existing query string. |
| `/chat/[sessionId]` | Load that session’s turns (may be empty). Missing / wrong owner → not-found + New chat CTA → `/chat`. |
| `/chat/[sessionId]?concept_id=&node_id=&stage=&prompt=&fresh=1` | Load that id; apply roadmap/study context from query. |

**Preserve existing query keys** (do not rename): `concept_id`, `node_id`, `stage`, `prompt`, `fresh`. Names above are the real keys from `buildContinueChatUrl`.

**App Router:**

- Keep `src/app/chat/page.tsx` as create-then-redirect only (no full workspace UI after success).
- Add `src/app/chat/[sessionId]/page.tsx` wrapping `ChatWorkspace` in the same AuthGuard/Suspense pattern.

**Middleware:** `/chat/:path*` already protected — no change required beyond verifying.

---

## 6. Frontend behavior (`ChatWorkspace`)

### 6.1 Bootstrap (only on `/chat/[sessionId]`)

- Read `sessionId` from the route.
- Fetch session detail; set messages (possibly `[]`).
- Optionally mirror id into `SESSION_STORAGE_KEY`; **URL is source of truth**.
- Do **not** restore last session from storage.
- Do **not** auto-select `mapped[0]`.

### 6.2 Entry points

All “open Study Session / start empty” navigations go to bare `/chat` (plus query if needed):

- Sidebar Study Session → `/chat`
- Dashboard / Practice / Sandbox starts → `/chat` or `/chat?…`
- Roadmap Start/Continue → `/chat?concept_id&node_id&stage&prompt&fresh=1` (always `fresh=1` for new session; update `buildContinueChatUrl` / `resolveNodeEntry` so Continue no longer resumes a prior transcript)

After create, page replaces to `/chat/<newId>?…` and roadmap bind is written as `{ sessionId: newId, stageIndex }` (from ChatWorkspace when it sees `node_id`, or from page after create — prefer ChatWorkspace once on `[sessionId]` so stage logic stays in one place).

### 6.3 Session list & New chat

- `selectSession(id)` → `router.push(/chat/<id>)` (load via route bootstrap).
- New chat → `router.push("/chat")` only.

### 6.4 Roadmap resume path — removed

Delete the “roadmap resume bound session transcript” and “free chat restore last session” branches on open.

- Bound `sessionId` is **not** used to reopen an old transcript when entering from roadmap.
- Bind still stores the **current** lesson session + stage for mid-lesson UI (stage chips) after the new session is created.
- Refresh on `/chat/<id>?node_id=…` loads **that** id (page is `[sessionId]`, so no create).
- `fresh=1`: after applying one-shot lesson setup (stage/prompt), strip it with  
  `router.replace(/chat/<currentSessionId>?…without fresh)`.  
  **Never** replace to bare `/chat` — that would create a second session.

### 6.5 Loading UX on `/chat`

While create runs: short “Starting session…” (or existing Suspense fallback). On failure: error + retry that re-calls create once (no auto-loop).

### 6.6 Session id plumbing & storage

- `[sessionId]/page.tsx` passes `sessionId` into `ChatWorkspace` as a **required prop** (preferred over re-reading `useParams` inside the workspace).
- Keep writing `SESSION_STORAGE_KEY` when the active id changes (harmless mirror for any leftover readers). Stop **reading** it for bootstrap/restore. Full removal of the key is out of scope unless nothing else references it after a quick grep.

---

## 7. Backend (`Aeropt-agent`)

### 7.1 New endpoint

```
POST /api/v1/chat/sessions
Body: { "user_id": "<uuid>" }
Response: { "session_id": "<uuid>" }
```

Implementation: `db.create_session(user_id)`; return id. Same caller-supplied `user_id` model as message API.

Register as a distinct FastAPI route on the same path prefix as the existing  
`GET /api/v1/chat/sessions` list handler (POST create + GET list coexist).

### 7.2 Unchanged

- `POST /api/v1/chat/message` — first message uses pre-created `session_id`.
- `GET /api/v1/chat/sessions`, detail, and end-session endpoints unchanged.

### 7.3 Frontend client

Add `createChatSession(userId)` in `src/lib/agent.ts`.

---

## 8. Error handling

| Case | Behavior |
|------|----------|
| Create fails | Stay on `/chat`; show error + retry. No redirect loop. |
| Unknown / other-user `sessionId` | Not-found on workspace; CTA New chat → `/chat`. |
| Strict Mode double mount on `/chat` | Create at most once (ref/lock or abort duplicate). |

---

## 9. Testing (manual)

1. Open Study Session → `/chat/<uuid>`, empty, no prior turns.
2. Send a message → same URL; refresh keeps history.
3. Open Study Session again → different uuid, empty.
4. Click older session → `/chat/<old-id>` with prior turns.
5. Roadmap Start and Continue → each get a **new** `/chat/<id>?concept_id&node_id&stage&prompt&fresh=1`, empty then auto-prompt.
6. Refresh mid-lesson on that URL → same session, not a new one.
7. Audit navigators: `StudySidebar`, `DashboardContent`, `PracticeContent`, `SandboxCardDeck`, `RoadmapContent` — all empty starts hit `/chat[?…]`.

---

## 10. Out of scope

- Deleting empty unused sessions.
- Session title renaming / sharing.
- Changing Django auth.
- Personalization / policy-plane agent rewrite.

---

## 11. Files likely touched

- `Aeropt-agent/api_server.py` — POST create session
- `Aeropt-frontend/src/lib/agent.ts` — `createChatSession`
- `Aeropt-frontend/src/app/chat/page.tsx` — create + redirect only
- `Aeropt-frontend/src/app/chat/[sessionId]/page.tsx` — new
- `Aeropt-frontend/src/components/ChatWorkspace.tsx` — load by route id; New chat → `/chat`; remove restore/resume-on-open
- `Aeropt-frontend/src/lib/roadmap.ts` — Continue always new session (`fresh=1`); URLs remain `/chat?…`
- Entry components only if any deep-link to a stale pattern (verify `StudySidebar`, Dashboard, Practice, Sandbox)
- `Aeropt-frontend/src/middleware.ts` — verify only
