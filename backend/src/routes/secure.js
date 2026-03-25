import { Router } from "express";
import { ok } from "../utils/http.js";

const router = Router();

// Mirrors the slides' "secure function" idea for React clients.
router.get("/ping", (req, res) => {
  return ok(res, {
    message: "Authenticated request accepted.",
    uid: req.user.uid,
  });
});

export default router;
