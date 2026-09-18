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

## Math rendering

Every student-facing string goes through `prepareMathMarkdown` (`src/lib/mathHarden.ts`)
before `react-markdown` sees it. Three layers, in order:

| layer | file | job |
|---|---|---|
| normalise | `src/lib/markdownMath.ts` | `\(…\)`/`\[…\]` → `$`/`$$`, unicode → macros, escape prices, unwrap sentences the model wrapped in `$…$`, delimit bare TeX, give display blocks their own line |
| choose | `src/lib/mathHarden.ts` | run the aggressive and conservative pipelines, score both with KaTeX, keep the better one — preprocessing may not make a message worse |
| veto | `src/lib/mathHarden.ts` | parse each span with **KaTeX itself**; what it rejects becomes text, not a red error |
| guarantee | `src/lib/rehypeKatexSafe.ts` | runs *after* rehype-katex and replaces any surviving error node with the formula as `code` |

The last layer is the one that actually guarantees it. A regex cannot reproduce exactly
which substrings remark-math treats as maths — auditing the corpus found five error
nodes the pre-pass had never inspected — so the final check happens after KaTeX has run,
where there is nothing left to guess.

```bash
npm run test:latex    # 1500+ fixtures: nothing breaks, and no valid maths is lost
npm run test:render   # the real remark-math → rehype-katex pipeline, 0 error nodes
npm run latex:audit   # corpus fixture, fails on any breakage
npm run latex:render  # corpus fixture through the real pipeline
```

Regenerate `fixtures/latex-corpus.json` from the agent with `make latex-fixture`; the
agent side of the same contract lives in `Aeropt-agent/utils/latex_guidelines.py` and
`Aeropt-agent/tests/test_latex_contract.py`.

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
