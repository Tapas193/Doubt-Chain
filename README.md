# Doubt-Chain

A place where students on the same campus answer each other's doubts, and where every answered doubt sticks around so nobody has to ask the same thing twice.

Built for **Graphite 26 (GEHU Bhimtal), PS 14 – Peer-to-Peer Doubt Resolution Tracker**.

---

## The idea in 30 seconds

Most doubt groups die in a WhatsApp scroll. Someone asks "why is my BST insert not working?", gets an answer at 11 pm, and two weeks later someone else asks the same thing. Doubt-Chain fixes that loop:

1. **Search before you post.** Typing a question shows similar ones that were already solved (keyword + AI meaning-based matching).
2. **Post it if nothing helps**, with text, a photo of your notebook, or a voice note.
3. **Peers answer, reply, comment and vote.** The asker picks the answer that actually worked.
4. **Accepted answers become FAQ entries**, grouped by subject, searchable by everyone.

On top of that there is an AI study assistant that answers from what's already in the platform, and the UI works in English, Hindi and Hinglish.

## What's in the box

| Area | What you get |
|---|---|
| **Subjects** | Course boards (e.g. CS201 Data Structures). Join with a code like `DS-201`. |
| **Doubts** | Create, edit, filter by subject / resolved state, attach up to 5 files. |
| **Answers** | Threaded replies, up/down votes, comments, soft delete. |
| **Resolution** | Owner accepts one answer → doubt becomes *resolved*. Delete the accepted answer, or reopen, and it goes back to *open*. |
| **Smart search** | Keyword scoring blended with Gemini embeddings, plus "did this help?" feedback. |
| **Image OCR & voice transcription** | Photos and audio are turned into searchable text on upload. |
| **Auto FAQ** | Accepting an answer generates a clean Q&A + tags for the subject FAQ. |
| **AI study assistant** | Multi-turn chat with modes (beginner, step-by-step, example, Hinglish, debug), thumbs up/down and "report this answer". |
| **Multilingual** | English / हिन्दी / Hinglish UI, plus on-demand translation of doubts and answers. |

## Tech stack

- **Frontend:** React 18, Vite, TypeScript, React Router, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Zod for validation
- **Database:** PostgreSQL via Prisma
- **Auth:** JWT stored in an HTTP-only cookie (a `Bearer` header also works)
- **AI:** Google Gemini through `@google/genai` (embeddings, generation, OCR, transcription)
- **Tests:** Vitest (both sides), Supertest (API)

## Project layout

```
Doubt-Chain/
├── backend/
│   ├── prisma/          # schema, migrations, seed script
│   ├── src/
│   │   ├── routes/      # URL → controller wiring
│   │   ├── controllers/ # request/response handling
│   │   ├── services/    # business logic (doubts, answers, AI, ...)
│   │   ├── validators/  # Zod schemas
│   │   ├── middleware/  # auth, validation, error handler
│   │   └── config/      # env parsing, Prisma client
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── pages/       # one file per screen
│   │   ├── components/  # shared UI pieces
│   │   ├── i18n/        # en / hi / hinglish dictionaries
│   │   ├── context/     # auth state
│   │   └── lib, services/ # API client and calls
│   └── tests/
└── Docs/                # product, research, design and API docs
```

## Getting it running

### You need

- Node.js 18 or newer (developed on 24)
- npm 9+
- A PostgreSQL database you can connect to
- *(Optional but recommended)* a [Gemini API key](https://aistudio.google.com/) for the AI features

### 1. Install

```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Configure

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

Then edit `backend/.env`:

| Variable | Needed? | What it does |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_SECRET` | yes | Signs login tokens. Use a long random string outside local dev |
| `PORT` | no | API port, defaults to `4000` |
| `CLIENT_ORIGIN` | no | Allowed frontend origin for CORS, defaults to `http://localhost:5173` |
| `GEMINI_API_KEY` | for AI | Without it, the app still runs, but the AI assistant, OCR, transcription, translation and AI-powered search matching won't work |
| `CLOUDINARY_*` | no | Reserved for later. Uploads currently go to the local `backend/uploads/` folder |

The frontend only needs `VITE_API_BASE_URL` (defaults to `/api/v1`, which Vite proxies to the backend in dev).

### 3. Set up the database

```bash
cd backend
npx prisma generate
npx prisma migrate dev     # applies all migrations
npx prisma db seed         # optional: demo subjects, user and sample doubts
```

The seed script creates five subjects, a demo account and about 30 sample doubts:

| Subject | Code | Join code |
|---|---|---|
| Data Structures | CS201 | `DS-201` |
| Object Oriented Programming | CS202 | `OOP-202` |
| Digital Logic | CS203 | `DL-203` |
| Operating Systems | CS204 | `OS-204` |
| Database Management Systems | CS205 | `DBMS-205` |

Demo login: `demo@doubtchain.dev` / `demo123456` (local use only, obviously).

### 4. Run

Two terminals:

```bash
# terminal 1 – API on http://localhost:4000
cd backend && npm run dev

# terminal 2 – app on http://localhost:5173
cd frontend && npm run dev
```

Open http://localhost:5173. Quick sanity check for the API: `curl http://localhost:4000/api/v1/health`.

## Everyday commands

| Where | Command | Does |
|---|---|---|
| backend | `npm run dev` | Start API with auto-reload |
| backend | `npm test` | Run API tests (no database needed, they mock Prisma, but run `npx prisma generate` once first) |
| backend | `npm run typecheck` | TypeScript check |
| backend | `npm run build && npm start` | Production build and run |
| backend | `npm run prisma:studio` | Browse the DB in the browser |
| frontend | `npm run dev` | Start Vite dev server |
| frontend | `npm test` | Run UI/service tests |
| frontend | `npm run typecheck` / `npm run build` | Check / bundle |

## Good to know

- **Rate limits:** 100 requests / 15 min overall, 20 / 15 min on login and register, 30 / min on AI endpoints.
- **Uploads:** JPEG, PNG, WebP images and WebM, MP4, M4A, OGG, WAV, MP3 audio, up to 10 MB. The server checks the file's actual header bytes, not just the extension.
- **No AI key?** Search falls back to keyword matching, and everything else outside the AI features keeps working.
- **Roles at sign-up:** Student, Professor or Corporate Worker, with an ID number.

## More docs

- [API reference](Docs/api-reference.md) – every endpoint, what it expects and returns
- [How it works](Docs/how-it-works.md) – search scoring, answer lifecycle, AI pipeline, data model
- [Contributing](CONTRIBUTING.md) – workflow, conventions, how to add a feature
- [Troubleshooting](Docs/troubleshooting.md) – the errors you're most likely to hit
- Planning material in `Docs/`: PRD, problem analysis, research, architecture, technical design, roadmap, testing plan, phase checklists

## Troubleshooting (quick version)

- `PrismaClientInitializationError` → run `npx prisma generate` and check `DATABASE_URL`.
- Login works in dev but not in production → cookies need HTTPS in production (`secure`, `sameSite=none`) and `CLIENT_ORIGIN` must match your real frontend URL exactly.
- AI calls return 500 mentioning `GEMINI_API_KEY` → set it in `backend/.env` and restart.

More in [Docs/troubleshooting.md](Docs/troubleshooting.md).