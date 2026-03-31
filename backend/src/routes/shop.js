import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { shopPurchaseSchema } from "../schemas/index.js";
import { listShop, purchaseShopItem } from "../services/shopService.js";
import { fail, ok } from "../utils/http.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const data = await listShop(req.user.uid);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
});

router.post("/purchase", validate(shopPurchaseSchema), async (req, res, next) => {
  try {
    const result = await purchaseShopItem(req.user.uid, req.validatedBody.sku);
    if (result.error) return fail(res, result.error, 400);
    return ok(res, result, 201);
  } catch (error) {
    return next(error);
  }
});

export default router;

