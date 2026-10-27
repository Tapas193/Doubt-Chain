# Doubt Chain — Testing and Validation

**Project:** Doubt Chain — AI-Powered, Organization-Specific Knowledge & Doubt Resolution Platform  
**Hackathon:** GRAPHITE 26 — GEHU Bhimtal — PS 14 — EdTech  
**Document ID:** 10-testing-and-validation.md  
**Version:** 1.0 — 2026-10-27  
**Status:** Design Proposal (pre-implementation)  
**Companion docs:** [07-system-architecture.md](07-system-architecture.md) · [08-technical-design.md](08-technical-design.md) · [09-implementation-roadmap.md](09-implementation-roadmap.md)

---

## 1. Testing Objectives

Before the team declares Doubt Chain demo-ready, we must **prove** (not claim) that:

1. **Core Q&A works:** Users can register, join orgs, ask, answer, accept, resolve, and search — without 500s or broken state.
2. **Security holds:** No cross-organization data leakage, no unauthorized acceptance, no duplicate votes, no secret exposure.
3. **Data is consistent:** Postgres constraints hold, vector index matches Postgres, reopen/delete correctly removes vectors.
4. **Semantic search retrieves:** Same doubt with different wording lands in top 3 — measured, not assumed.
5. **Multilingual retrieval is validated:** Hindi/Hinglish variants retrieve the English-indexed answer (or we document where it fails).
6. **RAG is grounded:** AI answers cite retrieved sources when they exist and acknowledge when they don't; no invented policy.
7. **Evaluation is provisional:** Scores correlate with human judgement at a useful level but are never treated as correctness proofs.
8. **System degrades gracefully:** AI/Chroma outage does not break P0; rate limits work; latency is acceptable for demo.

**What "done" means:** Every P0 test case in §4–§6 passes on the deployed environment; P1 tests pass locally with measured metrics recorded in docs; no critical security test fails.

---

## 2. Testing Strategy

| Test Level | What It Covers | When to Run | Tools (Proposed) |
|---|---|---|---|
| **Unit tests** | Service functions (auth hash, permission checks, threshold logic), validators (zod schemas), embedding doc builder | On commit | Vitest / Jest (`npm test`) |
| **Integration tests (API)** | Route → middleware → service → DB (mocked Chroma/LLM optional) | On PR + pre-deploy | Supertest + pg test DB |
| **Database tests** | FKs, UNIQUE, CHECK, pagination, indexes, transaction isolation | After migrations | pg + `EXPLAIN ANALYZE` |
| **Authorization & security tests** | 401/403, cross-org isolation, vote uniqueness, input validation, rate limits | Every phase after P2 | Supertest + manual OWASP checklist |
| **Semantic retrieval tests** | Recall@3, precision, latency, org isolation on 20–30 Q dataset | Phase 5 onward | Custom script (`scripts/eval-retrieval.js`) + Chroma test collection |
| **RAG evaluation** | Groundedness, citation, insufficient-context handling, org isolation | Phase 6 onward | Manual rubric + logged cases (10-testing §8) |
| **AI evaluation validation** | Score vs human judgement on 12-answer dataset | Phase 7 onward | Spreadsheet + LLM calls with fixed prompt |
| **Multilingual tests** | EN ↔ Hindi/Hinglish Recall@3 | Phase 8 | Same retrieval harness |
| **End-to-end (E2E)** | Full user journeys (see §11) on deployed env | Phase 9 | Playwright (optional) or manual script |
| **Performance & reliability** | API latency, search latency, LLM timeout, Chroma down, concurrent votes | Phase 9 | k6 / autocannon (optional) or manual timing |

**Tool choice rationale:**

- **Supertest** for API tests: works directly with Express, no need to start server.
- **Vitest** over Jest if team uses Vite (faster, shared config).
- **Playwright** only if time permits; manual E2E script is acceptable for hackathon.
- **k6/autocannon** optional — manual `time curl` + logging is sufficient for MVP latency checks.

**Principle:** Prefer executable tests over checklists, but a manual test with clear steps + expected result is better than no test.

---

## 3. Test Environment

### 3.1 Isolation

| Component | Test Setup | Cleanup |
|---|---|---|
| **Postgres** | Separate DB `doubtchain_test` (or `DATABASE_URL` with `_test` suffix); run migrations before suite; truncate tables after suite (`TRUNCATE ... CASCADE`) | `afterAll` hook truncates; or `BEGIN; ... ROLLBACK` per test for speed |
| **ChromaDB** | Test collection `doubtchain_resolved_test` (or in-memory embedded); create before suite, delete after | `afterAll` `deleteCollection` |
| **Users & orgs** | Factory helpers: `createUser()`, `createOrg()`, `joinOrg(userId, orgId, role)` — no dependency on seed | Truncated with DB |
| **LLM / Embedding** | **Mock by default** in CI: `MOCK_AI=true` returns deterministic fake embeddings/answers; real provider calls only in explicit `npm run test:live` with API key | No external cost in CI |
| **Env vars** | `.env.test` with `JWT_SECRET=test-secret-min-32-chars-long-enough`, `LLM_PROVIDER=mock`, `EMBEDDING_PROVIDER=mock` | Never use production secrets |
| **Ports** | Random or `0` — tests use Supertest's `app` object, not listening port | — |

### 3.2 Test Data Helpers (Pseudocode)

```js
// tests/helpers.js
export async function createUser(overrides = {}) {
  const user = { email: `u${Date.now()}@test.com`, password: 'Test1234!', displayName: 'Test', ...overrides };
  const res = await request(app).post('/api/auth/register').send(user);
  return { user: res.body.user, token: res.body.accessToken, raw: user };
}
export async function createOrg(token, overrides = {}) {
  const res = await request(app).post('/api/organizations').set('Authorization', `Bearer ${token}`).send({ name: 'Test Org', slug: `test-${Date.now()}`, ...overrides });
  return res.body.organization;
}
export async function createSubject(token, orgId, overrides = {}) {
  // ensure token's user is admin/moderator; join + promote if needed
  const res = await request(app).post(`/api/organizations/${orgId}/subjects`).set('Authorization', `Bearer ${token}`).send({ name: 'DSA', slug: `dsa-${Date.now()}`, ...overrides });
  return res.body.subject;
}
```

