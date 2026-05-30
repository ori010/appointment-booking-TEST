import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../middleware/errorHandler";
import { RegisterInput, LoginInput } from "../validators/auth.validator";
import { JwtPayload, SafeUser, UserRole } from "../types/auth";

// Prisma doesn't know about User yet until `prisma generate` is run after
// the schema update, so we access it via `as any` and type the results
// ourselves. Run `npm run db:generate` after pulling schema changes.
import prisma from "../db/prisma";
const db = prisma as any;

const BCRYPT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    createdAt: user.createdAt,
  };
}

function signToken(userId: string, role: UserRole): string {
  const payload: JwtPayload = { userId, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function register(data: RegisterInput): Promise<{ user: SafeUser; token: string }> {
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    },
  });

  const token = signToken(user.id, user.role as UserRole);
  return { user: toSafeUser(user), token };
}

export async function login(data: LoginInput): Promise<{ user: SafeUser; token: string }> {
  const user = await db.user.findUnique({ where: { email: data.email } });

  if (!user) {
    // Same message for unknown email and wrong password — prevents user enumeration
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(user.id, user.role as UserRole);
  return { user: toSafeUser(user), token };
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);
  return toSafeUser(user);
}
