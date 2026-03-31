import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { userPreferencesSchema, userSchema } from "../schemas/index.js";
import { fail, ok } from "../utils/http.js";
import { getMyProfile, updateMyPreferences, upsertMyProfile } from "../services/userService.js";

const router = Router();

router.get("/me", async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.uid);
    if (!user) return fail(res, "User profile not found", 404);
    return ok(res, user);
  } catch (e) {
    return next(e);
  }
});

router.post("/me", validate(userSchema), async (req, res, next) => {
  try {
    const user = await upsertMyProfile(req.user.uid, req.validatedBody);
    return ok(res, user, 201);
  } catch (e) {
    return next(e);
  }
});

router.patch("/me/preferences", validate(userPreferencesSchema), async (req, res, next) => {
  try {
    const user = await updateMyPreferences(req.user.uid, req.validatedBody);
    return ok(res, user);
  } catch (e) {
    return next(e);
  }
});

export default router;

import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { userPreferencesSchema, userSchema } from "../schemas/index.js";
import {
  getMyProfile,
  updateMyPreferences,
  upsertMyProfile,
} from "../services/userService.js";
import { fail, ok } from "../utils/http.js";

// User profile routes for the currently authenticated user.
// We do not expose arbitrary user profile writes from this route group.
const router = Router();

router.get("/me", async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.uid);
    if (!user) {
      return fail(res, "User profile not found", 404);
    }
    return ok(res, user);
  } catch (error) {
    return next(error);
  }
});

router.post("/me", validate(userSchema), async (req, res, next) => {
  try {
    const user = await upsertMyProfile(req.user.uid, req.validatedBody);
    return ok(res, user, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/me/preferences", validate(userPreferencesSchema), async (req, res, next) => {
  try {
    const user = await updateMyPreferences(req.user.uid, req.validatedBody);
    return ok(res, user);
  } catch (error) {
    return next(error);
  }
});

export default router;
