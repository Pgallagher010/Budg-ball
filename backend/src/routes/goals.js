import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { goalSchema, goalUpdateSchema } from "../schemas/index.js";
import { ok, fail } from "../utils/http.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const goals = await store.listGoals(req.user.uid);
    return ok(res, { goals });
  } catch (e) {
    return next(e);
  }
});

router.post("/", validate(goalSchema), async (req, res, next) => {
  try {
    const goal = await store.createGoal(req.user.uid, req.validatedBody);
    return ok(res, goal, 201);
  } catch (e) {
    return next(e);
  }
});

router.patch("/:goalId", validate(goalUpdateSchema), async (req, res, next) => {
  try {
    const updated = await store.updateGoal(req.user.uid, req.params.goalId, req.validatedBody);
    if (!updated) return fail(res, "Goal not found", 404);
    return ok(res, updated);
  } catch (e) {
    return next(e);
  }
});

export default router;

