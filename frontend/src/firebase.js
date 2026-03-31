import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"

function buildConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

export function isFirebaseClientConfigured() {
  const c = buildConfig()
  return Boolean(c.apiKey && c.projectId)
}

export function getFirebaseApp() {
  if (!isFirebaseClientConfigured()) return null
  const config = buildConfig()
  if (!getApps().length) return initializeApp(config)
  return getApps()[0]
}

export function getFirebaseAuth() {
  const app = getFirebaseApp()
  return app ? getAuth(app) : null
}
