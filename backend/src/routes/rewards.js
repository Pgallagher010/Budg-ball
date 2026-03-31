import { Router } from "express";
import { claimWeeklyCoins } from "../services/rewardService.js";
import { fail, ok } from "../utils/http.js";

const router = Router();

router.post("/weekly-claim", async (req, res, next) => {
  try {
    const result = await claimWeeklyCoins(req.user.uid);
    if (result.error) return fail(res, result.error, 400);
    return ok(res, result, 201);
  } catch (error) {
    return next(error);
  }
});

export default router;

