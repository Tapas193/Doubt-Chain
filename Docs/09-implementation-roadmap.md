# Doubt Chain — Implementation Roadmap

**Project:** Doubt Chain — AI-Powered, Organization-Specific Knowledge & Doubt Resolution Platform  
**Hackathon:** GRAPHITE 26 — GEHU Bhimtal — PS 14 — EdTech  
**Document ID:** 09-implementation-roadmap.md  
**Version:** 1.0 — 2026-10-27  
**Status:** Design Proposal (pre-implementation)  
**Companion docs:** [07-system-architecture.md](07-system-architecture.md) · [08-technical-design.md](08-technical-design.md) · [10-testing-and-validation.md](10-testing-and-validation.md)

---

## 1. Scope and Assumptions

### 1.1 Objective

Translate the architecture ([07-system-architecture.md](07-system-architecture.md)) and technical design ([08-technical-design.md](08-technical-design.md)) into an **ordered, executable plan** that a student team can follow from empty repo to hackathon demo without getting blocked.

### 1.2 What Is MVP vs Later

| Scope | Includes | Demo Promise |
|---|---|---|
| **MVP (P0)** | Org/subject boards, auth + membership, question CRUD, answer CRUD, accept/resolve, keyword search, upvote, comments (flat) | "We solved PS 14's core: persistent, searchable Q&A with resolution." |
| **Main differentiators (P1)** | Semantic search (Chroma), RAG chatbot with citations, AI evaluation (provisional scores) | "We added AI that actually helps: grounded answers + quality signals." |
| **Optional (P2)** | Multilingual retrieval validation, roadmap chatbot, image/voice input, advanced moderation/analytics | "We explored extensions without breaking MVP." — demo only if tested. |

> **Rule:** Never sacrifice P0 reliability for P2 novelty. Judges penalize broken core features more than missing extras.

### 1.3 Schedule Assumptions

- Team size and individual skill mix are **not assumed**. Phases are described by objective + prerequisites so they work for 2–5 contributors.
- Effort ranges are given in **story points / relative effort**, not fixed hours, because hackathon timelines vary (48-hour sprint vs 2-week build).
- If the team has a hard deadline (e.g., demo on Day 3), work backwards: P0 must be integrated by the midpoint; P1 by 75%; P2 is stretch.

### 1.4 How to Use This Document

1. Read §2 Prioritization to agree what to cut first.
2. Follow §3 Phases in order — each lists prerequisites, tasks, acceptance criteria, and failure modes.
3. Check §4 Dependency Graph before parallelizing.
4. §5 Task breakdown is the sprint backlog — assign from there.
5. §9 MVP Fallback tells what to drop if time is short.
6. §11 Demo Script is the rehearsal checklist.

---

## 2. Feature Prioritization

### P0 — Essential (Ship or Fail)

| Feature | Why Essential | Depends On |
|---|---|---|
| Repo, env, DB setup | Nothing runs without it | — |
| PostgreSQL schema + migrations | Source of truth | Repo |
| Auth (register/login/me) + JWT middleware | All protected routes need it | DB |
| Organizations CRUD + memberships + `requireMembership` middleware | Org isolation is non-negotiable | Auth |
| Subjects (per-org boards) | PS 14 requires subject-wise doubt boards | Orgs |
| Questions: create / list / get / edit | Core PS 14 workflow | Auth + Orgs + Subjects |
| Answers: create / list / edit / soft-delete | Peer resolution | Questions |
| Accept answer + resolve question | Transforms Q&A into knowledge | Questions + Answers |
| Keyword search (`ILIKE`) | Search-before-post baseline | Questions |
| Votes (upvote/downvote) + UNIQUE constraint | PS 14 upvoting requirement | Answers |
| Comments (flat) | Discussion | Answers |
| Frontend shells: login, org list, subject board, question feed, question detail, ask form | End-to-end demo needs UI | Backend APIs |
| Deployment (frontend + backend + PG) | Judges see a live link | All above |

### P1 — Main Differentiators (Judge-Impressing AI)

| Feature | Why P1 | Depends On |
|---|---|---|
| Embedding model integration + Chroma collection setup | Enables semantic search | P0 questions |
| Semantic search API + frontend "similar questions before posting" | Core AI differentiator | Embeddings + Chroma + P0 search |
| RAG pipeline: retrieval → prompt → LLM → citations + disclaimer | Grounded AI answers | Semantic search + LLM provider |
| AI answer endpoint + frontend "Ask AI" panel with sources | Visible AI value | RAG |
| AI answer evaluation (score + breakdown + suggestions) | Quality signal for peer answers | Answers + LLM |
| Vector indexing lifecycle: on resolve → upsert, on reopen → delete, retry | Keeps knowledge base fresh | P0 resolve + Chroma |
| Org-scoped RAG isolation tests | Security (no cross-org leakage) | RAG |

### P2 — Optional Enhancements (Only After P0+P1 Stable)

| Feature | Note | Depends On |
|---|---|---|
| Multilingual retrieval (EN + Hindi/Hinglish test set) | Requires multilingual embedding model + validation | P1 semantic search |
| Personalized roadmap chatbot | Separate LLM flow, lower priority per spec §9 | P1 LLM integration |
| Image upload for questions (MIME allowlist, 5 MB limit) | Desirable per PS 14 but not MVP blocker | P0 questions |
| Voice-note (Whisper STT) | High complexity, defer | P0 questions |
| Advanced moderation (reports table, admin queue) | Basic flag is P0; full queue is P2 | P0 |
| Analytics dashboard (top subjects, unresolved rate) | Nice-to-have | P0 |

---

## 3. Development Phases

### Phase 0 — Repository and Project Setup

**Objective:** Every contributor can clone, install, run, and push without "works on my machine."

