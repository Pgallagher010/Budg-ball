import { Router } from "express";
import { ok } from "../utils/http.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const summary = await store.buildDashboardSummary(req.user.uid);
    return ok(res, summary);
  } catch (e) {
    return next(e);
  }
});

export default router;

