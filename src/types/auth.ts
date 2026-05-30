/**
 * Mirrors the Prisma UserRole enum.
 * Defined here as a const so it can be imported anywhere without
 * requiring the Prisma client to have been regenerated first.
 */
export const UserRole = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Shape of the JWT payload stored in every access token. */
export interface JwtPayload {
  userId: string;
  role: UserRole;
}

/** Safe user object — never includes passwordHash. */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