### 3.3 CI Considerations

- For hackathon, local `npm test` passing is sufficient; CI (GitHub Actions) is bonus.
- If CI, set `DATABASE_URL` to service container Postgres; `CHROMA_URL` to service or `CHROMA_MODE=embedded`.

---

## 4. Functional Test Cases

**Conventions:** `TC-<area>-<num>`; Priority `P0` = must pass for MVP, `P1` = AI differentiator, `P2` = optional.

### 4.1 Authentication & Organization

| ID | Feature | Preconditions | Steps / Request | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-AUTH-01 | Register | No user `a@gehu.ac.in` | `POST /api/auth/register {email:a@gehu.ac.in, password:Test1234!, displayName:Aarav}` | 201 + `user.id` + `accessToken`; PG `users` has `password_hash` not plaintext; second identical register → 409 | P0 |
| TC-AUTH-02 | Login | User exists | `POST /api/auth/login {email, password}` correct → 200 + token; wrong password → 401 `INVALID_CREDENTIALS` | Tokens returned; wrong password denied | P0 |
| TC-AUTH-03 | Me | Logged in | `GET /api/auth/me` with `Bearer token` → 200 includes `memberships`; without token → 401 | Authenticated user identified; unauth rejected | P0 |
| TC-AUTH-04 | Org create + auto-admin | Logged in | `POST /api/organizations {name:GEHU Bhimtal, slug:gehu-bhimtal}` → 201; `GET /api/organizations/:orgId/members` shows creator as `admin` | Creator is admin | P0 |
| TC-AUTH-05 | Join org | User B not member | `POST /api/organizations/:orgId/memberships` as B → 201 role `student`; second join as B → 409 `ALREADY_MEMBER` | One membership per user per org (DB UNIQUE) | P0 |
| TC-AUTH-06 | Role update | Admin A, student B in org | `PATCH /api/organizations/:orgId/members/:userB {role:moderator}` as A → 200; as B (student) → 403 | Only admin can promote | P0 |
| TC-AUTH-07 | Subject create | GEHU org, admin A | `POST /api/organizations/:orgId/subjects {name:DSA, slug:dsa}` as admin → 201; as student → 403; duplicate slug in same org → 409; same slug in different org → 201 OK | Slug unique per org; role-gated | P0 |
| TC-AUTH-08 | Subject list | Member | `GET /api/organizations/:orgId/subjects` as member → 200 list; as non-member → 403 | Org isolation on subjects | P0 |

### 4.2 Questions

| ID | Feature | Preconditions | Steps / Request | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-Q-01 | Create question | Member of GEHU, subject DSA | `POST /api/organizations/:orgId/questions {title:Why circular queue..., body:..., subjectId}` → 201 `status=open`, `accepted_answer_id=null` | Question created, belongs to org+subject | P0 |
| TC-Q-02 | Create with missing fields | Member | `POST .../questions {title:"short"}` → 400 `VALIDATION_ERROR`; `title` 300+ chars → 400 | Validation enforced | P0 |
| TC-Q-03 | Create without membership | Non-member | `POST /api/organizations/:orgId/questions` as non-member → 403 | AuthZ enforced | P0 |
| TC-Q-04 | List with filters | 3 questions: 2 DSA open, 1 OS resolved | `GET /api/organizations/:orgId/questions?subjectId=dsa&status=open` → 200 returns 2; `?status=resolved` → 1; `?page=1&limit=2` paginates | Filtering + pagination correct | P0 |
| TC-Q-05 | Get single | Question exists in GEHU | `GET /api/questions/:id` as GEHU member → 200 with question+answers; as member of other org → 403; as non-member → 403 | Org isolation via derived org_id | P0 |
| TC-Q-06 | Edit own | Author A, other B | `PATCH /api/questions/:id {title:...}` as A → 200; as B → 403 | Author-only edit | P0 |

### 4.3 Answers & Resolution

| ID | Feature | Preconditions | Steps / Request | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-A-01 | Create answer | Open question Q, member S | `POST /api/questions/:id/answers {body:Because...}` → 201; PG `answers` has `is_deleted=false` | Answer linked to question | P0 |
| TC-A-02 | List answers with counts | Q with 2 answers, 3 votes | `GET /api/questions/:id/answers` → 200 includes `upvotes`, `downvotes`, `isAccepted`, `evaluation` (if P1) | Counts aggregated; latest evaluation shown | P0 |
| TC-A-03 | Edit own answer | Author S, other B | `PATCH /api/answers/:id {body:Updated...}` as S → 200; as B → 403 | Author-only edit | P0 |
| TC-A-04 | Delete accepted → reopen | Q resolved with accepted A1 | `DELETE /api/answers/:a1Id` as author → 200; `GET /api/questions/:id` → `status=open`, `accepted_answer_id=null`, Chroma vector deleted | Auto-reopen invariant | P0 |
| TC-A-05 | Accept answer | Open Q with answers A1,A2, author Q_auth | `POST /api/questions/:id/accept {answerId:A1}` as Q_auth → 200 `status=resolved`, `accepted_answer_id=A1`; second `POST .../accept {answerId:A2}` → 200 updates to A2 (change accepted) | Accept works + change accepted | P0 |
| TC-A-06 | Accept by non-author | Open Q | `POST /api/questions/:id/accept` as non-author student → 403; as moderator → 200 (override) | Author or mod/admin only | P0 |
| TC-A-07 | Accept invalid answer | Q1 with A1, Q2 with A2 | `POST /api/questions/q1Id/accept {answerId:A2}` (A2 belongs to Q2) → 400 `ANSWER_NOT_IN_QUESTION` | Cross-question accept prevented | P0 |
| TC-A-08 | Reopen | Resolved Q | `POST /api/questions/:id/reopen` as author → 200 `status=open`, `accepted_answer_id=null`; Chroma vector deleted; as non-author student → 403 | Reopen works + vector cleanup | P0 |
| TC-A-09 | Report (if implemented) | Answer exists | `POST /api/answers/:id/report {reason:spam}` → 201; duplicate report by same user → 409 or idempotent | Report stored | P2 |

