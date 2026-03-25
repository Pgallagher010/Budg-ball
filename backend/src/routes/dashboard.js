import { Router } from "express";
import { getDashboardSummary } from "../services/dashboardService.js";
import { ok } from "../utils/http.js";

// Aggregated read-only endpoint used by dashboard widgets in React.
const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const monthKey = String(req.query.monthKey || new Date().toISOString().slice(0, 7));
    const summary = await getDashboardSummary(req.user.uid, monthKey);
    return ok(res, summary);
  } catch (error) {
    return next(error);
  }
});

export default router;
