import admin from "firebase-admin";
import { env } from "./env.js";

let isFirebaseReady = false;

// Firebase initialization is optional so contributors can run the project
// in memory-mode without needing service account credentials.
if (!env.useMemoryDb) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    }),
  });
  isFirebaseReady = true;
}

export const firebaseAdmin = admin;
export const firestore = isFirebaseReady ? admin.firestore() : null;
export const firebaseReady = isFirebaseReady;
