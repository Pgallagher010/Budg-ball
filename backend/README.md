# Budg'Ball Backend

Node.js + Express backend for Budg'Ball with Firebase support and React-ready APIs.
This rewrite follows the course slide themes: modular Node code, REST API contracts,
Firebase auth token flow, document ownership, and integration testing.

## What this backend includes

- Firebase Admin authentication support (`Bearer <Firebase ID Token>`)
- Development auth mode (`x-dev-user-id` header)
- Goals API (daily/weekly/monthly)
- Budget API (monthly category budgets + usage warnings)
- Expense API (logging + budget impact + ballimal updates)
- Friends API (search, request, accept, list)
- Dashboard summary API (spending, budgets, goal progress, ballimal state)
- Firebase data mode and memory data mode

## Project structure

- `src/config`: env and Firebase setup
- `src/middleware`: auth, validation, error handlers
- `src/data`: data store abstraction (Firebase or in-memory)
- `src/routes`: thin REST route modules
- `src/services`: business logic modules
- `examples/reactApiExample.jsx`: sample React + Firebase integration
- `test/api.test.js`: Mocha/Chai integration tests
- `SLIDES_ALIGNMENT.md`: direct mapping from lecture slides to implementation

## Setup

1. Install Node.js 20+ and npm.
2. In `backend/`, run:
   - `npm install`
3. Copy `.env.example` to `.env`.

### Option A: Local development mode (no Firebase credentials required)

Use:

- `USE_MEMORY_DB=true`
- `ALLOW_DEV_AUTH=true`

Then call APIs with header:

- `x-dev-user-id: any-user-id`

### Option B: Firebase mode

Use:

- `USE_MEMORY_DB=false`
- `ALLOW_DEV_AUTH=false`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (with escaped newlines)

## Run

- Dev: `npm run dev`
- Prod: `npm start`
- Test: `npm test`

## Response format

All endpoints return a stable envelope suitable for React state handling:

- Success:
  - `{ "success": true, "data": ... }`
- Error:
  - `{ "success": false, "error": { "message": "...", "details": ... } }`

## API overview

- `GET /health`
- `GET/POST /api/users/me`
- `GET/POST/PATCH /api/goals` and `POST /api/goals/:goalId/complete`
- `GET/POST /api/budgets`
- `GET/POST /api/expenses`
- `GET /api/dashboard/summary`
- `GET /api/secure/ping` (auth check for secure sections in React)
- `GET /api/friends/search?q=`
- `GET/POST /api/friends/requests`
- `POST /api/friends/requests/:requestId/accept`
- `GET /api/friends/list`

## React + Firebase notes

- Sign in on React side using Firebase client SDK.
- Read current user ID token with `getIdToken()`.
- Send token as `Authorization: Bearer <token>`.
- See `examples/reactApiExample.jsx` for a direct example.
- In local mode, use `x-dev-user-id` for quick React development without Firebase credentials.
