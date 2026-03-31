import dotenv from "dotenv";

dotenv.config();

// Required only when the backend is running against live Firebase.
const requiredInFirebaseMode = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const useMemoryDb = process.env.USE_MEMORY_DB !== "false";
const hasDefaultGcpCreds = Boolean(process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT);

// Fail early with a clear message rather than crashing later on first request.
if (!useMemoryDb) {
  const missing = requiredInFirebaseMode.filter((k) => !process.env[k]);
  // On Firebase/Google Cloud (Functions/Run), Admin SDK can use default credentials without embedding keys.
  if (missing.length > 0 && !hasDefaultGcpCreds) {
    throw new Error(
      `Missing Firebase env variables: ${missing.join(", ")}. ` +
        "Either provide credentials or set USE_MEMORY_DB=true."
    );
  }
}

// CORS: allow Vite (5173) and Create React App (3000) by default when unset.
const corsOriginsRaw =
  process.env.FRONTEND_ORIGINS ||
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:5173,http://localhost:3000";
const frontendOrigins = corsOriginsRaw
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const env = {
  // Keep defaults friendly for local development.
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  /** @type {string | string[]} Single origin or list for cors() */
  frontendOrigin: frontendOrigins.length === 1 ? frontendOrigins[0] : frontendOrigins,

  // In development, default to allowing the x-dev-user-id header so the React demo flow works
  // even if you haven't created a backend/.env file yet.
  // For production-like setups, explicitly set ALLOW_DEV_AUTH=false.
  allowDevAuth:
    process.env.ALLOW_DEV_AUTH === "true" ||
    (process.env.ALLOW_DEV_AUTH !== "false" &&
      (process.env.NODE_ENV || "development") === "development"),

  useMemoryDb,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  // Firebase private keys are usually stored with escaped newlines in .env files.
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n"
  ),
};