### 4.4 Votes & Comments

| ID | Feature | Preconditions | Steps / Request | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-V-01 | Upvote | Answer A, user U no prior vote | `POST /api/answers/:id/votes {value:1}` → 200 counts `upvotes:1`; PG `votes` has row | Vote created | P0 |
| TC-V-02 | Toggle off | U upvoted A | `POST .../votes {value:1}` again → 200 `upvotes:0` (deleted) OR 409 per design — document chosen behavior | Toggle or 409 (consistent) | P0 |
| TC-V-03 | Change vote | U upvoted A | `POST .../votes {value:-1}` → 200 `upvotes:0 downvotes:1` | Upsert updates value | P0 |
| TC-V-04 | Duplicate prevention | U voted | Direct `INSERT votes (answer_id,user_id)` duplicate → DB `23505` → 409 | DB UNIQUE prevents race | P0 |
| TC-V-05 | Delete vote | U voted | `DELETE /api/answers/:id/votes` → 200 counts decremented; delete non-existent → 404 or idempotent 200 | Delete works | P0 |
| TC-C-01 | Comment | Answer A | `POST /api/answers/:id/comments {body:Clarify?}` → 201; `GET .../comments` → includes it | Comment created | P0 |
| TC-C-02 | Threaded reply (optional) | Comment C1 | `POST .../comments {body:Reply, parentId:C1}` → 201 with `parentId`; invalid parent (different answer) → 400 | Threading validated | P2 |

### 4.5 Search (Keyword + Semantic)

| ID | Feature | Preconditions | Steps / Request | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-S-01 | Keyword search | 2 resolved Q: "circular queue overflow" + "linked list" | `GET /api/organizations/:orgId/search?keyword=queue` → 200 returns 1 match; `?keyword=queue&subjectId=os` → 0 if mismatch | ILIKE org-scoped | P0 |
| TC-S-02 | Keyword empty | — | `GET .../search?keyword=` → 400 `QUERY_TOO_SHORT` | Validation | P0 |
| TC-S-03 | Semantic search basic | 3 resolved Q indexed in Chroma (queue, stack, BST) | `POST .../search/semantic {query:"Why circular queue full?", topK:3}` → 200 `results[0]` is queue question with `score>threshold` | Semantic retrieves paraphrase | P1 |
| TC-S-04 | Semantic topK limit | — | `POST .../search/semantic {query:"queue", topK:100}` → 400 or clamp to 10 | Limit enforced | P1 |
| TC-S-05 | Semantic org isolation | Org1 has Q "queue", Org2 has Q "queue" | `POST /api/organizations/org1Id/search/semantic {query:"queue"}` → results only from org1; org2 Q never returned | Where filter enforced | P1 |
| TC-S-06 | Chroma down fallback | Chroma stopped | `POST .../search/semantic {query:"queue"}` → 200 with `fallback:true` + keyword results OR 503 with clear message | Degraded but not crash | P1 |

### 4.6 AI Chatbot & Evaluation

| ID | Feature | Preconditions | Steps / Request | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-AI-01 | AI answer grounded | Q with 2 similar resolved Q indexed | `POST /api/questions/:id/ai-answer {}` → 200 `grounded:true` + `sources` length 2 + answer contains citation + disclaimer | Grounded answer | P1 |
| TC-AI-02 | AI answer no context | Q with no similar resolved Q indexed | `POST .../ai-answer` → 200 `grounded:false` + disclaimer "No verified knowledge found" + general explanation | Insufficient-context handling | P1 |
| TC-AI-03 | AI cross-org leak | Org1 has resolved Q "queue", Org2 Q is asked | `POST /api/questions/org2QId/ai-answer` → sources never include org1 Q | Org isolation in RAG | P1 |
| TC-AI-04 | AI rate limit | — | 11× `POST .../ai-answer` in 1 min → 11th 429 `RATE_LIMITED` | Rate limit | P1 |
| TC-AI-05 | AI unavailable | LLM API key invalid / timeout | `POST .../ai-answer` → 503 `AI_UNAVAILABLE` + friendly message; peer answers still returned via `GET /questions/:id/answers` | Graceful degradation | P1 |
| TC-EVAL-01 | Evaluate correct | Correct answer | `POST /api/answers/:id/evaluate` → 200 `score>=70`, `breakdown` sums to score, `strengths` + `suggestions` present | Valid evaluation | P1 |
| TC-EVAL-02 | Evaluate alternative correct | Correct answer with different approach (e.g., iterative vs recursive) | `POST .../evaluate` → 200 `score>=70` (not penalized) | Alternative approach accepted | P1 |
| TC-EVAL-03 | Evaluate irrelevant | Irrelevant answer ("I like pizza") to queue question | → 200 `score<50`, explanation mentions irrelevance | Low score for irrelevant | P1 |
| TC-EVAL-04 | Invalid JSON retry | Mock LLM returns invalid JSON once | → retries once, then succeeds; if twice invalid → 200 with `evaluation:null` + warning, no crash | Retry + graceful | P1 |

### 4.7 Roadmaps (P2)

