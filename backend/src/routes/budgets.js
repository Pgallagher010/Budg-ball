import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { budgetSchema } from "../schemas/index.js";
import { listBudgets, setBudget } from "../services/budgetService.js";
import { ok } from "../utils/http.js";

// Budget routes are intentionally thin: validation + auth are done in middleware,
// while computations are delegated to services for easier testing.
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    // monthKey format: YYYY-MM, defaults to current month.
    const monthKey = String(req.query.monthKey || new Date().toISOString().slice(0, 7));
    const summary = await listBudgets(req.user.uid, monthKey);
    return ok(res, summary);
  } catch (error) {
    return next(error);
  }
});

router.post("/", validate(budgetSchema), async (req, res, next) => {
  try {
    const budget = await setBudget(req.user.uid, req.validatedBody);
    return ok(res, budget, 201);
  } catch (error) {
    return next(error);
  }
});

export default router;
