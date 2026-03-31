import admin from "firebase-admin";
import { env } from "./env.js";

let firestore = null;
let firebaseReady = false;

// Firestore is optional in dev: USE_MEMORY_DB=true avoids needing credentials.
if (!env.useMemoryDb) {
  try {
    if (!admin.apps.length) {
      // Prefer explicit service-account env vars when provided (Render/VM/etc).
      // On Firebase/Google Cloud, fall back to default credentials automatically.
      const hasEnvCreds = Boolean(
        env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey
      );
      if (hasEnvCreds) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: env.firebaseProjectId,
            clientEmail: env.firebaseClientEmail,
            privateKey: env.firebasePrivateKey,
          }),
        });
      } else {
        admin.initializeApp();
      }
    }
    firestore = admin.firestore();
    firebaseReady = true;
  } catch (e) {
    // Keep startup resilient: surfaces as firebaseReady=false (memory DB can still be used).
    firestore = null;
    firebaseReady = false;
  }
}

export { firestore, firebaseReady };
export { admin };