| ID | Feature | Preconditions | Steps / Request | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-R-01 | Create roadmap | Logged in | `POST /api/roadmaps {goal:SDE in 6 months, skillLevel:beginner, availableHoursPerWeek:10, deadline:2027-04-27}` → 201 with `content.phases` | Roadmap generated; may include org question links if RAG used | P2 |
| TC-R-02 | Get own | Roadmap exists | `GET /api/roadmaps/:id` as owner → 200; as other user → 403 | Owner-only | P2 |

---

## 5. Authorization and Security Tests

These are **critical** — a single cross-org leak is a demo-fail.

| ID | Feature | Attack / Scenario | Expected Secure Behavior |
|---|---|---|---|
| SEC-01 | Unauthenticated | `GET /api/organizations/:orgId/questions` without token | 401 `UNAUTHENTICATED` |
| SEC-02 | Cross-org read | User in org1 tries `GET /api/questions/:qInOrg2Id` (Q belongs to org2) | 403 `FORBIDDEN` (derived org isolation) |
| SEC-03 | Cross-org search | User in org1 `POST /api/organizations/org1Id/search/semantic {query:"queue"}` when only org2 has queue Q | Results empty; org2 Q never returned (verified by seeding both orgs with same keyword) |
| SEC-04 | Cross-org RAG | User asks AI on org2 Q that would retrieve org1 knowledge if not filtered | `sources` never contain org1 Q |
| SEC-05 | Unauthorized resolve | Student B tries `POST /api/questions/:qByAId/accept` where A is author, B is not mod | 403 |
| SEC-06 | Reopen by non-author | Student B tries `POST /api/questions/:id/reopen` on A's resolved Q | 403 (unless B is moderator/admin) |
| SEC-07 | Edit another's answer | `PATCH /api/answers/:id` as not author | 403 |
| SEC-08 | Duplicate vote | Concurrent `POST .../votes {value:1}` twice by same user → DB UNIQUE → second is toggle or 409 | No duplicate row; counts correct |
| SEC-09 | Invalid input — XSS | `POST /api/questions` with `title:"<script>alert(1)</script>"` | Stored safely; frontend escapes; no execution (verify rendered output) |
| SEC-10 | SQL injection attempt | `GET .../search?keyword=' OR 1=1 --` | Parameterized query returns 0 or no extra rows; no error leak |
| SEC-11 | Oversized body | `POST /api/questions {title: "a"*1000}` (over 300) | 400 `VALIDATION_ERROR`; DB CHECK also rejects |
| SEC-12 | File upload (if P2) | Upload `evil.exe` or 10 MB file | 400 `INVALID_MIME` or `FILE_TOO_LARGE`; allowlist enforced |
| SEC-13 | Rate limit | 6× `POST /api/auth/login` in 1 min from same IP | 6th → 429 `RATE_LIMITED` with `retryAfter` |
| SEC-14 | Secret exposure | `GET /api/health` or any frontend JS | Response never contains `JWT_SECRET`, `OPENAI_API_KEY`, `DATABASE_URL` |
| SEC-15 | JWT tampering | Send `Authorization: Bearer <modified token>` | 401 `INVALID_TOKEN` |

**How to run:** Add `tests/security.test.js` that seeds two orgs with two users each and systematically tries cross-org access. Assert 403/401, not 200.

---

## 6. Database Integrity Tests

Run as integration tests against `doubtchain_test` DB.

| ID | What | Test | Expected |
|---|---|---|---|
| DB-01 | FK: question → org | Insert question with `organization_id` that doesn't exist | FK violation `23503` → 400/409 at API layer |
| DB-02 | FK: question → subject | Insert question with subject from another org | API should 400 `SUBJECT_NOT_IN_ORG` |
| DB-03 | UNIQUE: memberships | Insert duplicate `(user_id, org_id)` | `23505` → 409 |
| DB-04 | UNIQUE: votes | Insert duplicate `(answer_id, user_id)` | `23505` → handled as toggle/409 |
| DB-05 | UNIQUE: org slug | `INSERT organizations(slug) duplicate` | `23505` → 409 |
| DB-06 | UNIQUE: subject slug per org | Duplicate `(organization_id, slug)` | `23505` → 409; same slug in different org OK |
| DB-07 | CHECK: question resolved invariant | Manual `UPDATE questions SET status='resolved', accepted_answer_id=NULL` | CHECK violation `23514` → reject |
| DB-08 | CHECK: title length | `INSERT questions(title='hi')` (<10) | CHECK violation |
| DB-09 | Soft delete answer | `DELETE /api/answers/:id` as author → `SELECT is_deleted` | `is_deleted=true`; `GET /questions/:id/answers` excludes deleted by default (or marks) |
| DB-10 | Accepted answer FK | `DELETE answers WHERE id=accepted_answer_id` hard delete (if not soft) | `ON DELETE SET NULL` → question's `accepted_answer_id` becomes NULL; app should handle |
| DB-11 | Pagination | `GET /questions?limit=20&page=100` with 10 total | Returns empty list + `pagination.total=10` |
| DB-12 | Index existence | `SELECT * FROM pg_indexes WHERE tablename='questions'` | All planned indexes exist: `idx_questions_org_status`, etc. |
| DB-13 | Vector ↔ PG sync | Resolve Q → check Chroma `collection.get(ids:["q_<id>"])` exists + PG `indexed_at` set; reopen → Chroma deleted | Sync correct |
| DB-14 | Stale vector detection | Manually `DELETE FROM questions WHERE id=X` but leave Chroma vector → `POST .../search/semantic` should skip stale hit and optionally delete | No ghost results |

---

## 7. Semantic-Search Evaluation

### 7.1 Purpose

Measure whether semantic search actually retrieves relevant questions — do not claim accuracy without this.

### 7.2 Test Dataset (20–30 Questions)

Build `data/search-test-set.json` with three categories:

**Category A — Exact / Near-Exact (5 Q):** Should be retrieved trivially.

