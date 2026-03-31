import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { expenseSchema } from "../schemas/index.js";
import { createExpense, deleteExpense, listExpenses } from "../services/expenseService.js";
import { fail, ok } from "../utils/http.js";

// Expense endpoints are the main trigger for budget usage + ballimal recalculation.
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const monthKey = String(req.query.monthKey || new Date().toISOString().slice(0, 7));
    const data = await listExpenses(req.user.uid, monthKey);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
});

router.post("/", validate(expenseSchema), async (req, res, next) => {
  try {
    const data = await createExpense(req.user.uid, req.validatedBody);
    return ok(res, data, 201);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await deleteExpense(req.user.uid, req.params.id);
    if (result.error) {
      return fail(res, result.error, 404);
    }
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
});

export default router;
