import { Router } from "express";
import { goalSchema, goalUpdateSchema } from "../schemas/index.js";
import { validate } from "../middleware/validate.js";
import { completeGoal, createGoal, listGoals, updateGoal } from "../services/goalService.js";
import { fail, ok } from "../utils/http.js";

// Goal endpoints implement create/list/update/complete flow from user stories.
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const goals = await listGoals(req.user.uid);
    return ok(res, { goals });
  } catch (error) {
    return next(error);
  }
});

router.post("/", validate(goalSchema), async (req, res, next) => {
  try {
    const goal = await createGoal(req.user.uid, req.validatedBody);
    return ok(res, goal, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:goalId", validate(goalUpdateSchema), async (req, res, next) => {
  try {
    const goal = await updateGoal(req.user.uid, req.params.goalId, req.validatedBody);
    if (!goal) return fail(res, "Goal not found", 404);
    return ok(res, goal);
  } catch (error) {
    return next(error);
  }
});

router.post("/:goalId/complete", async (req, res, next) => {
  try {
    // Completion also awards coins and updates ballimal state in service layer.
    const result = await completeGoal(req.user.uid, req.params.goalId);
    if (!result) return fail(res, "Goal not found", 404);
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
});

export default router;
