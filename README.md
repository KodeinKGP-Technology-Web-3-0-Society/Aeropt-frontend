# PrepWise — Frontend

Next.js 16 app for PrepWise: landing, auth, onboarding, dashboard, roadmap,
progress, practice, and the Study Session (`/chat`).

Port **3000**. Django (`:8000`) is auth and roadmaps. The Learning Agent
(`:8001`) is live chat. The student does not pick an agent.

## Routes

| Path | What |
|---|---|
| `/` | Marketing landing |
| `/auth` | Login / signup |
| `/onboarding` | Journey, exam, placement |
| `/dashboard` | Streak, queue, custom session |
| `/roadmap` | PCM path |
| `/progress` | Mastery |
| `/practice` | Practice canvas |
| `/chat`, `/chat/[sessionId]` | Study Session |

Chat UI: `src/components/ChatWorkspace.tsx` plus `src/components/chat/`.
Math rendering: `src/lib/markdownMath.ts`.

## Env

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_AGENT_API_BASE=http://127.0.0.1:8001
```

## Run

```bash
npm install
npm run dev
```

| Command | What |
|---|---|
| `npm run dev` | Dev server |
| `npm run ci` / `make ci` | Lint, math self-test, typecheck, production build |
| `npm run start` | Serve a production build |
| `make deploy` | Start `:3000` if it is down |

Stack: Next.js 16, React 19, Tailwind CSS 4, TypeScript.
