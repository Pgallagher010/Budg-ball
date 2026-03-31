import { Router } from "express";
import { ok } from "../utils/http.js";

const router = Router();

router.get("/ping", (req, res) => {
  return ok(res, { uid: req.user.uid, secure: true });
});

export default router;

