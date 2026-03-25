# Budg'Ball

## Run backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Use `USE_MEMORY_DB=true` and `ALLOW_DEV_AUTH=true` in `.env` for the quickest local test.

## Run simple test GUI (React)

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and use the buttons to call the API. Set **x-dev-user-id** to your test user.

The Vite dev server proxies `/api` and `/health` to **http://localhost:4000**.

## Firebase

See **`docs/FIREBASE_SETUP.md`** for Auth + Firestore + backend service account steps.
