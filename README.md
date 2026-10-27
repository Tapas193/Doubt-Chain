# Doubt-Chain

Hyper-local peer-to-peer university doubt-resolution platform (Graphite 26, PS 14). Students can search before posting, answer doubts, upvote answers, mark doubts resolved, and build a searchable subject-wise FAQ.

## Technology Stack
- Frontend: React, Vite, TypeScript, React Router, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma ORM
- Validation: Zod
- Auth foundation: HTTP-only cookie/JWT foundation (configured)
- Testing: Vitest, Supertest
- Media: Cloudinary (integration planned for later phase)

## Directory Structure
```
Doubt-Chain/
├── Docs/        # Product requirements and innovation docs
├── frontend/    # React + Vite app
├── backend/     # Express + TypeScript API
└── README.md
```

## Prerequisites
- Node.js 18+ (tested with v24.11.0)
- npm 9+
- PostgreSQL (for migrations/runtime; not required for typecheck/build in this phase)

## Environment Setup
1. Copy example env files:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
2. Fill required values. Never commit real secrets.

## Installation
From repo root:
```bash
cd frontend && npm install
cd ../backend && npm install
```

## Database Setup
```bash
cd backend
npx prisma validate
npx prisma generate
# Create/apply migrations only if DATABASE_URL is configured and DB is available
npx prisma migrate dev --name init
```

## Development
Frontend (http://localhost:5173):
```bash
cd frontend
npm run dev
```

Backend (http://localhost:4000):
```bash
cd backend
npm run dev
```

## Health Check
Once backend is running: `GET http://localhost:4000/api/v1/health`

## Validation
Frontend:
```bash
cd frontend
npm run typecheck
npm run build
npm run test
```

Backend:
```bash
cd backend
npm run typecheck
npm run build
npm run test
npx prisma validate
npx prisma generate
```

## Troubleshooting
- If Prisma client not generated, run `npx prisma generate` in backend.
- If DB connection fails, migrations will not run; typecheck/build can still pass without DB.
- Ensure `backend/.env` has correct `DATABASE_URL` when running migrations/runtime.
- Frontend proxies `/api` to `http://localhost:4000` in dev.
