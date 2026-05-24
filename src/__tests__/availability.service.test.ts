import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock Prisma before importing the service.
// ---------------------------------------------------------------------------
vi.mock("../db/prisma", () => ({
  default: {
    service: { findUnique: vi.fn() },
    appointment: { findMany: vi.fn() },
  },
}));

import prisma from "../db/prisma";
import { getAvailableSlots } from "../services/availability.service";

const mockService = {
  id: "svc-1",
  name: "Haircut",
  durationMinutes: 30,
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
  vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
});

describe("getAvailableSlots", () => {
  it("returns all 16 slots when no appointments exist (30-minute service)", async () => {
    const result = await getAvailableSlots({
      date: "2024-06-15",
      serviceId: "svc-1",
    });

    expect(result.availableSlots).toHaveLength(16);
  });

  it("excludes a booked 09:00 slot from available results", async () => {
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([
      {
        startTime: new Date("2024-06-15T09:00:00.000Z"),
        endTime: new Date("2024-06-15T09:30:00.000Z"),
      },
    ] as any);

    const result = await getAvailableSlots({
      date: "2024-06-15",
      serviceId: "svc-1",
    });

    // 16 total – 1 booked = 15 available
    expect(result.availableSlots).toHaveLength(15);

    // 09:00 must not appear in the available list
    const bookedStart = "2024-06-15T09:00:00.000Z";
    const hasBooked = result.availableSlots.some(
      (s) => s.startTime === bookedStart
    );
    expect(hasBooked).toBe(false);
  });

  it("excludes multiple booked slots correctly", async () => {
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([
      {
        startTime: new Date("2024-06-15T09:00:00.000Z"),
        endTime: new Date("2024-06-15T09:30:00.000Z"),
      },
      {
        startTime: new Date("2024-06-15T11:00:00.000Z"),
        endTime: new Date("2024-06-15T11:30:00.000Z"),
      },
    ] as any);

    const result = await getAvailableSlots({
      date: "2024-06-15",
      serviceId: "svc-1",
    });

    expect(result.availableSlots).toHaveLength(14);
  });

  it("returns 0 slots when every slot is booked", async () => {
    // Book a single 8-hour appointment that covers the entire day
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([
      {
        startTime: new Date("2024-06-15T09:00:00.000Z"),
        endTime: new Date("2024-06-15T17:00:00.000Z"),
      },
    ] as any);

    const result = await getAvailableSlots({
      date: "2024-06-15",
      serviceId: "svc-1",
    });

    expect(result.availableSlots).toHaveLength(0);
  });

  it("includes service metadata in the response", async () => {
    const result = await getAvailableSlots({
      date: "2024-06-15",
      serviceId: "svc-1",
    });

    expect(result.serviceName).toBe("Haircut");
    expect(result.durationMinutes).toBe(30);
    expect(result.date).toBe("2024-06-15");
    expect(result.serviceId).toBe("svc-1");
  });

  it("throws 404 when service does not exist", async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue(null);

    await expect(
      getAvailableSlots({ date: "2024-06-15", serviceId: "ghost" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when service is inactive", async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue({
      ...mockService,
      isActive: false,
    } as any);

    await expect(
      getAvailableSlots({ date: "2024-06-15", serviceId: "svc-1" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
