import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock Prisma before importing the service so the DB is never touched.
// ---------------------------------------------------------------------------
vi.mock("../db/prisma", () => ({
  default: {
    customer: { findUnique: vi.fn() },
    service: { findUnique: vi.fn() },
    appointment: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

import prisma from "../db/prisma";
import { createAppointment } from "../services/appointments.service";
import { AppError } from "../middleware/errorHandler";

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const mockCustomer = { id: "cust-1", name: "Alice", phone: "+1", email: "a@b.com" };
const mockService = {
  id: "svc-1",
  name: "Haircut",
  durationMinutes: 30,
  price: 25,
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default happy-path: customer + service both exist, no overlap
  vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);
  vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
  vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.appointment.create).mockResolvedValue({
    id: "appt-1",
    customerId: "cust-1",
    serviceId: "svc-1",
    startTime: new Date("2024-06-15T09:00:00.000Z"),
    endTime: new Date("2024-06-15T09:30:00.000Z"),
    status: "scheduled",
    createdAt: new Date(),
    customer: mockCustomer,
    service: mockService,
  } as any);
});

// ---------------------------------------------------------------------------
// Working-hours enforcement
// ---------------------------------------------------------------------------

describe("createAppointment – working hours", () => {
  it("accepts a startTime at exactly 09:00 UTC", async () => {
    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "svc-1",
        startTime: "2024-06-15T09:00:00.000Z",
      })
    ).resolves.toBeDefined();
  });

  it("rejects a startTime before 09:00 UTC", async () => {
    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "svc-1",
        startTime: "2024-06-15T08:30:00.000Z",
      })
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "svc-1",
        startTime: "2024-06-15T08:30:00.000Z",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a startTime at or after 17:00 UTC", async () => {
    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "svc-1",
        startTime: "2024-06-15T17:00:00.000Z",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects when the appointment would end after 17:00 UTC", async () => {
    // 30-minute service starting at 16:45 ends at 17:15 → reject
    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "svc-1",
        startTime: "2024-06-15T16:45:00.000Z",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("accepts a startTime that ends exactly at 17:00 UTC", async () => {
    // 30-minute service starting at 16:30 ends at exactly 17:00 → valid
    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "svc-1",
        startTime: "2024-06-15T16:30:00.000Z",
      })
    ).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Overlap detection
// ---------------------------------------------------------------------------

describe("createAppointment – overlap detection", () => {
  it("creates the appointment when no overlap exists", async () => {
    // findFirst returns null → no conflict
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
    // findFirst returns an existing appointment → conflict
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: "existing",
      startTime: new Date("2024-06-15T09:00:00.000Z"),
      endTime: new Date("2024-06-15T09:30:00.000Z"),
    } as any);

    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "svc-1",
        startTime: "2024-06-15T09:00:00.000Z",
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("overlaps"),
    });

    // create must NOT be called when there is a conflict
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Guard clauses – customer / service validation
// ---------------------------------------------------------------------------

describe("createAppointment – guard clauses", () => {
  it("throws 404 when customer does not exist", async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

    await expect(
      createAppointment({
        customerId: "ghost",
        serviceId: "svc-1",
        startTime: "2024-06-15T09:00:00.000Z",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when service does not exist", async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue(null);

    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "ghost",
        startTime: "2024-06-15T09:00:00.000Z",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when service is inactive", async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      ...mockService,
      isActive: false,
    } as any);

    await expect(
      createAppointment({
        customerId: "cust-1",
        serviceId: "svc-1",
        startTime: "2024-06-15T09:00:00.000Z",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
