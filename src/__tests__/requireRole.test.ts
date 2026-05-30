import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole } from "../middleware/requireRole";

// ---------------------------------------------------------------------------
// requireRole is pure middleware logic — no external deps to mock
// ---------------------------------------------------------------------------

function makeRes(): any {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => { vi.clearAllMocks(); });

describe("requireRole middleware", () => {
  it("returns 401 when req.user is not set (requireAuth was skipped)", () => {
    const req: any = {}; // no user property
    const res = makeRes();
    const next = vi.fn();

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not in the allowed list", () => {
    const req: any = { user: { id: "u1", role: "CUSTOMER" } };
    const res = makeRes();
    const next = vi.fn();

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when user role is in the allowed list", () => {
    const req: any = { user: { id: "u1", role: "ADMIN" } };
    const res = makeRes();
    const next = vi.fn();

    requireRole("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows any of multiple accepted roles", () => {
    const staffReq: any = { user: { id: "u1", role: "STAFF" } };
    const next = vi.fn();

    requireRole("ADMIN", "STAFF")(staffReq, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects a role not in the accepted list when multiple are specified", () => {
    const req: any = { user: { id: "u1", role: "CUSTOMER" } };
    const res = makeRes();
    const next = vi.fn();

    requireRole("ADMIN", "STAFF")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("includes allowed roles in the 403 error message", () => {
    const req: any = { user: { id: "u1", role: "CUSTOMER" } };
    const res = makeRes();
    const next = vi.fn();

    requireRole("ADMIN", "STAFF")(req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.message).toContain("ADMIN");
    expect(jsonArg.message).toContain("STAFF");
  });
});
