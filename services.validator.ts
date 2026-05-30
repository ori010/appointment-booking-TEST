import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// All external dependencies are mocked so no DB, no real hashing, no real JWT
// ---------------------------------------------------------------------------

vi.mock("../db/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-jwt-token"),
    verify: vi.fn(),
  },
}));

import prisma from "../db/prisma";
import bcrypt from "bcryptjs";
import { register, login, getMe } from "../services/auth.service";
import { AppError } from "../middleware/errorHandler";

// The service accesses Prisma via `prisma as any` (db.user.*).
// Since both `prisma` and `db` point to the same mock object, we cast here too.
const db = prisma as any;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane@example.com",
  passwordHash: "hashed-password",
  role: "CUSTOMER",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no existing user, create succeeds, bcrypt compare succeeds
  db.user.findUnique.mockResolvedValue(null);
  db.user.create.mockResolvedValue(mockUser);
  vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
});

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

describe("register", () => {
  it("creates a user and returns a token on valid input", async () => {
    const result = await register({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      role: "CUSTOMER",
    });

    expect(result.token).toBe("mock-jwt-token");
    expect(result.user.email).toBe("jane@example.com");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("hashes the password before storing", async () => {
    await register({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      role: "CUSTOMER",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", expect.any(Number));
    const createCall = db.user.create.mock.calls[0][0];
    expect(createCall.data.passwordHash).toBe("hashed-password");
    expect(createCall.data).not.toHaveProperty("password");
  });

  it("throws 409 when email is already registered", async () => {
    db.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      register({ name: "Jane", email: "jane@example.com", password: "pass1234", role: "CUSTOMER" })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("defaults role to CUSTOMER when not specified", async () => {
    // The Zod schema defaults role to "CUSTOMER"
    await register({ name: "Jane Doe", email: "jane@example.com", password: "password123", role: "CUSTOMER" });
    const createCall = db.user.create.mock.calls[0][0];
    expect(createCall.data.role).toBe("CUSTOMER");
  });

  it("creates an ADMIN user when role is ADMIN", async () => {
    db.user.create.mockResolvedValue({ ...mockUser, role: "ADMIN" });
    const result = await register({
      name: "Admin",
      email: "admin@example.com",
      password: "admin1234",
      role: "ADMIN",
    });
    expect(result.user.role).toBe("ADMIN");
  });
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe("login", () => {
  it("returns token and safe user on valid credentials", async () => {
    db.user.findUnique.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

    const result = await login({ email: "jane@example.com", password: "password123" });

    expect(result.token).toBe("mock-jwt-token");
    expect(result.user.email).toBe("jane@example.com");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("throws 401 when email is not registered", async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(
      login({ email: "nobody@example.com", password: "password123" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when password is wrong", async () => {
    db.user.findUnique.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

    await expect(
      login({ email: "jane@example.com", password: "wrongpassword" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("uses the same error message for unknown email and wrong password (prevents enumeration)", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const unknownEmailError = await login({ email: "x@x.com", password: "p" }).catch((e) => e);

    db.user.findUnique.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
    const wrongPassError = await login({ email: "jane@example.com", password: "wrong" }).catch((e) => e);

    expect(unknownEmailError.message).toBe(wrongPassError.message);
  });
});

// ---------------------------------------------------------------------------
// getMe
// ---------------------------------------------------------------------------

describe("getMe", () => {
  it("returns safe user for a valid userId", async () => {
    db.user.findUnique.mockResolvedValue(mockUser);
    const result = await getMe("user-1");
    expect(result.id).toBe("user-1");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("throws 404 when user does not exist", async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(getMe("ghost")).rejects.toMatchObject({ statusCode: 404 });
  });
});
