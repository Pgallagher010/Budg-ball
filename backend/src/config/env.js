import dotenv from "dotenv";

dotenv.config();

// Required only when the backend is running against live Firebase.
const requiredInFirebaseMode = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const useMemoryDb = process.env.USE_MEMORY_DB !== "false";

// Fail early with a clear message rather than crashing later on first request.
if (!useMemoryDb) {
  const missing = requiredInFirebaseMode.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env variables: ${missing.join(", ")}. ` +
        "Either provide credentials or set USE_MEMORY_DB=true."
    );
  }
}

export const env = {
  // Keep defaults friendly for local development.
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  allowDevAuth: process.env.ALLOW_DEV_AUTH === "true",
  useMemoryDb,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  // Firebase private keys are usually stored with escaped newlines in .env files.
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n"
  ),
};