```json
[
  { "id": "t01", "query": "How to implement circular queue in C?", "expected_question_id": "q-001", "note": "Exact wording match" },
  { "id": "t02", "query": "What is the time complexity of binary search?", "expected_question_id": "q-002", "note": "Exact" }
]
```

**Category B — Paraphrased / Different Vocabulary (8 Q):** Tests semantic, not keyword.

```json
[
  { "id": "t03", "query": "Why is my circular queue showing full even though empty slots exist?", "expected_question_id": "q-001", "note": "Paraphrase of q-001 title" },
  { "id": "t04", "query": "Can't insert element into circular queue", "expected_question_id": "q-001", "note": "Different phrasing, same problem" },
  { "id": "t05", "query": "Explain working of queue with wrap-around", "expected_question_id": "q-001", "note": "No keyword 'circular' but same concept" }
]
```

**Category C — Hindi / Hinglish Variants (6 Q):** Tests multilingual model.

```json
[
  { "id": "t06", "query": "Mera circular queue full kyu dikha raha hai?", "expected_question_id": "q-001", "note": "Hinglish Roman" },
  { "id": "t07", "query": "सर्कुलर क्यू कैसे काम करता है?", "expected_question_id": "q-001", "note": "Hindi Devanagari" },
  { "id": "t08", "query": "Circular queue kaise kaam karta hai?", "expected_question_id": "q-001", "note": "Hinglish mix" }
]
```

**Category D — Ambiguous / No Relevant Answer (4 Q):**

```json
[
  { "id": "t09", "query": "How to fix hostel WiFi?", "expected_question_id": null, "note": "No relevant Q in DSA subject — should return empty or low-score" },
  { "id": "t10", "query": "What is photosynthesis?", "expected_question_id": null, "note": "Out-of-domain" }
]
```

**Category E — Similar Wording, Different Intent (3 Q):**

```json
[
  { "id": "t11", "query": "How to delete from circular queue?", "expected_question_id": "q-003", "note": "Similar words but different intent (delete vs insert) — should not retrieve q-001 top-1" }
]
```

### 7.3 Metrics

| Metric | Definition | Why |
|---|---|---|
| **Recall@3** | Fraction of test queries where `expected_question_id` appears in top 3 results | Primary measure; users see top 3 |
| **Precision@3** | Fraction of returned top-3 that are relevant (relevant = expected or manually judged relevant) | Avoids rewarding many irrelevant returns |
| **MRR (Mean Reciprocal Rank)** | Average of `1/rank` where expected appears; 1.0 = always rank 1 | Sensitive to ranking quality |
| **Retrieval latency p50/p95** | Time from `POST /search/semantic` to response | User-perceived speed; threshold e.g., p95 <1s |

**Calculation example:**

```
For 20 queries:
  14 have expected in top-3 → Recall@3 = 14/20 = 0.70
  For those 14, avg rank = 1.4 → MRR = avg(1/1, 1/2, 1/1, ...) ≈ 0.78
```

### 7.4 Acceptance Targets (Proposed — Clearly Label as Targets)

| Metric | Target | Note |
|---|---|---|
| Recall@3 (EN paraphrases) | ≥0.70 | Proposed; calibrate after running test set |
| Recall@3 (Hindi/Hinglish) | ≥0.60 | Lower expectation; depends on model; document actual |
| MRR | ≥0.65 | — |
| p95 retrieval latency | <1s | Excludes LLM call |

> **Important:** These are **targets**, not measured results. Record actual measured values in `docs/multilingual-eval.md` and present them honestly to judges. Do not invent metrics.

### 7.5 Evaluation Script

```js
// scripts/eval-retrieval.js (pseudocode)
import testSet from '../data/search-test-set.json';
let hits = 0, mrr = 0, latencies = [];
for (const t of testSet) {
  const start = Date.now();
  const res = await fetch(`${API}/organizations/${orgId}/search/semantic`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: t.query, topK: 3 })
  }).then(r => r.json());
  latencies.push(Date.now() - start);
  const ids = res.results.map(r => r.question.id);
  if (t.expected_question_id && ids.includes(t.expected_question_id)) hits++;
  if (t.expected_question_id) { const rank = ids.indexOf(t.expected_question_id); if (rank !== -1) mrr += 1/(rank+1); }
  if (!t.expected_question_id && res.results.length === 0) hits++; // correct empty
}
console.log(`Recall@3: ${hits}/${testSet.length} = ${(hits/testSet.length).toFixed(2)}`);
console.log(`MRR: ${(mrr/testSet.filter(t=>t.expected_question_id).length).toFixed(2)}`);
console.log(`p50 latency: ${median(latencies)}ms, p95: ${p95(latencies)}ms`);
```

Run with `npm run eval:retrieval` after seeding resolved Q&A + indexing.

### 7.6 Failure Analysis

For each miss, record:

- Query text, expected ID, returned IDs + scores
- Was threshold too high (score <0.35 filtered out correct result)?
- Was correct document missing from index (not resolved / not indexed)?
- Was wording too ambiguous?

Recommend improvements: include accepted answer in document, lower threshold for that subject, add subject filter, re-embed with different model.

---

## 8. RAG Evaluation

### 8.1 What to Evaluate

| Dimension | Question | How to Judge |
|---|---|---|
| **Relevance of retrieved context** | Were the sources actually relevant to the query? | Manual: for 10 test questions, check if top-3 retrieved are relevant (binary) |
| **Groundedness** | Does the answer use the retrieved sources (not ignore them)? | Check answer contains citation or facts from source |
| **Correctness** | Is the answer factually correct per known reference? | Compare to accepted answer / known correct explanation |
| **Citation accuracy** | Do citations point to real sources with correct titles/URLs? | Verify `sources[].questionId` exists and matches retrieved |
| **Insufficient-context handling** | When no sources, does it say "No verified knowledge found"? | Trigger with out-of-domain query |
| **Source conflict** | When two sources disagree, does it acknowledge? | Seed conflicting accepted answers (e.g., two definitions) |
| **Org isolation** | Are sources always from same org as question? | Cross-org test (see TC-AI-03) |

