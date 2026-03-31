import { env } from "../config/env.js";
import { admin, firebaseReady } from "../config/firebase.js";
import { fail } from "../utils/http.js";

function getBearerToken(req) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : "";
}

export async function requireAuth(req, res, next) {
  try {
    // Dev mode: allow quick local testing without Firebase.
    if (env.allowDevAuth) {
      const devUid = req.header("x-dev-user-id");
      if (devUid) {
        req.user = { uid: devUid, mode: "dev" };
        return next();
      }
    }

    // Production-like mode: verify Firebase ID token.
    const token = getBearerToken(req);
    if (!token) return fail(res, "Missing Authorization Bearer token", 401);
    if (!firebaseReady) return fail(res, "Firebase Admin not configured", 500);

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, mode: "firebase" };
    return next();
  } catch (e) {
    return fail(res, "Unauthorized", 401);
  }
}

