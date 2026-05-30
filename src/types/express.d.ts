import { UserRole } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

// Makes this file a module (required for declaration merging to work)
export {};
