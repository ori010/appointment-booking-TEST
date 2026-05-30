import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/auth";

/**
 * Returns middleware that allows only the specified roles through.
 * Must be used after `requireAuth` (which sets req.user).
 *
 * Usage:
 *   router.post("/services", requireAuth, requireRole("ADMIN"), controller.create)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
      return;
    }

    next();
  };
}
