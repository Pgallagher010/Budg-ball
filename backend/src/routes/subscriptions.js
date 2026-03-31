import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { subscriptionBulkSchema } from "../schemas/index.js";
import { ok } from "../utils/http.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await store.listSubscriptions(req.user.uid);
    return ok(res, { items });
  } catch (e) {
    return next(e);
  }
});

router.post("/", validate(subscriptionBulkSchema), async (req, res, next) => {
  try {
    const items = await store.upsertSubscriptions(req.user.uid, req.validatedBody.items);
    return ok(res, { items }, 201);
  } catch (e) {
    return next(e);
  }
});

export default router;

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