**Prerequisites:** None

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 0.1 | Create GitHub repo `doubt-chain` with `main` protected + `develop` branch | Any | Repo |
| 0.2 | Choose directory structure (see §7) and commit README with project vision + companion doc links | Any | `README.md` |
| 0.3 | Initialize backend: `npm init`, Express, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `zod`, `pg`, `bcrypt`, `jsonwebtoken` | Backend | `backend/package.json` |
| 0.4 | Initialize frontend: `npm create vite@latest frontend -- --template react-ts`, Tailwind, `react-router-dom`, `axios` or `fetch`, TanStack Query | Frontend | `frontend/package.json` |
| 0.5 | Create `.env.example` (see 08-design §14) + `.gitignore` (`.env`, `node_modules`, `chroma_data`) | Backend | `.env.example` |
| 0.6 | Add `docker-compose.yml` for local Postgres + optional Chroma (`chromadb/chroma`) | Backend | `docker-compose.yml` |
| 0.7 | Create `CONTRIBUTING.md` with branch naming (`feat/`, `fix/`) + commit convention | Any | `CONTRIBUTING.md` |
| 0.8 | Verify: `docker compose up -d` → Postgres reachable; `npm run dev` on both frontend/backend → "Hello Doubt Chain" | All | Smoke test |

**Expected deliverables:** Runnable empty apps, agreed env contract, docker-compose.

**Acceptance criteria:**

- [ ] `git clone && docker compose up -d && npm install && npm run dev` works on a fresh machine
- [ ] `.env.example` lists all required vars; no secrets committed
- [ ] CI (optional): `npm run lint` passes

**Common failure modes:**

- Tailwind v4 config change — pin version or follow official Vite guide
- `CORS_ORIGIN` mismatch — frontend cannot call backend; set `cors({ origin: process.env.CORS_ORIGIN })`
- Postgres `DATABASE_URL` format — use `postgres://user:pass@localhost:5432/db` not `postgresql://`

---

### Phase 1 — Database Schema and Backend Foundation

**Objective:** PostgreSQL is the source of truth; migrations run; health endpoint works.

**Prerequisites:** Phase 0

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 1.1 | Design SQL DDL from 08-design §3 (users, organizations, memberships, subjects, questions, answers, votes, comments, evaluations, roadmaps) | Backend + DB | `backend/migrations/001_initial.sql` |
| 1.2 | Implement migration runner (`npm run migrate` using `node-pg-migrate` or raw `pool.query` reading SQL files) | Backend | `backend/src/config/db.js`, `migrate.js` |
| 1.3 | Create seed script: GEHU org (`slug: gehu`), 5 subjects (DSA, DBMS, OS, CN, Web Dev), 2 test users, 1 question + 1 resolved Q&A for manual testing | Backend | `backend/seeds/seed.js` |
| 1.4 | Implement `AppError` classes, global error handler middleware, 404 handler, request logger | Backend | `src/middleware/errorHandler.js` |
| 1.5 | Implement `validate.js` (zod wrapper) + `rateLimit.js` | Backend | `middleware/` |
| 1.6 | Create `GET /api/health` returning `{ status:"ok", db:"connected", timestamp }` | Backend | `src/app.js` |
| 1.7 | Write DB integrity tests (see 10-testing §6): foreign keys, unique constraints, vote uniqueness | Backend | `backend/tests/db.test.js` |

**Expected deliverables:** Migrated DB, seeded data, health check, error handling.

**Acceptance criteria:**

- [ ] `npm run migrate` creates all tables; `SELECT * FROM questions` works
- [ ] Seed creates GEHU org + subjects visible via `psql`
- [ ] `GET /api/health` returns 200
- [ ] Invalid body returns 400 with `VALIDATION_ERROR` envelope

**Common failure modes:**

- FK cycle `questions.accepted_answer_id → answers` — create `answers` before adding FK or use `ALTER TABLE`
- `gen_random_uuid()` requires `pgcrypto` extension — add `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`
- `updated_at` trigger not firing — verify trigger per table

---

### Phase 2 — Authentication, Organizations, Authorization

**Objective:** Users can register, log in, join orgs, and are properly isolated.

**Prerequisites:** Phase 1

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 2.1 | Implement `POST /api/auth/register` (hash, insert, issue JWT) + `POST /api/auth/login` (compare, issue) + `GET /api/auth/me` | Backend | `modules/auth/` |
| 2.2 | Implement `authenticate` middleware (verify JWT from `Authorization` header) | Backend | `middleware/auth.js` |
| 2.3 | Implement `POST /api/organizations` (create + auto-admin membership) + `GET /api/organizations` (list) + `GET /api/organizations/:orgId` (member-only) | Backend | `modules/organizations/` |
| 2.4 | Implement `POST /api/organizations/:orgId/memberships` (join) + `GET /api/organizations/:orgId/members` + `PATCH /members/:userId` (admin only) | Backend | `modules/memberships/` |
| 2.5 | Implement `requireMembership` + `requireRole` middleware; apply to all org-scoped routes | Backend | `middleware/requireMembership.js` |
| 2.6 | Implement `GET/POST /api/organizations/:orgId/subjects` (moderator/admin create) | Backend | `modules/subjects/` |
| 2.7 | Frontend: Auth pages (Register, Login), auth store (JWT in httpOnly cookie or memory), protected route wrapper, org list + join button, subject board selector | Frontend | `frontend/src/pages/Auth`, `stores/auth` |
| 2.8 | Integration tests: unauthorized 401, cross-org 403, duplicate membership 409 (see 10-testing §5) | Backend | `tests/auth.test.js` |

**Expected deliverables:** Full auth flow, org isolation enforced.

**Acceptance criteria:**

- [ ] Register → auto-login → `GET /me` returns user + memberships
- [ ] Non-member cannot `GET /organizations/:orgId` (403) or `POST /organizations/:orgId/questions` (403)
- [ ] Admin can promote member to moderator; student cannot
- [ ] Frontend login persists across refresh; logout clears

**Common failure modes:**

- JWT in localStorage without httpOnly — XSS risk; document trade-off or use httpOnly cookie
- `requireMembership` not applied to `GET /questions/:id` — leaks cross-org question via direct ID; must derive org from question row
- `PATCH /members/:userId` allows self-promotion — check `actorRole === 'admin'`

---

### Phase 3 — Question and Answer Workflow

**Objective:** Core Q&A loop works end-to-end.

