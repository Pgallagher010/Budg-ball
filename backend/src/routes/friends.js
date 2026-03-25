import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { friendRequestSchema } from "../schemas/index.js";
import {
  acceptFriendRequest,
  createFriendRequest,
  listFriends,
  listIncomingFriendRequests,
  searchFriends,
} from "../services/friendService.js";
import { fail, ok } from "../utils/http.js";

// Friendship flow:
// search -> request -> recipient accepts -> friendship appears in list.
const router = Router();

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const users = await searchFriends(req.user.uid, q);
    return ok(res, { users });
  } catch (error) {
    return next(error);
  }
});

router.post("/requests", validate(friendRequestSchema), async (req, res, next) => {
  try {
    const result = await createFriendRequest(req.user.uid, req.validatedBody.toUid);
    if (result.error) return fail(res, result.error, 400);
    return ok(res, result.request, 201);
  } catch (error) {
    return next(error);
  }
});

router.get("/requests", async (req, res, next) => {
  try {
    const requests = await listIncomingFriendRequests(req.user.uid);
    return ok(res, { requests });
  } catch (error) {
    return next(error);
  }
});

router.post("/requests/:requestId/accept", async (req, res, next) => {
  try {
    const friendship = await acceptFriendRequest(req.user.uid, req.params.requestId);
    if (!friendship) return fail(res, "Request not found", 404);
    return ok(res, friendship);
  } catch (error) {
    return next(error);
  }
});

router.get("/list", async (req, res, next) => {
  try {
    const friends = await listFriends(req.user.uid);
    return ok(res, { friends });
  } catch (error) {
    return next(error);
  }
});

export default router;
