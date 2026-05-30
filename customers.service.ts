import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload, UserRole } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

/**
 * Verifies the Bearer token in the Authorization header.
 * On success, attaches `req.user = { id, role }` and calls next().
 * On failure, returns 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: payload.userId, role: payload.role as UserRole };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