**Prerequisites:** Phase 2

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 3.1 | Implement `POST /api/organizations/:orgId/questions` (create, status=open) + `GET /api/organizations/:orgId/questions` (filter by subject/status/search, paginated) + `GET /api/questions/:id` (with answers) + `PATCH /api/questions/:id` (author only) | Backend | `modules/questions/` |
| 3.2 | Implement `POST /api/questions/:id/answers` + `GET /api/questions/:id/answers` (with vote counts + evaluation) + `PATCH /answers/:id` + `DELETE /answers/:id` (soft delete, auto-reopen if accepted) | Backend | `modules/answers/` |
| 3.3 | Implement `POST /api/questions/:id/accept` (transaction: update questions + set resolved_at) + `POST /api/questions/:id/reopen` | Backend | `modules/questions/` |
| 3.4 | Frontend: Question feed (filter by subject/status), question detail (answers list, accept button for author, edit/delete), ask form (title/body/subject), answer form | Frontend | `pages/Questions`, `components/QuestionCard` |
| 3.5 | Frontend state: loading, empty, error states for all Q&A views | Frontend | UI polish |
| 3.6 | Tests: create question, answer, accept, reopen, edit permissions (see 10-testing §4) | Backend | `tests/questions.test.js` |

**Expected deliverables:** Working Q&A loop without AI.

**Acceptance criteria:**

- [ ] Student can create question in DSA board → appears in feed filtered by DSA
- [ ] Senior can answer → answer appears under question
- [ ] Author can accept → question becomes `resolved` → `accepted_answer_id` set → feed filter `status=resolved` shows it
- [ ] Non-author cannot accept (403)
- [ ] Accepted answer deleted → question auto-reopens

**Common failure modes:**

- `status='resolved'` without `accepted_answer_id` — DB CHECK should catch; app must set both atomically
- N+1 query: listing 20 questions fires 20 `SELECT answers` — use `JOIN` or batch load
- Frontend shows stale `status` after accept — invalidate TanStack Query cache for question + feed

---

### Phase 4 — Search, Votes, Discussions, Resolution Polish

**Objective:** Community features complete; keyword search baseline works; knowledge becomes discoverable.

**Prerequisites:** Phase 3

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 4.1 | Implement `POST /api/answers/:id/votes` (upsert + toggle, UNIQUE constraint) + `DELETE /api/answers/:id/votes` + vote counts in answer response | Backend | `modules/votes/` |
| 4.2 | Implement `GET/POST /api/answers/:id/comments` (flat for MVP, threaded optional) | Backend | `modules/comments/` |
| 4.3 | Implement keyword search: `GET /api/organizations/:orgId/search?keyword=&subjectId=&page=&limit=` using `ILIKE` | Backend | `modules/search/` |
| 4.4 | Frontend: Upvote/downvote button (optimistic update, single vote per user), comment thread, vote counts, "Search before posting" preview (keyword) | Frontend | `components/VoteButton`, `CommentThread`, `SearchBar` |
| 4.5 | Polish accept/reopen UX: confirmation dialog, resolved badge, accepted answer highlight | Frontend | UI |
| 4.6 | Tests: duplicate vote 409/ toggle, comment CRUD, keyword search, vote counts (see 10-testing §4) | Backend | `tests/votes.test.js` |

**Expected deliverables:** Community engagement + discoverability.

**Acceptance criteria:**

- [ ] Upvote once → count 1; upvote again → toggle off → count 0; change to downvote → counts update
- [ ] Duplicate `INSERT votes` returns 409 or idempotent toggle (choose one, document)
- [ ] Keyword search `?keyword=queue` returns resolved questions with "queue" in title/body (org-scoped)
- [ ] Comments appear under answer; author can delete own comment

**Common failure modes:**

- Vote UNIQUE violation not caught → 500 instead of 409; add `try/catch` for `23505`
- Keyword search leaks cross-org — must include `WHERE organization_id=$1`
- Comment `parent_id` points to different answer — validate same `answer_id`

---

### Phase 5 — Semantic Search and ChromaDB Integration

**Objective:** Semantic search replaces keyword-only; organization-filtered vector retrieval works.

**Prerequisites:** Phase 4 (questions exist, keyword search baseline to compare)

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 5.1 | Choose embedding model: evaluate `multilingual-e5-small` vs `bge-m3` on 10-question sample (see 10-testing §7); document choice + dims | AI | `docs/embedding-choice.md` |
| 5.2 | Set up ChromaDB: `docker compose` service or embedded client; create collection `doubtchain_resolved` with `cosine` distance | Backend | `src/config/chroma.js` |
| 5.3 | Implement `EmbeddingService` interface: `embed(text): number[]` with provider switch (`huggingface` / `openai` / `local` / `mock`) | AI | `modules/ai/embeddingService.js` |
| 5.4 | Implement `indexQuestion(questionId)` — fetch PG row + accepted answer, build document (`Title + Body + Accepted Answer`), embed, `upsert` to Chroma | Backend | `modules/indexer/` |
| 5.5 | Implement `POST /api/organizations/:orgId/search/semantic` — embed query, Chroma `query(where:{organization_id})`, PG join, ranking, threshold filter | Backend | `modules/search/` |
| 5.6 | Wire indexing trigger: `POST /accept` → try `indexQuestion` synchronously (timeout 5s); on fail set `index_pending=true` | Backend | `modules/questions/` |
| 5.7 | Implement `DELETE` vector on `POST /reopen` + `DELETE /answers` (if accepted) | Backend | `modules/indexer/` |
| 5.8 | Implement `POST /api/admin/reindex/:questionId` + `GET /api/admin/index-pending` for retry | Backend | `modules/indexer/` |
| 5.9 | Frontend: "Similar questions found" panel before posting (debounced 400ms, top 3 cards with score + link + subject badge) | Frontend | `components/SimilarQuestions` |
| 5.10 | Tests: semantic retrieval top-3 recall on 20-question dataset; org isolation (see 10-testing §7) | AI + Backend | `tests/search.test.js` |

**Expected deliverables:** Semantic search with org filtering; indexing lifecycle.

**Acceptance criteria:**

- [ ] Resolve question A → vector `q_<id>` exists in Chroma with correct `organization_id` metadata
- [ ] Reopen A → vector deleted (or not returned in search)
- [ ] Query "Mera queue full kyu dikha..." returns same top result as English paraphrase (if multilingual model chosen)
- [ ] Search from org `gehu` never returns question from org `other` even if text identical
- [ ] `GET /admin/index-pending` lists failed indexes; `POST /admin/reindex/:id` retries

**Common failure modes:**

- Chroma `where` filter syntax wrong — verify `where: { organization_id: "uuid-string" }` (string, not UUID object)
- Embedding dims mismatch (e.g., 384 vs 1024) — collection must be recreated if model changes
- Synchronous indexing blocks response >2s — move to `p-queue` if needed (see 07-arch §10)
- `index_pending` flag never cleared on success — update row after successful upsert

