import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { budgetSchema } from "../schemas/index.js";
import { ok } from "../utils/http.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/:monthKey", async (req, res, next) => {
  try {
    const budgets = await store.listBudgets(req.user.uid, req.params.monthKey);
    return ok(res, { budgets });
  } catch (e) {
    return next(e);
  }
});

router.post("/", validate(budgetSchema), async (req, res, next) => {
  try {
    const saved = await store.setBudget(req.user.uid, req.validatedBody);
    return ok(res, saved, 201);
  } catch (e) {
    return next(e);
  }
});

export default router;