### 8.2 Test Scenarios

| # | Scenario | Setup | Expected |
|---|---|---|---|
| RAG-01 | Grounded success | Q "queue overflow" with 2 resolved queue Q indexed | Answer explains overflow, cites [Source 1][Source 2], `grounded:true` |
| RAG-02 | No context | Q "quantum computing" with no resolved Q indexed | Answer is general explanation + "No verified knowledge found", `grounded:false` |
| RAG-03 | Conflicting sources | Two resolved Q with accepted answers that give different formulas (e.g., one says `front==rear`, other `(rear+1)%size==front`) | Answer notes conflict or picks one with disclaimer |
| RAG-04 | Cross-org leak attempt | Org1 has "GEHU fee deadline is X", Org2 Q asks "What is fee deadline?" | Sources only from org2; no org1 fee info leaked |
| RAG-05 | Hallucinated policy | Q "What is GEHU attendance policy?" with no policy doc indexed | LLM says "I don't have verified information" — does not invent 75% rule |
| RAG-06 | Latency | 10 sequential `POST .../ai-answer` | p95 <8s (LLM dependent) |

**Manual rubric for groundedness (for each RAG case):**

- `2` = Fully grounded: cites correct sources, no unsupported claims
- `1` = Partially grounded: mostly correct but adds unsourced detail or misses citation
- `0` = Ungrounded: ignores sources or hallucinates

Target: avg groundedness ≥1.5 on 10 cases.

---

## 9. AI Answer-Evaluation Validation

### 9.1 Dataset (12 Sample Answers)

Create `data/evaluation-test-set.json` — each entry has question + answer + human judgement:

| ID | Answer Type | Question | Answer | Human Expectation |
|---|---|---|---|---|
| E01 | Correct & complete | Queue overflow | "Overflow check is (rear+1)%size==front... [code + edge case]" | High score ≥80, all breakdown high |
| E02 | Correct but concise | Same | "Check (rear+1)%size==front" (one line, correct but minimal) | Medium-high ≥65, completeness lower |
| E03 | Correct alternative approach | Same | Implements queue with `count` variable instead of front/rear formula (valid) | High ≥75 — alternative approach not penalized |
| E04 | Partially correct | Same | Correct formula but says "queue is full when rear==size-1" (wrong for circular) | Medium 45–65, correctness penalized |
| E05 | Irrelevant | Same | "I like pizza" | Low <30, relevance near 0 |
| E06 | Plausible but incorrect | Same | "Overflow when rear==front" (wrong; that's empty) — sounds confident | Low correctness, overall <50 despite clarity |
| E07 | Correct with poor clarity | Same | Correct logic but no punctuation, run-on | High correctness, low clarity |
| E08 | Empty / too short | Same | "idk" | Low overall |
| E09 | Correct but off-topic detail | Same | Correct + adds unrelated OS paging explanation | High correctness, lower relevance |
| E10 | Dangerous/misleading | "How to handle user passwords?" | "Store plaintext for easy reset" | Must be flagged even if high clarity — score <40 |
| E11 | Good explanation, minor error | BST search | Minor off-by-one in complexity but rest correct | ~70–80 |
| E12 | Ambiguous | "Explain deadlock" | Vague "deadlock is when things stop" | Low completeness |

### 9.2 Comparison Method

1. Run `POST /api/answers/:id/evaluate` for each answer (same LLM, same prompt, temperature 0.2).
2. Record `score`, `breakdown`, `explanation`.
3. Human reviewer independently scores each answer on same 0–100 scale (without seeing AI score).
4. Compare: for each E*, is AI ranking direction correct? (E01 > E04 > E05?)

**Acceptance criteria:**

- Correct answers (E01,E03) scored ≥70
- Irrelevant/incorrect (E05,E06,E10) scored <50
- Alternative correct approach (E03) not penalized below 70
- `breakdown` sum ≈ `score` (±2)
- `explanation` mentions actual strengths/weaknesses (manual check)

**Do not expect perfect agreement** — evaluation is inherently subjective. Goal is directional correctness, not exact match.

### 9.3 Inspecting Disagreements

When AI and human disagree:

- Check if prompt weights (40/25/20/15) cause unexpected weighting.
- Check if LLM is overly strict on conciseness (E02) or overly lenient on confident incorrect (E06).
- Adjust prompt ("Accept alternative valid approaches") and re-run.

### 9.4 Threshold Warning

Do **not** set a single threshold (e.g., 70%) as auto-reject gate. Document in tests that score <70 means "flag for review", not "delete".

---

## 10. Multilingual Testing

### 10.1 Scope

Prioritize text-based multilingual search (EN ↔ Hindi/Hinglish Roman) over image/voice for MVP.

### 10.2 Test Set

Use Category C from §7.2 + additional equivalents:

| Query EN | Query Hinglish (Roman) | Query Hindi (Devanagari) | Expected ID | Expected Rank ≤3? |
|---|---|---|---|---|
| How does circular queue work? | Circular queue kaise kaam karta hai? | सर्कुलर क्यू कैसे काम करता है? | q-001 | Yes |
| Why insertion fails in circular queue? | Circular queue me insert kyu fail ho raha hai? | सर्कुलर क्यू में इन्सर्शन क्यों विफल होता है? | q-001 | Yes |
| Explain binary search | Binary search samjhao | बाइनरी सर्च समझाओ | q-002 | Yes |
| DBMS deadlock | DBMS me deadlock kya hai? | डीबीएमएस में डेडलॉक क्या है? | q-005 | Yes |

Add 2–3 ambiguous cases where translation may fail (e.g., English idiom with no Hindi equivalent).

### 10.3 Execution

Run same `scripts/eval-retrieval.js` but with `data/multilingual-test-set.json` (subset of full set with EN/Hinglish pairs).

Measure:

- **Recall@3 per language:** EN, Hinglish Roman, Hindi Devanagari
- **Cross-language recall:** Query in Hinglish, indexed in EN → does it still retrieve?

### 10.4 Separate Genuine Retrieval from Translation

- **Genuine:** Multilingual embedding model maps EN and Hinglish to nearby vectors — no translation step.
- **Translation shortcut (if used):** Translate query to EN first, then embed with English model — works but adds latency + translation error; document which approach is used.

MVP should use **genuine multilingual model** (`multilingual-e5-small`) — test it. If it fails for Hinglish Roman, document: "Model X retrieves EN→EN well but EN→Hinglish Roman recall is 0.40 — threshold tuned or translation fallback considered."

### 10.5 Language-Specific Failures to Document

- Roman script Hinglish with code-switching ("queue full kyu dikh raha") may score lower than pure Hindi Devanagari.
- Technical terms (e.g., "deadlock", "overflow") often remain in English even in Hindi queries — model handles this well; verify.
- Do not claim support for languages not in test set.

---

## 11. End-to-End Test Scenarios

Complete workflows to run on deployed environment before demo.

### Scenario A — Student Asks, Senior Answers, Resolves (Happy Path)

```
Prereq: Users student@gehu.ac.in (S), senior@gehu.ac.in (R), GEHU org with DSA subject, 1 pre-seeded resolved Q for search baseline.

1. S logs in (POST /auth/login → 200)
2. S GET /organizations/gehu → 200, GET /organizations/gehu/subjects → DSA listed
3. S GET /organizations/gehu/questions?subjectId=dsa&status=open → feed loads
4. S searches "queue overflow" → keyword returns 1 resolved Q → S opens it → sees accepted answer + votes
5. S creates new Q: POST /organizations/gehu/questions {title:"Why can't I insert into circular queue? size 5...", body:"...", subjectId:dsa} → 201 open
6. S clicks "Ask AI" → POST /questions/:id/ai-answer → 200 grounded:true with 1 source
7. R logs in (second browser), GET /questions/:id → sees S's Q
8. R POST /questions/:id/answers {body:"Check (rear+1)%size==front..."} → 201, evaluation async score 82
9. S GET /questions/:id/answers → sees R's answer + evaluation badge 82
10. Other student upvotes → POST /answers/:id/votes {value:1} → counts upvotes:1
11. S POST /questions/:id/accept {answerId:R's answer} → 200 status resolved
12. S GET /organizations/gehu/questions?status=resolved → new Q appears
13. New student searches Hinglish "Mera queue insert kyu nahi ho raha" → POST .../search/semantic → new Q appears top-1 (proves knowledge flywheel)
```

**Pass criteria:** All steps 200/201; no 500; resolved Q appears in search; Chroma vector `q_<id>` exists.

### Scenario B — Senior Evaluated, Moderator Flags

```
1. Senior posts answer with subtle error (E04)
2. Evaluation returns score 58, weaknesses include "incorrect non-circular check"
3. UI shows amber "Needs review" badge
4. Moderator views answer, sees evaluation + upvotes (2) + report button
5. Moderator comments "Correction: for circular, use (rear+1)%size==front"
6. Senior edits answer → new evaluation score 88
7. asker accepts corrected answer → resolved
```

**Pass criteria:** Evaluation visible, report/comment flow works, re-evaluation on edit, acceptance updates status.

### Scenario C — Knowledge Becomes Searchable (Vector Lifecycle)

```
1. Create Q1 open → Chroma has no vector q_Q1 → search "Q1 topic" → not found
2. Accept answer on Q1 → resolved → Chroma upsert q_Q1 → search "Q1 topic" → found
3. Reopen Q1 → Chroma delete q_Q1 → search "Q1 topic" → not found
4. Re-accept Q1 → Chroma upsert again → search found
5. Delete accepted answer → auto-reopen → Chroma delete → search not found
```

**Pass criteria:** Vector presence matches `status` at each step.

### Scenario D — Paraphrase Retrieval

```
1. Seed 3 resolved Q: queue overflow, binary search, DBMS deadlock
2. Search "Why insertion fails in circular queue?" (paraphrase, no word "overflow") → top-1 is queue overflow Q
3. Search "Explain binary search working" → top-1 is binary search Q
4. Search "What is photosynthesis?" (out-of-domain) → empty or low-score results
```

**Pass criteria:** Paraphrases retrieve correct; out-of-domain returns empty/low.

### Scenario E — Unauthorized Access Attempt

```
1. User in org1 tries GET /api/organizations/org2Id/questions → 403
2. User in org1 tries GET /api/questions/:qInOrg2Id → 403
3. User in org1 tries POST /api/organizations/org2Id/search/semantic → 403 or empty (org filter)
4. User tries POST /api/questions/:id/ai-answer for org2 Q → 403 or isolated sources
```

**Pass criteria:** All cross-org attempts denied; no data leaked.

---

## 12. Performance and Reliability

All measurements are on deployed env or local with seeded data (100 questions, 200 answers) — not production-scale guarantees.

| ID | Test | Method | Target | Note |
|---|---|---|---|---|
| PERF-01 | API latency (non-AI) | `GET /api/organizations/:orgId/questions` 20 requests, measure p50/p95 | p95 <500ms | Local + deployed |
| PERF-02 | Search latency (semantic) | `POST .../search/semantic` 20 requests | p95 <1s (embedding + Chroma + PG join) | Excludes LLM |
| PERF-03 | AI answer latency | `POST .../ai-answer` 10 requests | p95 <8s | LLM dependent; show spinner |
| PERF-04 | AI timeout | Mock LLM delay 10s → handler timeout 8s → 503 | 503 returned, no hang | Implemented with AbortController |
| PERF-05 | Chroma down | Stop Chroma → `POST .../search/semantic` → fallback to keyword | 200 with `fallback:true` or 503 with clear message | UX shows "Keyword search" badge |
| PERF-06 | DB failure | Kill Postgres → `GET /api/questions` → 500 | 500 with no DB details leaked | Health check should fail |
| PERF-07 | Rate limit | 11× `POST .../ai-answer` in 60s → 11th 429 | 429 with `retryAfter` | Per-user limiter |
| PERF-08 | Concurrent votes | 5 users simultaneously `POST .../votes {value:1}` on same answer | All succeed, counts =5, no duplicates (UNIQUE) | Use Promise.all |
| PERF-09 | Concurrent accepts | Two users try `POST /accept` with different answerIds simultaneously | One succeeds, one 409 or last-write-wins (document; use `SELECT FOR UPDATE`) | Transaction isolation |

**Assumptions:** Targets are for demo with small dataset; production caching/indexing not in scope.

---

## 13. Bug Tracking and Regression Testing

### 13.1 Bug Report Template

```md
**ID:** BUG-01  
**Title:** Cross-org search returns other org's question  
**Severity:** Critical (security)  
**Steps:** 1. Create org1 Q "queue" 2. As org2 user POST /organizations/org2Id/search/semantic {query:"queue"} → returns org1 Q  
**Expected:** Empty or only org2 results  
**Actual:** org1 Q returned  
**Root cause:** Missing `where:{organization_id}` in Chroma query  
**Fix:** Add org filter in `modules/search/semanticSearch.js:42`  
**Regression test:** SEC-03  
**Status:** Fixed, test added
```

### 13.2 Prioritization

| Severity | Meaning | Action |
|---|---|---|
| **Critical** | Security leak, data loss, crash on P0 flow | Fix immediately, block demo |
| **Major** | P0 feature broken (e.g., accept doesn't resolve) | Fix before demo |
| **Minor** | P1 glitch (e.g., evaluation badge missing) | Fix if time; document workaround |
| **Cosmetic** | UI polish | Post-demo |

### 13.3 Regression

- After every fix, re-run affected test suite (`npm test`) + relevant E2E scenario.
- Tag known failing tests with `.skip` and issue link — don't hide failures.
- Before demo, run full `npm test` + manual E2E Scenarios A–E on deployed env.

---

## 14. Release-Readiness Checklist

Use this as the final gate before presenting to judges. Check each box honestly.

### Functional

- [ ] Register / login / me work
- [ ] Org create, join, role update work
- [ ] Subject boards per org work
- [ ] Question create/list/get/edit work with org isolation
- [ ] Answer create/list/edit/delete (soft) work
- [ ] Accept → resolved (with `accepted_answer_id` + `resolved_at` + Chroma upsert)
- [ ] Reopen → open + vector deleted
- [ ] Votes with UNIQUE constraint; toggle behavior documented
- [ ] Comments (flat) under answers
- [ ] Keyword search org-scoped
- [ ] Semantic search org-filtered (if P1) — measured Recall@3 recorded
- [ ] AI answer grounded with citations or disclaimer (if P1)
- [ ] AI evaluation provisional badge (if P1) — no auto-delete

### Security

- [ ] All org-scoped routes return 403 for non-members (tested SEC-01–06)
- [ ] Cross-org search/RAG never leak (tested SEC-03–04)
- [ ] Duplicate vote prevented by DB
- [ ] Inputs validated (zod); SQL parameterized; no secrets in frontend
- [ ] Rate limits on auth, AI, votes

### Data

- [ ] Migrations run cleanly on fresh DB; seed creates GEHU + subjects
- [ ] CHECK constraints enforce `resolved ⇒ accepted_answer_id`
- [ ] Indexes exist for hot queries
- [ ] Vector index matches PG state; reindex endpoint works; stale cleanup handled

### AI

- [ ] LLM unavailable → 503 + peer answers still visible
- [ ] Chroma unavailable → keyword fallback
- [ ] No invented university policy; disclaimer present
- [ ] Evaluation labeled provisional

### Deployment & Demo

- [ ] Frontend + backend + PG deployed; live URLs in README
- [ ] `CORS_ORIGIN` set to deployed frontend; `DATABASE_URL` SSL configured
- [ ] Smoke test on deployed passes (Scenario A)
- [ ] Demo script rehearsed ≤7 min (see 09-roadmap §11)
- [ ] Backup screen recording saved
- [ ] README includes setup, architecture diagram, known limitations, GEHU disclaimer
- [ ] No last-minute untested commit on `main` after tag `v0.1-mvp`

---

## 15. Cross-References

- **Architecture (components, data flows, security, deployment):** [07-system-architecture.md](07-system-architecture.md)
- **Technical Design (schema, APIs, RAG, evaluation, env):** [08-technical-design.md](08-technical-design.md) — API paths and table names used here must match exactly
- **Implementation Roadmap (phases, tasks, fallback, demo script):** [09-implementation-roadmap.md](09-implementation-roadmap.md)

### Consistency Checklist (for reviewers)

- [ ] Table names (`users`, `organizations`, `memberships`, `subjects`, `questions`, `answers`, `answer_evaluations`, `votes`, `comments`, `roadmaps`) match 08-design §3
- [ ] API paths (`/api/organizations/:orgId/questions`, `/api/questions/:id/accept`, `/api/organizations/:orgId/search/semantic`, `/api/questions/:id/ai-answer`, `/api/answers/:id/evaluate`) match 08-design §6
- [ ] Roles (`student`, `moderator`, `admin`) match 08-design §2
- [ ] Chroma collection `doubtchain_resolved`, id `q_<questionId>`, metadata `organization_id` match 08-design §9
- [ ] `status` enum `open | resolved | archived` and `accepted_answer_id` semantics match 08-design §7
- [ ] Error codes (`VALIDATION_ERROR`, `FORBIDDEN`, `AI_UNAVAILABLE`) match 08-design §13

---

*End of 10-testing-and-validation.md*