---

### Phase 6 — RAG-Based Chatbot

**Objective:** "Ask AI" button returns grounded answer with citations + disclaimer when no context.

**Prerequisites:** Phase 5 (semantic retrieval + Chroma populated)

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 6.1 | Choose LLM provider (OpenAI `gpt-4o-mini`, Gemini Flash, or Groq `llama3.1:8b`); document in `.env.example` + fallback to `mock` | AI | `modules/ai/llmService.js` |
| 6.2 | Implement `LLMService` interface: `generate({system,user,maxTokens,temperature}): string` with provider switch + 8s timeout | AI | `modules/ai/llmService.js` |
| 6.3 | Implement RAG pipeline (see 08-design §10): load question → embed → Chroma query → PG join → build prompt → LLM → attach sources + grounded flag | AI | `modules/ai/rag.js` |
| 6.4 | Implement `POST /api/questions/:id/ai-answer` handler (rate limit 10/min/user) | Backend | `modules/ai/` |
| 6.5 | Frontend: "Ask AI" button on question detail → loading skeleton → rendered Markdown answer + source cards (clickable) + disclaimer badge ("AI-generated, not verified") | Frontend | `components/AiAnswerPanel` |
| 6.6 | Handle insufficient context: if no Chroma hits, prompt forces "No verified knowledge found — general explanation" disclaimer | AI | Prompt template |
| 6.7 | Log RAG calls (questionId, retrievedIds, latency, grounded) for evaluation | AI | Logger |
| 6.8 | Tests: RAG returns citations when context exists; returns disclaimer when no context; never leaks cross-org sources (see 10-testing §8) | AI + Backend | `tests/rag.test.js` |

**Expected deliverables:** Grounded AI answers with sources.

**Acceptance criteria:**

- [ ] Question with 2 resolved similar threads → AI answer cites both with links; `grounded:true`
- [ ] Question with no similar resolved threads → AI returns general explanation + "No verified knowledge found" disclaimer; `grounded:false`
- [ ] AI never returns cross-org question as source (tested with two orgs having similar questions)
- [ ] LLM timeout → 503 with retry message; peer answers still visible
- [ ] Rate limit: 11th request in 1 min → 429

**Common failure modes:**

- Prompt exceeds token limit — truncate context to 3 sources max, 3000 tokens
- LLM returns uncited answer — post-process to attach retrieved sources regardless
- `system` prompt not set — LLM hallucinates university policy; always include "Do not invent policies" instruction
- Frontend renders raw HTML from LLM — sanitize Markdown (DOMPurify) before display

---

### Phase 7 — AI Answer Evaluation

**Objective:** Answers show provisional quality badge with breakdown; scores never auto-delete.

**Prerequisites:** Phase 3 (answers exist) + Phase 6 (LLM service)

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 7.1 | Design evaluation prompt (see 08-design §11): criteria weights, JSON schema, instruction to accept alternative valid approaches | AI | `modules/ai/evaluator.js` |
| 7.2 | Implement `evaluateAnswer(answerId)` — fetch question+answer, call LLM with `response_format: json_object`, validate with Zod, retry once on invalid JSON | AI | `modules/ai/evaluator.js` |
| 7.3 | Implement `POST /api/answers/:id/evaluate` handler (rate limit 10/min) → save to `answer_evaluations` → return evaluation | Backend | `modules/ai/` |
| 7.4 | Wire auto-evaluation: `POST /answers` + `PATCH /answers/:id` enqueue evaluation (async, best-effort; failure does not block answer creation) | Backend | `modules/answers/` |
| 7.5 | Frontend: Evaluation badge on answer (score, breakdown bars, strengths/weaknesses/suggestions expandable), amber if <70 | Frontend | `components/EvaluationBadge` |
| 7.6 | Moderation note: score <70 shows "Needs review" but answer remains visible; report button always available | Frontend + Backend | UX |
| 7.7 | Tests: evaluation returns valid JSON for correct/partial/irrelevant answers; alternative correct approach not penalized (see 10-testing §9) | AI | `tests/evaluation.test.js` |

**Expected deliverables:** AI evaluation with moderation-safe workflow.

**Acceptance criteria:**

- [ ] Post correct answer → evaluation score ≥70, breakdown sums to score, strengths/suggestions present
- [ ] Post irrelevant answer → score low, explanation mentions irrelevance
- [ ] Alternative correct approach (e.g., array vs linked list queue) → not penalized below 70 if correct
- [ ] LLM returns invalid JSON → retry once → if still invalid, answer saved without evaluation, no crash
- [ ] Evaluation stored in `answer_evaluations` with `model_name`; latest shown

**Common failure modes:**

