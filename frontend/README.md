# Budg'Ball — frontend (React + Vite)

Includes a **login / sign-up** screen (Firebase when configured, or local demo) and a **mobile-style dashboard** (ballimal header, charts, budget cards) fed by the backend API when it is running.

## Prerequisites

- Backend running on **port 4000** with `ALLOW_DEV_AUTH=true` and `USE_MEMORY_DB=true` (see `backend/.env.example`).
- Node.js installed.

## Run

From this folder:

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

Vite **proxies** `/api` and `/health` to `http://localhost:4000`, so you do not need to set CORS manually for the default origins.

Set **x-dev-user-id** in the UI to match a test user, then use the buttons to call endpoints and read JSON responses below.

## Firebase Auth (optional)

1. Copy `frontend/.env.example` → `frontend/.env.local` and paste your web app config from Firebase Console.
2. Run `npm install` (includes `firebase`).
3. In the UI, choose **Firebase ID token** and sign in with Email/Password (enable it in Firebase Console → Authentication).

The backend must use the **Firebase Admin** service account and have `ALLOW_DEV_AUTH=false` for production-like checks. See **`docs/FIREBASE_SETUP.md`** at the repo root.
