import { fail } from "../utils/http.js";

// Reusable request-body validator based on zod schemas.
// Adds parsed payload to req.validatedBody to keep route handlers clean.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return fail(
        res,
        "Validation failed",
        400,
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }))
      );
    }
    req.validatedBody = result.data;
    return next();
  };
}
