# Study Session URL Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or implement task-by-task). Steps use checkbox syntax.

**Goal:** `/chat` always creates a new empty session and redirects to `/chat/<session-id>`; history only loads via that path.

**Architecture:** Thin `POST /api/v1/chat/sessions` on the agent; frontend `chat/page.tsx` is the sole create site; `chat/[sessionId]/page.tsx` hosts `ChatWorkspace` with a required `sessionId` prop.

**Tech Stack:** FastAPI, Next.js App Router, existing Supabase session table via `db.create_session`.

---

### Task 1: Backend create session

- Modify: `Aeropt-agent/api_server.py`
- [ ] Add `CreateSessionRequest` / response models
- [ ] Add `POST /api/v1/chat/sessions` calling `db.create_session`

### Task 2: Frontend API client

- Modify: `Aeropt-frontend/src/lib/agent.ts`
- [ ] Add `createChatSession(userId)`

### Task 3: Routes

- Modify: `Aeropt-frontend/src/app/chat/page.tsx` — create + replace
- Create: `Aeropt-frontend/src/app/chat/[sessionId]/page.tsx` — AuthGuard + ChatWorkspace

### Task 4: Roadmap Continue = fresh transcript + bound stage

- Modify: `Aeropt-frontend/src/lib/roadmap.ts` — `resolveNodeEntry` resume → `fresh: true`, keep stage

### Task 5: ChatWorkspace

- Modify: `Aeropt-frontend/src/components/ChatWorkspace.tsx`
- [ ] Require `sessionId` prop; bootstrap load that id only
- [ ] Strip `fresh` to `/chat/<sessionId>?…` never bare `/chat`
- [ ] New chat / end session → `router.push("/chat")`
- [ ] selectSession → `router.push(/chat/<id>)`
- [ ] Remove last-session restore and roadmap transcript resume

### Task 6: Verify entry points still use `/chat`

- Grep navigators; fix if any invent session ids
