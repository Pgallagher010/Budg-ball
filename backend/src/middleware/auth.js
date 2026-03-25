import { env } from "../config/env.js";
import { firebaseAdmin, firebaseReady } from "../config/firebase.js";
import { fail } from "../utils/http.js";

// Authentication middleware supports:
// 1) Firebase ID tokens in production-like environments.
// 2) x-dev-user-id in local development for quicker frontend iteration.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (token && firebaseReady) {
      // verifyIdToken also validates signature/expiry and returns trusted user claims.
      const decoded = await firebaseAdmin.auth().verifyIdToken(token);
      req.user = { uid: decoded.uid, email: decoded.email || "" };
      return next();
    }

    if (env.allowDevAuth) {
      // Dev mode bypass should never be enabled in production deployments.
      const devUid = req.headers["x-dev-user-id"];
      if (!devUid || typeof devUid !== "string") {
        return fail(res, "Missing auth. In development, pass x-dev-user-id header.", 401);
      }
      req.user = { uid: devUid, email: "" };
      return next();
    }

    return fail(res, "Unauthorized", 401);
  } catch (error) {
    return next(error);
  }
}
