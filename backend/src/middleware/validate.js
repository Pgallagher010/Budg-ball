import { fail } from "../utils/http.js";

export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, "Validation failed", 400, parsed.error.flatten());
    }
    req.validatedBody = parsed.data;
    return next();
  };
}

