import { Router } from "express";
import { env } from "../config/env.js";
import { validate } from "../middleware/validate.js";
import { devSetCoinsSchema } from "../schemas/index.js";
import { setMyCoins } from "../services/userService.js";
import { fail, ok } from "../utils/http.js";

const router = Router();

// Dev-only routes to speed up local testing (not mounted/usable in production).
router.post("/coins", validate(devSetCoinsSchema), async (req, res, next) => {
  try {
    if (env.nodeEnv !== "development") {
      return fail(res, "Not available", 404);
    }
    const user = await setMyCoins(req.user.uid, req.validatedBody.coins);
    return ok(res, user);
  } catch (error) {
    return next(error);
  }
});

export default router;

