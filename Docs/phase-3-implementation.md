# Phase 3 Implementation Checklist

**Source of truth:** `Docs/09-implementation-roadmap.md`, Phase 3 — Question and Answer Workflow.  The existing application uses the compatible `Doubt` naming and `/api/v1/doubts` route family rather than the roadmap's proposed `Question` naming and organization-scoped paths. This phase preserves those established contracts.

## Planning policy

```json
{
  "planning": "compact",
  "context_depth": "dependency",
  "verification_depth": "impact",
  "delegation": "none",
  "reason_codes": ["multiple-files", "shared-module", "database-schema"]
}
```

## Checklist

| Requirement | Current status | Files to change | Proposed implementation | Dependencies | Acceptance criteria | Tests required |
|---|---|---|---|---|---|---|
| Create, list, view and edit doubts | Complete | Existing service and detail page; lifecycle response additions | Preserved the `/doubts` contract and added lifecycle fields to its responses | Auth, Subject, Prisma | A student can create, filter, view and edit only their own doubt | Existing validation tests; lifecycle regression tests |
| Create, list and edit answers | Complete | `answer.service.ts`, `DoubtDetail.tsx`, tests | Existing author-only edit is retained; deleted answers are hidden | Auth, Prisma | Active answers appear under their doubt; only their author can edit them | Lifecycle service tests |
| Accept an answer and resolve a doubt atomically | Complete | Schema/migration, doubt route/controller/service, detail page | Added `acceptedAnswerId` and `POST /doubts/:id/accept` | Existing doubt and answer records | Only owner can accept an active answer belonging to that doubt; resolution has an accepted answer | Accept success, wrong owner and cross-doubt tests |
| Reopen a resolved doubt | Complete | Doubt route/controller/service, detail page, tests | Added `POST /doubts/:id/reopen`, clearing lifecycle fields | Accepted-answer lifecycle | Only owner can reopen; state becomes open with no accepted answer | Reopen lifecycle test |
| Soft-delete answers and auto-reopen accepted doubts | Complete | Schema/migration, answer service, detail page, tests | Added `isDeleted`; a transaction hides the answer and clears resolution when applicable | Prisma transaction | Deleted answers disappear; deleting accepted answer reopens doubt | Soft-delete and auto-reopen test |
| Phase 3 UI states | Complete (automated build verification) | `DoubtDetail.tsx`, types/service | Added accepted-answer highlight and owner-only accept, reopen, edit and delete controls | Auth context and lifecycle API | Owner can manage their content; non-owners do not receive management controls | Frontend typecheck/build; manual browser verification remains environment-dependent |

## Compatibility and database notes

- The migration is additive: nullable `acceptedAnswerId` and a non-null `isDeleted` field with a default. It does not modify or remove existing rows. Its `NOT VALID` check constraint enforces `isResolved → acceptedAnswerId` for new and changed rows while remaining safe for legacy rows.
- The legacy `POST /doubts/:id/resolve` route remains available. It resolves only when exactly one active answer exists; otherwise it returns a validation error directing the client to use the explicit accept route.
- No migration will be executed against a database in this task. Applying it requires a configured PostgreSQL/Neon `DATABASE_URL`.

## Decision record

- **Action:** Add an accepted-answer relation and soft-delete field to the existing `Doubt` / `Answer` models.
- **Reason:** Phase 3 requires accepting an answer, reopening a doubt, and auto-reopening when an accepted answer is removed. The current schema stores only a boolean resolution flag and physically deletes answers, so it cannot preserve this invariant.
- **Risk:** Medium. This touches an existing relationship and needs a migration, but the change is additive and queries will explicitly exclude deleted answers.

## Implemented API and database changes

- `POST /api/v1/doubts/:id/accept` accepts `{ "answerId": "..." }` for the doubt owner. The answer must belong to the doubt and be active.
- `POST /api/v1/doubts/:id/reopen` reopens an owner’s doubt and clears `acceptedAnswerId`.
- Existing `POST /api/v1/doubts/:id/resolve` remains compatible. It accepts an optional `answerId`; without one it only succeeds when exactly one active answer exists.
- `Doubt.acceptedAnswerId` identifies the accepted answer. `Answer.isDeleted` enables soft deletion. Listing and detail queries exclude soft-deleted answers and counts.

## Validation results (2026-10-27)

| Command | Result |
|---|---|
| `cd backend && npm run test` | Pass — 6 files, 15 tests |
| `cd backend && npm run typecheck && npm run build` | Pass |
| `cd backend && npm run prisma:validate` | Pass |
| `cd frontend && npm run typecheck && npm run build && npm run test` | Pass — production build completed; 1 test passed |

## Known limitations and remaining work

- No PostgreSQL or Neon database was available in this task, so the new migration has been validated syntactically but not applied to a live database. Apply it only after backing up and reviewing the target environment.
- The documented roadmap’s organization/membership model is not present in the existing schema or API. This Phase 3 work preserves the current global subject-board contract rather than introducing an incompatible architecture.
- Phase 4 comments, vote-toggle semantics, and advanced resolution polish remain outside this Phase 3 change.

## Run commands

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev

# In another terminal
cd frontend
npm install
npm run dev
```
