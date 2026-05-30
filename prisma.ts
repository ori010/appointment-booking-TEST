import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock Prisma before importing the service so the DB is never touched.
// cancelAppointment uses `prisma as any` (db.appointment.findUnique/update),
// so those must be in the mock too.
// ---------------------------------------------------------------------------
vi.mock("../db/prisma", () => ({
  default: {
    customer: { findUnique: vi.fn() },
    service: { findUnique: vi.fn() },
    appointment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "../db/prisma";
import { createAppointment, cancelAppointment } from "../services/appointments.service";
import { AppError } from "../middleware/errorHandler";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const mockCustomer = { id: "cust-1", name: "Alice", phone: "+1", email: "a@b.com" };
const mockService = {
  id: "svc-1",
  name: "Haircut",
  durationMinutes: 30,
  price: 25,
  isActive: true,
};
const mockAppointment = {
  id: "appt-1",
  customerId: "cust-1",
  serviceId: "svc-1",
  bookedById: "user-1",
  startTime: new Date("2024-06-15T09:00:00.000Z"),
  endTime: new Date("2024-06-15T09:30:00.000Z"),
  status: "scheduled",
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);
  vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
  vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointment as any);
  vi.mocked(prisma.appointment.create).mockResolvedValue({
    ...mockAppointment,
    customer: mockCustomer,
    service: mockService,
  } as any);
  vi.mocked(prisma.appointment.update).mockResolvedValue({
    ...mockAppointment,
    status: "cancelled",
    customer: mockCustomer,
    service: mockService,
  } as any);
});

// ---------------------------------------------------------------------------
// createAppointment – working hours
// ---------------------------------------------------------------------------

describe("createAppointment – working hours", () => {
  it("accepts a startTime at exactly 09:00 UTC", async () => {
    await expect(
      createAppointment({ customerId: "cust-1", serviceId: "svc-1", startTime: "2024-06-15T09:00:00.000Z" })
    ).resolves.toBeDefined();
  });

  it("rejects a startTime before 09:00 UTC", async () => {
    await expect(
      createAppointment({ customerId: "cust-1", serviceId: "svc-1", startTime: "2024-06-15T08:30:00.000Z" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a startTime at or after 17:00 UTC", async () => {
    await expect(
      createAppointment({ customerId: "cust-1", serviceId: "svc-1", startTime: "2024-06-15T17:00:00.000Z" })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects when the appointment would end after 17:00 UTC", async () => {
    await expect(
      createAppointment({ customerId: "cust-1", serviceId: "svc-1", startTime: "2024-06-15T16:45:00.000Z" })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("accepts a startTime that ends exactly at 17:00 UTC", async () => {
    await expect(
      createAppointment({ customerId: "cust-1", serviceId: "svc-1", startTime: "2024-06-15T16:30:00.000Z" })
    ).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// createAppointment – overlap detection
// ---------------------------------------------------------------------------

describe("createAppointment – overlap detection", () => {
  it("creates the appointment when no overlap exists", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
    const result = await createAppointment({
      customerId: "cust-1",
      serviceId: "svc-1",
      startTime: "2024-06-15T09:00:00.000Z",
    });
    expect(result).toBeDefined();
    expect(prisma.appointment.create).toHaveBeenCalledOnce();
  });

  it("throws 409 when a conflicting appointment exists", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: "existing",
      startTime: new Date("2024-06-15T09:00:00.000Z"),
      endTime: new Date("2024-06-15T09:30:00.000Z"),
    } as any);

    await expect(
      createAppointment({ customerId: "cust-1", serviceId: "svc-1", startTime: "2024-06-15T09:00:00.000Z" })
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("overlaps") });

    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// createAppointment – guard clauses
// ---------------------------------------------------------------------------

describe("createAppointment – guard clauses", () => {
  it("throws 404 when customer does not exist", async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);
    await expect(
      createAppointment({ customerId: "ghost", serviceId: "svc-1", startTime: "2024-06-15T09:00:00.000Z" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when service does not exist", async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue(null);
    await expect(
      createAppointment({ customerId: "cust-1", serviceId: "ghost", startTime: "2024-06-15T09:00:00.000Z" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when service is inactive", async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue({ ...mockService, isActive: false } as any);
    await expect(
      createAppointment({ customerId: "cust-1", serviceId: "svc-1", startTime: "2024-06-15T09:00:00.000Z" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ---------------------------------------------------------------------------
// cancelAppointment – status guards
// ---------------------------------------------------------------------------

describe("cancelAppointment – status guards", () => {
  it("throws 404 when appointment does not exist", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(null);
    await expect(
      cancelAppointment("ghost", { id: "user-1", role: "ADMIN" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when appointment is already cancelled", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      { ...mockAppointment, status: "cancelled" } as any
    );
    await expect(
      cancelAppointment("appt-1", { id: "user-1", role: "ADMIN" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when appointment is already completed", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      { ...mockAppointment, status: "completed" } as any
    );
    await expect(
      cancelAppointment("appt-1", { id: "user-1", role: "ADMIN" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ---------------------------------------------------------------------------
// cancelAppointment – ownership and role rules
// ---------------------------------------------------------------------------

describe("cancelAppointment – ownership rules", () => {
  it("ADMIN can cancel any appointment regardless of bookedById", async () => {
    // bookedById is "user-1" but requester is a different admin
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      { ...mockAppointment, bookedById: "user-1" } as any
    );
    await expect(
      cancelAppointment("appt-1", { id: "admin-99", role: "ADMIN" })
    ).resolves.toBeDefined();
    expect(prisma.appointment.update).toHaveBeenCalledOnce();
  });

  it("CUSTOMER can cancel their own appointment", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      { ...mockAppointment, bookedById: "user-1" } as any
    );
    await expect(
      cancelAppointment("appt-1", { id: "user-1", role: "CUSTOMER" })
    ).resolves.toBeDefined();
    expect(prisma.appointment.update).toHaveBeenCalledOnce();
  });

  it("CUSTOMER cannot cancel another user's appointment", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      { ...mockAppointment, bookedById: "user-99" } as any
    );
    await expect(
      cancelAppointment("appt-1", { id: "user-1", role: "CUSTOMER" })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it("CUSTOMER cannot cancel an appointment with no bookedById", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      { ...mockAppointment, bookedById: null } as any
    );
    await expect(
      cancelAppointment("appt-1", { id: "user-1", role: "CUSTOMER" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
