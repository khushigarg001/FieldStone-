import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

type Target = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, target: Target = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[target]);
    (req as any)[target] = parsed;
    next();
  };
}
