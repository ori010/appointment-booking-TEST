import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/requireAuth";

// ---------------------------------------------------------------------------
// Minimal mock request / response / next
// ---------------------------------------------------------------------------

function makeReq(authHeader?: string): any {
  return { headers: authHeader ? { authorization: authHeader } : {} };
}

function makeRes(): any {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => { vi.clearAllMocks(); });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("requireAuth middleware", () => {
  it("returns 401 when Authorization header is absent", () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header does not start with 'Bearer '", () => {
    const req = makeReq("Basic dXNlcjpwYXNz");
    const res = makeRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid or expired", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const req = makeReq("Bearer bad.token.here");
    const res = makeRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() and sets req.user when token is valid", () => {
    vi.mocked(jwt.verify).mockReturnValue({ userId: "user-1", role: "ADMIN" } as any);

    const req = makeReq("Bearer valid.token.here");
    const res = makeRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: "user-1", role: "ADMIN" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("sets the correct role from the JWT payload", () => {
    vi.mocked(jwt.verify).mockReturnValue({ userId: "user-2", role: "CUSTOMER" } as any);

    const req = makeReq("Bearer valid.token.here");
    const res = makeRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(req.user).toEqual({ id: "user-2", role: "CUSTOMER" });
  });
});
