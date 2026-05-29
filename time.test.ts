import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type ValidationTarget = "body" | "query" | "params";

/**
 * Returns an Express middleware that validates a part of the request
 * against the provided Zod schema. Passes ZodError to the error handler
 * on failure so all error formatting stays in one place.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(result.error);
    }
    // Replace the raw value with the parsed (and coerced) value
    req[target] = result.data;
    next();
  };
}
