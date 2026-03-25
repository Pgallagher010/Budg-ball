import { Router } from "express";
import { firebaseReady } from "../config/firebase.js";
import { ok } from "../utils/http.js";

// Lightweight status endpoint for monitoring and quick local checks.
const router = Router();

router.get("/", (_req, res) => {
  return ok(res, {
    status: "ok",
    apiVersion: "v1",
    firebase: firebaseReady ? "connected" : "memory-mode",
    timestamp: new Date().toISOString(),
  });
});

export default router;
