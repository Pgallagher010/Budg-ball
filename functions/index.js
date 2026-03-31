import { onRequest } from "firebase-functions/v2/https"
import app from "../backend/src/app.js"

// Expose the existing Express app at /api/**
// firebase.json rewrites /api/** → this function.
export const api = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  app
)

