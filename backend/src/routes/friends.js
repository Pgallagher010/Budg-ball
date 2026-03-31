import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { friendRequestSchema } from "../schemas/index.js";
import { ok } from "../utils/http.js";
import { store } from "../data/store.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const friends = await store.listFriends(req.user.uid);
    return ok(res, { friends });
  } catch (e) {
    return next(e);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const users = await store.searchUsers(q, req.user.uid);
    return ok(res, { users });
  } catch (e) {
    return next(e);
  }
});

router.post("/requests", validate(friendRequestSchema), async (req, res, next) => {
  try {
    const created = await store.createFriendRequest(req.user.uid, req.validatedBody.toUid);
    return ok(res, created, 201);
  } catch (e) {
    return next(e);
  }
});

router.post("/requests/:requestId/accept", async (req, res, next) => {
  try {
    const friendship = await store.acceptFriendRequest(req.user.uid, req.params.requestId);
    return ok(res, friendship);
  } catch (e) {
    return next(e);
  }
});

export default router;

