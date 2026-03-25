# Adding Firebase to Budg'Ball

Your app has **two** Firebase touchpoints:

1. **Firebase Authentication (client)** — users sign in in the React app; the app sends an **ID token** to your API.
2. **Firebase Admin + Firestore (server)** — the Node backend verifies tokens and reads/writes Firestore.

You can start with **Auth only** (backend still on `USE_MEMORY_DB=true`) or enable **Firestore** for real persistence.

---

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. After creation, click **Add app** → **Web** (`</>`). Register the app and copy the **firebaseConfig** object (you will map these to `VITE_*` variables in the frontend).

---

## 2. Enable Authentication

1. In Firebase Console: **Build → Authentication → Get started**.
2. Enable **Email/Password** (same as your course slides).
3. Create a test user under **Users** (optional), or sign up from your app later.

---

## 3. Enable Firestore (when you want real database)

1. **Build → Firestore Database → Create database**.
2. Start in **production mode** (you can tighten rules later).
3. Choose a region and finish.

> The backend uses the **Admin SDK**, which **bypasses** Firestore security rules. Rules still matter if you ever read/write Firestore **directly from the browser**; right now all data goes through your API.

---

## 4. Frontend: environment variables (Vite)

1. In `frontend/`, copy `.env.example` to `.env.local` (Vite loads this automatically; it is git-ignored).
2. Paste values from the Firebase web app config:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

3. Install the client SDK (if not already):

```bash
cd frontend
npm install firebase
```

4. Restart `npm run dev` after changing env files.

In the **API tester** UI, choose **Firebase ID token** auth mode, sign in with email/password, then call the API — requests will send `Authorization: Bearer <token>`.

---

## 5. Backend: service account (Admin SDK)

1. Firebase Console → **Project settings** (gear) → **Service accounts**.
2. **Generate new private key** → download the JSON file.
3. In `backend/.env` set (from that JSON):

- `USE_MEMORY_DB=false` — use Firestore instead of in-memory store.
- `ALLOW_DEV_AUTH=false` — **recommended** when using real Firebase Auth (so only valid tokens work).
- `FIREBASE_PROJECT_ID` — `project_id` from JSON.
- `FIREBASE_CLIENT_EMAIL` — `client_email` from JSON.
- `FIREBASE_PRIVATE_KEY` — `private_key` from JSON, but as **one line** with `\n` for newlines, e.g.  
  `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

4. Restart the backend.

**Important:** The **UID** from Firebase Auth must match the **Firestore user document** your API uses. This project uses `users/{uid}` where `uid` is the Firebase Auth UID. After signing in with Firebase, call **POST /api/users/me** once to create/update the profile for that UID.

---

## 6. CORS

Keep your frontend origin in `FRONTEND_ORIGINS` (e.g. `http://localhost:5173`). The default in `.env.example` already includes Vite’s port.

---

## 7. Optional: deploy backend as Firebase Cloud Functions

Your course slides use **`firebase init functions`** and deploy with **`firebase deploy`**. This repo’s backend is a standalone Express app; to host it on Firebase you would either:

- wrap routes in **Cloud Functions** (`onRequest`), or  
- deploy Express elsewhere (Render, Railway, etc.) and only use Firebase for Auth + Firestore.

That is a larger refactor; the steps above work with **local Express + local Vite**.

---

## Quick checklist

| Step | Frontend | Backend |
|------|----------|---------|
| Auth enabled | `.env.local` + `npm install firebase` | Service account env vars |
| Token sent | Sign in → Bearer token | `firebaseReady` → `verifyIdToken` |
| Firestore | (optional) | `USE_MEMORY_DB=false` |
| Dev header bypass | Turn off Firebase mode in UI | `ALLOW_DEV_AUTH=false` |

If something fails:

- **401 Unauthorized** with Firebase mode: check backend has correct `FIREBASE_PRIVATE_KEY` formatting and `USE_MEMORY_DB=false` only when Firestore is intended.
- **CORS errors**: add your exact dev URL to `FRONTEND_ORIGINS`.
