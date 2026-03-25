import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { subscriptionBulkSchema } from "../schemas/index.js";
import { getSubscriptions, saveSubscriptions } from "../services/subscriptionService.js";
import { ok } from "../utils/http.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const data = await getSubscriptions(req.user.uid);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
});

router.post("/", validate(subscriptionBulkSchema), async (req, res, next) => {
  try {
    const data = await saveSubscriptions(req.user.uid, req.validatedBody.items);
    return ok(res, data, 201);
  } catch (error) {
    return next(error);
  }
});

export default router;
