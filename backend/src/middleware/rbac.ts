import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthedRequest } from "./auth";
import { AppError } from "../utils/AppError";

export function requireRole(...allowed: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(AppError.forbidden(`This action requires one of: ${allowed.join(", ")}`));
    }
    next();
  };
}

export const OWNERSHIP_NOTE =
  "Ownership/assignment checks live in the service layer, against the loaded row — see project.service.ts and task.service.ts.";
