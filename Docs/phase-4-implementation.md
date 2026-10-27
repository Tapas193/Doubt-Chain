# Phase 4 Implementation Checklist

**Source of truth:** `Docs/09-implementation-roadmap.md`, Phase 4 — Search, Votes, Discussions, Resolution Polish. The existing application uses the compatible `/api/v1/doubts` and `/api/v1/answers` APIs instead of the roadmap's proposed organization-scoped API.

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

| Requirement | Current status | Relevant files | Implementation | Dependencies | Acceptance criteria | Required tests |
|---|---|---|---|---|---|---|
| Vote toggle and counts | Partial: upvote-only table and endpoints; duplicate upvotes return `409` | Prisma schema/migration, answer route/controller/service, frontend detail | Add signed vote value; expose `POST/DELETE /answers/:id/votes`; preserve legacy upvote aliases | Auth, answer lifecycle, unique `(userId, answerId)` | Same vote toggles off; switching sign updates both counts; one row per user/answer | Create, toggle, switch, remove, deleted-answer and invalid-value tests |
| Flat answer comments | Missing | Prisma schema/migration, comment module, answer routes, detail UI | Add soft-deletable answer comments with owner-only removal | Auth, active answer | Authenticated users can create/list comments; owner can remove own comment | Create, list, ownership, deleted-answer and validation tests |
| Keyword search baseline | Present but returns all matching doubts | Doubt validator/service, frontend search/new-doubt | Add optional resolved filter and use it in Search-Before-Posting interfaces | Existing query validation | Similar-question views prioritize resolved knowledge without breaking callers that need all matches | Search filter validation/service tests |
| Resolution polish | Partial: badge/highlight exist; no accept/reopen confirmation | Detail page | Add accessible confirmation states for accept and reopen actions | Phase 3 lifecycle API | Owner intentionally confirms lifecycle changes; accepted answer remains highlighted | Frontend build/typecheck; lifecycle API regression tests |

## Compatibility decisions

- The current global subject-board schema has no organization or membership table, so organization isolation cannot be retrofitted within this phase without a breaking architecture change. Existing current-user ownership authorization remains enforced.
- `AnswerUpvote` remains the Prisma model/table name to preserve deployed records and current relations. It will represent both positive and negative votes through an additive `value` field.
- The existing `/upvote` routes remain available as aliases; new code uses the documented `/votes` routes.

## Decision record

- **Action:** Extend existing vote persistence and add a comments relation, routes, services, UI, and tests.
- **Reason:** Phase 4 explicitly requires signed/toggle votes and flat comments. Neither can be supplied by the current upvote-only API.
- **Risk:** Medium. The changes affect answer response serialization and require an additive migration. Existing accepted-answer and soft-delete checks will remain in each new operation.