- LLM returns Markdown-wrapped JSON (```json ...) — strip fences before parse or instruct "Only JSON, no markdown"
- `score` != sum(breakdown) — validate and fix or reject; allow ±2 rounding
- Auto-evaluation blocks answer creation on LLM failure — decouple: save answer first, evaluate async

---

### Phase 8 — Multilingual Retrieval and Optional Roadmap Chatbot (P2 — Stretch)

**Objective:** Validate Hindi/Hinglish retrieval; optionally add roadmap chatbot without destabilizing P0/P1.

**Prerequisites:** Phase 5 (semantic search) + Phase 6 (LLM)

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 8.1 | Build 20–30 question multilingual test set (EN + Hindi + Hinglish variants) per 10-testing §10; measure Recall@3 for each embedding model; document results | AI | `data/multilingual-test-set.json`, `docs/multilingual-eval.md` |
| 8.2 | Tune similarity threshold (e.g., 0.30–0.50) based on test set; update `modules/search` config | AI | Config + docs |
| 8.3 | Frontend: language-agnostic search input (no separate language picker needed; embedding handles it); show demo query in Hindi/Hinglish in presentation | Frontend | Demo script |
| 8.4 | (Optional) Roadmap chatbot: `POST /api/roadmaps` — collect goal/skillLevel/hours/deadline, generate roadmap phases via LLM, optionally recommend org knowledge-base links via semantic search | AI + Backend | `modules/roadmaps/` |
| 8.5 | (Optional) Frontend: Roadmap form + timeline view + progress checkboxes | Frontend | `pages/Roadmap` |
| 8.6 | (Optional) Image upload: `multer` + allowlist + 5 MB limit + serve via backend | Backend | `modules/uploads/` |

**Expected deliverables:** Validated multilingual search; optional roadmap.

**Acceptance criteria:**

- [ ] Test set shows Recall@3 ≥ target (e.g., 0.70) for chosen model — clearly label as measured, not claimed
- [ ] At least 3 Hindi/Hinglish queries retrieve correct English-indexed resolved questions in top 3
- [ ] Roadmap chatbot (if implemented) generates phases + recommends relevant org questions; behind `FEATURE_ROADMAP` flag
- [ ] P0/P1 still pass all tests after P2 changes

**Common failure modes:**

- Multilingual model retrieves English well but fails on Hinglish Roman script — document limitation, don't claim universal support
- Roadmap chatbot hallucinates resources — must use RAG to recommend only existing org questions

---

### Phase 9 — Integration, Testing, Deployment, Demo Preparation

**Objective:** Integrated, tested, deployed, demo-ready.

**Prerequisites:** All prior phases (at least P0+P1)

**Tasks:**

| # | Task | Owner | Output |
|---|---|---|---|
| 9.1 | Full integration: wire frontend to deployed backend (not localhost); verify all P0+P1 flows end-to-end | All | Staging env |
| 9.2 | Run full test suite: unit + integration + authz + search + RAG + evaluation (see 10-testing.md) | All | `npm test` green |
| 9.3 | Performance spot-check: API latency <500ms (non-AI), search <1s, AI answer <8s (see 10-testing §12) | Backend + AI | Metrics log |
| 9.4 | Deploy backend (Render/Railway/Fly) + Postgres (Neon/Supabase) + Chroma (Cloud or embedded) + frontend (Vercel) | Any | Live URLs |
| 9.5 | Smoke-test deployed: register → join GEHU → ask → answer → accept → search retrieves → Ask AI cites | All | Deployed verification |
| 9.6 | Prepare demo script (§11) + judge Q&A (§ below) + architecture poster/slides | All | Slides, script |
| 9.7 | Record 2-min screen recording as backup (in case live demo fails) | Any | Video |
| 9.8 | Tag release `v0.1-mvp` + freeze `main`; no last-minute "improvements" | Any | Git tag |

**Expected deliverables:** Live deployment + tested flows + demo script.

**Acceptance criteria:**

- [ ] All P0 functional tests pass on deployed env
- [ ] Semantic search + RAG + evaluation work on deployed (not just local)
- [ ] Demo script rehearsed ≤7 minutes; backup video ready
- [ ] README includes live URLs + env setup + known limitations

**Common failure modes:**

- `CORS_ORIGIN` not set to deployed frontend URL → browser blocks API
- `DATABASE_URL` SSL required on Neon — add `?sslmode=require`
- Chroma Cloud collection not created → search returns 503; handle gracefully
- Last-minute env var missing → backend crash on boot; validate env at startup

---

## 4. Dependency Graph

```mermaid
flowchart TB
    P0["Phase 0<br/>Repo & Setup"]
    P1["Phase 1<br/>DB & Backend Foundation"]
    P2["Phase 2<br/>Auth & Orgs & AuthZ"]
    P3["Phase 3<br/>Questions & Answers<br/>+ Accept/Resolve"]
    P4["Phase 4<br/>Votes, Comments,<br/>Keyword Search"]
    P5["Phase 5<br/>Semantic Search<br/>Chroma + Embeddings"]
    P6["Phase 6<br/>RAG Chatbot"]
    P7["Phase 7<br/>AI Evaluation"]
    P8["Phase 8<br/>Multilingual +<br/>Roadmap (P2)"]
    P9["Phase 9<br/>Integration, Tests,<br/>Deploy, Demo"]

    P0 --> P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9

    P3 -.-> P7
    P5 -.-> P8
    P6 -.-> P8

    style P0 fill:#dbeafe,stroke:#3b82f6
    style P1 fill:#dbeafe,stroke:#3b82f6
    style P2 fill:#dbeafe,stroke:#3b82f6
    style P3 fill:#dcfce7,stroke:#16a34a
    style P4 fill:#dcfce7,stroke:#16a34a
    style P5 fill:#fef9c3,stroke:#ca8a04
    style P6 fill:#fef9c3,stroke:#ca8a04
    style P7 fill:#fef9c3,stroke:#ca8a04
    style P8 fill:#fce7f3,stroke:#db2777
    style P9 fill:#e0e7ff,stroke:#6366f1

    classDef p0 fill:#dbeafe,stroke:#3b82f6
    classDef p1 fill:#dcfce7,stroke:#16a34a
    classDef ai fill:#fef9c3,stroke:#ca8a04
    classDef p2 fill:#fce7f3,stroke:#db2777
```

**Critical path:** P0 → P1 → P2 → P3 → P4 → P5 → P6 → P9. P7 can overlap with P6; P8 is stretch.

**Parallelization opportunities:**

- After P2, frontend can build Q&A UI (P3) while backend implements vote/comment (P4).
- P7 (evaluation) can be built in parallel with P6 (RAG) — both use same LLM service.
- P8 (multilingual test set) can start during P5.

---

## 5. Task Breakdown (Sprint Backlog Summary)

| ID | Phase | Task | Effort | Acceptance |
|---|---|---|---|---|
| 0.1–0.8 | 0 | Repo, env, docker, health | Small per task | Clone+run works |
| 1.1 | 1 | DDL + migrations | Medium | Tables exist, CHECK constraints pass |
| 1.2–1.6 | 1 | Backend foundation, seed, error handling | Medium | Health 200, seed visible |
| 2.1–2.6 | 2 | Auth, orgs, memberships, subjects, middleware | Large | 401/403 tests pass; org isolation enforced |
| 3.1 | 3 | Questions CRUD | Medium | Create/list/get/edit + pagination |
| 3.2 | 3 | Answers CRUD + soft delete | Medium | Answer CRUD + auto-reopen on accepted delete |
| 3.3 | 3 | Accept/reopen transaction | Medium | Resolve sets status+accepted+resolved_at atomically |
| 3.4–3.5 | 3 | Frontend Q&A UI | Large | End-to-end Q&A loop in browser |
| 4.1 | 4 | Votes (UNIQUE) | Small | Toggle + 409 |
| 4.2 | 4 | Comments | Small | Flat comments under answers |
| 4.3 | 4 | Keyword search | Small | ILIKE org-scoped |
| 4.4–4.5 | 4 | Frontend votes/comments/search UI | Medium | Community features visible |
| 5.1 | 5 | Embedding model choice | Medium | Doc with Recall@3 comparison |
| 5.2–5.4 | 5 | Chroma setup + indexQuestion | Medium | Vector exists after resolve |
| 5.5 | 5 | Semantic search API | Medium | Top-K org-filtered results + PG join |
| 5.6–5.8 | 5 | Indexing trigger + fallback + admin retry | Medium | Pending flag + reindex endpoint |
| 6.1–6.4 | 6 | RAG pipeline + AI answer endpoint | Large | Grounded answer with citations |
| 6.5 | 6 | Frontend AI panel | Medium | Sources clickable, disclaimer visible |
| 7.1–7.5 | 7 | Evaluator prompt + service + endpoint + frontend badge | Large | Score + breakdown + suggestions |
| 8.1–8.2 | 8 | Multilingual test set + threshold tuning | Medium | Report with measured Recall@3 |
| 8.4–8.6 | 8 | Roadmap / image (optional) | Large (if done) | Feature-flagged, no P0 regression |
| 9.1–9.8 | 9 | Integration, deploy, demo | Large | Live URLs + passing tests + rehearsed demo |

**Total:** P0 alone is ~40% of effort; P0+P1 is ~75%. Plan accordingly.

---

## 6. Parallel Work

### 6.1 When to Parallelize

After Phase 2, the **API contract** (08-design §6) is the shared interface. If the team has ≥2 contributors, split:

| Contributor | Can Work On (in parallel) | Shared Interface to Agree First |
|---|---|---|
| **Frontend** | Auth pages, org/subject navigation, question feed, ask form, answer form | API paths + response shapes (08-design §6), JWT storage, pagination params |
| **Backend (DB/API)** | Questions/answers/votes/comments/search (keyword) | DB schema (08-design §3), auth middleware, error format |
| **AI/Retrieval** | Embedding service, Chroma setup, semantic search, RAG, evaluator | `EmbeddingService.embed()`, `LLMService.generate()`, Chroma metadata keys |

**Rules for safe parallel work:**

1. **Freeze API contract early** (end of Phase 2) — changes via PR with frontend+backend sign-off.
2. **Mock AI responses** for frontend dev: `if (process.env.MOCK_AI==="true") return mockAnswer` — don't block UI on LLM integration.
3. **Shared env file:** Commit `.env.example`; each dev copies to `.env` locally.
4. **Branch strategy:** See §7.

### 6.2 Integration Points (Don't Leave to End)

| Integration | When | How |
|---|---|---|
| Frontend ↔ Backend | After each backend endpoint is ready (Phase 2 onward) | Frontend calls real API (not mock) immediately; add to CI |
| PG ↔ Chroma | Phase 5 | Verify `indexQuestion` + `semanticSearch` end-to-end with 3 resolved questions |
| Search ↔ RAG | Phase 6 | Verify retrieved sources appear in AI answer |
| Evaluation ↔ Answers | Phase 7 | Verify new answer gets evaluation badge |

**Early end-to-end test (Phase 3):** Register → join GEHU → create question → answer → accept → verify PG state — no AI needed.

---

## 7. Git and Repository Workflow

### 7.1 Directory Structure (Proposed)

```
doubt-chain/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docs/
│   ├── 07-system-architecture.md
│   ├── 08-technical-design.md
│   ├── 09-implementation-roadmap.md
│   └── 10-testing-and-validation.md
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── organizations/
│   │   │   ├── subjects/
│   │   │   ├── questions/
│   │   │   ├── answers/
│   │   │   ├── votes/
│   │   │   ├── comments/
│   │   │   ├── search/
│   │   │   ├── ai/
│   │   │   ├── indexer/
│   │   │   └── roadmaps/ (P2)
│   │   └── utils/
│   ├── migrations/
│   ├── seeds/
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/ (axios instance, typed endpoints)
│   │   ├── stores/ (auth, organization)
│   │   ├── pages/ (Login, Register, Organizations, Subjects, Questions, QuestionDetail, Roadmap)
│   │   ├── components/ (QuestionCard, AnswerCard, VoteButton, AiAnswerPanel, EvaluationBadge, SearchBar)
│   │   └── lib/ (utils, validators)
│   └── index.html
└── data/
    └── multilingual-test-set.json
```

### 7.2 Branching Conventions

- `main` — deployable, protected, PR-only, tests must pass.
- `develop` — integration branch (optional; for larger teams).
- Feature branches: `feat/auth`, `feat/questions`, `feat/semantic-search`, `fix/vote-unique`, `docs/architecture`.
- Keep branches short-lived (<2 days); rebase before PR.

### 7.3 Commit Practices

- Conventional commits: `feat: add semantic search endpoint`, `fix: enforce org isolation in GET /questions/:id`, `test: add vote uniqueness test`.
- No `commit -m "fix"` or `wip`; write what and why.
- No secrets in commits — `.env` is gitignored; pre-commit hook recommended (`husky` + `lint-staged`).

### 7.4 Pull-Request / Integration Checks

- PR template: what changed, how tested, docs updated?
- Required checks (if CI set up): `npm run lint`, `npm test`, `npm run build`.
- Reviewer verifies: no cross-org leakage, no plaintext password, no API key in frontend.

### 7.5 Environment-Variable Management

- `.env.example` committed; `.env` gitignored.
- Production env set in hosting dashboard (Vercel/Render env vars), not in repo.
- Startup validation fails fast if required vars missing (see 08-design §14).

### 7.6 Documentation Maintenance

- Update companion docs when design changes — PR must include doc update if API/schema changed.
- README contains: setup steps, live URLs, architecture diagram, known limitations, disclaimer (not officially affiliated with GEHU).

---

## 8. Integration Strategy

| Stage | What Integrates | Mock vs Real | Exit Criteria |
|---|---|---|---|
| Phase 2 | Frontend auth ↔ backend auth | Real JWT | Login persists; `me` returns memberships |
| Phase 3 | Frontend Q&A ↔ backend Q&A | Real PG | Create → answer → accept → resolved visible |
| Phase 4 | Frontend votes/comments ↔ backend | Real PG | Vote toggle + comments work; counts correct |
| Phase 5 | Backend search ↔ Chroma + embeddings | Real Chroma; mock embedding if no API key | Semantic search returns org-filtered results |
| Phase 6 | Frontend AI panel ↔ RAG | Real LLM (or mock fallback) | AI answer with sources + disclaimer |
| Phase 7 | Frontend evaluation badge ↔ evaluator | Real LLM (or mock) | Score + breakdown visible |
| Phase 9 | All on deployed env | Real hosted services | Live demo rehearsal passes |

**Early mocking:** Until Phase 5, semantic search endpoint can return keyword results with `mock:true` flag so frontend can build UI without waiting for embeddings.

---

## 9. MVP Fallback Plan

**Trigger:** Less than 50% of planned time remains and P0 is not fully integrated.

### What to Cut (in order)

| Priority | Cut | Preserved | How to Present |
|---|---|---|---|
| 1st | P2 roadmap chatbot | Core doubt resolution | "We focused on PS 14's central problem — persistent knowledge." |
| 1st | P2 image/voice upload | Text Q&A | "Text covers 90% of doubts; images are future work." |
| 2nd | P2 multilingual validation | English semantic search | "We built semantic search; multilingual validation needs more data." — still mention as future scope |
| 3rd | P1 AI evaluation | P0+P1 search+RAG | "We prioritized retrieval + grounded answers; evaluation is next." — show UI stub if time |
| 4th | P1 RAG | Semantic search (keyword-level AI = mock) | "Semantic search is live; grounded AI is our immediate next step." — last resort; try to keep RAG |
| **Never cut** | Org/subject boards, question/answer/accept, keyword search, votes | — | Without these, PS 14 is not solved. |

### Reduced-Scope Demo (Minimum Viable Demo)

If only P0 is ready:

1. Student logs in → joins GEHU → selects DSA board.
2. Searches keyword "queue" → sees resolved question.
3. Creates new question → senior answers → author accepts → resolved.
4. Keyword search now finds the new resolved question.
5. Explain: "Semester 2, this becomes semantic + AI-grounded."

This still demonstrates the **knowledge flywheel** — the project's core insight — even without AI.

### What Not to Do When Cutting

- Do not claim semantic/multilingual/RAG works if it doesn't — judges will test.
- Do not leave `FEATURE_ROADMAP` half-wired and broken — flag-gate it.
- Do not sacrifice auth isolation to save time — cross-org leak is a critical bug.

---

## 10. Definition of Done

Before the team declares the project complete, all of the following must be true:

### Functional

- [ ] User can register, log in, join organization, browse subjects
- [ ] User can create question (title+body+subject), view feed with filters, view detail with answers
- [ ] User can post answer, edit own answer, soft-delete own answer
- [ ] Question author can accept answer → status `resolved`, `accepted_answer_id` set, `resolved_at` set
- [ ] Author/moderator can reopen → status `open`, vector deleted
- [ ] Keyword search works org-scoped; semantic search (if P1) returns org-filtered top-K with scores
- [ ] Upvote/downvote with UNIQUE constraint; counts correct; comments work
- [ ] AI answer (if P1) returns grounded answer with sources or disclaimer when no context
- [ ] AI evaluation (if P1) shows score + breakdown + suggestions; never auto-deletes

### Security

- [ ] Non-member cannot access org questions (403 on all org-scoped routes)
- [ ] Non-author cannot accept (403)
- [ ] Duplicate vote prevented by DB constraint
- [ ] No secrets in frontend or repo; env vars validated at startup
- [ ] Inputs validated with zod; SQL parameterized
- [ ] Rate limits on auth, AI, voting endpoints

### Data Consistency

- [ ] `status='resolved'` always has `accepted_answer_id` (CHECK or app invariant)
- [ ] Resolved question has Chroma vector; reopened question does not
- [ ] Stale vector cleanup (missing PG row) handled
- [ ] Pagination works; no N+1 on feed

### AI Handling

- [ ] AI unavailable → 503 with friendly message; peer answers still visible
- [ ] Chroma unavailable → fallback to keyword search
- [ ] No hallucinated university policy; disclaimer present when no sources
- [ ] Evaluation score labeled provisional, not proof of correctness

### Deployment & Demo

- [ ] Frontend + backend + PG deployed; live URLs in README
- [ ] Deployed smoke test passes (register→ask→answer→accept→search)
- [ ] Demo script rehearsed ≤7 min; backup video recorded
- [ ] Known limitations documented (08-design §15, 07-arch §13)

---

## 11. Final Demonstration Preparation

### 11.1 Ordered Demo Script (7 Minutes Target)

**Setup (before judges arrive):** Two browser windows logged in as `student_a` (junior, asker) and `senior_b` (senior, answerer); GEHU org with DSA subject and 2 pre-seeded resolved questions for search demo. Deployed URLs open.

| Time | Actor | Action | What Judges See | Narrative |
|---|---|---|---|---|
| 0:00 | Narrator | Intro (30s) | Slide: Problem → Solution | "WhatsApp doubts get buried. Doubt Chain turns them into persistent, searchable knowledge for GEHU." |
| 0:30 | `student_a` | Searches "circular queue full" (keyword/semantic) | Search returns 1 resolved thread "Why circular queue shows overflow..." with accepted answer + 12 upvotes | "A junior searches before asking — knowledge is reused." |
| 1:30 | `student_a` | Opens thread, clicks "Ask AI" | AI panel: grounded answer with 2 citations + disclaimer | "AI explains using verified community answers, not hallucination." |
| 2:00 | `student_a` | Asks new question: "Can't insert into circular queue — size 5, front 2 rear 1" (different wording, same problem) | New question created, status `open` | "New wording, same underlying doubt." |
| 2:30 | `senior_b` | Posts answer: "Check (rear+1)%size==front..." | Answer appears, evaluation badge animates: Score 84, strengths/suggestions | "Peer answers + AI quality signal — provisional, not proof." |
| 3:30 | `student_a` + `senior_b` | `student_a` upvotes, `senior_b` comments "Edge case: front==-1" → `student_a` accepts | Question → `resolved`, green badge, accepted answer highlighted; vote count 1 | "Community feedback → human acceptance → knowledge captured." |
| 4:30 | Narrator | Searches again with Hinglish (if validated): "Mera circular queue full kyu dikha raha hai?" | Same resolved question appears top-1 (multilingual retrieval) | "Same doubt, different language — still found. (If validated; else skip.)" |
| 5:00 | Narrator | Shows architecture diagram + security: org isolation, RAG grounding, vector lifecycle | Slide: modular monolith, PG source of truth, Chroma index, org filter | "Backend-enforced org isolation; no cross-org leakage; RAG cites sources." |
| 5:45 | Narrator | Limitations + future: what we didn't claim, roadmap chatbot stub (if P2) | Slide: limitations, extensibility to other orgs | "We don't claim perfect AI — we show provisional scores + disclaimers. Next: other orgs, analytics." |
| 6:30 | Judges | Q&A | — | See §11.2 |

**If multilingual not validated:** Skip Hinglish step; show English paraphrase retrieval instead ("Why can't I insert into circular queue?" → same top result). Never demo untested feature.

**If time short:** Cut roadmap/limitations to 15s; keep Q&A → knowledge → AI → community → resolution arc.

### 11.2 Judge Q&A Preparation (Difficult Questions)

| Question | Strong Answer |
|---|---|
| "Isn't this just a chatbot?" | "No. The chatbot is one feature. Our core is the growing org-scoped knowledge base: resolved threads become searchable vectors. Chatbot without that is generic; with it, answers are grounded and citable." |
| "How do you prevent wrong answers from polluting the index?" | "Only `status='resolved'` + `accepted_answer_id` is indexed. Unverified answers never enter Chroma. Acceptance is human (author/moderator). Scores are provisional, not indexing gates." |
| "What if AI evaluation is wrong?" | "We treat scores as signals, not proof. No auto-delete. Low score → 'Needs review' badge + flag for moderator. Human acceptance is authoritative." |
| "Can a GEHU student see another university's questions?" | "No. Every PG query and Chroma query filters by `organization_id` derived server-side from membership. We test cross-org 403 and retrieval isolation." |
| "Does multilingual search really work?" | "We tested with 20–30 EN/Hindi/Hinglish variants. Recall@3 is X (measured). It works for Hindi/Hinglish Roman script with e5-small; we document failures. We don't claim full translation." |
| "What if OpenAI quota runs out?" | "LLM is behind an interface; we can swap to Gemini/Groq/Ollama. If all fail, app degrades to peer answers + keyword search — P0 still works." |
| "Is this officially GEHU?" | "No. GEHU is a prototype organization in our system. We include a disclaimer and use no official data without permission." |
| "Why not microservices/Kubernetes?" | "For a hackathon prototype with hundreds of users, a modular monolith is simpler to build, test, and explain. We can split later if scale demands." |

---

## 12. Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Fallback |
|---|---|---|---|---|---|
| R1 | LLM API quota / 500 / timeout | Medium | High (RAG + evaluation down) | Swappable provider + mock fallback; short timeout 8s + 503 handling | Peer answers + keyword search still work; degrade gracefully |
| R2 | Poor semantic retrieval (low Recall@3) | Medium | High (core differentiator weak) | Tune threshold; include accepted answer in vector doc; test with 20-Q set early (Phase 5) | Keyword search remains; explain threshold calibration as future work |
| R3 | Multilingual retrieval fails for Hinglish | Medium | Medium (P2) | Evaluate two models; document measured results; don't claim universal | Demo English paraphrase retrieval; list as limitation |
| R4 | Cross-org data leak (missing filter) | Low | Critical (security) | Enforce org_id in every handler; integration tests for 403 + retrieval isolation | Fix immediately; block demo until passing |
| R5 | Chroma downtime / collection corruption | Low | Medium | Keyword fallback; `index_pending` + retry; reindex endpoint | Search degrades to keyword; no data loss (PG is truth) |
| R6 | LLM evaluation hallucinates score / invalid JSON | Medium | Medium | Zod validation + retry once + store NULL on failure; never auto-delete | Answer visible without badge; manual moderation |
| R7 | Scope creep (image/voice/roadmap) delays P0 | High | High | P0→P1→P2 priority; MVP fallback plan (§9); feature flags | Cut P2; reduced-scope demo still solves PS 14 |
| R8 | Frontend/backend API contract drift | Medium | High | Freeze contract at Phase 2; typed `api/` layer; integration smoke after each phase | Align on 08-design §6; fix contract in next PR |
| R9 | Vote race condition / duplicate vote | Low | Low | DB UNIQUE constraint + ON CONFLICT handling | Constraint guarantees correctness; app shows 409 or toggle |
| R10 | Deployment env misconfig (CORS, DB SSL) | Medium | High (demo down) | Deploy early (Phase 9.4) + smoke test; validate env at startup | Local demo fallback + backup video |
| R11 | Team member unavailable / skill gap | Medium | Medium | Phases have clear tasks + effort; parallel work guide (§6) | Reduce scope to P0; rebalance tasks |
| R12 | Last-minute merge conflict / broken main | Low | High | Protected `main`, short-lived branches, tag `v0.1-mvp` and freeze | Revert to last tag; backup video |

---

## 13. Timeline Template (Fill In Real Dates)

```
Week/Day:  [  Day 0  ] [  Day 1  ] [  Day 2  ] [  Day 3 Demo ]
Phase 0-1: ████████
Phase 2:         ████████
Phase 3:               ████████
Phase 4:                     ████████
Phase 5:                           ████████
Phase 6:                                 ████████
Phase 7:                                 ████████ (parallel)
Phase 9:                                       ████████

Milestone M1 (end Day 1): P0 Q&A loop working locally
Milestone M2 (mid Day 2): Semantic search + RAG on local
Milestone M3 (end Day 2): Deployed + smoke test
Milestone M4 (Day 3): Rehearsed demo + backup video
```

Adapt to actual hackathon schedule; keep M1 as early integration checkpoint.

---

## 14. Cross-References

- **Architecture (components, flows, security, deployment):** [07-system-architecture.md](07-system-architecture.md)
- **Technical Design (schema, APIs, RAG, evaluation, env):** [08-technical-design.md](08-technical-design.md)
- **Testing & Validation (executable tests, datasets, metrics):** [10-testing-and-validation.md](10-testing-and-validation.md)

---

*End of 09-implementation-roadmap.md — Next: [10-testing-and-validation.md](10-testing-and-validation.md)*
